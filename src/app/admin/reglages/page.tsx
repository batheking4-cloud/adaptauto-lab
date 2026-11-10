import { requireRole } from '@/lib/auth'
import { saveSettings } from '../actions'
import SettingsForm from './SettingsForm'
export default async function Reglages() {
  const { sb } = await requireRole('admin')
  const { data } = await sb.from('app_settings').select('mode, primary_color, whatsapp_number').eq('id', 1).single()
  return <SettingsForm mode={data?.mode === 'light' ? 'light' : 'dark'} color={data?.primary_color ?? '#0a84ff'} wa={data?.whatsapp_number ?? ''} action={saveSettings} />
}
