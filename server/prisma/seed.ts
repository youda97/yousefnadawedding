import { PrismaClient } from "@prisma/client";
import fs from "fs";
import path from "path";

const prisma = new PrismaClient();

function last4(phone: string) {
  const d = phone.replace(/\D/g, "");
  return d.slice(-4);
}

async function main() {
  const csvPath = path.join(process.cwd(), "data", "guests.csv");
  const rows = fs.readFileSync(csvPath, "utf8").trim().split(/\r?\n/);

  // group rows by household label
  const map = new Map<string, { phone: string; guests: string[] }>();
  for (const line of rows) {
    const [label, phone, full] = line.split(",").map((s) => s.trim());
    if (!map.has(label)) map.set(label, { phone, guests: [] });
    map.get(label)!.guests.push(full);
  }

  for (const [label, info] of map.entries()) {
    const hh = await prisma.household.create({
      data: { label, phone: info.phone, phoneLast4: last4(info.phone) },
    });
    for (const full of info.guests) {
      const [first, ...rest] = full.split(/\s+/);
      await prisma.guest.create({
        data: {
          householdId: hh.id,
          firstName: first,
          lastName: rest.join(" "),
          displayName: full,
        },
      });
    }
  }

  console.log("Seeded", map.size, "households");
}

main().finally(() => prisma.$disconnect());
