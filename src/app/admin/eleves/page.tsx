import { requireRole } from '@/lib/auth'
export default async function Eleves() {
  const { sb } = await requireRole('admin')
  const { data } = await sb.from('profiles').select('id, full_name, role, created_at').order('created_at', { ascending: false })
  return (<>
    <h1 className="text-3xl font-semibold tracking-tight">Élèves</h1>
    <div className="glass p-3 grid">
      {(data ?? []).map(p => (
        <div key={p.id} className="flex justify-between gap-3 p-3" style={{ borderBottom: '1px solid var(--line)' }}>
          <span>{p.full_name || 'Sans nom'}</span>
          <span className="muted text-sm">{p.role === 'admin' ? 'Administrateur' : 'Élève'} · {new Date(p.created_at).toLocaleDateString('fr-FR')}</span>
        </div>))}
    </div>
    <p className="muted text-sm">La création, la modification et la suppression de comptes depuis l’application demandent une clé secrète côté serveur : elles seront ajoutées avec votre accord, étape par étape.</p>
  </>)
}
