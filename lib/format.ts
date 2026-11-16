export function formatDate(value: string | Date) {
  const date = value instanceof Date ? value : new Date(value);
  if (Number.isNaN(date.getTime())) return "—";
  return new Intl.DateTimeFormat("en-GB", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  }).format(date);
}

export function isNew(postedAt: string, now = Date.now()) {
  const time = Date.parse(postedAt);
  if (Number.isNaN(time)) return false;
  return now - time >= 0 && now - time <= 14 * 24 * 60 * 60 * 1000;
}

export function formatDuration(hours: number | null) {
  if (hours === null || Number.isNaN(hours)) return "—";
  if (hours < 1) return "<1h";
  if (hours < 48) return `${Math.round(hours)}h`;
  return `${Math.round(hours / 24)}d`;
}

export function slugify(value: string) {
  const slug = value
    .normalize("NFKD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 72);
  return slug || "job";
}

export function companyTag(company: string) {
  const parts = company.trim().split(/\s+/).filter(Boolean);
  if (parts.length >= 2) return `${parts[0]![0]}${parts[1]![0]}`.toUpperCase();
  return (parts[0] ?? "JB").slice(0, 2).toUpperCase();
}

export function asDate(value: Date | string) {
  return value instanceof Date ? value : new Date(value);
}

export function asStringArray(value: unknown) {
  if (!Array.isArray(value)) return [];
  return value.filter((item): item is string => typeof item === "string");
}
