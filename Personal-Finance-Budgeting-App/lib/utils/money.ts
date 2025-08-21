export const formatCents = (cents: number, currency = "USD") =>
  new Intl.NumberFormat(undefined, { style: "currency", currency }).format(
    (cents || 0) / 100
  );

export function parseAmountToCents(input: string): number {
  const trimmed = input.replace(/[, ]/g, "").trim();
  if (!/^\d+(\.\d{0,2})?$/.test(trimmed)) throw new Error("Invalid amount");
  return Math.round(Number(trimmed) * 100);
}
