'use client'
import { useEffect, useRef, useState } from 'react'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'
type Opt = { id: string; text: string }
type Q = { id: string; text: string; qtype: string; options: Opt[]; image_path?: string | null; audio_path?: string | null; autoplay?: boolean }
export type Quiz = { id: string; kind: string; title: string; intro_text: string; outro_text: string; duration_min: number | null; pass_score: number; questions: Q[]; intro_audio?: string | null; outro_audio?: string | null }
type Det = { question_id: string; text: string; selected: string[]; correct_ids: string[]; is_correct: boolean; explanation: string; options: Opt[] }
type Res = { score_pct: number; correct: number; wrong: number; total: number; passed: boolean | null; pass_score: number; details: Det[] }
export default function Player({ quiz, practice = false, preview = false }: { quiz: Quiz; practice?: boolean; preview?: boolean }) {
  const sb = createClient()
  const exam = quiz.kind === 'exam' && !practice
  const [phase, setPhase] = useState<'intro' | 'play' | 'end'>('intro')
  const [i, setI] = useState(0); const [sel, setSel] = useState<string[]>([])
  const [fb, setFb] = useState<{ is_correct: boolean; correct_ids: string[]; explanation: string; correction_audio_path?: string | null } | null>(null)
  const answers = useRef<{ question_id: string; selected: string[] }[]>([])
  const [res, setRes] = useState<Res | null>(null); const [err, setErr] = useState(''); const [busy, setBusy] = useState(false)
  const [left, setLeft] = useState((quiz.duration_min ?? 0) * 60)
  const done = useRef(false)
  const q = quiz.questions[i]
  const aud = useRef<HTMLAudioElement | null>(null); const [vol, setVol] = useState(1); const [muted, setMuted] = useState(false)
  const base = `${process.env.NEXT_PUBLIC_SUPABASE_URL}/storage/v1/object/public/media/`
  function play(path?: string | null) { if (!path || muted) return; aud.current?.pause(); const a = new Audio(base + path); a.volume = vol; aud.current = a; a.play().catch(() => {}) }
  useEffect(() => { if (aud.current) aud.current.volume = vol }, [vol])
  useEffect(() => { if (phase === 'play' && q?.autoplay) play(q.audio_path) }, [i, phase])
  async function finish() {
    if (done.current) return; done.current = true; setBusy(true)
    if (practice) { const r = answers.current; const c = r.filter((a: any) => a.ok).length; setRes({ score_pct: Math.round(100 * c / Math.max(1, quiz.questions.length)), correct: c, wrong: quiz.questions.length - c, total: quiz.questions.length, passed: null, pass_score: 0, details: [] }); setPhase('end'); return setBusy(false) }
    const { data, error } = await sb.rpc('submit_attempt', { p_quiz: quiz.id, p_answers: answers.current, p_preview: preview })
    if (error) { setErr(error.message); done.current = false } else { setRes(data as Res); setPhase('end'); if (!exam) play(quiz.outro_audio) }
    setBusy(false)
  }
  useEffect(() => {
    if (phase !== 'play' || !exam || !quiz.duration_min) return
    const t = setInterval(() => setLeft(l => l - 1), 1000); return () => clearInterval(t)
  }, [phase])
  useEffect(() => { if (phase === 'play' && exam && quiz.duration_min && left <= 0) { answers.current = withCurrent(); finish() } }, [left])
  function withCurrent() { const a = answers.current.filter(x => x.question_id !== q?.id); return q ? [...a, { question_id: q.id, selected: sel }] : a }
  const toggle = (id: string) => { if (fb) return; setSel(q.qtype === 'multiple' ? (sel.includes(id) ? sel.filter(x => x !== id) : [...sel, id]) : [id]) }
  async function validate() {
    setBusy(true); setErr('')
    const { data, error } = await sb.rpc('check_answer', { p_question: q.id, p_selected: sel, p_record: practice })
    setBusy(false); if (error) return setErr(error.message)
    setFb(data); if (!exam) play(data.correction_audio_path); answers.current = [...answers.current.filter(x => x.question_id !== q.id), { question_id: q.id, selected: sel, ok: data.is_correct } as any]
  }
  function next() {
    if (!exam) { setFb(null); setSel([]); if (i + 1 >= quiz.questions.length) return void finish(); return setI(i + 1) }
    answers.current = withCurrent()
    if (i + 1 >= quiz.questions.length) { if (confirm('Valider définitivement vos réponses ?')) finish(); return }
    setI(i + 1); const nxt = answers.current.find(x => x.question_id === quiz.questions[i + 1].id); setSel(nxt?.selected ?? [])
  }
  function back() { answers.current = withCurrent(); const p = answers.current.find(x => x.question_id === quiz.questions[i - 1].id); setI(i - 1); setSel(p?.selected ?? []) }
  if (!quiz.questions.length) return <p className="glass p-6 muted">Ce contenu ne contient aucune question.</p>
  if (phase === 'intro') return (
    <div className="glass p-6 grid gap-4"><h1 className="text-3xl font-semibold tracking-tight">{quiz.title}</h1>
      {quiz.intro_text && <p>{quiz.intro_text}</p>}
      <p className="muted">{quiz.questions.length} questions{exam && quiz.duration_min ? ` · ${quiz.duration_min} min · réussite à ${quiz.pass_score} %` : ''}{exam ? ' · pas de correction pendant l’examen' : ''}</p>
      {quiz.intro_audio && <button className="btn btn-ghost" onClick={() => play(quiz.intro_audio)}>🔊 Écouter la présentation</button>}
      <button className="btn" onClick={() => setPhase('play')}>Commencer</button></div>)
  if (phase === 'end' && res) return (
    <div className="grid gap-4"><div className="glass p-6 grid gap-2">
      <h1 className="text-3xl font-semibold tracking-tight">{res.passed === null ? (res.score_pct >= 70 ? 'Bravo !' : 'Terminé') : res.passed ? 'Examen réussi' : 'Examen non réussi'}</h1>
      <p className="text-5xl font-semibold">{res.score_pct} %</p>
      <p className="muted">{res.correct} bonnes réponses · {res.wrong} mauvaises · {res.total} questions{res.passed !== null ? ` · seuil ${res.pass_score} %` : ''}</p>
      {!exam && quiz.outro_text && <p>{quiz.outro_text}</p>}{!exam && quiz.outro_audio && <button className="btn btn-ghost" style={{ width: 'fit-content' }} onClick={() => play(quiz.outro_audio)}>🔊 Réécouter</button>}
      {preview && <p className="muted text-sm">Aperçu : ce résultat n’est pas enregistré.</p>}
      <div className="flex gap-2 flex-wrap"><Link href="/eleve/erreurs" className="btn" style={{ width: 'auto' }}>M’entraîner sur mes erreurs</Link><Link href={preview ? '/admin' : '/eleve'} className="btn btn-ghost">Retour</Link></div></div>
      {res.details.map((d, n) => (<div key={d.question_id} className="glass p-5 grid gap-2"><p className="font-medium">{n + 1}. {d.text}</p>
        {d.options.map(o => { const good = d.correct_ids.includes(o.id), pick = d.selected.includes(o.id)
          return <p key={o.id} style={{ color: good ? '#30d158' : pick ? '#ff6b6b' : 'inherit' }}>{good ? '✓' : pick ? '✗' : '•'} {o.text}{pick ? ' (votre réponse)' : ''}</p> })}
        <p className="muted text-sm">{d.is_correct ? 'Bonne réponse.' : 'Réponse incorrecte.'} {d.explanation}</p></div>))}
    </div>)
  const mm = String(Math.max(0, Math.floor(left / 60))).padStart(2, '0') + ':' + String(Math.max(0, left % 60)).padStart(2, '0')
  return (
    <div className="grid gap-4">
      <div className="glass p-4 grid gap-2"><div className="flex justify-between muted text-sm"><span>Question {i + 1} / {quiz.questions.length}</span>{exam && quiz.duration_min ? <span role="timer">Temps restant {mm}</span> : null}</div>
        <div style={{ height: 8, borderRadius: 4, background: 'var(--line)' }}><div style={{ height: 8, borderRadius: 4, background: 'var(--accent)', width: `${(i + (fb ? 1 : 0)) / quiz.questions.length * 100}%`, transition: 'width .3s' }} /></div></div>
      <div className="glass p-6 grid gap-3">{q.image_path && <img src={base + q.image_path} alt="Illustration de la question" style={{ width: '100%', maxHeight: 260, objectFit: 'contain', borderRadius: 16 }} />}<h2 className="text-xl font-semibold">{q.text}</h2>
        <div className="flex items-center gap-2 flex-wrap muted text-sm">{q.audio_path && <button type="button" className="btn btn-ghost" onClick={() => play(q.audio_path)}>🔊 Écouter la question</button>}<button type="button" className="btn btn-ghost" onClick={() => { setMuted(!muted); aud.current?.pause() }}>{muted ? '🔇 Son coupé' : '🔊 Son activé'}</button><input type="range" min="0" max="1" step="0.1" value={vol} onChange={e => setVol(Number(e.target.value))} aria-label="Volume" /></div>
        {q.qtype === 'multiple' && <p className="muted text-sm">Plusieurs réponses possibles.</p>}
        {q.options.map(o => { const on = sel.includes(o.id); const good = fb?.correct_ids.includes(o.id)
          const st = fb ? (good ? { borderColor: '#30d158' } : on ? { borderColor: '#ff6b6b' } : {}) : on ? { borderColor: 'var(--accent)' } : {}
          return <button key={o.id} type="button" onClick={() => toggle(o.id)} aria-pressed={on} className="input" style={{ textAlign: 'left', borderWidth: 2, ...st }}>{q.qtype === 'multiple' ? (on ? '☑ ' : '☐ ') : on ? '◉ ' : '○ '}{o.text}</button> })}
        {fb && <div className="grid gap-1"><p className="font-semibold" style={{ color: fb.is_correct ? '#30d158' : '#ff6b6b' }}>{fb.is_correct ? 'Bravo, bonne réponse !' : 'Ce n’est pas la bonne réponse.'}</p>{fb.explanation && <p className="muted">{fb.explanation}</p>}</div>}
        {err && <p role="alert" style={{ color: '#ff6b6b' }}>{err}</p>}
        <div className="flex gap-2">
          {exam && i > 0 && <button className="btn btn-ghost" onClick={back}>Précédente</button>}
          {!exam && !fb && <button className="btn" disabled={!sel.length || busy} onClick={validate}>Valider</button>}
          {(exam || fb) && <button className="btn" disabled={busy} onClick={next}>{i + 1 >= quiz.questions.length ? (exam ? 'Terminer l’examen' : 'Voir mon résultat') : 'Suivant'}</button>}
        </div></div></div>)
}
