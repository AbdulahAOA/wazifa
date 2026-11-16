export function first(value: string | string[] | undefined) {
  const raw = Array.isArray(value) ? value[0] : value;
  return raw?.trim() ?? "";
}

export function pageNumber(value: string | string[] | undefined) {
  const page = Number.parseInt(first(value), 10);
  if (!Number.isFinite(page) || page < 1) return 1;
  return Math.min(page, 10000);
}
