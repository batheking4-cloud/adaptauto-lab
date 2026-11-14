import TabBar from '@/components/TabBar'
export default function EleveLayout({ children }: { children: React.ReactNode }) {
  return <>{children}<TabBar items={[['Accueil', '/eleve', '🏠'], ['Cours', '/eleve/cours', '📖'], ['Examen blanc', '/eleve/examen-ecrit', '📝'], ['Résultats', '/eleve/resultats', '📊']]} more={[['S’entraîner (correction immédiate)', '/eleve/s-entrainer'], ['Mes parcours', '/eleve/parcours'], ['Mes erreurs', '/eleve/erreurs']]} /></>
}
