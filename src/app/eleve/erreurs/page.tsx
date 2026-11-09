import { requireRole } from '@/lib/auth'
import Link from 'next/link'
import Player, { type Quiz } from '@/components/Player'
export default async function Erreurs() {
  const { sb } = await requireRole('student')
  const { data } = await sb.rpc('get_error_questions')
  const quiz: Quiz = { id: 'practice', kind: 'game', title: 'M’entraîner sur mes erreurs', intro_text: 'Retravaille les questions que tu as ratées. Une question réussie sort de cette liste.', outro_text: '', duration_min: null, pass_score: 0, questions: (data as Quiz['questions']) ?? [] }
  return <main className="max-w-2xl mx-auto p-5 pb-16 grid gap-4"><Link href="/eleve" className="link">← Mon espace</Link>
    {quiz.questions.length ? <Player quiz={quiz} practice /> : <p className="glass p-6">Aucune erreur à retravailler pour le moment. Continue comme ça !</p>}</main>
}
