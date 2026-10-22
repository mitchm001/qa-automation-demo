/**
    Ids in a URL arrive as text ("7"), but the database needs a real number (7).
    Anything else ("abc", "1.5", "-3", "0") gives null, which the routes turn into a 404.
*/
export function parseId(value: unknown): number | null {
  if (typeof value !== 'string' || !/^\d+$/.test(value)) return null;
  const id = Number(value);
  return Number.isSafeInteger(id) && id > 0 ? id : null;
}
