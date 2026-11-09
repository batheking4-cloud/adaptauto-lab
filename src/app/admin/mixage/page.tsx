import { requireRole } from '@/lib/auth'
import MediaManager from '@/components/MediaManager'
export default async function Mixage() {
  const { sb } = await requireRole('admin'); const { data } = await sb.from('media').select('*').eq('kind', 'audio').order('created_at', { ascending: false })
  return <><h1 className="text-3xl font-semibold tracking-tight">MIXAGE</h1>
    <p className="muted">Générez la voix sur ElevenLabs, téléchargez le MP3 et importez-le ici. Aucune connexion automatique à ElevenLabs n’est configurée. Associez ensuite chaque audio à une question, une correction, l’introduction ou la fin d’un mini-jeu.</p>
    <MediaManager kind="audio" initial={data ?? []} /></>
}
