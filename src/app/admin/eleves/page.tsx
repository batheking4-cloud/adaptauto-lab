import { requireRole } from '@/lib/auth'
import { createStudent, updateStudent, deleteStudent } from '../studentActions'
export default async function Eleves({ searchParams }: { searchParams: Promise<{ ok?: string; err?: string }> }) {
  const { ok, err } = await searchParams
  const { sb } = await requireRole('admin')
  const { data } = await sb.from('profiles').select('id, full_name, role, created_at').order('created_at', { ascending: false })
  return (<>
    <h1 className="text-3xl font-semibold tracking-tight">Élèves</h1>
    {ok && <p role="status" className="glass p-3" style={{ color: '#30d158' }}>{ok}</p>}
    {err && <p role="alert" className="glass p-3" style={{ color: '#ff6b6b' }}>{err}</p>}
    <form action={createStudent} className="glass p-5 grid gap-3 sm:grid-cols-4 items-end">
      <label className="grid gap-1"><span className="muted text-sm">Nom</span><input className="input" name="name" /></label>
      <label className="grid gap-1"><span className="muted text-sm">E-mail</span><input className="input" type="email" name="email" required /></label>
      <label className="grid gap-1"><span className="muted text-sm">Mot de passe</span><input className="input" type="text" name="password" minLength={8} required /></label>
      <button className="btn">Créer l’élève</button></form>
    <div className="grid gap-3">
      {(data ?? []).map(p => (
        <details key={p.id} className="glass p-4"><summary className="flex justify-between gap-3 cursor-pointer"><span className="font-medium">{p.full_name || 'Sans nom'}</span>
          <span className="muted text-sm">{p.role === 'admin' ? 'Administrateur' : 'Élève'} · {new Date(p.created_at).toLocaleDateString('fr-FR')}</span></summary>
          {p.role === 'student' && <div className="grid gap-3 mt-3">
            <form action={updateStudent} className="grid gap-3 sm:grid-cols-3 items-end"><input type="hidden" name="id" value={p.id} />
              <label className="grid gap-1"><span className="muted text-sm">Nom</span><input className="input" name="name" defaultValue={p.full_name} /></label>
              <label className="grid gap-1"><span className="muted text-sm">Nouveau mot de passe (facultatif)</span><input className="input" name="password" type="text" /></label>
              <button className="btn">Enregistrer</button></form>
            <form action={deleteStudent}><input type="hidden" name="id" value={p.id} /><button className="btn-danger">Supprimer ce compte</button></form></div>}
        </details>))}
    </div>
  </>)
}
