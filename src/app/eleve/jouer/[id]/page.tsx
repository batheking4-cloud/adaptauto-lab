import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import Player, { type Quiz } from '@/components/Player'
export default async function Jouer({ params, searchParams }: { params: Promise<{ id: string }>; searchParams: Promise<{ apercu?: string }> }) {
  const { id } = await params; const { apercu } = await searchParams
  const sb = await createClient(); const { data: { user } } = await sb.auth.getUser(); if (!user) redirect('/login')
  const { data, error } = await sb.rpc('get_quiz', { p_quiz: id })
  if (error || !data) return <main className="min-h-screen grid place-items-center p-5"><div className="glass p-8 text-center grid gap-4"><p role="alert">{error?.message ?? 'Introuvable'}</p><a href="/eleve" className="btn">Retour</a></div></main>
  return <Player quiz={data as Quiz} preview={!!apercu} back={apercu ? '/admin' : '/eleve'} notice={apercu ? 'Aperçu élève : rien n’est enregistré' : undefined} />
}
