import { redirect, notFound } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import LessonView from '@/components/LessonView'
import { completeSection } from '../../actions'
export default async function Lecon({ params }: { params: Promise<{ cid: string; sid: string }> }) {
  const { cid, sid } = await params
  const sb = await createClient(); const { data: { user } } = await sb.auth.getUser(); if (!user) redirect('/login')
  const { data: ch } = await sb.from('course_chapters').select('id, title, icon, status').order('position')
  const { data: se } = await sb.from('course_sections').select('id, chapter_id, title, est_minutes').order('position')
  const { data: cur } = await sb.from('course_sections').select('id, chapter_id, title, est_minutes, blocks').eq('id', sid).eq('chapter_id', cid).maybeSingle()
  if (!cur) notFound()
  const { data: pr } = await sb.from('course_progress').select('section_id').eq('user_id', user.id)
  const done = new Set((pr ?? []).map(x => x.section_id))
  const flat = (ch ?? []).flatMap(c => (se ?? []).filter(s => s.chapter_id === c.id).map(s => ({ ...s, cid: c.id })))
  const i = flat.findIndex(s => s.id === sid), href = (s?: { id: string; cid: string }) => s ? `/eleve/cours/${s.cid}/${s.id}` : null
  const chapter = (ch ?? []).find(c => c.id === cid)!
  const toc = (ch ?? []).map(c => ({ title: c.title, icon: c.icon, items: flat.filter(s => s.cid === c.id).map(s => ({ id: s.id, title: s.title, done: done.has(s.id), href: href(s)! })) }))
  return <LessonView chapter={{ title: chapter.title, icon: chapter.icon, draft: chapter.status === 'draft' }} section={{ id: cur.id, title: cur.title, min: cur.est_minutes, blocks: cur.blocks as any[] }}
    toc={toc} prev={href(flat[i - 1])} next={href(flat[i + 1])} done={done.has(sid)} position={`${i + 1} / ${flat.length}`} action={completeSection} />
}
