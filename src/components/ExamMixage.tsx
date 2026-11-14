'use client'
import { useMemo, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
type Media = { id: string; name: string; path: string }
type Q = { id: string; pos: number; label: string; image: string | null; audio_id: string | null; statement: string }
type Slide = { n: number; series: string; status: string; expected: number; quiz: { id: string; intro_text: string; audio_id: string | null } | null; qs: Q[] }
type Other = { id: string; name: string; path: string; used: boolean }
const MIME: Record<string, string> = { mp3: 'audio/mpeg', wav: 'audio/wav', m4a: 'audio/mp4' }
function Slot({ label, m, busy, base, onPick, onDel }: { label: string; m: Media | null; busy: boolean; base: string; onPick: (f?: File) => void; onDel: () => void }) {
  return (<div className="grid gap-2" style={{ padding: 12, borderRadius: 18, boxShadow: 'var(--in)' }}>
    <div className="flex justify-between items-center gap-2 flex-wrap"><span className="text-sm font-semibold">{label}</span><span className="text-xs" style={{ color: m ? '#30d158' : '#ff9f0a' }}>{m ? '● Audio associé' : '● Sans audio'}</span></div>
    {m && <><p className="text-sm muted" style={{ wordBreak: 'break-all' }}>📎 {m.name}</p><audio controls preload="none" src={base + m.path} style={{ width: '100%' }} /></>}
    <div className="flex gap-2 flex-wrap"><label className="btn btn-ghost" style={{ cursor: busy ? 'wait' : 'pointer', opacity: busy ? .5 : 1 }}>{busy ? 'Envoi en cours…' : m ? 'Remplacer l’audio' : 'Ajouter un audio'}
      <input type="file" hidden accept=".mp3,.wav,.m4a,audio/mpeg,audio/wav,audio/mp4" disabled={busy} onChange={e => { onPick(e.target.files?.[0]); e.target.value = '' }} /></label>
      {m && <button type="button" className="btn-danger" disabled={busy} onClick={onDel}>Supprimer</button>}</div></div>)
}
export default function ExamMixage({ slides: s0, media: m0, others: o0 }: { slides: Slide[]; media: Record<string, Media>; others: Other[] }) {
  const sb = createClient(); const base = `${process.env.NEXT_PUBLIC_SUPABASE_URL}/storage/v1/object/public/media/`
  const [slides, setSlides] = useState(s0), [media, setMedia] = useState(m0), [others, setOthers] = useState(o0)
  const [only, setOnly] = useState(false), [msg, setMsg] = useState(''), [busy, setBusy] = useState('')
  const setQ = (n: number, id: string, p: Partial<Q>) => setSlides(a => a.map(s => s.n !== n ? s : { ...s, qs: s.qs.map(q => q.id === id ? { ...q, ...p } : q) }))
  const setQuiz = (n: number, p: Partial<NonNullable<Slide['quiz']>>) => setSlides(a => a.map(s => s.n !== n || !s.quiz ? s : { ...s, quiz: { ...s.quiz, ...p } }))
  async function cleanup(mid: string) {
    const [a, b] = await Promise.all([sb.from('questions').select('id', { count: 'exact', head: true }).or(`audio_id.eq.${mid},correction_audio_id.eq.${mid}`), sb.from('quizzes').select('id', { count: 'exact', head: true }).or(`intro_audio_id.eq.${mid},outro_audio_id.eq.${mid}`)])
    if ((a.count ?? 0) === 0 && (b.count ?? 0) === 0) { const m = media[mid]; if (m) await sb.storage.from('media').remove([m.path]); await sb.from('media').delete().eq('id', mid); setMedia(x => { const y = { ...x }; delete y[mid]; return y }) }
  }
  async function attach(key: string, file: File | undefined, kind: 'q' | 'z', n: number, id: string, old: string | null) {
    if (!file) return; setMsg(''); const ext = file.name.split('.').pop()?.toLowerCase() ?? ''
    if (!MIME[ext]) return setMsg(`« ${file.name} » : format non accepté (MP3, WAV ou M4A).`)
    if (file.size > 25 * 1024 * 1024) return setMsg(`« ${file.name} » dépasse 25 Mo.`)
    if (ext === 'm4a' && !document.createElement('audio').canPlayType('audio/mp4')) setMsg('Ce navigateur ne lit peut-être pas les M4A : préférez le MP3 si l’écoute échoue.')
    setBusy(key)
    try {
      const path = `exam-audio/${crypto.randomUUID()}.${ext}`
      const up = await sb.storage.from('media').upload(path, file, { contentType: MIME[ext] }); if (up.error) throw up.error
      const ins = await sb.from('media').insert({ kind: 'audio', name: file.name, path, text_content: '', usage: 'examen' }).select('id, name, path').single(); if (ins.error) throw ins.error
      const m = ins.data as Media
      const upd = kind === 'q' ? await sb.from('questions').update({ audio_id: m.id }).eq('id', id) : await sb.from('quizzes').update({ intro_audio_id: m.id }).eq('id', id)
      if (upd.error) { await sb.storage.from('media').remove([path]); await sb.from('media').delete().eq('id', m.id); throw upd.error }
      setMedia(x => ({ ...x, [m.id]: m })); if (kind === 'q') setQ(n, id, { audio_id: m.id }); else setQuiz(n, { audio_id: m.id })
      if (old) await cleanup(old)
    } catch (e: any) { setMsg(e?.message || 'Erreur pendant l’envoi du fichier.') }
    setBusy('')
  }
  async function detach(key: string, kind: 'q' | 'z', n: number, id: string, old: string | null) {
    if (!old || !confirm('Supprimer cet audio ? La question ou l’énoncé restera disponible en texte.')) return; setBusy(key); setMsg('')
    const r = kind === 'q' ? await sb.from('questions').update({ audio_id: null }).eq('id', id) : await sb.from('quizzes').update({ intro_audio_id: null }).eq('id', id)
    if (r.error) setMsg(r.error.message); else { if (kind === 'q') setQ(n, id, { audio_id: null }); else setQuiz(n, { audio_id: null }); await cleanup(old) }
    setBusy('')
  }
  const saveText = async (kind: 'q' | 'z', id: string, v: string) => { const r = kind === 'q' ? await sb.from('questions').update({ statement_text: v }).eq('id', id) : await sb.from('quizzes').update({ intro_text: v }).eq('id', id); if (r.error) setMsg(r.error.message) }
  async function delOther(o: Other) { if (!confirm(`Supprimer « ${o.name} » ? ${o.used ? 'Il est encore utilisé : il sera retiré des contenus liés.' : ''}`)) return; await sb.storage.from('media').remove([o.path]); const r = await sb.from('media').delete().eq('id', o.id); if (r.error) return setMsg(r.error.message); setOthers(a => a.filter(x => x.id !== o.id)) }
  const st = useMemo(() => { let expected = 0, added = 0, pending = 0
    for (const s of slides) { if (!s.quiz) { pending += 1 + s.expected; continue } expected += 1 + s.qs.length; added += (s.quiz.audio_id ? 1 : 0) + s.qs.filter(q => q.audio_id).length; pending += Math.max(0, s.expected - s.qs.length) }
    return { expected, added, missing: expected - added, pending, pct: expected ? Math.round(100 * added / expected) : 0 } }, [slides])
  const info = (s: Slide) => { if (!s.quiz) return { label: 'Indisponible', col: '#8e8e93', a: 0, t: 0 }; const t = 1 + s.qs.length, a = (s.quiz.audio_id ? 1 : 0) + s.qs.filter(q => q.audio_id).length
    return { label: a === 0 ? 'Sans audio' : a === t ? (s.qs.length < s.expected ? 'Complet (questions manquantes)' : 'Complet') : 'Incomplet', col: a === t ? '#30d158' : a === 0 ? '#ff453a' : '#ff9f0a', a, t } }
  return (<div className="grid gap-5">
    <div className="glass p-5 grid gap-2"><p className="font-semibold">Comment ça marche ?</p>
      <p className="muted text-sm" style={{ lineHeight: 1.6 }}>Les questions viennent directement de la rubrique <b>Examen blanc</b> : rien n’est recopié. Chaque diapositive et chaque question a son propre emplacement audio, relié à son identifiant : modifier un texte ne casse jamais l’association. Générez la voix sur ElevenLabs, téléchargez le fichier (MP3, WAV ou M4A), puis ajoutez-le ici.</p>
      <p className="text-sm" style={{ color: '#ff9f0a', lineHeight: 1.6 }}>Important : les énoncés de l’examen écrit sont des <b>images</b> (vos diapositives). Le texte exact se lit dans l’image affichée ; aucun texte séparé n’est enregistré. Vous pouvez saisir ou coller le texte à faire lire dans le champ prévu : il est relié à la question et s’affiche à l’élève sous l’image.</p></div>
    <div className="glass p-5 grid gap-3"><div className="flex justify-between items-baseline gap-3 flex-wrap"><p className="font-semibold">Avancement des audios</p><span className="text-2xl font-semibold">{st.pct} %</span></div>
      <div className="pbar"><i style={{ width: `${st.pct}%` }} /></div>
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-center"><div><p className="muted text-xs">Audios attendus</p><b className="text-xl">{st.expected}</b></div><div><p className="muted text-xs">Ajoutés</p><b className="text-xl" style={{ color: '#30d158' }}>{st.added}</b></div><div><p className="muted text-xs">Sans audio</p><b className="text-xl" style={{ color: '#ff9f0a' }}>{st.missing}</b></div><div><p className="muted text-xs">En attente de fichiers</p><b className="text-xl">{st.pending}</b></div></div>
      <label className="flex items-center gap-2 text-sm"><input type="checkbox" checked={only} onChange={e => setOnly(e.target.checked)} style={{ width: 20, height: 20 }} /> Afficher seulement ce qui n’a pas encore d’audio</label></div>
    {msg && <p role="alert" className="glass p-3" style={{ color: '#ff6b6b' }}>{msg}</p>}
    <div className="grid gap-3">{slides.filter(s => !only || !s.quiz || info(s).a < info(s).t).map(s => { const i = info(s)
      return (<details key={s.n + (only ? 'o' : '')} className="glass p-4" open={only}><summary className="flex justify-between items-center gap-3 flex-wrap cursor-pointer"><span className="font-semibold text-lg">Diapositive {String(s.n).padStart(2, '0')} <span className="muted text-sm font-normal">· série {s.series}</span></span>
        <span className="text-sm" style={{ color: i.col }}>● {i.label}{s.quiz ? ` · ${i.a}/${i.t}` : ''}</span></summary>
        {!s.quiz ? <p className="muted text-sm mt-3">Indisponible : le fichier de questions de cette diapositive n’a pas encore été reçu. Aucun emplacement n’est créé tant que rien n’est importé.</p> : (<div className="grid gap-4 mt-4">
          <div className="grid gap-3"><p className="font-semibold">Énoncé de la diapositive</p>
            <textarea className="input" rows={2} defaultValue={s.quiz.intro_text} placeholder="Texte de l’énoncé (facultatif). Aucun énoncé écrit n’existe dans le fichier source : saisissez-le ici si vous voulez le faire lire." onBlur={e => e.target.value !== s.quiz!.intro_text && (setQuiz(s.n, { intro_text: e.target.value }), saveText('z', s.quiz!.id, e.target.value))} />
            <Slot label="Audio de l’énoncé de la diapositive" m={s.quiz.audio_id ? media[s.quiz.audio_id] ?? null : null} busy={busy === 'z' + s.n} base={base} onPick={f => attach('z' + s.n, f, 'z', s.n, s.quiz!.id, s.quiz!.audio_id)} onDel={() => detach('z' + s.n, 'z', s.n, s.quiz!.id, s.quiz!.audio_id)} /></div>
          {s.qs.filter(q => !only || !q.audio_id).map(q => (<div key={q.id} className="grid gap-3 sm:grid-cols-[minmax(0,260px)_1fr]" style={{ paddingTop: 12, borderTop: '1px solid var(--line)' }}>
            {q.image ? <a href={q.image} target="_blank" rel="noreferrer" aria-label={`Agrandir ${q.label}`}><img src={q.image} alt={q.label} loading="lazy" style={{ width: '100%', borderRadius: 14 }} /></a> : <span />}
            <div className="grid gap-2 content-start"><p className="font-semibold">{q.label}</p>
              <textarea className="input" rows={2} defaultValue={q.statement} placeholder="Texte de la question (facultatif) : collez ici le texte exact à faire lire" onBlur={e => e.target.value !== q.statement && (setQ(s.n, q.id, { statement: e.target.value }), saveText('q', q.id, e.target.value))} />
              <Slot label="Audio de la question" m={q.audio_id ? media[q.audio_id] ?? null : null} busy={busy === q.id} base={base} onPick={f => attach(q.id, f, 'q', s.n, q.id, q.audio_id)} onDel={() => detach(q.id, 'q', s.n, q.id, q.audio_id)} /></div></div>))}
          {s.qs.length < s.expected && <p className="text-sm" style={{ color: '#ff9f0a' }}>⚠ Questions {s.qs.length + 1} à {s.expected} : fichiers non reçus, en attente (aucun emplacement créé).</p>}</div>)}</details>) })}</div>
    {others.length > 0 && <div className="glass p-5 grid gap-3"><p className="font-semibold">Autres fichiers audio (hors examen écrit)</p><p className="muted text-sm">Anciens audios : ils continuent de fonctionner là où ils sont utilisés.</p>
      {others.map(o => <div key={o.id} className="grid gap-2" style={{ paddingTop: 10, borderTop: '1px solid var(--line)' }}><div className="flex justify-between gap-2 flex-wrap"><span className="text-sm" style={{ wordBreak: 'break-all' }}>📎 {o.name}</span><span className="text-xs" style={{ color: o.used ? '#30d158' : '#ff9f0a' }}>{o.used ? '● Utilisé' : '● Non associé'}</span></div>
        <audio controls preload="none" src={base + o.path} style={{ width: '100%' }} /><button type="button" className="btn-danger" style={{ width: 'fit-content' }} onClick={() => delOther(o)}>Supprimer</button></div>)}</div>}
  </div>)
}
