'use client'
import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
type Mode = 'login' | 'signup' | 'forgot'
export default function Login() {
  const router = useRouter(); const sb = createClient()
  const [role, setRole] = useState<'student' | 'admin'>('student'); const [mode, setMode] = useState<Mode>('login')
  const [name, setName] = useState(''); const [email, setEmail] = useState(''); const [pw, setPw] = useState('')
  const [msg, setMsg] = useState(''); const [err, setErr] = useState(''); const [busy, setBusy] = useState(false)
  const pick = (r: 'student' | 'admin') => { setRole(r); setMode('login'); setErr(''); setMsg('') }
  async function submit(e: React.FormEvent) {
    e.preventDefault(); setErr(''); setMsg(''); setBusy(true)
    try {
      if (mode === 'login') {
        const { data, error } = await sb.auth.signInWithPassword({ email, password: pw }); if (error) throw error
        const { data: p } = await sb.from('profiles').select('role').eq('id', data.user.id).single()
        if (p?.role !== role) { await sb.auth.signOut(); throw new Error(role === 'admin' ? 'Ce compte n’a pas les droits administrateur.' : 'Ce compte est administrateur : utilisez l’onglet Administrateur.') }
        router.replace('/'); router.refresh()
      } else if (mode === 'signup') {
        if (pw.length < 8) throw new Error('Le mot de passe doit contenir au moins 8 caractères.')
        const { data, error } = await sb.auth.signUp({ email, password: pw, options: { data: { full_name: name }, emailRedirectTo: `${location.origin}/auth/callback` } }); if (error) throw error
        if (data.session) { router.replace('/'); router.refresh() } else setMsg('Compte créé. Vérifiez votre e-mail pour confirmer, puis connectez-vous.')
      } else {
        const { error } = await sb.auth.resetPasswordForEmail(email, { redirectTo: `${location.origin}/auth/callback?next=/reset-password` }); if (error) throw error
        setMsg('Si cette adresse existe, un lien de réinitialisation vient d’être envoyé.')
      }
    } catch (x: any) { setErr(x.message === 'Invalid login credentials' ? 'E-mail ou mot de passe incorrect.' : x.message) }
    setBusy(false)
  }
  const adm = role === 'admin'
  const title = mode === 'login' ? (adm ? 'Connexion administrateur' : 'Connexion élève') : mode === 'signup' ? 'Créer un compte élève' : 'Mot de passe oublié'
  return (
    <main className="min-h-screen grid place-items-center p-5"><div className="w-full max-w-md grid gap-4">
      <div className="glass p-2 grid grid-cols-2 gap-2" role="tablist" aria-label="Type de compte">
        {([['student', 'Élève'], ['admin', 'Administrateur']] as const).map(([r, l]) => <button key={r} type="button" role="tab" aria-selected={role === r} onClick={() => pick(r)}
          style={{ padding: '12px', borderRadius: 20, border: 0, cursor: 'pointer', fontWeight: 600, fontSize: 16, background: role === r ? 'var(--accent)' : 'transparent', color: role === r ? '#fff' : 'var(--text)', transition: 'background .2s' }}>{l}</button>)}</div>
      <form onSubmit={submit} className="glass p-7 grid gap-4">
        <div><p className="muted text-sm">ADAPT’AUTO LAB</p><h1 className="text-3xl font-semibold tracking-tight">{title}</h1></div>
        {mode === 'signup' && <input className="input" placeholder="Nom complet" value={name} onChange={e => setName(e.target.value)} required autoComplete="name" />}
        <input className="input" type="email" placeholder="Adresse e-mail" value={email} onChange={e => setEmail(e.target.value)} required autoComplete="email" />
        {mode !== 'forgot' && <input className="input" type="password" placeholder="Mot de passe" value={pw} onChange={e => setPw(e.target.value)} required autoComplete={mode === 'login' ? 'current-password' : 'new-password'} />}
        {err && <p role="alert" style={{ color: '#ff6b6b' }} className="text-sm">{err}</p>}{msg && <p role="status" style={{ color: '#30d158' }} className="text-sm">{msg}</p>}
        <button className="btn" disabled={busy}>{busy ? 'Un instant…' : mode === 'login' ? 'Se connecter' : mode === 'signup' ? 'Créer mon compte' : 'Envoyer le lien'}</button>
        <div className="flex justify-between flex-wrap gap-2">
          {mode !== 'login' && <button type="button" className="link" onClick={() => setMode('login')}>Retour à la connexion</button>}
          {mode === 'login' && !adm && <button type="button" className="link" onClick={() => setMode('signup')}>Créer un compte élève</button>}
          {mode === 'login' && <button type="button" className="link" onClick={() => setMode('forgot')}>Mot de passe oublié</button>}</div>
      </form></div></main>)
}
