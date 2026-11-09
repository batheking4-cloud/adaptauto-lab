import Link from 'next/link'
import Logo from '@/components/Logo'
export default function Done() {
  return <main className="min-h-screen grid place-items-center p-5"><div className="glass w-full max-w-md p-8 grid gap-5 justify-items-center text-center">
    <Logo height={80} float />
    <div style={{ width: 84, height: 84, borderRadius: '50%', display: 'grid', placeItems: 'center', fontSize: 40, color: '#fff', background: 'var(--accent)', boxShadow: '0 10px 26px color-mix(in srgb,var(--accent) 50%,transparent)', animation: 'pop .6s ease both' }} aria-hidden="true">✓</div>
    <h1 className="text-2xl font-semibold">Mot de passe modifié</h1><p className="muted">Votre mot de passe a bien été changé. Vous pouvez maintenant vous connecter avec le nouveau.</p>
    <Link href="/login" className="btn">Se connecter</Link></div></main>
}
