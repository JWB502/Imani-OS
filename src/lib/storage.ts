export function readJson<T>(key: string): T | undefined {
  const raw = localStorage.getItem(key);
  if (!raw) return undefined;
  return JSON.parse(raw) as T;
}

export function writeJson(key: string, value: unknown) {
  localStorage.setItem(key, JSON.stringify(value));
}
