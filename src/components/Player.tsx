'use client'
import { useEffect, useRef, useState } from 'react'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'
type Opt = { id: string; text: string }
type Q = { id: string; text: string; qtype: string; options: Opt[]; image_path?: string | null; audio_path?: string | null; audio_text?: string | null; autoplay?: boolean }
export type Quiz = { id: string; kind: string; title: string; intro_text: string; outro_text: string; duration_min: number | null; pass_score: number; questions: Q[]; intro_audio?: string | null; outro_audio?: string | null }
type Det = { question_id: string; text: string; selected: string[]; correct_ids: string[]; is_correct: boolean; explanation: string; options: Opt[] }
type Res = { score_pct: number; correct: number; wrong: number; total: number; passed: boolean | null; pass_score: number; details: Det[] }
type Fb = { is_correct: boolean; correct_ids: string[]; explanation: string; correction_audio_path?: string | null }
const DECOR: [string, number, number][] = [['🚗', 6, 22], ['🚦', 90, 30], ['🛑', 12, 62], ['⚠️', 84, 70], ['🚸', 50, 12]]
function Car({ mood }: { mood: string }) {
  return (<svg className={`gcar ${mood}`} viewBox="0 0 160 90" aria-hidden="true">
    <rect x="10" y="38" width="140" height="34" rx="14" fill="#e5383b" /><path d="M38 38 56 14H104L126 38Z" fill="#e5383b" />
    <path d="M50 38 62 20H82V38Z" fill="#d9efff" /><path d="M88 38V20H101L116 38Z" fill="#d9efff" />
    <circle cx="68" cy="31" r="6" fill="#fff" /><circle cx="70" cy="31" r="3" fill="#222" /><circle cx="97" cy="31" r="6" fill="#fff" /><circle cx="99" cy="31" r="3" fill="#222" />
    <path d={mood === 'sad' ? 'M72 58Q83 50 94 58' : 'M72 52Q83 62 94 52'} stroke="#fff" strokeWidth="3.5" fill="none" strokeLinecap="round" />
    <circle cx="146" cy="52" r="6" fill="#ffe27a" /><circle cx="44" cy="74" r="13" fill="#2b2d33" /><circle cx="44" cy="74" r="6" fill="#cfd3da" /><circle cx="116" cy="74" r="13" fill="#2b2d33" /><circle cx="116" cy="74" r="6" fill="#cfd3da" /></svg>)
}
export default function Player({ quiz, practice = false, preview = false, back = '/eleve', notice }: { quiz: Quiz; practice?: boolean; preview?: boolean; back?: string; notice?: string }) {
  const sb = createClient(); const exam = quiz.kind === 'exam' && !practice
  const [phase, setPhase] = useState<'intro' | 'play' | 'end'>('intro'); const [i, setI] = useState(0); const [sel, setSel] = useState<string[]>([])
  const [fb, setFb] = useState<Fb | null>(null); const answers = useRef<any[]>([]); const [res, setRes] = useState<Res | null>(null)
  const [err, setErr] = useState(''); const [busy, setBusy] = useState(false); const [left, setLeft] = useState((quiz.duration_min ?? 0) * 60)
  const [paused, setPaused] = useState(false); const [mood, setMood] = useState<'idle' | 'happy' | 'sad'>('idle'); const done = useRef(false)
  const q = quiz.questions[i]
  const aud = useRef<HTMLAudioElement | null>(null); const [vol, setVol] = useState(1); const [muted, setMuted] = useState(false)
  const base = `${process.env.NEXT_PUBLIC_SUPABASE_URL}/storage/v1/object/public/media/`
  function play(path?: string | null) { if (!path || muted) return; aud.current?.pause(); const a = new Audio(base + path); a.volume = vol; aud.current = a; a.play().catch(() => {}) }
  useEffect(() => { if (aud.current) aud.current.volume = vol }, [vol])
  useEffect(() => { if (phase === 'play' && q?.autoplay) play(q.audio_path) }, [i, phase])
  async function finish() {
    if (done.current) return; done.current = true; setBusy(true)
    if (practice) { const c = answers.current.filter((a: any) => a.ok).length, n = quiz.questions.length; setRes({ score_pct: Math.round(100 * c / Math.max(1, n)), correct: c, wrong: n - c, total: n, passed: null, pass_score: 0, details: [] }); setPhase('end'); return setBusy(false) }
    const { data, error } = await sb.rpc('submit_attempt', { p_quiz: quiz.id, p_answers: answers.current, p_preview: preview })
    if (error) { setErr(error.message); done.current = false } else { setRes(data as Res); setPhase('end'); if (!exam) play(quiz.outro_audio) }
    setBusy(false)
  }
  useEffect(() => { if (phase !== 'play' || !exam || !quiz.duration_min) return; const t = setInterval(() => setLeft(l => l - 1), 1000); return () => clearInterval(t) }, [phase])
  useEffect(() => { if (phase === 'play' && exam && quiz.duration_min && left <= 0) { answers.current = withCurrent(); finish() } }, [left])
  function withCurrent() { const a = answers.current.filter(x => x.question_id !== q?.id); return q ? [...a, { question_id: q.id, selected: sel }] : a }
  const toggle = (id: string) => { if (fb || paused) return; setSel(q.qtype === 'multiple' ? (sel.includes(id) ? sel.filter(x => x !== id) : [...sel, id]) : [id]) }
  async function validate() {
    setBusy(true); setErr(''); const { data, error } = await sb.rpc('check_answer', { p_question: q.id, p_selected: sel, p_record: practice }); setBusy(false)
    if (error) return setErr(error.message)
    setFb(data); setMood(data.is_correct ? 'happy' : 'sad'); if (!exam) play(data.correction_audio_path)
    answers.current = [...answers.current.filter(x => x.question_id !== q.id), { question_id: q.id, selected: sel, ok: data.is_correct }]
  }
  function next() {
    setMood('idle')
    if (!exam) { setFb(null); setSel([]); if (i + 1 >= quiz.questions.length) return void finish(); return setI(i + 1) }
    answers.current = withCurrent()
    if (i + 1 >= quiz.questions.length) { if (confirm('Valider définitivement vos réponses ?')) finish(); return }
    setI(i + 1); setSel(answers.current.find(x => x.question_id === quiz.questions[i + 1].id)?.selected ?? [])
  }
  function prev() { answers.current = withCurrent(); setI(i - 1); setSel(answers.current.find(x => x.question_id === quiz.questions[i - 1].id)?.selected ?? []) }
  const mm = String(Math.max(0, Math.floor(left / 60))).padStart(2, '0') + ':' + String(Math.max(0, left % 60)).padStart(2, '0')
  const win = !!res && (res.passed ?? res.score_pct >= 70)
  const title = practice ? 'Mes erreurs' : quiz.title
  const scene = (card: React.ReactNode, extra?: React.ReactNode) => (
    <div className="gscene">
      {DECOR.map(([e, x, y], k) => <span key={k} className="gfloat" aria-hidden="true" style={{ left: `${x}%`, top: `${y}%`, animationDelay: `${k * .7}s` }}>{e}</span>)}
      <span className="gcloud" aria-hidden="true" style={{ top: '9%' }} /><span className="gcloud" aria-hidden="true" style={{ top: '30%', animationDelay: '-25s', width: 110 }} />
      <div className="gtop"><Link href={back} className="gpill">← Retour</Link>{notice && <span className="gpill">{notice}</span>}</div>
      <div className="gwrap"><div className="gtitle">{title}</div><div className="gcard">{card}
        <div className={`groad${mood === 'happy' ? ' fast' : ''}`} aria-hidden="true" /><Car mood={mood} /><div className="gsign" aria-hidden="true"><b /><i /></div>
        {mood !== 'idle' && <span className="gbubble" role="status">{mood === 'happy' ? 'Bravo !' : 'Oups !'}</span>}</div></div>{extra}</div>)
  if (!quiz.questions.length) return scene(<p className="gq">Ce contenu ne contient aucune question.</p>)
  if (phase === 'intro') return scene(<div className="grid gap-4 justify-items-center"><p className="gcount">{quiz.questions.length} QUESTIONS{exam && quiz.duration_min ? ` · ${quiz.duration_min} MIN · RÉUSSITE ${quiz.pass_score} %` : ''}</p>
    <h2 className="gq">{quiz.intro_text || (exam ? 'Examen blanc : pas de correction pendant l’épreuve.' : 'Prêt à rouler ? Réponds, la correction est immédiate !')}</h2>
    {quiz.intro_audio && <button className="gpill" onClick={() => play(quiz.intro_audio)}>🔊 Écouter la présentation</button>}<button className="gprimary" onClick={() => setPhase('play')}>Démarrer</button></div>)
  if (phase === 'end' && res) return scene(<div className="grid gap-3 justify-items-center">
    {win && <div className="confetti" aria-hidden="true">{Array.from({ length: 18 }, (_, k) => <i key={k} style={{ ['--l' as string]: `${(k * 37) % 100}%`, ['--h' as string]: (k * 47) % 360, ['--d' as string]: `${(k % 6) * .35}s` }} />)}</div>}
    <p className="gcount">{res.passed === null ? 'RÉSULTAT' : res.passed ? 'EXAMEN RÉUSSI' : 'EXAMEN NON RÉUSSI'}</p><p style={{ fontSize: 'clamp(54px,12vw,96px)', fontWeight: 900, color: win ? '#2fbf71' : '#e5383b', lineHeight: 1, animation: 'pop .6s ease both' }}>{res.score_pct} %</p>
    <p className="gq" style={{ margin: 0 }}>{res.correct} bonnes · {res.wrong} mauvaises · {res.total} questions</p>{res.passed !== null && <p className="gcount">SEUIL {res.pass_score} %</p>}
    {!exam && quiz.outro_text && <p style={{ fontWeight: 700 }}>{quiz.outro_text}</p>}{preview && <p className="gcount">APERÇU : NON ENREGISTRÉ</p>}
    <div className="gcta"><Link href="/eleve/erreurs" className="gprimary" style={{ textDecoration: 'none' }}>M’entraîner sur mes erreurs</Link><Link href={back} className="gpill">Retour</Link></div></div>,
    res.details.length > 0 && <div className="gdetails">{res.details.map((d, n) => <div key={d.question_id} className="gwhite"><p style={{ fontWeight: 800 }}>{n + 1}. {d.text}</p>
      {d.options.map(o => { const good = d.correct_ids.includes(o.id), pick = d.selected.includes(o.id); return <p key={o.id} style={{ color: good ? '#1f9d55' : pick ? '#e5383b' : 'inherit' }}>{good ? '✓' : pick ? '✗' : '•'} {o.text}{pick ? ' (votre réponse)' : ''}</p> })}
      <p style={{ color: '#6b7280', fontSize: 14 }}>{d.is_correct ? 'Bonne réponse.' : 'Réponse incorrecte.'} {d.explanation}</p></div>)}</div>)
  return scene(<>
    {exam && quiz.duration_min ? <span className="gcorner" role="timer">⏱ {mm}</span> : !exam && <button className="gcorner" onClick={() => setPaused(true)} aria-label="Pause">❚❚</button>}
    <p className="gcount">{i + 1} / {quiz.questions.length}</p><div className="gbar"><i style={{ width: `${(i + (fb ? 1 : 0)) / quiz.questions.length * 100}%` }} /></div>
    {q.image_path && <img src={base + q.image_path} alt="Illustration de la question" style={{ maxHeight: 200, margin: '0 auto 14px', borderRadius: 20, objectFit: 'contain', maxWidth: '100%' }} />}
    <h2 className="gq" key={q.id} style={{ animation: 'rise .4s ease both' }}>{q.text}</h2>
    <div style={{ display: 'flex', gap: 8, justifyContent: 'center', flexWrap: 'wrap', marginBottom: 12 }}>{q.audio_path && <button className="gpill" onClick={() => play(q.audio_path)}>🔊 Écouter</button>}
      <button className="gpill" onClick={() => { setMuted(!muted); aud.current?.pause() }}>{muted ? '🔇 Son coupé' : '🔊 Son activé'}</button><input type="range" min="0" max="1" step="0.1" value={vol} onChange={e => setVol(Number(e.target.value))} aria-label="Volume" /></div>
    {q.audio_text && <details style={{ marginBottom: 10, color: '#475569', fontSize: 14 }}><summary style={{ cursor: 'pointer' }}>Voir le texte de l’audio</summary><p>{q.audio_text}</p></details>}
    {q.qtype === 'multiple' && <p className="gcount" style={{ marginBottom: 10 }}>PLUSIEURS RÉPONSES POSSIBLES</p>}
    <div className="gans">{q.options.map((o, k) => { const on = sel.includes(o.id), good = fb?.correct_ids.includes(o.id)
      return <button key={o.id} type="button" disabled={!!fb} aria-pressed={on} onClick={() => toggle(o.id)} className={`gbtn${fb ? (good ? ' ok' : on ? ' ko' : '') : on ? ' sel' : ''}`} style={{ animation: `rise .4s ease ${k * .07}s both` }}>{q.qtype === 'multiple' ? (on ? '☑ ' : '☐ ') : ''}{o.text}</button> })}</div>
    {fb && <div className="gfb"><p style={{ fontWeight: 900, color: fb.is_correct ? '#1f9d55' : '#e5383b' }}>{fb.is_correct ? 'Bravo, bonne réponse !' : 'Ce n’est pas la bonne réponse.'}</p>{fb.explanation && <p style={{ color: '#475569' }}>{fb.explanation}</p>}</div>}
    {err && <p role="alert" style={{ color: '#e5383b', marginTop: 8 }}>{err}</p>}
    <div className="gcta">{exam && i > 0 && <button className="gpill" onClick={prev}>Précédente</button>}
      {!exam && !fb && <button className="gprimary" disabled={!sel.length || busy} onClick={validate}>Valider</button>}
      {(exam || fb) && <button className="gprimary" disabled={busy} onClick={next}>{i + 1 >= quiz.questions.length ? (exam ? 'Terminer' : 'Résultat') : 'Suivant'}</button>}</div>
    {paused && <div className="gpause"><div className="grid gap-4 justify-items-center"><p className="gq" style={{ margin: 0 }}>Pause</p><button className="gprimary" onClick={() => setPaused(false)}>Reprendre</button></div></div>}</>)
}
