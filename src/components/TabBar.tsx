'use client'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useState } from 'react'
export default function TabBar({ items, more }: { items: [string, string, string][]; more: [string, string][] }) {
  const p = usePathname() ?? ''; const [open, setOpen] = useState(false)
  if (p.startsWith('/eleve/jouer') || p.startsWith('/eleve/erreurs')) return null
  return (<>
    <div className="tabspacer" aria-hidden="true" />
    {open && <div className="sheetbg" onClick={() => setOpen(false)}><div className="sheet" onClick={e => e.stopPropagation()}>
      {more.map(([l, h]) => <Link key={h} href={h} onClick={() => setOpen(false)}>{l}</Link>)}
      <form action="/auth/signout" method="post"><button className="btn">Se déconnecter</button></form></div></div>}
    <nav className="tabbar" aria-label="Navigation principale">
      {items.map(([l, h, i], k) => <Link key={h} href={h} className={(k === 0 ? p === h : p.startsWith(h)) ? 'on' : ''}><span aria-hidden="true">{i}</span>{l}</Link>)}
      <button type="button" onClick={() => setOpen(!open)} className={open ? 'on' : ''} aria-expanded={open}><span aria-hidden="true">⋯</span>Plus</button></nav></>)
}
