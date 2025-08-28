export function normalizeName(s: string) {
    return s.toLowerCase().normalize("NFKD").replace(/[^\p{Letter}\p{Number}\s]/gu, "").replace(/\s+/g, " ").trim();
  }
  