export default function Logo({ height = 48, float = false }: { height?: number; float?: boolean }) {
  return <span className={`logo-wrap${float ? ' logo-float' : ''}`}><img src="/logo.png" alt="ADAPT’AUTO – La conduite accessible à tous" style={{ height, width: 'auto', maxWidth: '100%', objectFit: 'contain', display: 'block' }} /></span>
}
