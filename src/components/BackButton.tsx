'use client'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
export default function BackButton() {
  const p = usePathname(); if (!p || p === '/admin') return null
  const parts = p.split('/').filter(Boolean); parts.pop(); let to = '/' + parts.join('/'); if (to === '/admin/q' || to === '/') to = '/admin'
  return <Link href={to} className="back">← Retour</Link>
}
