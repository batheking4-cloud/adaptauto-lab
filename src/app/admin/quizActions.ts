'use server'
import { redirect } from 'next/navigation'
import { revalidatePath } from 'next/cache'
import { requireRole } from '@/lib/auth'
export async function deleteQuiz(fd: FormData) {
  const { sb } = await requireRole('admin')
  const { error } = await sb.from('quizzes').delete().eq('id', String(fd.get('id'))); if (error) throw new Error(error.message)
  revalidatePath('/admin/q', 'layout')
}
export async function saveQuiz(fd: FormData) {
  const { sb } = await requireRole('admin')
  const id = String(fd.get('id') || ''); const kind = fd.get('kind') === 'exam' ? 'exam' : 'game'
  const title = String(fd.get('title') || '').trim(); if (!title) throw new Error('Titre obligatoire')
  const qids: string[] = JSON.parse(String(fd.get('qids') || '[]'))
  const status = fd.get('status') === 'published' ? 'published' : 'draft'
  if (status === 'published' && !qids.length) throw new Error('Sélectionnez au moins une question avant de publier')
  const dur = Number(fd.get('duration_min')) || null
  const row = { kind, title, description: String(fd.get('description') || ''), category: String(fd.get('category') || 'Général') || 'Général',
    difficulty: Math.min(3, Math.max(1, Number(fd.get('difficulty')) || 1)), intro_text: String(fd.get('intro_text') || ''), outro_text: String(fd.get('outro_text') || ''),
    duration_min: kind === 'exam' ? dur : null, pass_score: Math.min(100, Math.max(0, Number(fd.get('pass_score')) || 70)), status }
  let qid = id
  if (id) { const { error } = await sb.from('quizzes').update(row).eq('id', id); if (error) throw new Error(error.message) }
  else { const { data, error } = await sb.from('quizzes').insert(row).select('id').single(); if (error) throw new Error(error.message); qid = data.id }
  await sb.from('quiz_questions').delete().eq('quiz_id', qid)
  if (qids.length) { const { error } = await sb.from('quiz_questions').insert(qids.map((question_id, position) => ({ quiz_id: qid, question_id, position }))); if (error) throw new Error(error.message) }
  revalidatePath('/admin/q', 'layout')
  redirect(`/admin/q/${kind === 'exam' ? 'examens' : 'jeux'}`)
}
