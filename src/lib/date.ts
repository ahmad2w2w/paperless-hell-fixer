export function formatDutchDate(date: Date | null | undefined) {
  if (!date) return "";
  return new Intl.DateTimeFormat("nl-NL", {
    year: "numeric",
    month: "long",
    day: "2-digit",
  }).format(date);
}

export function toISODate(date: Date | null | undefined) {
  if (!date) return null;
  const y = date.getUTCFullYear();
  const m = String(date.getUTCMonth() + 1).padStart(2, "0");
  const d = String(date.getUTCDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
}


