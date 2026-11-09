import Link from 'next/link'
import Logo from '@/components/Logo'
export default function NotFound() {
  return <main className="min-h-screen grid place-items-center p-5"><div className="glass w-full max-w-md p-8 grid gap-5 justify-items-center text-center">
    <Logo height={80} /><h1 className="text-2xl font-semibold">Page introuvable</h1><p className="muted">Cette page n’existe pas ou a été déplacée.</p>
    <Link href="/" className="btn">Retour à l’accueil</Link></div></main>
}
