export function normalizeName(input: string): string {
  return input
    .normalize("NFKD")                     // split diacritics
    .replace(/[\u0300-\u036f]/g, "")       // strip diacritics
    // convert *any* hyphen-like char to a space (covers -, ‐, -, ‒, – , —)
    .replace(/[-\u2010\u2011\u2012\u2013\u2014]/g, " ")
    // keep letters/numbers/apostrophes/spaces; drop everything else
    .replace(/[^\p{L}\p{N}'\s]/gu, " ")
    .replace(/\s+/g, " ")
    .trim();
}
