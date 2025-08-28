import crypto from "crypto";
export function generateCode() {
  return "" + Math.floor(100000 + Math.random() * 900000); // 6 digits
}
export function hashCode(code: string) {
  return crypto.createHash("sha256").update(code).digest("hex");
}
