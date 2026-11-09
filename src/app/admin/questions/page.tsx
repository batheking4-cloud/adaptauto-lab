import Link from 'next/link'
import { requireRole } from '@/lib/auth'
import { deleteQuestion } from '../actions'
const T: Record<string, string> = { single: 'Réponse unique', multiple: 'Réponses multiples', truefalse: 'Vrai ou faux' }
export default async function Questions() {
  const { sb } = await requireRole('admin')
  const { data } = await sb.from('questions').select('id, text, category, difficulty, qtype, is_demo').order('created_at', { ascending: false })
  return (<>
    <div className="flex items-center justify-between gap-3 flex-wrap">
      <h1 className="text-3xl font-semibold tracking-tight">Banque de questions</h1>
      <Link href="/admin/questions/new" className="btn" style={{ width: 'auto' }}>Nouvelle question</Link>
    </div>
    {(data ?? []).length === 0 && <p className="glass p-6 muted">Aucune question. Cliquez sur « Nouvelle question » pour commencer.</p>}
    <div className="grid gap-3">
      {(data ?? []).map(q => (
        <div key={q.id} className="glass p-4 flex gap-3 items-center justify-between flex-wrap">
          <div className="min-w-0" style={{ flex: '1 1 260px' }}>
            <p className="font-medium">{q.text}</p>
            <p className="muted text-sm">{q.category} · {T[q.qtype]} · difficulté {q.difficulty}/3{q.is_demo ? ' · exemple' : ''}</p>
          </div>
          <div className="flex gap-2">
            <Link href={`/admin/questions/${q.id}`} className="btn btn-ghost">Modifier</Link>
            <form action={deleteQuestion}><input type="hidden" name="id" value={q.id} /><button className="btn-danger">Supprimer</button></form>
          </div>
        </div>))}
    </div>
  </>)
}
