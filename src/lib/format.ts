export const fmt = (cents: number) => `$${(cents / 100).toFixed(2)}`;
export const fmtDate = (s: string) => new Date(s).toLocaleString();
export const fmtShort = (s: string) => new Date(s).toLocaleDateString();
