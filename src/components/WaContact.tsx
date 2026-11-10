'use client'
import { useEffect, useState } from 'react'
import { TEMPLATES, waLink } from '@/lib/wa'
import WaIcon from './WaIcon'
export default function WaContact({ name, phone, template = 'bienvenue', compact = false }: { name: string; phone?: string | null; template?: string; compact?: boolean }) {
  const first = (name || '').split(' ')[0]; const [t, setT] = useState(template); const [site, setSite] = useState(''); const [custom, setCustom] = useState<string | null>(null)
  useEffect(() => setSite(location.origin), [])
  const text = custom ?? TEMPLATES[t].text.replace('{prenom}', first).replace('{site}', site).trim()
  const href = waLink(phone, text)
  if (!href) return <span className="muted text-sm">Pas de numéro WhatsApp</span>
  const btn = <a className="wabtn" href={href} target="_blank" rel="noopener noreferrer"><WaIcon size={18} />WhatsApp</a>
  if (compact) return btn
  return (<div className="grid gap-2"><select className="input" value={t} onChange={e => { setT(e.target.value); setCustom(null) }} aria-label="Modèle de message">{Object.entries(TEMPLATES).map(([k, v]) => <option key={k} value={k}>{v.label}</option>)}</select>
    <textarea className="input" rows={3} value={text} onChange={e => setCustom(e.target.value)} aria-label="Message" />{btn}</div>)
}
