import { requireRole } from '@/lib/auth'
import ExamMixage from '@/components/ExamMixage'
export default async function Mixage() {
  const { sb } = await requireRole('admin')
  const { data: ws } = await sb.from('written_slides').select('*').order('slide_no'); const slides = ws ?? []
  const qids = slides.map(s => s.quiz_id).filter(Boolean) as string[]
  const { data: quizzes } = qids.length ? await sb.from('quizzes').select('id, intro_text, intro_audio_id').in('id', qids) : { data: [] as any[] }
  const { data: qq } = qids.length ? await sb.from('quiz_questions').select('quiz_id, position, questions(id, text, image_path, audio_id, statement_text)').in('quiz_id', qids).order('position') : { data: [] as any[] }
  const { data: audios } = await sb.from('media').select('id, name, path').eq('kind', 'audio')
  const { data: qa } = await sb.from('questions').select('id, kind, audio_id, correction_audio_id').or('audio_id.not.is.null,correction_audio_id.not.is.null')
  const { data: za } = await sb.from('quizzes').select('id, slide_no, intro_audio_id, outro_audio_id').or('intro_audio_id.not.is.null,outro_audio_id.not.is.null')
  const slideRefs = new Set<string>(), otherRefs = new Set<string>()
  for (const q of qa ?? []) for (const m of [q.audio_id, q.correction_audio_id]) if (m) (q.kind === 'slide' ? slideRefs : otherRefs).add(m)
  for (const z of za ?? []) for (const m of [z.intro_audio_id, z.outro_audio_id]) if (m) (z.slide_no ? slideRefs : otherRefs).add(m)
  const media: Record<string, { id: string; name: string; path: string }> = {}; for (const m of (audios ?? []).filter(a => a.path)) media[m.id] = m as any
  const data = slides.map(s => { const z = (quizzes ?? []).find(x => x.id === s.quiz_id)
    return { n: s.slide_no, series: s.series, status: s.status, expected: s.expected_questions,
      quiz: z ? { id: z.id, intro_text: z.intro_text ?? '', audio_id: z.intro_audio_id ?? null } : null,
      qs: (qq ?? []).filter(r => r.quiz_id === s.quiz_id).map((r: any) => ({ id: r.questions.id, pos: r.position, label: r.questions.text, image: r.questions.image_path, audio_id: r.questions.audio_id ?? null, statement: r.questions.statement_text ?? '' })) } })
  const others = (audios ?? []).filter(a => a.path && !slideRefs.has(a.id)).map(a => ({ id: a.id, name: a.name, path: a.path as string, used: otherRefs.has(a.id) }))
  return <><h1 className="text-3xl font-semibold tracking-tight">MIXAGE : audios de l’examen</h1><ExamMixage slides={data} media={media} others={others} /></>
}
