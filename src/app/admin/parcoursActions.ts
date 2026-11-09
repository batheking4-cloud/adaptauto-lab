'use server'
import { redirect } from 'next/navigation'
import { revalidatePath } from 'next/cache'
import { requireRole } from '@/lib/auth'
export async function deletePath(fd: FormData) {
  const { sb } = await requireRole('admin'); const { error } = await sb.from('paths').delete().eq('id', String(fd.get('id'))); if (error) throw new Error(error.message)
  revalidatePath('/admin/parcours')
}
export async function savePath(fd: FormData) {
  const { sb } = await requireRole('admin')
  const id = String(fd.get('id') || ''), title = String(fd.get('title') || '').trim(), status = fd.get('status') === 'published' ? 'published' : 'draft'
  const steps: any[] = JSON.parse(String(fd.get('steps') || '[]'))
  if (!title) throw new Error('Titre obligatoire')
  if (status === 'published' && !steps.length) throw new Error('Ajoutez au moins une étape avant de publier')
  if (steps.some(s => !String(s.title).trim() || (s.type !== 'lesson' && !s.quiz_id))) throw new Error('Chaque étape doit avoir un titre, et un quiz ou examen choisi')
  const row = { title, description: String(fd.get('description') || ''), status }
  let pid = id
  if (id) { const { error } = await sb.from('paths').update(row).eq('id', id); if (error) throw new Error(error.message) }
  else { const { data, error } = await sb.from('paths').insert(row).select('id').single(); if (error) throw new Error(error.message); pid = data.id }
  const { data: old } = await sb.from('path_steps').select('id').eq('path_id', pid)
  const keep = new Set(steps.map(s => s.id)); const gone = (old ?? []).map(o => o.id).filter(x => !keep.has(x))
  if (gone.length) await sb.from('path_steps').delete().in('id', gone)
  if (steps.length) { const { error } = await sb.from('path_steps').upsert(steps.map((s, position) => ({ id: s.id, path_id: pid, position, chapter: s.chapter ?? '', type: s.type, title: s.title.trim(), content: s.content ?? '', video_url: s.video_url ?? '',
    quiz_id: s.type === 'lesson' ? null : s.quiz_id, unlock_type: s.unlock_type, min_score: Math.min(100, Math.max(0, Number(s.min_score) || 70)) }))); if (error) throw new Error(error.message) }
  revalidatePath('/admin/parcours'); redirect('/admin/parcours')
}
