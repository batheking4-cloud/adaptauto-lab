import { redirect } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'
import Player, { type Quiz } from '@/components/Player'
export default async function Jouer({ params, searchParams }: { params: Promise<{ id: string }>; searchParams: Promise<{ apercu?: string }> }) {
  const { id } = await params; const { apercu } = await searchParams
  const sb = await createClient(); const { data: { user } } = await sb.auth.getUser(); if (!user) redirect('/login')
  const { data, error } = await sb.rpc('get_quiz', { p_quiz: id })
  return <main className="max-w-2xl mx-auto p-5 pb-16 grid gap-4">
    <Link href="/eleve" className="link">← Mon espace</Link>
    {apercu && <p className="glass p-3 text-sm">Aperçu élève : voici exactement ce que verra un élève.</p>}
    {error || !data ? <p className="glass p-6" role="alert">{error?.message ?? 'Introuvable'}</p> : <Player quiz={data as Quiz} preview={!!apercu} />}
  </main>
}
