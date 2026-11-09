import { requireRole } from '@/lib/auth'
import { saveQuestion } from '../../actions'
import QuestionForm from './QuestionForm'
export default async function EditQuestion({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const { sb } = await requireRole('admin')
  let q: any = { id: '', text: '', category: 'Signalisation', difficulty: 1, qtype: 'single', explanation: '' }
  let opts = [{ text: '', is_correct: true }, { text: '', is_correct: false }]
  if (id !== 'new') {
    const { data } = await sb.from('questions').select('id, text, category, difficulty, qtype, explanation, image_id, audio_id, correction_audio_id, audio_autoplay').eq('id', id).single()
    if (data) q = data
    const { data: o } = await sb.from('question_options').select('text, is_correct').eq('question_id', id).order('position')
    if (o && o.length) opts = o
  }
  const { data: media } = await sb.from('media').select('id, name, kind').order('name')
  return <QuestionForm q={q} opts={opts} media={media ?? []} action={saveQuestion} />
}
