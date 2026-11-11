'use client'
import Link from 'next/link'
import { useEffect, useRef, useState } from 'react'
function Reveal({ children }: { children: React.ReactNode }) {
  const r = useRef<HTMLDivElement>(null); const [on, setOn] = useState(false)
  useEffect(() => { const el = r.current; if (!el) return; const io = new IntersectionObserver(e => { if (e[0].isIntersecting) { setOn(true); io.disconnect() } }, { threshold: .08 }); io.observe(el); return () => io.disconnect() }, [])
  return <div ref={r} className={`reveal${on ? ' in' : ''}`}>{children}</div>
}
function Quiz({ b, report }: { b: any; report: (ok: boolean) => void }) {
  const [sel, setSel] = useState<number | null>(null)
  return (<div className="glass p-5 grid gap-3"><p className="muted text-xs" style={{ letterSpacing: '.1em' }}>🎯 TESTE-TOI</p><p className="font-semibold">{b.q}</p>
    {b.o.map((o: string, i: number) => <button key={i} className={`qopt${sel !== null ? (i === b.a ? ' ok' : i === sel ? ' ko' : '') : ''}`} disabled={sel !== null} onClick={() => { setSel(i); report(i === b.a) }}>{o}</button>)}
    {sel !== null && <p style={{ animation: 'rise .4s ease both' }}><b style={{ color: sel === b.a ? '#30d158' : '#ff453a' }}>{sel === b.a ? 'Bravo, bonne réponse ! ' : 'Pas tout à fait. '}</b><span className="muted">{b.e}</span></p>}</div>)
}
function Flip({ b }: { b: any }) {
  const [on, setOn] = useState<boolean[]>(b.x.map(() => false))
  return (<div className="grid gap-3"><div className="flex justify-between items-center"><p className="muted text-xs" style={{ letterSpacing: '.1em' }}>🃏 CARTES À RETOURNER</p><button className="back" onClick={() => setOn(on.map(() => !on.every(Boolean)))}>Tout retourner</button></div>
    <div className="grid gap-3 sm:grid-cols-2">{b.x.map((c: string[], i: number) => <div key={i} className={`flipc${on[i] ? ' on' : ''}`} onClick={() => setOn(on.map((v, j) => j === i ? !v : v))} role="button" tabIndex={0} onKeyDown={e => e.key === 'Enter' && setOn(on.map((v, j) => j === i ? !v : v))}><div><div className="f">{c[0]}</div><div className="b">{c[1]}</div></div></div>)}</div></div>)
}
function Block({ b, zoom, report }: { b: any; zoom: (s: string) => void; report: (ok: boolean) => void }) {
  switch (b.t) {
    case 'p': return <p style={{ lineHeight: 1.7 }}>{b.x}</p>
    case 'h': return <h2 className="text-xl font-semibold" style={{ marginTop: 8 }}>{b.x}</h2>
    case 'ul': return <ul className="grid gap-2">{b.x.map((x: string, i: number) => <li key={i} className="flex gap-3"><span style={{ color: 'var(--accent)' }}>●</span><span>{x}</span></li>)}</ul>
    case 'ol': return <ol className="grid gap-2">{b.x.map((x: string, i: number) => <li key={i} className="flex gap-3"><b style={{ color: 'var(--accent)', minWidth: 24 }}>{i + 1}.</b><span>{x}</span></li>)}</ol>
    case 'key': return <div className="keybox"><p className="text-xs muted" style={{ letterSpacing: '.1em' }}>💡 À RETENIR</p><p className="font-semibold" style={{ lineHeight: 1.6 }}>{b.x}</p></div>
    case 'def': return <div className="grid gap-2">{b.x.map((d: string[], i: number) => <details key={i} className="glass p-4 acc"><summary><span>{d[0]}</span><span>▾</span></summary><p className="muted" style={{ lineHeight: 1.7, padding: '4px 4px 6px' }}>{d[1]}</p></details>)}</div>
    case 'img': return <figure className="grid gap-2"><img className="zimg" src={b.src} alt={b.cap || 'Illustration du cours'} loading="lazy" onClick={() => zoom(b.src)} />{b.cap && <figcaption className="muted text-sm text-center">🔍 {b.cap} (touchez pour agrandir)</figcaption>}</figure>
    case 'tbl': return <div className="tblwrap"><table><thead><tr>{b.h.map((h: string, i: number) => <th key={i}>{h}</th>)}</tr></thead><tbody>{b.r.map((r: string[], i: number) => <tr key={i}>{r.map((c, j) => <td key={j} style={j === 0 ? { fontWeight: 600 } : {}}>{c}</td>)}</tr>)}</tbody></table></div>
    case 'cmp': return <div className="grid gap-3 sm:grid-cols-2">{[b.l, b.r].map((c: string[], i: number) => <div key={i} className="glass p-5 grid gap-2"><p className="font-semibold" style={{ color: 'var(--accent)' }}>{c[0]}</p><p style={{ lineHeight: 1.6 }}>{c[1]}</p></div>)}</div>
    case 'flip': return <Flip b={b} />
    case 'quiz': return <Quiz b={b} report={report} />
    case 'go': return <Link href={b.h} className="btn" style={{ width: 'fit-content' }}>{b.l}</Link>
    default: return null
  }
}
export default function LessonView({ chapter, section, toc, prev, next, done, position, action }: { chapter: { title: string; icon: string; draft: boolean }; section: { id: string; title: string; min: number; blocks: any[] }; toc: any[]; prev: string | null; next: string | null; done: boolean; position: string; action: (fd: FormData) => Promise<void> }) {
  const [pct, setPct] = useState(0); const [open, setOpen] = useState(false); const [img, setImg] = useState<string | null>(null); const [res, setRes] = useState<boolean[]>([])
  useEffect(() => { const f = () => { const h = document.documentElement; setPct(Math.min(100, Math.round(100 * h.scrollTop / Math.max(1, h.scrollHeight - h.clientHeight)))) }; f(); window.addEventListener('scroll', f, { passive: true }); return () => window.removeEventListener('scroll', f) }, [])
  useEffect(() => { window.scrollTo(0, 0); setRes([]) }, [section.id])
  const nq = section.blocks.filter(b => b.t === 'quiz').length
  return (<main className="max-w-3xl mx-auto p-3 sm:p-5 pb-8 grid gap-5">
    <div className="rprog" style={{ width: `${pct}%` }} aria-hidden="true" />
    <div className="flex justify-between items-center gap-3 flex-wrap"><Link href="/eleve/cours" className="back">← Le cours</Link><button className="back" onClick={() => setOpen(true)}>☰ Sommaire</button></div>
    {chapter.draft && <p className="glass p-3 text-sm" style={{ color: '#ff9f0a' }}>Brouillon : ce chapitre n’est visible que par l’administrateur.</p>}
    <header className="grid gap-2"><p className="muted text-sm">{chapter.icon} {chapter.title} · leçon {position} · {section.min} min</p><h1 className="text-3xl sm:text-4xl font-semibold tracking-tight">{section.title}</h1></header>
    {section.blocks.map((b, i) => <Reveal key={section.id + i}><Block b={b} zoom={setImg} report={ok => setRes(r => [...r, ok])} /></Reveal>)}
    {nq > 0 && res.length > 0 && <div className="glass p-4 text-center" style={{ animation: 'pop .4s ease both' }}>Auto-évaluation : <b>{res.filter(Boolean).length} / {nq}</b> bonne{res.filter(Boolean).length > 1 ? 's' : ''} réponse{res.filter(Boolean).length > 1 ? 's' : ''}</div>}
    <div className="flex gap-3 flex-wrap items-center justify-between" style={{ marginTop: 8 }}>
      {prev ? <Link href={prev} className="btn btn-ghost">← Précédent</Link> : <span />}
      <form action={action} className="flex-1" style={{ minWidth: 220 }}><input type="hidden" name="section_id" value={section.id} /><input type="hidden" name="next" value={next ?? '/eleve/cours'} />
        <button className="btn">{done ? 'Déjà terminée ✓ ' : 'J’ai compris ✓ '}{next ? '· Leçon suivante →' : '· Terminer le cours'}</button></form></div>
    {open && <div className="drawerbg" onClick={() => setOpen(false)}><div className="drawer" onClick={e => e.stopPropagation()}><div className="flex justify-between items-center mb-3"><h2 className="font-semibold text-lg">Sommaire</h2><button className="back" onClick={() => setOpen(false)}>Fermer ✕</button></div>
      {toc.map((c: any) => <div key={c.title} className="mb-3"><p className="muted text-sm" style={{ padding: '4px 12px' }}>{c.icon} {c.title}</p>{c.items.map((s: any) => <Link key={s.id} href={s.href} onClick={() => setOpen(false)} className={`trow${s.id === section.id ? ' cur' : ''}`}><span className={`chk${s.done ? ' on' : ''}`}>{s.done ? '✓' : ''}</span><span>{s.title}</span></Link>)}</div>)}</div></div>}
    {img && <div className="lightbox" onClick={() => setImg(null)} role="dialog" aria-label="Image agrandie"><img src={img} alt="Image agrandie" /></div>}
  </main>)
}
