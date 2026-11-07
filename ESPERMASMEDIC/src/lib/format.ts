const p = (n: number) => String(n).padStart(2, '0')
export function fmtTime(s: number) {
  const h = Math.floor(s / 3600), m = Math.floor((s % 3600) / 60), x = s % 60
  return h ? `${h}:${p(m)}:${p(x)}` : `${p(m)}:${p(x)}`
}
