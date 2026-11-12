import { requireRole } from '@/lib/auth'
import AudioStudio from '@/components/AudioStudio'
export default async function Mixage() {
  const { sb } = await requireRole('admin')
  const [{ data: m }, { data: q }, { data: g }] = await Promise.all([sb.from('media').select('id, name, path, text_content, usage').eq('kind', 'audio').order('created_at', { ascending: false }),
    sb.from('questions').select('id, text, audio_id, correction_audio_id').neq('kind', 'slide').order('created_at', { ascending: false }), sb.from('quizzes').select('id, title, intro_audio_id, outro_audio_id').eq('kind', 'game').order('title')])
  return <><h1 className="text-3xl font-semibold tracking-tight">MIXAGE</h1><AudioStudio initial={m ?? []} questions={q ?? []} games={g ?? []} /></>
}
