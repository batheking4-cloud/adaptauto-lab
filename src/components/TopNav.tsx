'use client'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
export default function TopNav({ items }: { items: [string, string][] }) {
  const p = usePathname() ?? ''
  return <nav className="topnav" aria-label="Navigation">{items.map(([l, h], i) => <Link key={h} href={h} className={(i === 0 ? p === h : p.startsWith(h)) ? 'on' : ''}>{l}</Link>)}</nav>
}
