'use client'
import Link from 'next/link'
import { useState } from 'react'
import { Ring } from './Viz'
type S = { id: string; title: string; min: number; done: boolean }
type C = { id: string; title: string; icon: string; summary: string; status: string; sections: S[] }
export default function CourseHome({ chapters }: { chapters: C[] }) {
  const [q, setQ] = useState('')
  const all = chapters.flatMap(c => c.sections.map(s => ({ ...s, cid: c.id, ct: c.title })))
  const total = all.length, done = all.filter(s => s.done).length, pct = total ? Math.round(100 * done / total) : 0
  const next = all.find(s => !s.done) ?? all[0]
  const hits = q.trim() ? all.filter(s => (s.title + ' ' + s.ct).toLowerCase().includes(q.toLowerCase())) : []
  return (
    <main className="max-w-5xl mx-auto p-3 sm:p-5 pb-8 grid gap-5">
      <a href="/eleve" className="link">← Mon espace</a>
      <section className="glass p-6 grid gap-5 sm:grid-cols-[auto_1fr] items-center">
        <Ring value={pct} label="du cours" size={140} />
        <div className="grid gap-3"><div><p className="muted text-sm">Apprentissage</p><h1 className="text-3xl font-semibold tracking-tight">Le Code de la route</h1><p className="muted">{done} leçon{done > 1 ? 's' : ''} terminée{done > 1 ? 's' : ''} sur {total} · {chapters.length} chapitres. Reviens en arrière quand tu veux.</p></div>
          {next && <Link href={`/eleve/cours/${next.cid}/${next.id}`} className="btn" style={{ width: 'fit-content' }}>{done === 0 ? 'Commencer le cours' : done === total ? 'Revoir le cours' : 'Reprendre : ' + next.title} →</Link>}</div></section>
      <input className="input" placeholder="🔎 Rechercher une leçon (ex. feux, priorité, ligne continue)" value={q} onChange={e => setQ(e.target.value)} aria-label="Rechercher une leçon" />
      {q.trim() ? <section className="glass p-4 grid gap-1">{hits.length ? hits.map(s => <Link key={s.id} href={`/eleve/cours/${s.cid}/${s.id}`} className="trow"><span className={`chk${s.done ? ' on' : ''}`}>{s.done ? '✓' : ''}</span><span>{s.title}<span className="muted text-xs"> · {s.ct}</span></span></Link>) : <p className="muted p-2">Aucune leçon trouvée.</p>}</section>
      : <section className="grid gap-4">{chapters.length === 0 && <p className="glass p-6 muted">Le cours n’est pas encore disponible.</p>}
        {chapters.map((c, i) => { const d = c.sections.filter(s => s.done).length, p = c.sections.length ? Math.round(100 * d / c.sections.length) : 0
          return (<details key={c.id} className="glass p-4" open={next?.cid === c.id} style={{ animationDelay: `${i * .06}s` }}>
            <summary className="flex items-center justify-between gap-3 cursor-pointer"><span className="flex items-center gap-3"><span className="ico" style={{ width: 48, height: 48, fontSize: 24 }} aria-hidden="true">{c.icon}</span>
              <span><b>{i + 1}. {c.title}</b>{c.status === 'draft' && <span className="text-xs" style={{ color: '#ff9f0a' }}> · brouillon</span>}<br /><span className="muted text-sm">{c.summary}</span></span></span><span className="text-sm muted">{d}/{c.sections.length}</span></summary>
            <div className="pbar" style={{ margin: '12px 0 6px' }}><i style={{ width: `${p}%` }} /></div>
            <div className="grid gap-1">{c.sections.map(s => <Link key={s.id} href={`/eleve/cours/${c.id}/${s.id}`} className="trow"><span className={`chk${s.done ? ' on' : ''}`}>{s.done ? '✓' : ''}</span><span style={{ flex: 1 }}>{s.title}</span><span className="muted text-xs">{s.min} min</span></Link>)}</div></details>) })}</section>}
    </main>)
}
