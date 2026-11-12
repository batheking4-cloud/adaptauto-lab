import Link from 'next/link'
import { notFound } from 'next/navigation'
import { requireRole } from '@/lib/auth'
import { saveSlide, applyKey } from '../../slideActions'
export default async function Diapo({ params, searchParams }: { params: Promise<{ n: string }>; searchParams: Promise<{ ok?: string; err?: string }> }) {
  const { n } = await params; const { ok, err } = await searchParams; const num = Number(n); if (!(num >= 1 && num <= 12)) notFound()
  const { sb } = await requireRole('admin')
  const { data: s } = await sb.from('written_slides').select('*').eq('slide_no', num).maybeSingle(); if (!s) notFound()
  const { data: all } = await sb.from('written_slide_keys').select('slide_no, answer_key, notes').order('slide_no')
  const ref = (all ?? []).find(k => k.slide_no === num); const key = (ref?.answer_key ?? {}) as Record<string, string>
  let rows: any[] = []
  if (s.quiz_id) { const { data } = await sb.from('quiz_questions').select('position, questions(id, text, image_path, explanation, question_options(text, is_correct, position))').eq('quiz_id', s.quiz_id).order('position'); rows = data ?? [] }
  const letters = (q: any) => (q.question_options as any[]).filter(o => o.is_correct).map(o => o.text).sort().join('')
  return (<>
    <div><h1 className="text-3xl font-semibold tracking-tight">Diapositive {String(num).padStart(2, '0')}</h1><p className="muted">Série de correction associée : <b>{s.series}</b> · {s.question_count}/{s.expected_questions} questions</p></div>
    {ok && <p role="status" className="glass p-3" style={{ color: '#30d158' }}>{ok}</p>}{err && <p role="alert" className="glass p-3" style={{ color: '#ff6b6b' }}>{err}</p>}
    {ref?.notes && <p className="glass p-3 text-sm" style={{ color: '#ff9f0a' }}>⚠ {ref.notes}</p>}
    {!s.quiz_id ? (<div className="glass p-5 grid gap-3"><p className="font-semibold">Correction de référence {s.series} (25 réponses)</p><p className="muted text-sm">Le fichier de questions n’a pas encore été reçu : aucune question n’est affichée, rien n’est inventé.</p>
      <div className="grid gap-2 grid-cols-5 sm:grid-cols-9">{Array.from({ length: 25 }, (_, i) => <div key={i} className="glass p-2 text-center text-sm"><span className="muted">{i + 1}</span><br /><b>{key[String(i + 1)] ?? '—'}</b></div>)}</div></div>)
    : (<>
      <form action={applyKey} className="glass p-4 flex gap-3 flex-wrap items-end"><input type="hidden" name="slide_no" value={num} />
        <label className="grid gap-1"><span className="muted text-sm">Remplacer l’association : appliquer la correction de la série</span><select className="input" name="series" defaultValue={s.series}>{Array.from({ length: 12 }, (_, i) => <option key={i} value={`B${i + 1}`}>B{i + 1}</option>)}</select></label>
        <button className="btn btn-ghost">Appliquer cette série</button><p className="muted text-xs" style={{ flex: '1 1 260px' }}>Remplace les bonnes réponses de cette diapositive par celles du document de la série choisie (question par question, dans l’ordre).</p></form>
      <form action={saveSlide} className="grid gap-3"><input type="hidden" name="slide_no" value={num} /><input type="hidden" name="quiz_id" value={s.quiz_id} /><input type="hidden" name="ids" value={JSON.stringify(rows.map(r => r.questions.id))} />
        {rows.map((r, i) => { const q = r.questions; const cur = letters(q); const doc = key[String(i + 1)] ?? ''; const diff = doc && cur !== doc
          return (<div key={q.id} className="glass p-4 grid gap-3 sm:grid-cols-[minmax(0,320px)_1fr]">
            <a href={q.image_path} target="_blank" rel="noreferrer"><img src={q.image_path} alt={`Question ${i + 1}`} loading="lazy" style={{ width: '100%', borderRadius: 14 }} /></a>
            <div className="grid gap-2 content-start"><p className="font-semibold">Question {i + 1} <span className="muted text-sm font-normal">· document {s.series} : <b>{doc || '—'}</b>{diff && <span style={{ color: '#ff9f0a' }}> · ⚠ différent (actuellement {cur})</span>}</span></p>
              <div className="flex gap-3 flex-wrap">{['A', 'B', 'C', 'D'].map(L => <label key={L} className="flex items-center gap-2 font-semibold"><input type="checkbox" name={`a_${q.id}`} value={L} defaultChecked={cur.includes(L)} style={{ width: 22, height: 22 }} />{L}</label>)}</div>
              <textarea className="input" name={`e_${q.id}`} rows={2} defaultValue={q.explanation} placeholder="Explication ou observation (facultatif, affichée dans la correction)" /></div></div>) })}
        <button className="btn" style={{ width: 'fit-content' }}>Enregistrer les corrections</button></form></>)}
    <Link href="/admin/diapositives" className="back">← Toutes les diapositives</Link></>)
}
