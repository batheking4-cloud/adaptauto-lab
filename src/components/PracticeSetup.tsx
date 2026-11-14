'use client'
import Link from 'next/link'
import { useState } from 'react'
type Opts = { bank_total: number; categories: { name: string; count: number }[]; slides: { slide_no: number; count: number }[] }
export default function PracticeSetup({ opts }: { opts: Opts }) {
  const hasBank = opts.bank_total > 0, hasSlides = opts.slides.length > 0
  const [source, setSource] = useState<'mix' | 'slide' | 'bank'>('mix'); const [slide, setSlide] = useState(opts.slides[0]?.slide_no ?? 0); const [cat, setCat] = useState(''); const [n, setN] = useState(20)
  const sources = ([['mix', '🎲', 'Mélange', 'Questions de la banque et des diapositives', hasBank || hasSlides], ['slide', '🗂️', 'Une diapositive', 'Toutes les questions d’une diapositive', hasSlides], ['bank', '📚', 'Banque de questions', 'Par catégorie', hasBank]] as const)
  const q = new URLSearchParams({ source, n: String(n) }); if (source === 'slide') q.set('slide', String(slide)); if (source === 'bank' && cat) q.set('cat', cat)
  const none = !hasBank && !hasSlides
  return (
    <main className="max-w-3xl mx-auto p-3 sm:p-5 pb-8 grid gap-5">
      <Link href="/eleve" className="back">← Mon espace</Link>
      <header className="grid gap-1"><p className="muted text-sm">Apprendre et progresser</p><h1 className="text-3xl sm:text-4xl font-semibold tracking-tight">S’entraîner</h1>
        <p className="muted">Une question à la fois, avec la <b>correction immédiate</b> et l’explication après chaque réponse. Autant de fois que tu veux.</p></header>
      {none && <p className="glass p-6 muted">Aucune question disponible pour l’instant.</p>}
      <section className="grid gap-3 sm:grid-cols-3">{sources.map(([k, ic, t, d, ok], i) => <button key={k} type="button" disabled={!ok} onClick={() => setSource(k)} aria-pressed={source === k} className="glass p-5 grid gap-1 text-left" style={{ cursor: ok ? 'pointer' : 'not-allowed', opacity: ok ? 1 : .45, border: 0, color: 'inherit', outline: source === k ? '2px solid var(--accent)' : 'none', animationDelay: `${i * .06}s` }}>
        <span style={{ fontSize: 28 }} aria-hidden="true">{ic}</span><b>{t}</b><span className="muted text-sm">{d}</span></button>)}</section>
      {source === 'slide' && <section className="glass p-5 grid gap-3"><p className="font-semibold">Quelle diapositive ?</p><div className="flex gap-2 flex-wrap">{opts.slides.map(s => <button key={s.slide_no} type="button" className="btn btn-ghost" aria-pressed={slide === s.slide_no} style={slide === s.slide_no ? { outline: '2px solid var(--accent)' } : {}} onClick={() => setSlide(s.slide_no)}>{String(s.slide_no).padStart(2, '0')} <span className="muted text-xs">· {s.count}</span></button>)}</div></section>}
      {source === 'bank' && <section className="glass p-5 grid gap-3"><p className="font-semibold">Quelle catégorie ?</p><select className="input" value={cat} onChange={e => setCat(e.target.value)} aria-label="Catégorie"><option value="">Toutes les catégories ({opts.bank_total})</option>{opts.categories.map(c => <option key={c.name} value={c.name}>{c.name} ({c.count})</option>)}</select></section>}
      <section className="glass p-5 grid gap-3"><p className="font-semibold">Combien de questions ?</p><div className="flex gap-2 flex-wrap">{[10, 20, 25, 40].map(v => <button key={v} type="button" className="btn btn-ghost" aria-pressed={n === v} style={n === v ? { outline: '2px solid var(--accent)' } : {}} onClick={() => setN(v)}>{v}</button>)}</div>
        <p className="muted text-sm">Si moins de questions sont disponibles, la séance utilise toutes celles qui existent.</p></section>
      {!none && <Link href={`/eleve/s-entrainer/jouer?${q.toString()}`} prefetch={false} className="btn" style={{ fontSize: 17, padding: '16px 22px' }}>Commencer l’entraînement →</Link>}
    </main>)
}
