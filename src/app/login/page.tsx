'use client'
import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import Logo from '@/components/Logo'
import RoadScene from '@/components/RoadScene'
type Mode = 'login' | 'signup' | 'forgot'
function Toast({ note, onClose }: { note: { t: 'ok' | 'err'; m: string } | null; onClose: () => void }) {
  useEffect(() => { if (!note || note.t === 'ok') return; const t = setTimeout(onClose, 8000); return () => clearTimeout(t) }, [note])
  if (!note) return null
  return <div className={`toast ${note.t}`} role={note.t === 'err' ? 'alert' : 'status'} aria-live="polite" key={note.m}><span className="ti" aria-hidden="true">{note.t === 'ok' ? '✓' : '!'}</span><span className="text-sm" style={{ fontWeight: 600 }}>{note.m.replace(/^[✓✗]\s*/, '')}</span><button type="button" onClick={onClose} aria-label="Fermer la notification">×</button></div>
}
export default function Login() {
  const router = useRouter(); const sb = createClient()
  const [mode, setMode] = useState<Mode>('login'); const [name, setName] = useState(''); const [phone, setPhone] = useState(''); const [email, setEmail] = useState(''); const [pw, setPw] = useState('')
  const [note, setNote] = useState<{ t: 'ok' | 'err'; m: string } | null>(null); const [busy, setBusy] = useState(false)
  const explain = (e: any): string => {
    const m = String(e?.message ?? ''), st = Number(e?.status ?? 0)
    if ((typeof navigator !== 'undefined' && !navigator.onLine) || /failed to fetch|networkerror|load failed|network request/i.test(m) || (e?.name === 'AuthRetryableFetchError' && !st)) return 'Problème de connexion Internet : vérifiez votre réseau puis réessayez.'
    if (/invalid login credentials/i.test(m)) return 'E-mail ou mot de passe incorrect (ou compte inexistant).'
    if (/email not confirmed/i.test(m)) return 'Adresse e-mail non confirmée : ouvrez le lien reçu par e-mail.'
    if (st === 429 || /rate limit|too many/i.test(m)) return 'Trop de tentatives : patientez quelques minutes avant de réessayer.'
    if (st >= 500 || /unavailable|timeout|upstream|bad gateway/i.test(m)) return 'Serveur momentanément indisponible : réessayez dans un instant.'
    if (/banned|disabled/i.test(m)) return 'Ce compte est désactivé. Contactez l’auto-école.'
    return m ? `Erreur : ${m}` : 'Erreur inconnue.'
  }
  const fail = (m: string) => setNote({ t: 'err', m: `Connexion échouée : ${m}` })
  async function submit(e: React.FormEvent) {
    e.preventDefault(); setNote(null); setBusy(true)
    if (mode === 'login') {
      let res: any
      try { res = await sb.auth.signInWithPassword({ email, password: pw }) } catch (x) { fail(explain(x)); return setBusy(false) }
      if (res.error || !res.data?.session) { fail(explain(res.error ?? { message: 'Aucune session reçue.' })); return setBusy(false) }
      const prof = await sb.from('profiles').select('role').eq('id', res.data.user.id).single()
      if (prof.error || !prof.data) { await sb.auth.signOut(); fail('votre profil n’a pas pu être chargé (serveur indisponible ou compte incomplet).'); return setBusy(false) }
      setNote({ t: 'ok', m: 'Connexion réussie. Bienvenue !' }); setTimeout(() => { router.replace('/'); router.refresh() }, 900); return
    }
    if (mode === 'signup') {
      if (pw.length < 8) { setNote({ t: 'err', m: '✗ Inscription impossible : 8 caractères minimum pour le mot de passe.' }); return setBusy(false) }
      if (!/^\+?[0-9][0-9 ]{7,17}$/.test(phone.trim())) { setNote({ t: 'err', m: '✗ Inscription impossible : numéro WhatsApp invalide (ex. +221 77 000 00 00).' }); return setBusy(false) }
      const { data, error } = await sb.auth.signUp({ email, password: pw, options: { data: { full_name: name, phone }, emailRedirectTo: `${location.origin}/auth/callback` } })
      if (error) { setNote({ t: 'err', m: `✗ Inscription impossible : ${error.message}` }); return setBusy(false) }
      if (data.session) { setNote({ t: 'ok', m: '✓ Compte créé. Redirection…' }); setTimeout(() => { router.replace('/'); router.refresh() }, 900); return }
      setNote({ t: 'ok', m: '✓ Compte créé. Vérifiez votre e-mail pour confirmer, puis connectez-vous.' }); return setBusy(false)
    }
    const { error } = await sb.auth.resetPasswordForEmail(email, { redirectTo: `${location.origin}/auth/callback?next=/reset-password` })
    setNote(error ? { t: 'err', m: `✗ Envoi impossible : ${error.message}` } : { t: 'ok', m: '✓ Si cette adresse existe, un lien de réinitialisation vient d’être envoyé.' }); setBusy(false)
  }
  const title = mode === 'signup' ? 'Créer un compte élève' : mode === 'forgot' ? 'Mot de passe oublié' : 'Connexion'
  return (
    <div className="stage-wrap"><div className="stage">
      <svg className="blob" viewBox="0 0 1600 900" preserveAspectRatio="xMidYMid slice" aria-hidden="true"><path d="M0 0H640C600 110 500 150 420 240C340 330 330 440 230 520C150 585 70 600 0 640Z" /><path d="M1600 900V610C1520 690 1430 700 1380 780C1350 830 1310 870 1270 900Z" /></svg>
      <div className="hero hidden lg:flex flex-col justify-between">
        <div className="grid gap-5"><div style={{ width: 'fit-content', background: '#fff', borderRadius: 24, padding: 6 }}><Logo height={72} /></div>
          <p className="kick">Apprentissage du Code de la route</p><h2>La conduite accessible à tous.</h2>
          <p className="lead">Cours, entraînement avec correction immédiate et examens blancs pour préparer le Code de la route à votre rythme.</p>
          <div className="flex flex-wrap gap-3">{[['📚', 'Cours et parcours'], ['🎯', 'S’entraîner avec correction'], ['📝', 'Examens blancs'], ['🔊', 'Audio et accessibilité']].map(([i, l], k) => <span key={l} className="hpill" style={{ animationDelay: `${k * .6}s` }}><span aria-hidden="true">{i}</span>{l}</span>)}</div></div>
        <RoadScene /></div>
      <form onSubmit={submit} className="phone" aria-label={title}>
        <div className="notch" />
        <div className="grid gap-5 justify-items-center py-3">
          <Logo height={96} float />
          <p className="muted text-sm" style={{ letterSpacing: '.08em', textTransform: 'uppercase' }}>{title}</p>
          <div className="grid gap-4 w-full">
            {mode === 'signup' && <input className="input" placeholder="Nom complet" value={name} onChange={e => setName(e.target.value)} required autoComplete="name" />}
            {mode === 'signup' && <><input className="input" type="tel" placeholder="Numéro WhatsApp (+221 77 000 00 00)" value={phone} onChange={e => setPhone(e.target.value)} required autoComplete="tel" /><p className="muted text-xs" style={{ marginTop: -8 }}>Utilisé uniquement par l’auto-école pour vous contacter sur WhatsApp.</p></>}
            <input className="input" type="email" placeholder="E-mail" value={email} onChange={e => setEmail(e.target.value)} required autoComplete="email" />
            {mode !== 'forgot' && <input className="input" type="password" placeholder="Mot de passe" value={pw} onChange={e => setPw(e.target.value)} required autoComplete={mode === 'login' ? 'current-password' : 'new-password'} />}</div>
          <Toast note={note} onClose={() => setNote(null)} />
          <button className="btn" disabled={busy}>{busy ? 'Un instant…' : mode === 'login' ? 'Se connecter' : mode === 'signup' ? 'Créer mon compte' : 'Envoyer le lien'}</button>
          <div className="grid gap-2 justify-items-center">{mode === 'login' && <button type="button" className="link" style={{ textDecoration: 'underline', color: 'var(--muted)' }} onClick={() => { setMode('forgot'); setNote(null) }}>Mot de passe oublié ?</button>}
            {mode !== 'login' && <button type="button" className="link" onClick={() => { setMode('login'); setNote(null) }}>← Retour à la connexion</button>}</div></div>
        <div className="grid gap-3 justify-items-center">{mode === 'login' && <p className="muted text-sm">Pas encore de compte ? <button type="button" className="link" style={{ textDecoration: 'underline' }} onClick={() => { setMode('signup'); setNote(null) }}>Créer un compte</button></p>}<div className="home" /></div>
      </form>
    </div></div>)
}
