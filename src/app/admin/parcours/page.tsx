import Link from 'next/link'
import { requireRole } from '@/lib/auth'
import { deletePath } from '../parcoursActions'
export default async function Parcours() {
  const { sb } = await requireRole('admin'); const { data } = await sb.from('paths').select('id, title, status').order('created_at', { ascending: false })
  return (<><div className="flex items-center justify-between gap-3 flex-wrap"><h1 className="text-3xl font-semibold tracking-tight">Constructeur de parcours</h1>
    <Link href="/admin/parcours/new" className="btn" style={{ width: 'auto' }}>Nouveau parcours</Link></div>
    {(data ?? []).length === 0 && <p className="glass p-6 muted">Aucun parcours.</p>}
    {(data ?? []).map(p => <div key={p.id} className="glass p-4 flex gap-3 items-center justify-between flex-wrap"><div><p className="font-medium">{p.title}</p><p className="muted text-sm">{p.status === 'published' ? 'Publié' : 'Brouillon'}</p></div>
      <div className="flex gap-2 flex-wrap"><Link href={`/eleve/parcours/${p.id}?apercu=1`} className="btn btn-ghost">Aperçu élève</Link><Link href={`/admin/parcours/${p.id}`} className="btn btn-ghost">Modifier</Link>
        <form action={deletePath}><input type="hidden" name="id" value={p.id} /><button className="btn-danger">Supprimer</button></form></div></div>)}</>)
}
