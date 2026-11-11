'use server'
import { redirect } from 'next/navigation'
import { revalidatePath } from 'next/cache'
import { createClient } from '@/lib/supabase/server'
export async function completeSection(fd: FormData) {
  const sb = await createClient(); const { data: { user } } = await sb.auth.getUser(); if (!user) redirect('/login')
  await sb.from('course_progress').upsert({ user_id: user.id, section_id: String(fd.get('section_id')) }, { onConflict: 'user_id,section_id', ignoreDuplicates: true })
  revalidatePath('/eleve/cours'); const next = String(fd.get('next') || '')
  redirect(next.startsWith('/eleve/cours') ? next : '/eleve/cours')
}
