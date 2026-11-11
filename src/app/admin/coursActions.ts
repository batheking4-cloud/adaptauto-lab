'use server'
import { revalidatePath } from 'next/cache'
import { requireRole } from '@/lib/auth'
export async function setChapterStatus(fd: FormData) {
  const { sb } = await requireRole('admin'); const status = fd.get('status') === 'published' ? 'published' : 'draft'
  const id = String(fd.get('id') || '')
  const q = sb.from('course_chapters').update({ status }); const { error } = id ? await q.eq('id', id) : await q.not('id', 'is', null)
  if (error) throw new Error(error.message)
  revalidatePath('/admin/cours'); revalidatePath('/eleve/cours')
}
