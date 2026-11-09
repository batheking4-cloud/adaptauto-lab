'use server'
import { redirect } from 'next/navigation'
import { revalidatePath } from 'next/cache'
import { createClient } from '@/lib/supabase/server'
export async function completeLesson(fd: FormData) {
  const sb = await createClient(); const { data: { user } } = await sb.auth.getUser(); if (!user) redirect('/login')
  const step = String(fd.get('step_id')), path = String(fd.get('path_id'))
  await sb.from('lesson_progress').upsert({ user_id: user.id, step_id: step }, { onConflict: 'user_id,step_id', ignoreDuplicates: true })
  revalidatePath(`/eleve/parcours/${path}`); redirect(`/eleve/parcours/${path}`)
}
