import Link from 'next/link'
import Logo from '@/components/Logo'
export default function Invalid() {
  return <main className="min-h-screen grid place-items-center p-5"><div className="glass w-full max-w-md p-8 grid gap-5 justify-items-center text-center">
    <Logo height={80} /><h1 className="text-2xl font-semibold">Lien expiré ou déjà utilisé</h1>
    <p className="muted">Ce lien n’est plus valable. Ouvrez-le dans le navigateur où vous avez fait la demande, ou demandez-en un nouveau depuis « Mot de passe oublié ».</p>
    <Link href="/login" className="btn">Retour à la connexion</Link></div></main>
}
