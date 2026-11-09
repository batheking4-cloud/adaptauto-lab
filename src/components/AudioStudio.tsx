'use client'
import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'
type M = { id: string; name: string; path: string | null; text_content: string; usage: string }
type Q = { id: string; text: string; audio_id: string | null; correction_audio_id: string | null }
type G = { id: string; title: string; intro_audio_id: string | null; outro_audio_id: string | null }
const USAGES: [string, string][] = [['question', 'Question'], ['bonne', 'Bonne réponse'], ['mauvaise', 'Mauvaise réponse'], ['correction', 'Correction'], ['intro', 'Début de jeu'], ['fin', 'Fin de jeu'], ['autre', 'Autre']]
const TG: [string, string][] = [['q_audio', 'Question — audio de la question'], ['q_corr', 'Question — audio de correction'], ['g_intro', 'Mini-jeu — introduction'], ['g_outro', 'Mini-jeu — fin']]
export default function AudioStudio({ initial, questions: q0, games: g0 }: { initial: M[]; questions: Q[]; games: G[] }) {
  const sb = createClient(); const base = `${process.env.NEXT_PUBLIC_SUPABASE_URL}/storage/v1/object/public/media/`
  const [items, setItems] = useState(initial), [qs, setQs] = useState(q0), [gs, setGs] = useState(g0)
  const [search, setSearch] = useState(''), [filter, setFilter] = useState(''), [msg, setMsg] = useState(''), [busy, setBusy] = useState(false)
  const [nName, setNName] = useState(''), [nUse, setNUse] = useState('question'), [nText, setNText] = useState(''), [nFile, setNFile] = useState<File | null>(null)
  async function upload(file: File) {
    if (file.type !== 'audio/mpeg') throw new Error('Seuls les fichiers MP3 sont acceptés.'); if (file.size > 10 * 1024 * 1024) throw new Error('Fichier de plus de 10 Mo.')
    const path = `audio/${crypto.randomUUID()}.mp3`; const { error } = await sb.storage.from('media').upload(path, file, { contentType: 'audio/mpeg' }); if (error) throw error; return path
  }
  async function create(e: React.FormEvent) {
    e.preventDefault(); setBusy(true); setMsg('')
    try { const path = nFile ? await upload(nFile) : null
      const { data, error } = await sb.from('media').insert({ kind: 'audio', name: nName || 'Sans nom', usage: nUse, text_content: nText, path }).select('*').single(); if (error) throw error
      setItems(i => [data as M, ...i]); setNName(''); setNText(''); setNFile(null) } catch (x: any) { setMsg(x.message) }
    setBusy(false)
  }
  const patch = async (id: string, v: Partial<M>) => { const { error } = await sb.from('media').update(v).eq('id', id); if (error) return setMsg(error.message); setItems(i => i.map(x => x.id === id ? { ...x, ...v } : x)) }
  async function attach(m: M, f?: File) { if (!f) return; setBusy(true); setMsg(''); try { const path = await upload(f); await patch(m.id, { path }); if (m.path) await sb.storage.from('media').remove([m.path]) } catch (x: any) { setMsg(x.message) } setBusy(false) }
  async function del(m: M) { if (!confirm(`Supprimer « ${m.name} » ? Il sera retiré de tous les contenus liés.`)) return
    if (m.path) await sb.storage.from('media').remove([m.path]); const { error } = await sb.from('media').delete().eq('id', m.id); if (error) return setMsg(error.message)
    setItems(i => i.filter(x => x.id !== m.id)); setQs(a => a.map(x => ({ ...x, audio_id: x.audio_id === m.id ? null : x.audio_id, correction_audio_id: x.correction_audio_id === m.id ? null : x.correction_audio_id })))
    setGs(a => a.map(x => ({ ...x, intro_audio_id: x.intro_audio_id === m.id ? null : x.intro_audio_id, outro_audio_id: x.outro_audio_id === m.id ? null : x.outro_audio_id }))) }
  async function link(t: string, target: string, mid: string | null, auto = false) {
    const isQ = t.startsWith('q_'); const c = t === 'q_audio' ? 'audio_id' : t === 'q_corr' ? 'correction_audio_id' : t === 'g_intro' ? 'intro_audio_id' : 'outro_audio_id'
    const body: any = { [c]: mid }; if (t === 'q_audio' && mid) body.audio_autoplay = auto
    const { error } = await sb.from(isQ ? 'questions' : 'quizzes').update(body).eq('id', target); if (error) return setMsg(error.message)
    if (isQ) setQs(a => a.map(x => x.id === target ? { ...x, [c]: mid } : x)); else setGs(a => a.map(x => x.id === target ? { ...x, [c]: mid } : x))
  }
  const used = (m: M) => [...qs.filter(x => x.audio_id === m.id).map(x => ({ k: 'q_audio', id: x.id, l: `Question « ${x.text.slice(0, 40)} » (audio)` })), ...qs.filter(x => x.correction_audio_id === m.id).map(x => ({ k: 'q_corr', id: x.id, l: `Question « ${x.text.slice(0, 40)} » (correction)` })),
    ...gs.filter(x => x.intro_audio_id === m.id).map(x => ({ k: 'g_intro', id: x.id, l: `${x.title} (introduction)` })), ...gs.filter(x => x.outro_audio_id === m.id).map(x => ({ k: 'g_outro', id: x.id, l: `${x.title} (fin)` }))]
  const list = items.filter(m => (!filter || m.usage === filter) && (m.name + ' ' + m.text_content).toLowerCase().includes(search.toLowerCase()))
  return (<div className="grid gap-5">
    <div className="glass p-5 grid gap-3"><p className="font-semibold">Comment ça marche ?</p>
      <ol className="grid gap-3 sm:grid-cols-4 text-sm">{['1. Écrivez le texte ci-dessous et copiez-le.', '2. Collez-le dans ElevenLabs et générez la voix.', '3. Téléchargez le MP3 et importez-le sur la fiche : texte et audio restent liés.', '4. Associez la fiche à une question, une correction ou un mini-jeu.'].map(s => <li key={s} className="glass p-3">{s}</li>)}</ol>
      <p className="muted text-sm">Aucune connexion automatique à ElevenLabs. Le texte de la fiche s’affiche sous l’audio côté élève (« Voir le texte »). Une fiche peut servir à plusieurs contenus.</p></div>
    <form onSubmit={create} className="glass p-5 grid gap-3"><p className="font-semibold">Nouvelle fiche audio</p>
      <div className="grid gap-3 sm:grid-cols-2"><input className="input" placeholder="Nom (ex. Bravo – bonne réponse)" value={nName} onChange={e => setNName(e.target.value)} required />
        <select className="input" value={nUse} onChange={e => setNUse(e.target.value)} aria-label="Usage">{USAGES.map(([v, l]) => <option key={v} value={v}>{l}</option>)}</select></div>
      <textarea className="input" rows={3} placeholder="Texte à dire (à copier dans ElevenLabs)" value={nText} onChange={e => setNText(e.target.value)} required />
      <div className="flex gap-2 flex-wrap items-center"><button type="button" className="btn btn-ghost" onClick={() => navigator.clipboard?.writeText(nText)}>Copier le texte</button>
        <label className="muted text-sm">MP3 (facultatif maintenant) <input type="file" accept="audio/mpeg" onChange={e => setNFile(e.target.files?.[0] ?? null)} /></label><button className="btn" style={{ width: 'auto' }} disabled={busy}>Créer la fiche</button></div></form>
    {msg && <p role="alert" style={{ color: '#ff6b6b' }}>{msg}</p>}
    <div className="glass p-4 flex gap-3 flex-wrap items-center"><input className="input" style={{ flex: '1 1 220px' }} placeholder="Rechercher (nom ou texte)" value={search} onChange={e => setSearch(e.target.value)} aria-label="Rechercher" />
      <select className="input" style={{ flex: '0 1 220px' }} value={filter} onChange={e => setFilter(e.target.value)} aria-label="Filtrer par usage"><option value="">Tous les usages</option>{USAGES.map(([v, l]) => <option key={v} value={v}>{l}</option>)}</select></div>
    {list.length === 0 && <p className="glass p-6 muted">Aucune fiche audio.</p>}
    <div className="grid gap-4 sm:grid-cols-2">{list.map(m => <Card key={m.id} m={m} base={base} qs={qs} gs={gs} used={used(m)} patch={patch} attach={attach} del={del} link={link} />)}</div></div>)
}
function Card({ m, base, qs, gs, used, patch, attach, del, link }: any) {
  const [t, setT] = useState('q_audio'), [target, setTarget] = useState(''), [auto, setAuto] = useState(false)
  const opts = t.startsWith('q_') ? qs.map((x: Q) => ({ id: x.id, l: x.text.slice(0, 60) })) : gs.map((x: G) => ({ id: x.id, l: x.title }))
  return (<div className="glass p-4 grid gap-3">
    <div className="flex justify-between gap-2 items-center"><span className="text-sm" style={{ color: m.path ? '#30d158' : '#ff9f0a' }}>{m.path ? '● MP3 importé' : '● En attente du MP3'}</span>
      <select className="input" style={{ width: 'auto' }} value={m.usage} onChange={e => patch(m.id, { usage: e.target.value })} aria-label="Usage">{USAGES.map(([v, l]) => <option key={v} value={v}>{l}</option>)}</select></div>
    <input className="input" defaultValue={m.name} aria-label="Nom" onBlur={e => e.target.value !== m.name && patch(m.id, { name: e.target.value })} />
    <textarea className="input" rows={3} defaultValue={m.text_content} aria-label="Texte de l’audio" onBlur={e => e.target.value !== m.text_content && patch(m.id, { text_content: e.target.value })} />
    {m.path ? <audio controls preload="none" src={base + m.path} style={{ width: '100%' }} /> : <p className="muted text-sm">Générez la voix avec ce texte, puis importez le MP3.</p>}
    <div className="flex gap-2 flex-wrap"><button type="button" className="btn btn-ghost" onClick={() => navigator.clipboard?.writeText(m.text_content)}>Copier le texte</button>
      <label className="btn btn-ghost" style={{ cursor: 'pointer' }}>{m.path ? 'Remplacer le MP3' : 'Importer le MP3'}<input type="file" hidden accept="audio/mpeg" onChange={e => { attach(m, e.target.files?.[0]); e.target.value = '' }} /></label><button className="btn-danger" onClick={() => del(m)}>Supprimer</button></div>
    <div className="grid gap-2"><p className="text-sm font-semibold">Associer à un contenu</p>
      <select className="input" value={t} onChange={e => { setT(e.target.value); setTarget('') }} aria-label="Type d’association">{TG.map(([v, l]) => <option key={v} value={v}>{l}</option>)}</select>
      <select className="input" value={target} onChange={e => setTarget(e.target.value)} aria-label="Contenu"><option value="">Choisir…</option>{opts.map((o: any) => <option key={o.id} value={o.id}>{o.l}</option>)}</select>
      {t === 'q_audio' && <label className="flex items-center gap-2 text-sm"><input type="checkbox" checked={auto} onChange={e => setAuto(e.target.checked)} style={{ width: 20, height: 20 }} /> Lecture automatique (sinon bouton haut-parleur)</label>}
      <button type="button" className="btn btn-ghost" disabled={!target} onClick={() => link(t, target, m.id, auto)}>Associer</button></div>
    <div className="grid gap-1"><p className="text-sm font-semibold">Utilisé dans ({used.length})</p>{used.length === 0 && <p className="muted text-sm">Aucun contenu pour l’instant.</p>}
      {used.map((u: any) => <div key={u.k + u.id} className="flex justify-between gap-2 text-sm"><span>{u.l}</span><button type="button" className="link" onClick={() => link(u.k, u.id, null)}>Dissocier</button></div>)}</div></div>)
}
