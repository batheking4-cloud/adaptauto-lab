import { requireRole } from '@/lib/auth'
import PracticeSetup from '@/components/PracticeSetup'
export default async function Page() {
  const { sb } = await requireRole('student')
  const { data } = await sb.rpc('practice_options')
  return <PracticeSetup opts={(data as any) ?? { bank_total: 0, categories: [], slides: [] }} />
}
