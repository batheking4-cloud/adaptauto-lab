import { requireRole } from '@/lib/auth'
import Shell from '../Shell'
export default async function Admin() {
  const { sb, profile } = await requireRole('admin')
  const { count } = await sb.from('profiles').select('id', { count: 'exact', head: true }).eq('role', 'student')
  const items = [['Élèves','phase 2'],['Banque de questions','phase 2'],['Mini-jeux','phase 3'],['Constructeur de parcours','phase 4'],['Examens blancs','phase 6'],['MIXAGE','phase 5'],['Bibliothèque d’images','phase 5'],['Paramètres et apparence','phase 2']].map(([label, phase]) => ({ label, phase }))
  return <Shell title="Espace administrateur" name={profile.full_name} items={items}>
    <div className="glass p-6"><p style={{color:'var(--muted)'}}>Élèves inscrits</p><p className="text-5xl font-semibold">{count ?? 0}</p></div>
  </Shell>
}
