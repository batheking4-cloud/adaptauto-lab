'use client'
import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
export default function Reset() {
  const router = useRouter(); const sb = createClient()
  const [pw, setPw] = useState(''); const [err, setErr] = useState('')
  async function submit(e: React.FormEvent) {
    e.preventDefault(); setErr('')
    if (pw.length < 8) return setErr('Au moins 8 caractères.')
    const { error } = await sb.auth.updateUser({ password: pw })
    if (error) return setErr(error.message)
    router.replace('/'); router.refresh()
  }
  return (
    <main className="min-h-screen grid place-items-center p-5">
      <form onSubmit={submit} className="glass w-full max-w-md p-7 grid gap-4">
        <h1 className="text-3xl font-semibold tracking-tight">Nouveau mot de passe</h1>
        <input className="input" type="password" placeholder="Nouveau mot de passe" value={pw} onChange={e => setPw(e.target.value)} required autoComplete="new-password" />
        {err && <p role="alert" style={{color:'#ff6b6b'}} className="text-sm">{err}</p>}
        <button className="btn">Enregistrer</button>
      </form>
    </main>
  )
}
