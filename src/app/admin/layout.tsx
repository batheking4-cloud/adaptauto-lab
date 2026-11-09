import Link from 'next/link'
import { requireRole } from '@/lib/auth'
import Logo from '@/components/Logo'
import BackButton from '@/components/BackButton'
export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  await requireRole('admin')
  return (
    <div className="max-w-5xl mx-auto p-5 pb-16 grid gap-5">
      <header className="flex items-center justify-between gap-3 flex-wrap">
        <div className="flex items-center gap-3 flex-wrap"><BackButton /><Link href="/admin" aria-label="Tableau de bord"><Logo height={46} /></Link></div>
        <form action="/auth/signout" method="post"><button className="btn btn-ghost">Se déconnecter</button></form>
      </header>
      {children}
    </div>
  )
}
