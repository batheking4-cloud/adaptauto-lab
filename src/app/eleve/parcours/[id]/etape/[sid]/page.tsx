import Link from 'next/link'
import { redirect, notFound } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { loadState } from '@/lib/path'
import { completeLesson } from '../../../actions'
export default async function Lecon({ params, searchParams }: { params: Promise<{ id: string; sid: string }>; searchParams: Promise<{ apercu?: string }> }) {
  const { id, sid } = await params; const { apercu } = await searchParams
  const sb = await createClient(); const { data: { user } } = await sb.auth.getUser(); if (!user) redirect('/login')
  const s = await loadState(sb, user.id, id, !!apercu); const row = s?.rows.find(r => r.step.id === sid)
  if (!s || !row || row.step.type !== 'lesson') notFound(); if (row.locked) redirect(`/eleve/parcours/${id}`)
  const v = row.step.video_url.trim(); const yt = v.match(/(?:youtube\.com\/watch\?v=|youtu\.be\/)([\w-]{11})/)
  return <main className="max-w-2xl mx-auto p-5 pb-16 grid gap-4"><Link href={`/eleve/parcours/${id}${apercu ? '?apercu=1' : ''}`} className="link">← {s.path.title}</Link>
    <h1 className="text-3xl font-semibold tracking-tight">{row.step.title}</h1>
    {v && (yt ? <iframe title="Cours vidéo" src={`https://www.youtube.com/embed/${yt[1]}`} allowFullScreen style={{ width: '100%', aspectRatio: '16/9', border: 0, borderRadius: 20 }} /> : <video controls src={v} style={{ width: '100%', borderRadius: 20 }} />)}
    {row.step.content && <div className="glass p-6" style={{ whiteSpace: 'pre-wrap' }}>{row.step.content}</div>}
    <form action={completeLesson}><input type="hidden" name="step_id" value={sid} /><input type="hidden" name="path_id" value={id} /><button className="btn">{row.completed ? 'Leçon déjà terminée — retour' : 'Marquer comme terminée'}</button></form></main>
}
