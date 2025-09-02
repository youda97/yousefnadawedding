import "dotenv/config";
import express from "express";
import cors from "cors";
import cookieParser from "cookie-parser";
import { z } from "zod";
import { prisma } from "./lib/db.js";
import { normalizeName } from "./lib/normalize.js";
import { sign, verify as verifyJWT } from "./lib/jwt.js";
import { generateCode, hashCode } from "./lib/otp.js";
import { sendOtp } from "./lib/sms.js";

const app = express();
const PORT = process.env.PORT || 8787;
const FRONTEND_ORIGIN = process.env.FRONTEND_ORIGIN || "http://localhost:5173";
const isProd = process.env.NODE_ENV === "production";

// Allow calls from your Vite dev server
app.use(cors({
  origin: FRONTEND_ORIGIN,
  credentials: true
}));
app.use(express.json());
app.use(cookieParser());

const ADMIN_COOKIE = "rv_admin";
const ADMIN_TTL_MS = 24 * 60 * 60 * 1000; // 1 day

function isAdmin(req: express.Request) {
  return req.cookies?.[ADMIN_COOKIE] === "ok";
}

// POST /api/rsvp/search  { name }
app.post("/api/rsvp/search", async (req, res) => {
  const schema = z.object({ name: z.string().min(2) });
  const { name } = schema.parse(req.body);

  const tokens = normalizeName(name).split(" ");
  // simple fuzzy: all tokens must appear in first/last/display
  const guests = await prisma.guest.findMany({
    where: {
      AND: tokens.map((t) => ({
        OR: [
          { firstName: { contains: t, mode: "insensitive" } },
          { lastName: { contains: t, mode: "insensitive" } },
          { displayName: { contains: t, mode: "insensitive" } },
        ],
      })),
    },
    select: { householdId: true },
    take: 20,
  });

  const candidateIds = Array.from(new Set(guests.map((g) => g.householdId)));
  if (candidateIds.length === 0) return res.json({ candidate: false });

  // Store candidate households in a short-lived signed cookie (no PII leaked)
  const token = await sign({ c: candidateIds }, "10m");
  res.cookie("rv_cand", token, {
    httpOnly: true, sameSite: isProd ? "none" : "lax", secure: isProd, maxAge: 10 * 60 * 1000,
  });
  res.json({ candidate: true });
});

// POST /api/rsvp/otp/init   { last4 }
app.post("/api/rsvp/otp/init", async (req, res) => {
  try {
    const schema = z.object({ last4: z.string().regex(/^\d{4}$/) });
    const { last4 } = schema.parse(req.body);

    const cand = await verifyJWT<{ c: string[] }>(req.cookies.rv_cand);
    if (!cand?.c?.length) {
      console.warn("otp/init: no candidate cookie or verify failed");
      return res.status(400).json({ error: "search_required" });
    }

    // Sanity log the candidate IDs and last4 (safe)
    console.log("otp/init candidates:", cand.c, "last4:", last4);

    const households = await prisma.household.findMany({
      where: { id: { in: cand.c }, phoneLast4: last4 },
      select: { id: true, label: true, phoneLast4: true },
    });

    console.log("otp/init matches:", households.map(h => ({ id: h.id, last4: h.phoneLast4 })));

    if (households.length === 0) {
      return res.status(400).json({ error: "not_verified_no_match" });
    }
    if (households.length > 1) {
      return res.status(400).json({ error: "not_verified_ambiguous" });
    }

    const hh = households[0];

    // cooldown
    const existing = await prisma.otp.findFirst({
      where: { householdId: hh.id },
      orderBy: { createdAt: "desc" },
    });
    if (existing && Date.now() - existing.createdAt.getTime() < 60_000) {
      return res.status(429).json({ error: "cooldown" });
    }

    const code = generateCode();
    await prisma.otp.create({
      data: {
        householdId: hh.id,
        codeHash: hashCode(code),
        purpose: "rsvp",
        expiresAt: new Date(Date.now() + 10 * 60 * 1000),
      },
    });

    await sendOtp(hh.phoneLast4, code);

    res.cookie("rv_otp", JSON.stringify({ hh: hh.id }), {
      httpOnly: true,
      sameSite: isProd ? "none" : "lax",
      secure: isProd,
      maxAge: 10 * 60 * 1000,
    });

    return res.json({ sent: true });
  } catch (err: any) {
    console.error("otp/init error", err?.message || err);
    return res.status(400).json({ error: "bad_request" });
  }
});

// POST /api/rsvp/otp/verify   { code }
app.post("/api/rsvp/otp/verify", async (req, res) => {
  const schema = z.object({ code: z.string().regex(/^\d{6}$/) });
  const { code } = schema.parse(req.body);

  const otpCookieRaw = req.cookies.rv_otp;
  if (!otpCookieRaw) return res.status(400).json({ error: "otp_required" });
  const { hh } = JSON.parse(otpCookieRaw) as { hh: string };

  const otp = await prisma.otp.findFirst({
    where: { householdId: hh },
    orderBy: { createdAt: "desc" },
  });
  if (!otp || otp.expiresAt < new Date()) return res.status(400).json({ error: "expired" });

  if (hashCode(code) !== otp.codeHash) {
    await prisma.otp.update({ where: { id: otp.id }, data: { attempts: { increment: 1 } } });
    return res.status(400).json({ error: "bad_code" });
  }

  const session = await sign({ hh }, "7d");
  res.cookie("rv_sess", session, {
    httpOnly: true, sameSite: isProd ? "none" : "lax", secure: isProd, maxAge: 7 * 24 * 60 * 60 * 1000,
  });
  // clear temp cookies
  res.clearCookie("rv_cand");
  res.clearCookie("rv_otp");
  res.json({ ok: true });
});

// GET /api/rsvp/household
app.get("/api/rsvp/household", async (req, res) => {
  const sess = await verifyJWT<{ hh: string }>(req.cookies.rv_sess);
  if (!sess) return res.status(401).json({ error: "unauthorized" });

  const hh = await prisma.household.findUnique({
    where: { id: sess.hh },
    include: { guests: true },
  });
  if (!hh) return res.status(404).json({ error: "not_found" });

  res.json({
    household: { id: hh.id, label: hh.label },
    guests: hh.guests.map((g) => ({ id: g.id, fullName: g.displayName, rsvp: (g.rsvpStatus as any) || null })),
  });
});

// POST /api/rsvp/submit  { responses: [{id, rsvp}] }
app.post("/api/rsvp/submit", async (req, res) => {
  const schema = z.object({
    responses: z.array(z.object({ id: z.string(), rsvp: z.enum(["yes", "no"]) })),
  });
  const { responses } = schema.parse(req.body);

  const sess = await verifyJWT<{ hh: string }>(req.cookies.rv_sess);
  if (!sess) return res.status(401).json({ error: "unauthorized" });

  for (const r of responses) {
    await prisma.guest.update({ where: { id: r.id }, data: { rsvpStatus: r.rsvp } });
  }
  res.json({ ok: true });
});

// --- ADMIN: login ---
app.post("/api/admin/login", (req, res) => {
    const { password } = req.body ?? {};
    if (!password || password !== process.env.ADMIN_PASSWORD) {
      return res.status(401).json({ ok: false, error: "bad_password" });
    }
    res.cookie(ADMIN_COOKIE, "ok", {
      httpOnly: true,
      sameSite: isProd ? "none" : "lax",
      secure: isProd,           
      maxAge: ADMIN_TTL_MS,
    });
    res.json({ ok: true });
  });
  
  // --- ADMIN: logout (optional) ---
  app.post("/api/admin/logout", (req, res) => {
    res.clearCookie(ADMIN_COOKIE);
    res.json({ ok: true });
  });
  
  // --- ADMIN: summary counts ---
  app.get("/api/admin/summary", async (req, res) => {
    if (!isAdmin(req)) return res.status(401).json({ error: "unauthorized" });
  
    const totalGuests = await prisma.guest.count();
    const yes = await prisma.guest.count({ where: { rsvpStatus: "yes" } });
    const no = await prisma.guest.count({ where: { rsvpStatus: "no" } });
    const pending = totalGuests - yes - no;
  
    const households = await prisma.household.count();
  
    res.json({ totalGuests, households, yes, no, pending });
  });
  
  // --- ADMIN: guests table (with optional filters) ---
  app.get("/api/admin/guests", async (req, res) => {
    if (!isAdmin(req)) return res.status(401).json({ error: "unauthorized" });
  
    const search = String(req.query.search ?? "").trim();
    const status = String(req.query.status ?? "all"); // all|yes|no|pending
  
    const where: any = {};
    if (status === "yes") where.rsvpStatus = "yes";
    if (status === "no") where.rsvpStatus = "no";
    if (status === "pending") where.rsvpStatus = null;
  
    // join household for label
    const guests = await prisma.guest.findMany({
      where: {
        ...where,
        ...(search
          ? {
              OR: [
                { displayName: { contains: search, mode: "insensitive" } },
                { household: { label: { contains: search, mode: "insensitive" } } },
              ],
            }
          : {}),
      },
      include: { household: true },
      orderBy: [{ householdId: "asc" }, { lastName: "asc" }, { firstName: "asc" }],
      take: 2000, // plenty for your case
    });
  
    res.json(
      guests.map((g) => ({
        id: g.id,
        fullName: g.displayName,
        rsvpStatus: g.rsvpStatus ?? null,
        updatedAt: g.updatedAt,
        household: g.household.label,
      }))
    );
  });
  
  // --- ADMIN: CSV export ---
  app.get("/api/admin/export.csv", async (req, res) => {
    if (!isAdmin(req)) return res.status(401).send("unauthorized");
  
    const rows = await prisma.guest.findMany({
      include: { household: true },
      orderBy: [{ householdId: "asc" }, { lastName: "asc" }, { firstName: "asc" }],
      take: 2000,
    });
  
    const header = ["Household", "Full Name", "RSVP", "Updated At"];
    const csvLines = [
      header.join(","),
      ...rows.map((g) =>
        [
          `"${g.household.label.replace(/"/g, '""')}"`,
          `"${g.displayName.replace(/"/g, '""')}"`,
          g.rsvpStatus ?? "",
          g.updatedAt.toISOString(),
        ].join(",")
      ),
    ];
  
    res.setHeader("Content-Type", "text/csv");
    res.setHeader("Content-Disposition", "attachment; filename=\"rsvp_export.csv\"");
    res.send(csvLines.join("\n"));
  });

  // --- ADMIN: update RSVP for a single guest ---
app.post("/api/admin/update", async (req, res) => {
    if (!isAdmin(req)) return res.status(401).json({ error: "unauthorized" });
  
    const { id, rsvp } = req.body ?? {};
    if (!id || !["yes", "no", null].includes(rsvp)) {
      return res.status(400).json({ error: "bad_input" });
    }
  
    try {
      const updated = await prisma.guest.update({
        where: { id },
        data: { rsvpStatus: rsvp },
      });
      res.json({ ok: true, guest: updated });
    } catch (err) {
      res.status(500).json({ error: "update_failed" });
    }
  });
  
  // --- ADMIN: list households (with guests)
app.get("/api/admin/households", async (req, res) => {
    if (!isAdmin(req)) return res.status(401).json({ error: "unauthorized" });
  
    const rows = await prisma.household.findMany({
      include: { guests: true },
      orderBy: { createdAt: "desc" },
      take: 1000,
    });
  
    res.json(rows.map(h => ({
      id: h.id,
      label: h.label,
      phone: h.phone,
      phoneLast4: h.phoneLast4,
      guests: h.guests.map(g => ({ id: g.id, fullName: g.displayName })),
    })));
  });
  
  // --- ADMIN: create household
  app.post("/api/admin/households", async (req, res) => {
    if (!isAdmin(req)) return res.status(401).json({ error: "unauthorized" });
    const { label, phone } = req.body ?? {};
    if (!label || !phone) return res.status(400).json({ error: "bad_input" });
  
    const digits = String(phone).replace(/\D/g,"");
    if (digits.length < 7) return res.status(400).json({ error: "bad_phone" });
    const e164 = phone.startsWith("+") ? phone : `+${digits}`;
    const last4 = digits.slice(-4);
  
    const hh = await prisma.household.create({
      data: { label: String(label).trim(), phone: e164, phoneLast4: last4 },
    });
    res.json({ ok: true, household: hh });
  });
  
  // --- ADMIN: update household phone
  app.post("/api/admin/households/:id/phone", async (req, res) => {
    if (!isAdmin(req)) return res.status(401).json({ error: "unauthorized" });
    const { id } = req.params;
    const { phone } = req.body ?? {};
    if (!phone) return res.status(400).json({ error: "bad_input" });
  
    const digits = String(phone).replace(/\D/g,"");
    if (digits.length < 7) return res.status(400).json({ error: "bad_phone" });
    const e164 = phone.startsWith("+") ? phone : `+${digits}`;
    const last4 = digits.slice(-4);
  
    const hh = await prisma.household.update({
      where: { id },
      data: { phone: e164, phoneLast4: last4 },
    });
  
    // prevent stale OTPs from working
    await prisma.otp.deleteMany({ where: { householdId: id } });
  
    res.json({ ok: true, household: hh });
  });
  
  // --- ADMIN: add guest to household
  app.post("/api/admin/households/:id/guests", async (req, res) => {
    if (!isAdmin(req)) return res.status(401).json({ error: "unauthorized" });
    const { id } = req.params;
    const { fullName } = req.body ?? {};
    if (!fullName) return res.status(400).json({ error: "bad_input" });
  
    const parts = String(fullName).trim().split(/\s+/);
    const first = parts[0];
    const last = parts.slice(1).join(" ");
  
    const g = await prisma.guest.create({
      data: { householdId: id, firstName: first, lastName: last, displayName: fullName.trim() },
    });
    res.json({ ok: true, guest: g });
  });
  
  // --- ADMIN: delete guest
  app.delete("/api/admin/guests/:id", async (req, res) => {
    if (!isAdmin(req)) return res.status(401).json({ error: "unauthorized" });
    const { id } = req.params;
    await prisma.guest.delete({ where: { id } });
    res.json({ ok: true });
  });
  
  // --- ADMIN: BULK UPSERT CSV
  // Body: { csv: string, removeMissing?: boolean }
  // CSV columns: household_label, phone_e164_or_digits, guest_full_name
  app.post("/api/admin/bulk-upsert", async (req, res) => {
    if (!isAdmin(req)) return res.status(401).json({ error: "unauthorized" });
  
    const csv = String(req.body?.csv ?? "").trim();
    const removeMissing = !!req.body?.removeMissing;
  
    if (!csv) return res.status(400).json({ error: "empty_csv" });
  
    const lines = csv.split(/\r?\n/).filter(Boolean);
    const triplets = lines.map((line, idx) => {
      const [label, phone, fullName] = line.split(",").map(s => (s ?? "").trim());
      if (!label || !phone || !fullName) throw new Error(`bad_row_${idx+1}`);
      return { label, phone, fullName };
    });
  
    // Group by (label, phone) to reduce queries
    const byHousehold = new Map<string, { label: string; phone: string; guests: string[] }>();
    for (const t of triplets) {
      const digits = t.phone.replace(/\D/g,"");
      const e164 = t.phone.startsWith("+") ? t.phone : `+${digits}`;
      const key = `${t.label}||${e164}`;
      if (!byHousehold.has(key)) byHousehold.set(key, { label: t.label, phone: e164, guests: [] });
      byHousehold.get(key)!.guests.push(t.fullName);
    }
  
    let createdHouseholds = 0, updatedPhones = 0, createdGuests = 0, existingGuests = 0, removedGuests = 0;
  
    for (const { label, phone, guests } of byHousehold.values()) {
      const digits = phone.replace(/\D/g,"");
      const last4 = digits.slice(-4);
  
      // try find by exact (label, phone)
      let hh = await prisma.household.findFirst({ where: { label, phone } });
  
      // else try by label only (and update phone)
      if (!hh) {
        const byLabel = await prisma.household.findFirst({ where: { label } });
        if (byLabel) {
          hh = await prisma.household.update({
            where: { id: byLabel.id },
            data: { phone, phoneLast4: last4 },
          });
          updatedPhones++;
          await prisma.otp.deleteMany({ where: { householdId: hh.id } });
        } else {
          hh = await prisma.household.create({
            data: { label, phone, phoneLast4: last4 },
          });
          createdHouseholds++;
        }
      }
  
      // fetch existing guests for comparison
      const existing = await prisma.guest.findMany({ where: { householdId: hh.id } });
      const existingSet = new Set(existing.map(g => g.displayName.trim().toLowerCase()));
      const incomingSet = new Set(guests.map(n => n.trim().toLowerCase()));
  
      // upsert new ones (by displayName within household)
      for (const full of guests) {
        const key = full.trim().toLowerCase();
        if (existingSet.has(key)) { existingGuests++; continue; }
        const parts = full.trim().split(/\s+/);
        const first = parts[0]; const last = parts.slice(1).join(" ");
        await prisma.guest.create({
          data: { householdId: hh.id, firstName: first, lastName: last, displayName: full.trim() },
        });
        createdGuests++;
      }
  
      // optionally remove missing guests
      if (removeMissing) {
        for (const g of existing) {
          if (!incomingSet.has(g.displayName.trim().toLowerCase())) {
            await prisma.guest.delete({ where: { id: g.id } });
            removedGuests++;
          }
        }
      }
    }
  
    res.json({ ok: true, createdHouseholds, updatedPhones, createdGuests, existingGuests, removedGuests });
  });  
  

app.listen(PORT, () => console.log(`RSVP server running on http://localhost:${PORT}`));
