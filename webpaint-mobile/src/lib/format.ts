/** Format a numeric-string total (e.g. "1200.50") with its currency. */
export function formatMoney(total: string, currency: string): string {
  const n = Number(total);
  if (!Number.isFinite(n)) return `${total} ${currency}`;
  return `${n.toFixed(2)} ${currency}`;
}

/** Format a YYYY-MM-DD or ISO timestamp as "Jan 5, 2026". Returns empty string when null. */
export function formatDate(value: string | null): string {
  if (!value) return '';
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return value;
  return d.toLocaleDateString(undefined, {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  });
}
