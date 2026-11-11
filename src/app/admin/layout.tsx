import Link from 'next/link'
import { requireRole } from '@/lib/auth'
import Logo from '@/components/Logo'
import TopNav from '@/components/TopNav'
import BackButton from '@/components/BackButton'
import TabBar from '@/components/TabBar'
const NAV: [string, string][] = [['Tableau de bord', '/admin'], ['Élèves', '/admin/eleves'], ['Questions', '/admin/questions'], ['Mini-jeux', '/admin/q/jeux'], ['Examens', '/admin/q/examens'], ['Parcours', '/admin/parcours'], ['Cours', '/admin/cours'], ['MIXAGE', '/admin/mixage'], ['Images', '/admin/images'], ['Apparence', '/admin/reglages']]
export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  await requireRole('admin')
  return (<>
    <div className="max-w-6xl mx-auto p-3 sm:p-5 pb-8"><div className="panel grid gap-5">
      <header className="flex items-center justify-between gap-3"><Link href="/admin" aria-label="Tableau de bord"><Logo height={42} /></Link>
        <div className="hidden lg:block min-w-0"><TopNav items={NAV} /></div>
        <form action="/auth/signout" method="post" className="hidden lg:block"><button className="btn btn-ghost">Se déconnecter</button></form></header>
      <BackButton />{children}</div></div>
    <TabBar items={[['Accueil', '/admin', '🏠'], ['Questions', '/admin/questions', '❓'], ['Jeux', '/admin/q/jeux', '🎮'], ['Élèves', '/admin/eleves', '🎓']]}
      more={[['Examens blancs', '/admin/q/examens'], ['Parcours', '/admin/parcours'], ['Cours (apprentissage)', '/admin/cours'], ['MIXAGE', '/admin/mixage'], ['Images', '/admin/images'], ['Apparence', '/admin/reglages']]} /></>)
}
