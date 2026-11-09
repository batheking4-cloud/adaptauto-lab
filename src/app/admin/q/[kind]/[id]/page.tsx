import { notFound } from 'next/navigation'
import { requireRole } from '@/lib/auth'
import { saveQuiz } from '../../../quizActions'
import QuizForm from './QuizForm'
export default async function Edit({ params }: { params: Promise<{ kind: string; id: string }> }) {
  const { kind, id } = await params; if (kind !== 'jeux' && kind !== 'examens') notFound()
  const { sb } = await requireRole('admin')
  let quiz: any = { id: '', kind: kind === 'jeux' ? 'game' : 'exam', title: '', description: '', category: 'Général', difficulty: 1, intro_text: '', outro_text: '', duration_min: 20, pass_score: 70, status: 'draft' }
  let selected: string[] = []
  if (id !== 'new') {
    const { data } = await sb.from('quizzes').select('*').eq('id', id).single(); if (!data) notFound(); quiz = data
    const { data: s } = await sb.from('quiz_questions').select('question_id').eq('quiz_id', id).order('position'); selected = (s ?? []).map(x => x.question_id)
  }
  const { data: all } = await sb.from('questions').select('id, text, category').order('created_at', { ascending: false })
  const { data: media } = await sb.from('media').select('id, name, kind').eq('kind', 'audio').order('name')
  return <QuizForm quiz={quiz} all={all ?? []} selected={selected} media={media ?? []} action={saveQuiz} />
}
