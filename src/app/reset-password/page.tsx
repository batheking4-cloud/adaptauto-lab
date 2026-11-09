'use client'
import { useEffect, useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import Logo from '@/components/Logo'
export default function Reset() {
  const router = useRouter(); const sb = createClient()
  const [st, setSt] = useState<'check' | 'ready' | 'invalid'>('check'); const [pw, setPw] = useState(''); const [pw2, setPw2] = useState(''); const [err, setErr] = useState(''); const [busy, setBusy] = useState(false)
  useEffect(() => {
    sb.auth.getSession().then(({ data }) => { if (data.session) setSt('ready'); else setTimeout(() => setSt(s => s === 'check' ? 'invalid' : s), 1500) })
    const { data: sub } = sb.auth.onAuthStateChange((e, s) => { if (e === 'PASSWORD_RECOVERY' || s) setSt('ready') })
    return () => sub.subscription.unsubscribe()
  }, [])
  async function submit(e: React.FormEvent) {
    e.preventDefault(); setErr('')
    if (pw.length < 8) return setErr('Au moins 8 caractères.'); if (pw !== pw2) return setErr('Les deux mots de passe ne sont pas identiques.')
    setBusy(true); const { error } = await sb.auth.updateUser({ password: pw })
    if (error) { setBusy(false); return setErr(error.message) }
    await sb.auth.signOut(); router.replace('/mot-de-passe-modifie')
  }
  return (
    <main className="min-h-screen grid place-items-center p-5"><div className="glass w-full max-w-md p-8 grid gap-5 justify-items-center text-center">
      <Logo height={80} float />
      {st === 'check' && <p className="muted">Vérification du lien…</p>}
      {st === 'invalid' && <><h1 className="text-2xl font-semibold">Lien expiré ou invalide</h1><p className="muted">Ouvrez le lien dans le même navigateur que celui où vous avez fait la demande, ou demandez un nouveau lien.</p><Link href="/login" className="btn">Retour à la connexion</Link></>}
      {st === 'ready' && <form onSubmit={submit} className="grid gap-4 w-full text-left"><h1 className="text-2xl font-semibold text-center">Nouveau mot de passe</h1>
        <input className="input" type="password" placeholder="Nouveau mot de passe" value={pw} onChange={e => setPw(e.target.value)} required autoComplete="new-password" />
        <input className="input" type="password" placeholder="Confirmer le mot de passe" value={pw2} onChange={e => setPw2(e.target.value)} required autoComplete="new-password" />
        {err && <p role="alert" style={{ color: '#ff6b6b' }} className="text-sm">{err}</p>}<button className="btn" disabled={busy}>{busy ? 'Un instant…' : 'Enregistrer'}</button>
        <Link href="/login" className="back" style={{ justifySelf: 'center' }}>← Retour</Link></form>}
    </div></main>)
}
