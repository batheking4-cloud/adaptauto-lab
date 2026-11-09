import { requireRole } from '@/lib/auth'
import Shell from '../Shell'
export default async function Eleve() {
  const { profile } = await requireRole('student')
  const items = [['Mes parcours','phase 4'],['Mes cours','phase 4'],['Mes mini-jeux','phase 3'],['Mes quiz','phase 3'],['Mes examens blancs','phase 6'],['Mes résultats','phase 6'],['Ma progression','phase 4'],['Mes erreurs','phase 3']].map(([label, phase]) => ({ label, phase }))
  return <Shell title="Mon espace" name={profile.full_name} items={items} />
}
