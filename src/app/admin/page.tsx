import Link from 'next/link'
import { requireRole } from '@/lib/auth'
export default async function Admin() {
  const { sb, profile } = await requireRole('admin')
  const students = await sb.from('profiles').select('id', { count: 'exact', head: true }).eq('role', 'student')
  const questions = await sb.from('questions').select('id', { count: 'exact', head: true })
  const items: [string, string, string | null][] = [
    ['Élèves', 'Voir les comptes élèves', '/admin/eleves'], ['Banque de questions', 'Créer et modifier les questions', '/admin/questions'],
    ['Paramètres et apparence', 'Thème, couleur, aperçu', '/admin/reglages'], ['Mini-jeux', 'Phase 3', null], ['Constructeur de parcours', 'Phase 4', null],
    ['MIXAGE', 'Phase 5', null], ['Bibliothèque d’images', 'Phase 5', null], ['Examens blancs', 'Phase 6', null]]
  return (<>
    <h1 className="text-3xl font-semibold tracking-tight">Bonjour {profile.full_name || 'administrateur'}</h1>
    <div className="grid grid-cols-2 gap-3">
      <div className="glass p-5"><p className="muted text-sm">Élèves inscrits</p><p className="text-4xl font-semibold">{students.count ?? 0}</p></div>
      <div className="glass p-5"><p className="muted text-sm">Questions</p><p className="text-4xl font-semibold">{questions.count ?? 0}</p></div>
    </div>
    <section className="grid gap-3 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3">
      {items.map(([t, d, href]) => href
        ? <Link key={t} href={href} className="glass p-5 block" style={{ textDecoration: 'none', color: 'inherit' }}><h2 className="font-semibold">{t}</h2><p className="muted text-sm mt-1">{d}</p></Link>
        : <div key={t} className="glass p-5 opacity-60"><h2 className="font-semibold">{t}</h2><p className="muted text-sm mt-1">Disponible en {d.toLowerCase()}</p></div>)}
    </section></>)
}
