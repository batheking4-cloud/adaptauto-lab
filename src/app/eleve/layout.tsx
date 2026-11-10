import TabBar from '@/components/TabBar'
export default function EleveLayout({ children }: { children: React.ReactNode }) {
  return <>{children}<TabBar items={[['Accueil', '/eleve', '🏠'], ['Parcours', '/eleve/parcours', '🧭'], ['Jouer', '/eleve/quiz', '🎮'], ['Résultats', '/eleve/resultats', '📊']]} more={[['Mes erreurs', '/eleve/erreurs']]} /></>
}
