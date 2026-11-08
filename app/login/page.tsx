'use client'
import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
type Mode = 'login' | 'signup' | 'forgot'
export default function Login() {
  const router = useRouter(); const sb = createClient()
  const [mode, setMode] = useState<Mode>('login')
  const [name, setName] = useState(''); const [email, setEmail] = useState(''); const [pw, setPw] = useState('')
  const [msg, setMsg] = useState(''); const [err, setErr] = useState(''); const [busy, setBusy] = useState(false)
  async function submit(e: React.FormEvent) {
    e.preventDefault(); setErr(''); setMsg(''); setBusy(true)
    try {
      if (mode === 'login') {
        const { error } = await sb.auth.signInWithPassword({ email, password: pw })
        if (error) throw error
        router.replace('/'); router.refresh()
      } else if (mode === 'signup') {
        if (pw.length < 8) throw new Error('Le mot de passe doit contenir au moins 8 caractères.')
        const { data, error } = await sb.auth.signUp({ email, password: pw, options: { data: { full_name: name }, emailRedirectTo: `${location.origin}/auth/callback` } })
        if (error) throw error
        if (data.session) { router.replace('/'); router.refresh() } else setMsg('Compte créé. Vérifiez votre e-mail pour confirmer, puis connectez-vous.')
      } else {
        const { error } = await sb.auth.resetPasswordForEmail(email, { redirectTo: `${location.origin}/auth/callback?next=/reset-password` })
        if (error) throw error
        setMsg('Si cette adresse existe, un lien de réinitialisation vient d’être envoyé.')
      }
    } catch (x: any) { setErr(x.message === 'Invalid login credentials' ? 'E-mail ou mot de passe incorrect.' : x.message) }
    setBusy(false)
  }
  const title = { login: 'Connexion', signup: 'Créer un compte élève', forgot: 'Mot de passe oublié' }[mode]
  return (
    <main className="min-h-screen grid place-items-center p-5">
      <form onSubmit={submit} className="glass w-full max-w-md p-7 grid gap-4">
        <div><p style={{color:'var(--muted)'}} className="text-sm">ADAPT’AUTO LAB</p><h1 className="text-3xl font-semibold tracking-tight">{title}</h1></div>
        {mode === 'signup' && <input className="input" placeholder="Nom complet" value={name} onChange={e => setName(e.target.value)} required autoComplete="name" />}
        <input className="input" type="email" placeholder="Adresse e-mail" value={email} onChange={e => setEmail(e.target.value)} required autoComplete="email" />
        {mode !== 'forgot' && <input className="input" type="password" placeholder="Mot de passe" value={pw} onChange={e => setPw(e.target.value)} required autoComplete={mode === 'login' ? 'current-password' : 'new-password'} />}
        {err && <p role="alert" style={{color:'#ff6b6b'}} className="text-sm">{err}</p>}
        {msg && <p role="status" style={{color:'#63e6a0'}} className="text-sm">{msg}</p>}
        <button className="btn" disabled={busy}>{busy ? 'Un instant…' : mode === 'login' ? 'Se connecter' : mode === 'signup' ? 'Créer mon compte' : 'Envoyer le lien'}</button>
        <div className="flex justify-between flex-wrap gap-2">
          {mode !== 'login' && <button type="button" className="link" onClick={() => setMode('login')}>J’ai déjà un compte</button>}
          {mode === 'login' && <button type="button" className="link" onClick={() => setMode('signup')}>Créer un compte</button>}
          {mode === 'login' && <button type="button" className="link" onClick={() => setMode('forgot')}>Mot de passe oublié</button>}
        </div>
      </form>
    </main>
  )
}
