import Link from 'next/link'
import { requireRole } from '@/lib/auth'
export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  await requireRole('admin')
  return (
    <div className="max-w-5xl mx-auto p-5 pb-16 grid gap-5">
      <header className="flex items-center justify-between gap-3 flex-wrap">
        <Link href="/admin" className="link text-lg font-semibold">ADAPT’AUTO LAB · Administration</Link>
        <form action="/auth/signout" method="post"><button className="btn btn-ghost">Se déconnecter</button></form>
      </header>
      {children}
    </div>
  )
}
