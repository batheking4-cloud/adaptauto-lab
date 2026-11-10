import { requireRole } from '@/lib/auth'
import Player, { type Quiz } from '@/components/Player'
export default async function Erreurs() {
  const { sb } = await requireRole('student')
  const { data } = await sb.rpc('get_error_questions'); const qs = (data as Quiz['questions']) ?? []
  if (!qs.length) return <main className="min-h-screen grid place-items-center p-5"><div className="glass p-8 text-center grid gap-4"><p>Aucune erreur à retravailler pour le moment. Continuez comme ça !</p><a href="/eleve" className="btn">Retour</a></div></main>
  return <Player practice back="/eleve" quiz={{ id: 'practice', kind: 'game', title: 'Mes erreurs', intro_text: 'Retravaillez les questions ratées. Une question réussie sort de cette liste.', outro_text: '', duration_min: null, pass_score: 0, questions: qs }} />
}
