'use client'
import { useEffect, useRef, useState, useTransition } from 'react'
const PRESETS: [string, string][] = [['Bleu', '#1a8cff'], ['Rouge ADAPT’AUTO', '#d7191f'], ['Bleu roi', '#0071bc'], ['Vert', '#30d158'], ['Orange', '#ff9f0a'], ['Violet', '#bf5af2'], ['Rose', '#ff375f']]
const DEF = { mode: 'dark', color: '#1a8cff' }
type Res = { ok: boolean; error?: string }
const apply = (mode: string, color: string) => { document.documentElement.setAttribute('data-mode', mode); document.body.style.setProperty('--accent', color) }
export default function SettingsForm({ mode: m0, color: c0, wa: w0, action }: { mode: string; color: string; wa: string; action: (fd: FormData) => Promise<Res> }) {
  const [mode, setMode] = useState(m0), [color, setColor] = useState(c0), [hex, setHex] = useState(c0), [wa, setWa] = useState(w0)
  const saved = useRef({ mode: m0, color: c0 }); const [msg, setMsg] = useState<{ t: 'ok' | 'err'; m: string } | null>(null); const [pending, start] = useTransition()
  const dirty = mode !== saved.current.mode || color !== saved.current.color
  useEffect(() => { apply(mode, color) }, [mode, color])                      // aperçu immédiat sur toute l'interface
  useEffect(() => () => { apply(saved.current.mode, saved.current.color) }, []) // si on quitte sans enregistrer : retour au thème enregistré
  const pick = (c: string) => { setColor(c); setHex(c) }
  const onHex = (v: string) => { setHex(v); const x = v.startsWith('#') ? v : '#' + v; if (/^#[0-9a-fA-F]{6}$/.test(x)) setColor(x.toLowerCase()) }
  const hexOk = /^#?[0-9a-fA-F]{6}$/.test(hex)
  function save(reset = false) {
    const fd = new FormData(); fd.set('mode', reset ? DEF.mode : mode); fd.set('color', reset ? DEF.color : color); fd.set('wa', wa); if (reset) fd.set('reset', '1')
    start(async () => { const r = await action(fd)
      if (r.ok) { const m = reset ? DEF.mode : mode, c = reset ? DEF.color : color; saved.current = { mode: m, color: c }; if (reset) { setMode(m); setColor(c); setHex(c) } setMsg({ t: 'ok', m: reset ? 'Thème par défaut restauré ✓' : 'Apparence enregistrée ✓ Elle est conservée pour tous les utilisateurs, même après déconnexion.' }) }
      else setMsg({ t: 'err', m: r.error || 'Erreur inconnue' }) })
  }
  return (
    <div className="grid gap-4">
      <h1 className="text-3xl font-semibold tracking-tight">Paramètres et apparence</h1>
      <div className="glass p-5 grid gap-4">
        <div className="grid gap-2"><p className="font-semibold">Thème</p><div className="flex gap-2 flex-wrap">{([['dark', 'Sombre (Gris sidéral)'], ['light', 'Clair']] as const).map(([v, l]) => <button type="button" key={v} className="btn btn-ghost" aria-pressed={mode === v} style={mode === v ? { outline: '2px solid var(--accent)' } : {}} onClick={() => setMode(v)}>{l}</button>)}</div></div>
        <div className="grid gap-2"><p className="font-semibold">Couleur principale</p>
          <div className="flex gap-2 flex-wrap">{PRESETS.map(([n, c]) => <button type="button" key={c} className="btn btn-ghost" aria-pressed={color === c} onClick={() => pick(c)} style={color === c ? { outline: '2px solid var(--accent)' } : {}}><span style={{ width: 14, height: 14, borderRadius: 7, background: c, display: 'inline-block', marginRight: 8 }} />{n}</button>)}</div>
          <div className="flex gap-3 flex-wrap items-center"><label className="flex items-center gap-2 muted text-sm">Sélecteur <input type="color" value={color} onChange={e => pick(e.target.value)} aria-label="Choisir une couleur" style={{ width: 44, height: 36, border: 0, background: 'none' }} /></label>
            <label className="flex items-center gap-2 muted text-sm">Code HEX <input className="input" style={{ width: 140 }} value={hex} onChange={e => onHex(e.target.value)} maxLength={7} placeholder="#1A8CFF" aria-label="Code couleur HEX" aria-invalid={!hexOk} /></label>
            {!hexOk && <span className="text-sm" style={{ color: '#ff6b6b' }}>6 caractères, ex. #1A8CFF</span>}</div></div>
        <p className="muted text-sm">Les changements s’appliquent tout de suite à l’écran (aperçu). Ils ne sont conservés pour tout le monde qu’après « Enregistrer ».{dirty && <b style={{ color: '#ff9f0a' }}> · Modifications non enregistrées</b>}</p></div>
      <div className="glass p-5 grid gap-2"><p className="font-semibold">WhatsApp de l’auto-école</p><input className="input" type="tel" value={wa} onChange={e => setWa(e.target.value)} placeholder="+221 77 000 00 00" /><p className="muted text-sm">Bouton WhatsApp vert affiché sur le site. Laissez vide pour le masquer.</p></div>
      <div data-mode={mode} style={{ ['--accent' as string]: color, color: 'var(--text)', background: 'var(--bg)', borderRadius: 28, padding: 16 }}>
        <p className="muted text-sm" style={{ marginBottom: 8 }}>Aperçu de composants</p>
        <div className="glass p-5 grid gap-3"><p className="font-semibold">Question d’exemple</p><p className="muted">Que faire devant un feu rouge fixe ?</p><span className="btn" style={{ pointerEvents: 'none' }}>Valider ma réponse</span></div></div>
      {msg && <p role={msg.t === 'ok' ? 'status' : 'alert'} className="glass p-3" style={{ color: msg.t === 'ok' ? '#30d158' : '#ff6b6b' }}>{msg.m}</p>}
      <div className="flex gap-3 flex-wrap"><button type="button" className="btn" style={{ width: 'auto' }} disabled={pending || !hexOk} onClick={() => save(false)}>{pending ? 'Enregistrement…' : 'Enregistrer l’apparence'}</button>
        <button type="button" className="btn btn-ghost" disabled={pending} onClick={() => save(true)}>Restaurer le thème par défaut</button></div>
    </div>)
}
