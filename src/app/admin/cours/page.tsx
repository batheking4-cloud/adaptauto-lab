import Link from 'next/link'
import { requireRole } from '@/lib/auth'
import { setChapterStatus } from '../coursActions'
const NAMES: Record<string, string> = { img: 'image', quiz: 'quiz', flip: 'cartes', def: 'définitions', tbl: 'tableau', cmp: 'comparaison', key: 'à retenir' }
const summary = (blocks: any[]) => { const c: Record<string, number> = {}; for (const b of blocks) c[b.t] = (c[b.t] || 0) + 1
  return Object.entries(NAMES).filter(([k]) => c[k]).map(([k, l]) => `${c[k]} ${l}${c[k] > 1 && k !== 'tbl' ? 's' : ''}`).join(' · ') }
export default async function CoursAdmin() {
  const { sb } = await requireRole('admin')
  const { data: ch } = await sb.from('course_chapters').select('*').order('position')
  const { data: se } = await sb.from('course_sections').select('id, chapter_id, position, title, est_minutes, blocks, admin_note').order('position')
  const pub = (ch ?? []).filter(c => c.status === 'published').length
  return (<>
    <div className="flex items-start justify-between gap-3 flex-wrap"><div><h1 className="text-3xl font-semibold tracking-tight">Cours (apprentissage)</h1>
      <p className="muted">{(ch ?? []).length} chapitres · {(se ?? []).length} leçons · {pub} publié{pub > 1 ? 's' : ''}. Les chapitres en brouillon ne sont visibles que par vous.</p></div>
      <div className="flex gap-2 flex-wrap"><form action={setChapterStatus}><input type="hidden" name="status" value="published" /><button className="btn" style={{ width: 'auto' }}>Tout publier</button></form>
        <form action={setChapterStatus}><input type="hidden" name="status" value="draft" /><button className="btn btn-ghost">Tout repasser en brouillon</button></form></div></div>
    {(ch ?? []).length === 0 && <p className="glass p-6 muted">Aucun cours importé. Exécutez le script <b>08_cours.sql</b> dans Supabase.</p>}
    {(ch ?? []).map(c => { const s = (se ?? []).filter(x => x.chapter_id === c.id)
      return (<details key={c.id} className="glass p-4" open><summary className="flex items-center justify-between gap-3 flex-wrap cursor-pointer">
        <span className="flex items-center gap-3"><span className="ico" aria-hidden="true">{c.icon}</span><span><b>{c.title}</b><br /><span className="muted text-sm">{c.summary}</span></span></span>
        <span className="text-sm" style={{ color: c.status === 'published' ? '#30d158' : '#ff9f0a' }}>{c.status === 'published' ? '● Publié' : '● Brouillon'}</span></summary>
        <div className="flex gap-2 flex-wrap mt-3">{s[0] && <Link href={`/eleve/cours/${c.id}/${s[0].id}`} className="btn btn-ghost">Aperçu élève</Link>}
          <form action={setChapterStatus}><input type="hidden" name="id" value={c.id} /><input type="hidden" name="status" value={c.status === 'published' ? 'draft' : 'published'} /><button className={c.status === 'published' ? 'btn btn-ghost' : 'btn'} style={c.status === 'published' ? {} : { width: 'auto' }}>{c.status === 'published' ? 'Repasser en brouillon' : 'Publier ce chapitre'}</button></form></div>
        <div className="grid gap-2 mt-3">{s.map((x, i) => (<div key={x.id} className="p-3" style={{ borderTop: '1px solid var(--line)' }}>
          <div className="flex justify-between gap-3 flex-wrap"><Link href={`/eleve/cours/${c.id}/${x.id}`} style={{ color: 'inherit', fontWeight: 600 }}>{i + 1}. {x.title}</Link><span className="muted text-sm">{x.est_minutes} min</span></div>
          <p className="muted text-xs">{(x.blocks as any[]).length} blocs · {summary(x.blocks as any[])}</p>
          {x.admin_note && <p className="text-xs" style={{ color: '#ff9f0a', marginTop: 4 }}>⚠ À vérifier : {x.admin_note}</p>}</div>))}</div></details>) })}</>)
}
