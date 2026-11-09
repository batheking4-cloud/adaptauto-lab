import { requireRole } from '@/lib/auth'
import MediaManager from '@/components/MediaManager'
export default async function Images() {
  const { sb } = await requireRole('admin'); const { data } = await sb.from('media').select('*').eq('kind', 'image').order('created_at', { ascending: false })
  return <><h1 className="text-3xl font-semibold tracking-tight">Bibliothèque d’images</h1><MediaManager kind="image" initial={data ?? []} /></>
}
