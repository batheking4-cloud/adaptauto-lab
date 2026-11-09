'use client'
import { useState } from 'react'
type Q = { id: string; text: string; category: string }
export default function QuizForm({ quiz, all, selected, action }: { quiz: any; all: Q[]; selected: string[]; action: (fd: FormData) => Promise<void> }) {
  const [sel, setSel] = useState<string[]>(selected); const exam = quiz.kind === 'exam'
  const by = (id: string) => all.find(q => q.id === id)
  const move = (i: number, d: number) => { const k = i + d; if (k < 0 || k >= sel.length) return; const c = [...sel];[c[i], c[k]] = [c[k], c[i]]; setSel(c) }
  const f = (label: string, el: React.ReactNode) => <label className="grid gap-1"><span className="muted text-sm">{label}</span>{el}</label>
  return (
    <form action={action} className="grid gap-4">
      <h1 className="text-3xl font-semibold tracking-tight">{quiz.id ? 'Modifier' : 'Créer'} {exam ? 'un examen blanc' : 'un mini-jeu'}</h1>
      <input type="hidden" name="id" value={quiz.id} /><input type="hidden" name="kind" value={quiz.kind} /><input type="hidden" name="qids" value={JSON.stringify(sel)} />
      <div className="glass p-5 grid gap-3">
        {f('Titre', <input className="input" name="title" defaultValue={quiz.title} required />)}
        {f('Description', <textarea className="input" name="description" rows={2} defaultValue={quiz.description} />)}
        <div className="grid gap-3 sm:grid-cols-3">{f('Catégorie', <input className="input" name="category" defaultValue={quiz.category} />)}
          {f('Difficulté', <select className="input" name="difficulty" defaultValue={quiz.difficulty}><option value={1}>1 - Facile</option><option value={2}>2 - Moyenne</option><option value={3}>3 - Difficile</option></select>)}
          {exam && f('Durée (minutes)', <input className="input" type="number" min={1} name="duration_min" defaultValue={quiz.duration_min ?? 20} />)}</div>
        {exam && f('Score minimum de réussite (%)', <input className="input" type="number" min={0} max={100} name="pass_score" defaultValue={quiz.pass_score} />)}
        {!exam && <>{f('Message d’introduction', <textarea className="input" name="intro_text" rows={2} defaultValue={quiz.intro_text} />)}{f('Message de fin', <textarea className="input" name="outro_text" rows={2} defaultValue={quiz.outro_text} />)}</>}
      </div>
      <div className="glass p-5 grid gap-2"><p className="font-semibold">Questions choisies ({sel.length}) <span className="muted text-sm font-normal">dans l’ordre de passage</span></p>
        {sel.map((id, i) => <div key={id} className="flex items-center gap-2"><span className="flex-1">{i + 1}. {by(id)?.text ?? '(supprimée)'}</span>
          <button type="button" className="btn btn-ghost" onClick={() => move(i, -1)} aria-label="Monter">↑</button><button type="button" className="btn btn-ghost" onClick={() => move(i, 1)} aria-label="Descendre">↓</button>
          <button type="button" className="btn-danger" onClick={() => setSel(sel.filter(x => x !== id))} aria-label="Retirer">✕</button></div>)}
        {!sel.length && <p className="muted text-sm">Ajoutez des questions depuis la banque ci-dessous.</p>}</div>
      <div className="glass p-5 grid gap-2"><p className="font-semibold">Banque de questions</p>
        {all.filter(q => !sel.includes(q.id)).map(q => <div key={q.id} className="flex items-center gap-2"><span className="flex-1">{q.text} <span className="muted text-sm">· {q.category}</span></span>
          <button type="button" className="btn btn-ghost" onClick={() => setSel([...sel, q.id])}>Ajouter</button></div>)}</div>
      <div className="flex gap-2 flex-wrap"><button className="btn btn-ghost" name="status" value="draft">Enregistrer comme brouillon</button><button className="btn" style={{ width: 'auto' }} name="status" value="published">Publier</button>
        {quiz.id && <a className="btn btn-ghost" href={`/eleve/jouer/${quiz.id}?apercu=1`} target="_blank">Aperçu élève</a>}</div>
      {quiz.id && <p className="muted text-sm">L’aperçu montre la dernière version enregistrée. Enregistrez avant de prévisualiser.</p>}
    </form>)
}
