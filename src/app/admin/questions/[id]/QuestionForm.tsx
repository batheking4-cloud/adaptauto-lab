'use client'
import { useState } from 'react'
type Opt = { text: string; is_correct: boolean }
type Q = { id: string; text: string; category: string; difficulty: number; qtype: string; explanation: string }
export default function QuestionForm({ q, opts, action }: { q: Q; opts: Opt[]; action: (fd: FormData) => Promise<void> }) {
  const [type, setType] = useState(q.qtype)
  const [options, setOptions] = useState<Opt[]>(opts)
  const [err, setErr] = useState('')
  const tf = type === 'truefalse'
  function changeType(t: string) {
    setType(t)
    if (t === 'truefalse') setOptions([{ text: 'Vrai', is_correct: true }, { text: 'Faux', is_correct: false }])
    else if (t === 'single') { const i = Math.max(0, options.findIndex(o => o.is_correct)); setOptions(options.map((o, j) => ({ ...o, is_correct: j === i }))) }
  }
  const setCorrect = (i: number) => setOptions(options.map((o, j) => type === 'multiple' ? (j === i ? { ...o, is_correct: !o.is_correct } : o) : { ...o, is_correct: j === i }))
  const edit = (i: number, text: string) => setOptions(options.map((o, j) => j === i ? { ...o, text } : o))
  const remove = (i: number) => setOptions(options.filter((_, j) => j !== i))
  function move(i: number, d: number) { const k = i + d; if (k < 0 || k >= options.length) return; const c = [...options];[c[i], c[k]] = [c[k], c[i]]; setOptions(c) }
  function check(e: React.FormEvent<HTMLFormElement>) {
    const good = options.filter(o => o.is_correct).length
    const msg = options.length < 2 || options.some(o => !o.text.trim()) ? 'Il faut au moins 2 propositions, toutes remplies.'
      : good < 1 ? 'Cochez au moins une bonne réponse.' : type !== 'multiple' && good !== 1 ? 'Une seule bonne réponse pour ce type.' : ''
    setErr(msg); if (msg) e.preventDefault()
  }
  return (
    <form action={action} onSubmit={check} className="grid gap-4">
      <h1 className="text-3xl font-semibold tracking-tight">{q.id ? 'Modifier la question' : 'Nouvelle question'}</h1>
      <input type="hidden" name="id" value={q.id} />
      <input type="hidden" name="options" value={JSON.stringify(options)} />
      <div className="glass p-5 grid gap-3">
        <label className="grid gap-1"><span className="muted text-sm">Énoncé</span><textarea className="input" name="text" rows={3} defaultValue={q.text} required /></label>
        <div className="grid gap-3 sm:grid-cols-3">
          <label className="grid gap-1"><span className="muted text-sm">Catégorie</span><input className="input" name="category" defaultValue={q.category} /></label>
          <label className="grid gap-1"><span className="muted text-sm">Difficulté</span>
            <select className="input" name="difficulty" defaultValue={q.difficulty}><option value={1}>1 - Facile</option><option value={2}>2 - Moyenne</option><option value={3}>3 - Difficile</option></select></label>
          <label className="grid gap-1"><span className="muted text-sm">Type de réponse</span>
            <select className="input" name="qtype" value={type} onChange={e => changeType(e.target.value)}><option value="single">Réponse unique</option><option value="multiple">Réponses multiples</option><option value="truefalse">Vrai ou faux</option></select></label>
        </div>
      </div>
      <div className="glass p-5 grid gap-3">
        <p className="font-semibold">Propositions <span className="muted text-sm font-normal">({type === 'multiple' ? 'cochez toutes les bonnes réponses' : 'choisissez la bonne réponse'})</span></p>
        {options.map((o, i) => (
          <div key={i} className="flex items-center gap-2">
            <input aria-label="Bonne réponse" type={type === 'multiple' ? 'checkbox' : 'radio'} name="correct" checked={o.is_correct} onChange={() => setCorrect(i)} style={{ width: 22, height: 22 }} />
            <input className="input" value={o.text} disabled={tf} onChange={e => edit(i, e.target.value)} placeholder={`Proposition ${i + 1}`} />
            {!tf && <>
              <button type="button" className="btn btn-ghost" onClick={() => move(i, -1)} aria-label="Monter">↑</button>
              <button type="button" className="btn btn-ghost" onClick={() => move(i, 1)} aria-label="Descendre">↓</button>
              <button type="button" className="btn-danger" onClick={() => remove(i)} aria-label="Supprimer">✕</button></>}
          </div>))}
        {!tf && <button type="button" className="btn btn-ghost" onClick={() => setOptions([...options, { text: '', is_correct: false }])}>Ajouter une proposition</button>}
      </div>
      <div className="glass p-5"><label className="grid gap-1"><span className="muted text-sm">Explication (affichée à l’élève après sa réponse)</span><textarea className="input" name="explanation" rows={4} defaultValue={q.explanation} /></label></div>
      {err && <p role="alert" style={{ color: '#ff6b6b' }}>{err}</p>}
      <div className="flex gap-3"><button className="btn">Enregistrer la question</button><a href="/admin/questions" className="btn btn-ghost">Annuler</a></div>
    </form>
  )
}
