import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import CourseHome from '@/components/CourseHome'
export default async function Cours() {
  const sb = await createClient(); const { data: { user } } = await sb.auth.getUser(); if (!user) redirect('/login')
  const { data: ch } = await sb.from('course_chapters').select('id, title, icon, summary, status').order('position')
  const { data: se } = await sb.from('course_sections').select('id, chapter_id, title, est_minutes').order('position')
  const { data: pr } = await sb.from('course_progress').select('section_id').eq('user_id', user.id)
  const done = new Set((pr ?? []).map(x => x.section_id))
  const chapters = (ch ?? []).map(c => ({ ...c, sections: (se ?? []).filter(s => s.chapter_id === c.id).map(s => ({ id: s.id, title: s.title, min: s.est_minutes, done: done.has(s.id) })) }))
  return <CourseHome chapters={chapters} />
}
