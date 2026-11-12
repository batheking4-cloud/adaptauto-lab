'use client'
import Link from 'next/link'
import { useEffect, useState } from 'react'
type Slide = { slide_no: number; series: string; quiz_id: string | null; status: string; question_count: number }
type Best = { correct: number; total: number; passed: boolean | null; n: number }
const RULES: [string, string, string, string, string][] = [
  ['info', '🪑', 'Ta place = ta diapositive', 'La salle est organisée en 12 rangées de chaises. Chaque candidat a une place déterminée, et la diapositive qu’il reçoit correspond à sa position : place n°7 = diapositive n°7.', 'RÈGLE 1'],
  ['info', '📚', 'Maîtrise les 12 diapositives', 'Tu ne sais pas à l’avance laquelle te sera attribuée : tu dois connaître les 12.', 'RÈGLE 2'],
  ['info', '📝', '25 questions par diapositive', 'Chaque diapositive comporte exactement 25 questions.', 'RÈGLE 3'],
  ['must', '📵', 'Téléphone éteint, complètement', 'Avant d’entrer dans la salle, le téléphone doit être totalement éteint.', 'RÈGLE 4'],
  ['must', '✈️', 'Mode avion : interdit', 'Le mode avion ne remplace pas l’extinction. Un téléphone allumé est strictement interdit, même en mode avion.', 'RÈGLE 5'],
  ['must', '🕐', 'Interdit de consulter l’heure sur ton téléphone', 'Le téléphone est censé être éteint : tu ne peux donc pas t’en servir pour voir l’heure pendant l’épreuve.', 'RÈGLE 6'],
  ['fail', '❌', 'À partir de 5 erreurs, tu as échoué', 'Maximum 4 erreurs pour réussir : il faut au minimum 21 bonnes réponses sur 25.', 'RÈGLE 7'],
]
function Room() {
  const order = [7, 3, 11, 5, 9, 1, 12, 4, 8, 2, 10, 6]; const [k, setK] = useState(0)
  useEffect(() => { const t = setInterval(() => setK(x => (x + 1) % order.length), 3200); return () => clearInterval(t) }, [])
  const seat = order[k]
  return (<div className="glass p-5 grid gap-5">
    <div className="flex justify-between items-center gap-3 flex-wrap"><p className="font-semibold">🚪 Entrée → ta place → ta diapositive</p>
      <p key={seat} className="font-semibold" style={{ color: 'var(--accent)', animation: 'pop .4s ease both' }}>Place n°{seat} → Diapositive {String(seat).padStart(2, '0')}</p></div>
    <div className="room">{Array.from({ length: 12 }, (_, i) => i + 1).map(n => (<div key={n} className={`seat${n === seat ? ' on' : ''}`}><span className="muted" style={{ fontSize: 10 }}>Rangée {n}</span><span className="chair" aria-hidden="true">🪑</span><b>{n}</b>
      {n === seat && <span key={'c' + seat} className="cand" aria-hidden="true">🧑‍🎓</span>}{n === seat && <span key={'s' + seat} className="sl" aria-hidden="true">📄 {String(n).padStart(2, '0')}</span>}</div>))}</div>
    <p className="muted text-sm">12 rangées de chaises · une place = une diapositive.</p></div>)
}
export default function ExamenEcrit({ slides, best, accepted }: { slides: Slide[]; best: Record<string, Best>; accepted: boolean }) {
  const [step, setStep] = useState<'intro' | 'grid'>(accepted ? 'grid' : 'intro')
  function start() { document.cookie = 'ecrit_ok=1; path=/; max-age=7200; samesite=lax'; setStep('grid'); window.scrollTo({ top: 0, behavior: 'smooth' }) }
  const list: Slide[] = Array.from({ length: 12 }, (_, i) => slides.find(s => s.slide_no === i + 1) ?? { slide_no: i + 1, series: `B${i + 1}`, quiz_id: null, status: 'soon', question_count: 0 })
  if (step === 'intro') return (
    <main className="max-w-4xl mx-auto p-3 sm:p-5 pb-8 grid gap-5">
      <Link href="/eleve/quiz" className="back">← Retour</Link>
      <header className="grid gap-2 text-center"><p className="muted text-sm" style={{ letterSpacing: '.14em' }}>EXAMEN BLANC · ÉPREUVE ÉCRITE</p>
        <h1 className="text-3xl sm:text-4xl font-semibold tracking-tight" style={{ textTransform: 'uppercase' }}>Conditions de l’examen écrit au Sénégal</h1>
        <p className="muted">Ce sont les conditions réelles de l’épreuve. Lis-les avant de commencer.</p></header>
      <Room />
      <section className="grid gap-3">{RULES.map(([k, ic, t, d, tag], i) => (<div key={t} className={`glass rule ${k}`} style={{ animationDelay: `${i * .08}s` }}><span className="ri" aria-hidden="true">{ic}</span>
        <div><p className="muted" style={{ fontSize: 11, letterSpacing: '.12em' }}>{tag}</p><p className="font-semibold">{t}</p><p className="muted text-sm" style={{ lineHeight: 1.6 }}>{d}</p></div></div>))}</section>
      <button className="btn" onClick={start} style={{ fontSize: 17, padding: '16px 22px' }}>J’AI COMPRIS — COMMENCER</button></main>)
  return (
    <main className="max-w-5xl mx-auto p-3 sm:p-5 pb-8 grid gap-5">
      <Link href="/eleve/quiz" className="back">← Retour</Link>
      <header className="grid gap-1"><h1 className="text-3xl font-semibold tracking-tight">Choisis ta diapositive</h1>
        <p className="muted">Le jour J, tu ne sais pas laquelle tu recevras : entraîne-toi sur les 12. 25 questions · 4 erreurs maximum.</p></header>
      <section className="grid gap-4 grid-cols-2 sm:grid-cols-3 lg:grid-cols-4">{list.map((s, i) => { const on = s.status === 'available' && !!s.quiz_id; const b = s.quiz_id ? best[s.quiz_id] : undefined
        const inner = (<><span className="muted text-xs" style={{ letterSpacing: '.12em' }}>DIAPOSITIVE</span><span className="num">{String(s.slide_no).padStart(2, '0')}</span><span className="muted text-xs">Série {s.series}</span>
          {on ? (b ? <span className="text-sm" style={{ color: b.passed ? '#30d158' : '#ff6b6b', fontWeight: 700 }}>Meilleur : {b.correct}/{b.total} · {b.passed ? 'ADMIS' : 'ÉCHOUÉ'}</span> : <span className="text-sm" style={{ color: 'var(--accent)', fontWeight: 700 }}>Commencer →</span>)
            : <span className="text-sm" style={{ fontWeight: 700 }}>🔒 {s.status === 'incomplete' ? `Incomplète · ${s.question_count}/25` : 'Bientôt disponible'}</span>}</>)
        return on ? <Link key={s.slide_no} href={`/eleve/jouer/${s.quiz_id}`} className="glass slidecard" style={{ animationDelay: `${i * .05}s` }}>{inner}</Link>
          : <div key={s.slide_no} className="glass slidecard off" aria-disabled="true" style={{ animationDelay: `${i * .05}s` }}>{inner}</div> })}</section>
      <button className="back" onClick={() => setStep('intro')}>↺ Revoir les conditions</button></main>)
}
