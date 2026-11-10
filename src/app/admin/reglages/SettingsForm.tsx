'use client'
import { useState } from 'react'
const PRESETS: [string, string][] = [['Bleu', '#1a8cff'], ['Rouge ADAPT’AUTO', '#d7191f'], ['Bleu roi', '#0071bc'], ['Vert', '#30d158'], ['Orange', '#ff9f0a'], ['Violet', '#bf5af2'], ['Rose', '#ff375f']]
export default function SettingsForm({ mode: m0, color: c0, wa, action }: { mode: string; color: string; wa: string; action: (fd: FormData) => Promise<void> }) {
  const [mode, setMode] = useState(m0); const [color, setColor] = useState(c0)
  return (
    <form action={action} className="grid gap-4">
      <h1 className="text-3xl font-semibold tracking-tight">Paramètres et apparence</h1>
      <input type="hidden" name="mode" value={mode} /><input type="hidden" name="color" value={color} />
      <div className="glass p-5 grid gap-3">
        <p className="font-semibold">Thème</p>
        <div className="flex gap-2">{(['dark', 'light'] as const).map(v => <button type="button" key={v} className="btn btn-ghost" aria-pressed={mode === v} style={mode === v ? { outline: '2px solid var(--accent)' } : {}} onClick={() => setMode(v)}>{v === 'dark' ? 'Sombre (Gris sidéral)' : 'Clair'}</button>)}</div>
        <p className="font-semibold">Couleur principale</p>
        <div className="flex gap-2 flex-wrap items-center">
          {PRESETS.map(([n, c]) => <button type="button" key={c} className="btn btn-ghost" onClick={() => setColor(c)} style={color === c ? { outline: '2px solid var(--accent)' } : {}}><span style={{ width: 14, height: 14, borderRadius: 7, background: c, display: 'inline-block', marginRight: 8 }} />{n}</button>)}
          <label className="flex items-center gap-2 muted text-sm">Personnalisée <input type="color" value={color} onChange={e => setColor(e.target.value)} aria-label="Couleur personnalisée" /></label>
        </div>
      </div>
      <div className="glass p-5 grid gap-2"><p className="font-semibold">WhatsApp de l’auto-école</p><input className="input" name="wa" type="tel" defaultValue={wa} placeholder="+221 77 000 00 00" /><p className="muted text-sm">Affiché en bouton WhatsApp vert sur le site : les visiteurs et élèves vous écrivent en un appui. Laissez vide pour le masquer.</p></div>
      <div data-mode={mode} style={{ ['--accent' as string]: color, color: 'var(--text)', background: 'var(--bg)', borderRadius: 28, padding: 16 }}>
        <p className="muted text-sm" style={{ marginBottom: 8 }}>Aperçu (pas encore enregistré)</p>
        <div className="glass p-5 grid gap-3"><p className="font-semibold">Question d’exemple</p><p className="muted">Que faire devant un feu rouge fixe ?</p><span className="btn" style={{ pointerEvents: 'none' }}>Valider ma réponse</span></div>
      </div>
      <div className="flex gap-3 flex-wrap"><button className="btn" style={{ width: 'auto' }}>Enregistrer l’apparence</button>
        <button className="btn btn-ghost" name="reset" value="1" formNoValidate>Restaurer le thème par défaut</button></div>
    </form>
  )
}
