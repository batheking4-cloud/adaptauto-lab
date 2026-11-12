import Link from 'next/link'
import { requireRole } from '@/lib/auth'
import { setSlideStatus } from '../slideActions'
const ST: Record<string, [string, string]> = { available: ['● Disponible pour les élèves', '#30d158'], incomplete: ['● Incomplète', '#ff9f0a'], soon: ['● Bientôt disponible (verrouillée)', '#8e8e93'] }
export default async function Diapos({ searchParams }: { searchParams: Promise<{ ok?: string; err?: string }> }) {
  const { ok, err } = await searchParams; const { sb } = await requireRole('admin')
  const { data: slides } = await sb.from('written_slides').select('*').order('slide_no')
  const { data: keys } = await sb.from('written_slide_keys').select('slide_no, answer_key')
  const nk = (n: number) => Object.keys((keys ?? []).find(k => k.slide_no === n)?.answer_key ?? {}).length
  return (<>
    <div><h1 className="text-3xl font-semibold tracking-tight">Examen écrit : 12 diapositives</h1>
      <p className="muted">Chaque diapositive est reliée à son fichier de questions et à sa série de correction (B1 à B12). Réussite : 4 erreurs maximum sur 25.</p></div>
    {ok && <p role="status" className="glass p-3" style={{ color: '#30d158' }}>{ok}</p>}{err && <p role="alert" className="glass p-3" style={{ color: '#ff6b6b' }}>{err}</p>}
    {(slides ?? []).length === 0 && <p className="glass p-6 muted">Exécutez d’abord le script <b>09_examen_ecrit.sql</b> dans Supabase.</p>}
    <div className="grid gap-3">{(slides ?? []).map(s => { const [lbl, col] = ST[s.status] ?? ST.soon
      return (<div key={s.slide_no} className="glass p-4 grid gap-3">
        <div className="flex justify-between gap-3 flex-wrap items-center"><div><p className="font-semibold text-lg">Diapositive {String(s.slide_no).padStart(2, '0')} <span className="muted text-sm font-normal">· série de correction {s.series}</span></p>
          <p className="text-sm" style={{ color: col }}>{lbl}</p></div>
          <div className="text-sm muted text-right"><p>Questions : <b>{s.question_count}/{s.expected_questions}</b></p><p>Corrections : <b>{nk(s.slide_no)}/25</b> enregistrées</p></div></div>
        <div className="flex gap-2 flex-wrap"><Link href={`/admin/diapositives/${s.slide_no}`} className="btn btn-ghost">{s.quiz_id ? 'Voir et corriger' : 'Voir la correction de référence'}</Link>
          {s.quiz_id && <Link href={`/eleve/jouer/${s.quiz_id}?apercu=1`} className="btn btn-ghost">Aperçu élève</Link>}
          {s.quiz_id && <form action={setSlideStatus}><input type="hidden" name="slide_no" value={s.slide_no} /><input type="hidden" name="status" value={s.status === 'available' ? 'soon' : 'available'} />
            <button className={s.status === 'available' ? 'btn-danger' : 'btn'} style={s.status === 'available' ? {} : { width: 'auto', padding: '10px 18px', fontSize: 14 }}>{s.status === 'available' ? 'Retirer aux élèves' : 'Ouvrir aux élèves'}</button></form>}</div>
        {s.status === 'incomplete' && <p className="text-sm" style={{ color: '#ff9f0a' }}>⚠ Seulement {s.question_count} pages de questions reçues sur {s.expected_questions}. Les questions {s.question_count + 1} à {s.expected_questions} manquent : les élèves ne peuvent pas la passer tant qu’elle n’est pas complète.</p>}
        {!s.quiz_id && <p className="text-sm muted">Fichier de questions non reçu : la correction {s.series} est déjà enregistrée et sera reliée dès l’import.</p>}</div>) })}</div></>)
}
