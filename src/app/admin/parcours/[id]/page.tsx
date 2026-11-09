import { notFound } from 'next/navigation'
import { requireRole } from '@/lib/auth'
import { savePath } from '../../parcoursActions'
import PathForm from './PathForm'
export default async function EditPath({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params; const { sb } = await requireRole('admin')
  let path: any = { id: '', title: '', description: '' }; let steps: any[] = []
  if (id !== 'new') { const { data } = await sb.from('paths').select('id, title, description').eq('id', id).single(); if (!data) notFound(); path = data
    const { data: s } = await sb.from('path_steps').select('*').eq('path_id', id).order('position'); steps = s ?? [] }
  const { data: quizzes } = await sb.from('quizzes').select('id, title, kind').order('title')
  return <PathForm path={path} initial={steps} quizzes={quizzes ?? []} action={savePath} />
}
