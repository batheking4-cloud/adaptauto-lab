import { requireRole } from '@/lib/auth'
import { createStudent, updateStudent, deleteStudent } from '../studentActions'
import WaContact from '@/components/WaContact'
export default async function Eleves({ searchParams }: { searchParams: Promise<{ ok?: string; err?: string }> }) {
  const { ok, err } = await searchParams
  const { sb } = await requireRole('admin')
  const { data } = await sb.from('profiles').select('id, full_name, role, phone, created_at').order('created_at', { ascending: false })
  const { data: att } = await sb.from('attempts').select('user_id, created_at').order('created_at', { ascending: false }).limit(3000)
  const last = new Map<string, string>(); for (const a of att ?? []) if (!last.has(a.user_id)) last.set(a.user_id, a.created_at)
  const limit = Date.now() - 7 * 864e5
  const students = (data ?? []).filter(p => p.role === 'student')
  const idle = students.filter(p => !last.has(p.id) || new Date(last.get(p.id)!).getTime() < limit)
  return (<>
    <h1 className="text-3xl font-semibold tracking-tight">Élèves</h1>
    {ok && <p role="status" className="glass p-3" style={{ color: '#30d158' }}>{ok}</p>}{err && <p role="alert" className="glass p-3" style={{ color: '#ff6b6b' }}>{err}</p>}
    <div className="glass p-5 grid gap-3"><div><h2 className="font-semibold">Relancer les inactifs sur WhatsApp</h2><p className="muted text-sm">Élèves sans activité depuis 7 jours. Un appui ouvre WhatsApp avec le message prêt : vous appuyez sur « envoyer ».</p></div>
      {idle.length ? idle.map(p => <div key={p.id} className="flex justify-between items-center gap-3 flex-wrap py-2" style={{ borderTop: '1px solid var(--line)' }}><span>{p.full_name || 'Sans nom'} <span className="muted text-sm">· {last.has(p.id) ? `dernière activité le ${new Date(last.get(p.id)!).toLocaleDateString('fr-FR')}` : 'jamais connecté au jeu'}</span></span>
        <WaContact name={p.full_name} phone={p.phone} template="relance" compact /></div>) : <p className="muted text-sm">Tous vos élèves sont actifs. Bravo !</p>}</div>
    <form action={createStudent} className="glass p-5 grid gap-3 sm:grid-cols-5 items-end">
      <label className="grid gap-1"><span className="muted text-sm">Nom</span><input className="input" name="name" /></label>
      <label className="grid gap-1"><span className="muted text-sm">E-mail</span><input className="input" type="email" name="email" required /></label>
      <label className="grid gap-1"><span className="muted text-sm">WhatsApp</span><input className="input" type="tel" name="phone" placeholder="+221 77 000 00 00" /></label>
      <label className="grid gap-1"><span className="muted text-sm">Mot de passe</span><input className="input" type="text" name="password" minLength={8} required /></label>
      <button className="btn">Créer l’élève</button></form>
    <div className="grid gap-3">{(data ?? []).map(p => (
      <details key={p.id} className="glass p-4"><summary className="flex justify-between gap-3 cursor-pointer"><span className="font-medium">{p.full_name || 'Sans nom'}</span>
        <span className="muted text-sm">{p.role === 'admin' ? 'Administrateur' : 'Élève'}{p.phone ? ` · ${p.phone}` : ''}</span></summary>
        {p.role === 'student' && <div className="grid gap-4 mt-3 lg:grid-cols-2">
          <div className="grid gap-2"><p className="text-sm font-semibold">Contacter sur WhatsApp</p><WaContact name={p.full_name} phone={p.phone} /></div>
          <div className="grid gap-3"><form action={updateStudent} className="grid gap-3"><input type="hidden" name="id" value={p.id} />
            <label className="grid gap-1"><span className="muted text-sm">Nom</span><input className="input" name="name" defaultValue={p.full_name} /></label>
            <label className="grid gap-1"><span className="muted text-sm">Numéro WhatsApp</span><input className="input" type="tel" name="phone" defaultValue={p.phone ?? ''} placeholder="+221 77 000 00 00" /></label>
            <label className="grid gap-1"><span className="muted text-sm">Nouveau mot de passe (facultatif)</span><input className="input" name="password" type="text" /></label><button className="btn">Enregistrer</button></form>
            <form action={deleteStudent}><input type="hidden" name="id" value={p.id} /><button className="btn-danger">Supprimer ce compte</button></form></div></div>}
      </details>))}</div></>)
}
