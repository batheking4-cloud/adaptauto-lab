export type Item = { label: string; phase: string }
export default function Shell({ title, name, items, children }: { title: string; name: string; items: Item[]; children?: React.ReactNode }) {
  return (
    <main className="max-w-5xl mx-auto p-5 pb-16 grid gap-5">
      <header className="flex items-center justify-between gap-3">
        <div><p style={{color:'var(--muted)'}} className="text-sm">ADAPT’AUTO LAB</p><h1 className="text-3xl font-semibold tracking-tight">{title}</h1><p style={{color:'var(--muted)'}}>Bonjour {name || 'à vous'}</p></div>
        <form action="/auth/signout" method="post"><button className="btn btn-ghost">Se déconnecter</button></form>
      </header>
      {children}
      <section className="grid gap-3 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3">
        {items.map(i => (
          <div key={i.label} className="glass p-5 opacity-70" aria-disabled="true">
            <h2 className="font-semibold">{i.label}</h2>
            <p style={{color:'var(--muted)'}} className="text-sm mt-1">Disponible en {i.phase}</p>
          </div>
        ))}
      </section>
    </main>
  )
}
