'use client'
import { useState } from 'react'
type S = { id: string; chapter: string; type: string; title: string; content: string; video_url: string; quiz_id: string | null; unlock_type: string; min_score: number }
const T: Record<string, string> = { lesson: 'Leçon', game: 'Mini-jeu / quiz', exam: 'Examen blanc' }
export default function PathForm({ path, initial, quizzes, action }: { path: any; initial: S[]; quizzes: { id: string; title: string; kind: string }[]; action: (fd: FormData) => Promise<void> }) {
  const [steps, setSteps] = useState<S[]>(initial)
  const add = (type: string) => setSteps([...steps, { id: crypto.randomUUID(), chapter: steps.at(-1)?.chapter ?? '', type, title: '', content: '', video_url: '', quiz_id: null, unlock_type: steps.length ? 'previous' : 'free', min_score: 70 }])
  const set = (i: number, v: Partial<S>) => setSteps(steps.map((s, j) => j === i ? { ...s, ...v } : s))
  const move = (i: number, d: number) => { const k = i + d; if (k < 0 || k >= steps.length) return; const c = [...steps];[c[i], c[k]] = [c[k], c[i]]; setSteps(c) }
  return (
    <form action={action} className="grid gap-4">
      <h1 className="text-3xl font-semibold tracking-tight">{path.id ? 'Modifier le parcours' : 'Nouveau parcours'}</h1>
      <input type="hidden" name="id" value={path.id} /><input type="hidden" name="steps" value={JSON.stringify(steps)} />
      <div className="glass p-5 grid gap-3"><label className="grid gap-1"><span className="muted text-sm">Titre</span><input className="input" name="title" defaultValue={path.title} required /></label>
        <label className="grid gap-1"><span className="muted text-sm">Description</span><textarea className="input" name="description" rows={2} defaultValue={path.description} /></label></div>
      {steps.map((s, i) => (
        <div key={s.id} className="glass p-5 grid gap-3">
          <div className="flex items-center gap-2 flex-wrap"><p className="font-semibold flex-1">Étape {i + 1} · {T[s.type]}</p>
            <button type="button" className="btn btn-ghost" onClick={() => move(i, -1)} aria-label="Monter">↑</button><button type="button" className="btn btn-ghost" onClick={() => move(i, 1)} aria-label="Descendre">↓</button>
            <button type="button" className="btn-danger" onClick={() => setSteps(steps.filter((_, j) => j !== i))}>Supprimer</button></div>
          <div className="grid gap-3 sm:grid-cols-2"><input className="input" placeholder="Chapitre (ex. Les panneaux de danger)" value={s.chapter} onChange={e => set(i, { chapter: e.target.value })} />
            <input className="input" placeholder="Titre de l’étape" value={s.title} onChange={e => set(i, { title: e.target.value })} /></div>
          {s.type === 'lesson' ? <><textarea className="input" rows={4} placeholder="Contenu de la leçon (texte)" value={s.content} onChange={e => set(i, { content: e.target.value })} />
            <input className="input" placeholder="Lien vidéo (YouTube ou fichier .mp4), facultatif" value={s.video_url} onChange={e => set(i, { video_url: e.target.value })} /></>
            : <select className="input" value={s.quiz_id ?? ''} onChange={e => set(i, { quiz_id: e.target.value || null })}><option value="">Choisir…</option>{quizzes.filter(q => q.kind === s.type).map(q => <option key={q.id} value={q.id}>{q.title}</option>)}</select>}
          <div className="grid gap-3 sm:grid-cols-2"><select className="input" value={s.unlock_type} onChange={e => set(i, { unlock_type: e.target.value })} aria-label="Condition d’accès">
            <option value="free">Accès libre</option><option value="previous">Après avoir terminé l’étape précédente</option><option value="previous_score">Après un score minimum à l’étape précédente</option><option value="all_previous">Après validation de toutes les étapes précédentes</option></select>
            {s.unlock_type === 'previous_score' && <input className="input" type="number" min={0} max={100} value={s.min_score} onChange={e => set(i, { min_score: Number(e.target.value) })} aria-label="Score minimum (%)" />}</div>
        </div>))}
      <div className="flex gap-2 flex-wrap">{Object.keys(T).map(t => <button key={t} type="button" className="btn btn-ghost" onClick={() => add(t)}>+ {T[t]}</button>)}</div>
      <div className="flex gap-2 flex-wrap"><button className="btn btn-ghost" name="status" value="draft">Enregistrer comme brouillon</button><button className="btn" style={{ width: 'auto' }} name="status" value="published">Publier</button>
        {path.id && <a className="btn btn-ghost" href={`/eleve/parcours/${path.id}?apercu=1`} target="_blank">Aperçu élève</a>}</div>
    </form>)
}
