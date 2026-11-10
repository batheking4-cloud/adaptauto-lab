'use client'
import { usePathname } from 'next/navigation'
import { waLink } from '@/lib/wa'
import WaIcon from './WaIcon'
export default function WaFab({ number }: { number: string }) {
  const p = usePathname() ?? ''
  if (p.startsWith('/eleve/jouer') || p.startsWith('/eleve/erreurs')) return null
  const href = waLink(number, 'Bonjour ADAPT’AUTO, j’ai une question.'); if (!href) return null
  return <a className="wafab" href={href} target="_blank" rel="noopener noreferrer" aria-label="Nous contacter sur WhatsApp"><WaIcon size={30} /></a>
}
