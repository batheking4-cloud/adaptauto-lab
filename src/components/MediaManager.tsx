'use client'
import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'
type M = { id: string; kind: string; name: string; path: string; text_content: string }
const OK: Record<string, string[]> = { image: ['image/jpeg', 'image/png', 'image/webp'], audio: ['audio/mpeg'] }
export default function MediaManager({ kind, initial }: { kind: 'image' | 'audio'; initial: M[] }) {
  const sb = createClient(); const base = `${process.env.NEXT_PUBLIC_SUPABASE_URL}/storage/v1/object/public/media/`
  const [items, setItems] = useState<M[]>(initial); const [q, setQ] = useState(''); const [msg, setMsg] = useState(''); const [busy, setBusy] = useState(false)
  async function put(file: File) {
    if (!OK[kind].includes(file.type)) throw new Error(`${file.name} : format non accepté (${kind === 'image' ? 'JPG, PNG, WebP' : 'MP3'}).`)
    if (file.size > 10 * 1024 * 1024) throw new Error(`${file.name} : plus de 10 Mo.`)
    const ext = file.type === 'image/jpeg' ? 'jpg' : file.type === 'image/png' ? 'png' : file.type === 'image/webp' ? 'webp' : 'mp3'
    const path = `${kind}/${crypto.randomUUID()}.${ext}`
    const { error } = await sb.storage.from('media').upload(path, file, { contentType: file.type }); if (error) throw error
    return path
  }
  async function add(files: FileList | null) {
    if (!files) return; setBusy(true); setMsg('')
    try { for (const f of Array.from(files)) { const path = await put(f)
      const { data, error } = await sb.from('media').insert({ kind, name: f.name.replace(/\.[^.]+$/, ''), path }).select('*').single(); if (error) throw error; setItems(i => [data as M, ...i]) } }
    catch (e: any) { setMsg(e.message) }
    setBusy(false)
  }
  const patch = async (id: string, v: Partial<M>) => { const { error } = await sb.from('media').update(v).eq('id', id); if (error) return setMsg(error.message); setItems(i => i.map(x => x.id === id ? { ...x, ...v } : x)) }
  async function replace(m: M, file?: File) {
    if (!file) return; setBusy(true); setMsg('')
    try { const path = await put(file); await patch(m.id, { path }); await sb.storage.from('media').remove([m.path]) } catch (e: any) { setMsg(e.message) }
    setBusy(false)
  }
  async function del(m: M) {
    if (!confirm(`Supprimer « ${m.name} » ? Il sera retiré des contenus qui l’utilisent.`)) return
    await sb.storage.from('media').remove([m.path]); const { error } = await sb.from('media').delete().eq('id', m.id)
    if (error) return setMsg(error.message); setItems(i => i.filter(x => x.id !== m.id))
  }
  const list = items.filter(m => (m.name + ' ' + m.text_content).toLowerCase().includes(q.toLowerCase()))
  return (<div className="grid gap-4">
    <div className="glass p-5 grid gap-3 sm:grid-cols-2 items-end">
      <label className="grid gap-1"><span className="muted text-sm">{kind === 'image' ? 'Importer des images (JPG, PNG, WebP)' : 'Importer des MP3 (générés avec ElevenLabs puis téléchargés)'}</span>
        <input className="input" type="file" multiple accept={OK[kind].join(',')} disabled={busy} onChange={e => { add(e.target.files); e.target.value = '' }} /></label>
      <input className="input" placeholder="Rechercher par nom ou texte" value={q} onChange={e => setQ(e.target.value)} aria-label="Rechercher" /></div>
    {busy && <p className="muted">Envoi en cours…</p>}{msg && <p role="alert" style={{ color: '#ff6b6b' }}>{msg}</p>}
    {list.length === 0 && <p className="glass p-6 muted">Aucun fichier.</p>}
    <div className="grid gap-3 sm:grid-cols-2">{list.map(m => (
      <div key={m.id} className="glass p-4 grid gap-2">
        {kind === 'image' ? <img src={base + m.path} alt={m.name} style={{ width: '100%', height: 160, objectFit: 'cover', borderRadius: 16 }} /> : <audio controls preload="none" src={base + m.path} style={{ width: '100%' }} />}
        <input className="input" defaultValue={m.name} aria-label="Nom" onBlur={e => e.target.value !== m.name && patch(m.id, { name: e.target.value })} />
        {kind === 'audio' && <textarea className="input" rows={2} placeholder="Texte correspondant (obligatoire pour l’accessibilité)" defaultValue={m.text_content} onBlur={e => e.target.value !== m.text_content && patch(m.id, { text_content: e.target.value })} />}
        <div className="flex gap-2 flex-wrap"><label className="btn btn-ghost" style={{ cursor: 'pointer' }}>Remplacer<input type="file" hidden accept={OK[kind].join(',')} onChange={e => { replace(m, e.target.files?.[0]); e.target.value = '' }} /></label>
          <button className="btn-danger" onClick={() => del(m)}>Supprimer</button></div></div>))}</div></div>)
}
