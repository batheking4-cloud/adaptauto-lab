import Link from 'next/link'
import { notFound } from 'next/navigation'
import { requireRole } from '@/lib/auth'
import { deleteQuiz } from '../../quizActions'
export default async function List({ params }: { params: Promise<{ kind: string }> }) {
  const { kind } = await params; if (kind !== 'jeux' && kind !== 'examens') notFound()
  const { sb } = await requireRole('admin'); const k = kind === 'jeux' ? 'game' : 'exam'
  const { data } = await sb.from('quizzes').select('id, title, category, status, is_demo').eq('kind', k).order('created_at', { ascending: false })
  return (<>
    <div className="flex items-center justify-between gap-3 flex-wrap"><h1 className="text-3xl font-semibold tracking-tight">{k === 'game' ? 'Mini-jeux' : 'Examens blancs'}</h1>
      <Link href={`/admin/q/${kind}/new`} className="btn" style={{ width: 'auto' }}>{k === 'game' ? 'Nouveau mini-jeu' : 'Nouvel examen'}</Link></div>
    {(data ?? []).length === 0 && <p className="glass p-6 muted">Rien pour l’instant.</p>}
    {(data ?? []).map(x => <div key={x.id} className="glass p-4 flex gap-3 items-center justify-between flex-wrap">
      <div style={{ flex: '1 1 240px' }}><p className="font-medium">{x.title}</p><p className="muted text-sm">{x.category} · {x.status === 'published' ? 'Publié' : 'Brouillon'}{x.is_demo ? ' · exemple' : ''}</p></div>
      <div className="flex gap-2 flex-wrap"><Link href={`/eleve/jouer/${x.id}?apercu=1`} className="btn btn-ghost">Aperçu élève</Link><Link href={`/admin/q/${kind}/${x.id}`} className="btn btn-ghost">Modifier</Link>
        <form action={deleteQuiz}><input type="hidden" name="id" value={x.id} /><button className="btn-danger">Supprimer</button></form></div></div>)}
  </>)
}
