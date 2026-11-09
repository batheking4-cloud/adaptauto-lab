export function Ring({ value, label, size = 140 }: { value: number; label: string; size?: number }) {
  const r = size / 2 - 12, c = 2 * Math.PI * r, v = Math.max(0, Math.min(100, value))
  return (<div style={{ position: 'relative', width: size, height: size }} role="img" aria-label={`${label} : ${v} %`}>
    <svg width={size} height={size} style={{ transform: 'rotate(-90deg)' }}><circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke="var(--line)" strokeWidth="12" />
      <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke="var(--accent)" strokeWidth="12" strokeLinecap="round" strokeDasharray={`${c * v / 100} ${c}`} style={{ transition: 'stroke-dasharray .8s' }} /></svg>
    <div style={{ position: 'absolute', inset: 0, display: 'grid', placeItems: 'center', textAlign: 'center' }}><div><p className="text-3xl font-semibold">{v}%</p><p className="muted text-xs">{label}</p></div></div></div>)
}
export function Bars({ data }: { data: { l: string; v: number }[] }) {
  const m = Math.max(1, ...data.map(d => d.v))
  return (<div className="flex items-end gap-2" style={{ height: 110 }}>{data.map(d => <div key={d.l} className="grid gap-1 text-center" style={{ flex: 1 }}>
    <div style={{ height: Math.max(4, 80 * d.v / m), background: 'var(--accent)', borderRadius: 8, opacity: d.v ? 1 : .25 }} title={`${d.v}`} /><span className="muted text-xs">{d.l}</span></div>)}</div>)
}
export function lastDays(dates: string[]) {
  const out: { l: string; v: number }[] = []
  for (let i = 6; i >= 0; i--) { const d = new Date(); d.setDate(d.getDate() - i); const k = d.toDateString()
    out.push({ l: d.toLocaleDateString('fr-FR', { weekday: 'short' }).slice(0, 3), v: dates.filter(x => new Date(x).toDateString() === k).length }) }
  return out
}
