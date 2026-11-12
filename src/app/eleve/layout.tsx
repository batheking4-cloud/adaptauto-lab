import TabBar from '@/components/TabBar'
export default function EleveLayout({ children }: { children: React.ReactNode }) {
  return <>{children}<TabBar items={[['Accueil', '/eleve', '🏠'], ['Cours', '/eleve/cours', '📖'], ['Jouer', '/eleve/quiz', '🎮'], ['Résultats', '/eleve/resultats', '📊']]} more={[['Examen écrit (12 diapositives)', '/eleve/examen-ecrit'], ['Mes parcours', '/eleve/parcours'], ['Mes erreurs', '/eleve/erreurs']]} /></>
}
