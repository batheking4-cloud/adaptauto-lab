'use client'
import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import Logo from '@/components/Logo'
type Mode = 'login' | 'signup' | 'forgot'
function Phone({ role }: { role: 'student' | 'admin' }) {
  const router = useRouter(); const sb = createClient(); const adm = role === 'admin'
  const [mode, setMode] = useState<Mode>('login'); const [name, setName] = useState(''); const [email, setEmail] = useState(''); const [pw, setPw] = useState('')
  const [msg, setMsg] = useState(''); const [err, setErr] = useState(''); const [busy, setBusy] = useState(false)
  async function submit(e: React.FormEvent) {
    e.preventDefault(); setErr(''); setMsg(''); setBusy(true)
    try {
      if (mode === 'login') {
        const { data, error } = await sb.auth.signInWithPassword({ email, password: pw }); if (error) throw error
        const { data: p } = await sb.from('profiles').select('role').eq('id', data.user.id).single()
        if (p?.role !== role) { await sb.auth.signOut(); throw new Error(adm ? 'Ce compte n’a pas les droits administrateur.' : 'Ce compte est administrateur : utilisez l’espace Administrateur.') }
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
  return (
    <form onSubmit={submit} className="phone" aria-label={adm ? 'Connexion administrateur' : 'Connexion élève'}>
      <div className="notch" />
      <div className="grid gap-5 justify-items-center py-3">
        <Logo height={96} float />
        <p className="muted text-sm" style={{ letterSpacing: '.08em', textTransform: 'uppercase' }}>{mode === 'signup' ? 'Créer un compte élève' : mode === 'forgot' ? 'Mot de passe oublié' : adm ? 'Espace administrateur' : 'Espace élève'}</p>
        <div className="grid gap-4 w-full">
          {mode === 'signup' && <input className="input" placeholder="Nom complet" value={name} onChange={e => setName(e.target.value)} required autoComplete="name" />}
          <input className="input" type="email" placeholder="E-mail" value={email} onChange={e => setEmail(e.target.value)} required autoComplete="email" />
          {mode !== 'forgot' && <input className="input" type="password" placeholder="Mot de passe" value={pw} onChange={e => setPw(e.target.value)} required autoComplete={mode === 'login' ? 'current-password' : 'new-password'} />}
        </div>
        {err && <p role="alert" style={{ color: '#e5484d' }} className="text-sm text-center">{err}</p>}{msg && <p role="status" style={{ color: '#1f9d55' }} className="text-sm text-center">{msg}</p>}
        <button className="btn" disabled={busy}>{busy ? 'Un instant…' : mode === 'login' ? 'Se connecter' : mode === 'signup' ? 'Créer mon compte' : 'Envoyer le lien'}</button>
        <div className="grid gap-2 justify-items-center">
          {mode === 'login' && <button type="button" className="link" style={{ textDecoration: 'underline', color: 'var(--muted)' }} onClick={() => setMode('forgot')}>Mot de passe oublié ?</button>}
          {mode !== 'login' && <button type="button" className="link" onClick={() => setMode('login')}>← Retour à la connexion</button>}</div>
      </div>
      <div className="grid gap-3 justify-items-center">
        {!adm && mode === 'login' && <p className="muted text-sm">Pas encore de compte ? <button type="button" className="link" style={{ textDecoration: 'underline' }} onClick={() => setMode('signup')}>Créer un compte</button></p>}
        <div className="home" /></div>
    </form>)
}
export default function Login() {
  const [role, setRole] = useState<'student' | 'admin'>('student')
  return (
    <div data-mode="light" className="stage-wrap" style={{ color: 'var(--text)' }}><div className="stage">
      <svg className="blob" viewBox="0 0 1600 900" preserveAspectRatio="xMidYMid slice" aria-hidden="true">
        <path d="M0 0H640C600 110 500 150 420 240C340 330 330 440 230 520C150 585 70 600 0 640Z" /><path d="M1600 900V610C1520 690 1430 700 1380 780C1350 830 1310 870 1270 900Z" /></svg>
      <div className="watermark" aria-hidden="true">ADAPT’AUTO</div>
      <div className="lg:hidden" style={{ position: 'relative', zIndex: 2 }}>
        <div style={{ display: 'flex', justifyContent: 'center', padding: '16px 16px 0' }}><div role="tablist" aria-label="Type de compte" style={{ display: 'flex', gap: 6, padding: 6, borderRadius: 999, background: 'var(--bg)', boxShadow: 'var(--in)' }}>
          {([['student', 'Élève'], ['admin', 'Administrateur']] as const).map(([r, l]) => <button key={r} role="tab" aria-selected={role === r} onClick={() => setRole(r)} style={{ padding: '10px 22px', borderRadius: 999, border: 0, cursor: 'pointer', fontWeight: 600, background: role === r ? 'var(--accent)' : 'transparent', color: role === r ? '#fff' : 'var(--text)', transition: 'all .25s' }}>{l}</button>)}</div></div>
        <Phone key={role} role={role} /></div>
      <div className="hidden lg:flex" style={{ gap: '6vh', alignItems: 'center', position: 'relative', zIndex: 2 }}><Phone role="student" /><Phone role="admin" /></div>
    </div></div>)
}
