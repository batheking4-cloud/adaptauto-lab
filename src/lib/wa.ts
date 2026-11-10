// WhatsApp gratuit : simples liens wa.me, aucun envoi automatique, aucune API payante.
export const TEMPLATES: Record<string, { label: string; text: string }> = {
  bienvenue: { label: 'Bienvenue', text: 'Bonjour {prenom}, bienvenue sur ADAPT’AUTO LAB ! Connecte-toi ici pour commencer tes cours : {site}' },
  relance: { label: 'Relance (inactif)', text: 'Bonjour {prenom}, on ne t’a pas vu depuis un moment sur ADAPT’AUTO LAB. Une petite session de quiz aujourd’hui ? {site}' },
  felicitations: { label: 'Félicitations', text: 'Bravo {prenom} ! Tu progresses très bien sur ADAPT’AUTO LAB. Continue comme ça 💪' },
  examen: { label: 'Nouvel examen blanc', text: 'Bonjour {prenom}, un nouvel examen blanc est disponible sur ADAPT’AUTO LAB. Bonne chance ! {site}' },
  libre: { label: 'Message libre', text: '' },
}
export function waNumber(p?: string | null) {
  let d = (p || '').replace(/[^0-9]/g, ''); if (!d) return ''
  if (d.startsWith('00')) d = d.slice(2); else if (d.length === 9 && d.startsWith('7')) d = '221' + d
  return d.length >= 8 && d.length <= 15 ? d : ''
}
export const waLink = (p: string | null | undefined, text: string) => { const n = waNumber(p); return n ? `https://wa.me/${n}?text=${encodeURIComponent(text)}` : '' }
