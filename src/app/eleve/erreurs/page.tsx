import { requireRole } from '@/lib/auth'
import Player, { type Quiz } from '@/components/Player'
export default async function Erreurs({ searchParams }: { searchParams: Promise<{ quiz?: string }> }) {
  const { quiz } = await searchParams
  const { sb } = await requireRole('student')
  const { data } = await sb.rpc('get_error_questions', quiz ? { p_quiz: quiz } : {}); const qs = (data as Quiz['questions']) ?? []
  const back = quiz ? '/eleve/examen-ecrit' : '/eleve'
  if (!qs.length) return <main className="min-h-screen grid place-items-center p-5"><div className="glass p-8 text-center grid gap-4"><p>Aucune erreur à retravailler pour le moment. Continuez comme ça !</p><a href={back} className="btn">Retour</a></div></main>
  return <Player practice back={back} quiz={{ id: 'practice', kind: 'game', title: 'Mes erreurs', intro_text: 'Retravaillez uniquement les questions ratées. Une question réussie sort de cette liste.', outro_text: '', duration_min: null, pass_score: 0, questions: qs }} />
}
