'use server'
import { redirect } from 'next/navigation'
import { revalidatePath } from 'next/cache'
import { requireRole } from '@/lib/auth'

export async function deleteQuestion(fd: FormData) {
  const { sb } = await requireRole('admin')
  const { error } = await sb.from('questions').delete().eq('id', String(fd.get('id')))
  if (error) throw new Error(error.message)
  revalidatePath('/admin/questions')
}

export async function saveQuestion(fd: FormData) {
  const { sb } = await requireRole('admin')
  const id = String(fd.get('id') || '')
  const qtype = String(fd.get('qtype'))
  const text = String(fd.get('text') || '').trim()
  const options: { text: string; is_correct: boolean }[] = JSON.parse(String(fd.get('options') || '[]'))
  const good = options.filter(o => o.is_correct).length
  if (!text) throw new Error('Énoncé obligatoire')
  if (!['single', 'multiple', 'truefalse'].includes(qtype)) throw new Error('Type invalide')
  if (options.length < 2 || options.some(o => !o.text.trim())) throw new Error('Au moins 2 propositions non vides')
  if (good < 1 || (qtype !== 'multiple' && good !== 1)) throw new Error('Nombre de bonnes réponses incorrect')
  const row = { text, qtype, category: String(fd.get('category') || 'Général').trim() || 'Général',
    difficulty: Math.min(3, Math.max(1, Number(fd.get('difficulty')) || 1)), explanation: String(fd.get('explanation') || ''),
    image_id: String(fd.get('image_id') || '') || null, audio_id: String(fd.get('audio_id') || '') || null, correction_audio_id: String(fd.get('correction_audio_id') || '') || null, audio_autoplay: fd.get('audio_autoplay') === 'on' }
  let qid = id
  if (id) { const { error } = await sb.from('questions').update(row).eq('id', id); if (error) throw new Error(error.message) }
  else { const { data, error } = await sb.from('questions').insert(row).select('id').single(); if (error) throw new Error(error.message); qid = data.id }
  await sb.from('question_options').delete().eq('question_id', qid)
  const { error } = await sb.from('question_options').insert(options.map((o, i) => ({ question_id: qid, text: o.text.trim(), is_correct: o.is_correct, position: i })))
  if (error) throw new Error(error.message)
  revalidatePath('/admin/questions')
  redirect('/admin/questions')
}

export async function saveSettings(fd: FormData) {
  const { sb } = await requireRole('admin')
  const reset = fd.get('reset') === '1'
  const mode = reset ? 'dark' : fd.get('mode') === 'light' ? 'light' : 'dark'
  const color = reset ? '#0a84ff' : String(fd.get('color'))
  if (!/^#[0-9a-fA-F]{6}$/.test(color)) throw new Error('Couleur invalide')
  const { error } = await sb.from('app_settings').update({ mode, primary_color: color, updated_at: new Date().toISOString() }).eq('id', 1)
  if (error) throw new Error(error.message)
  revalidatePath('/', 'layout')
}
