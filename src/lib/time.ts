export function toIso(raw: string | number | undefined): string {
  if (raw == null || raw === '') return new Date().toISOString()
  if (typeof raw === 'number') {
    const ms = raw < 1e12 ? raw * 1000 : raw
    const d = new Date(ms)
    return Number.isNaN(d.getTime()) ? new Date().toISOString() : d.toISOString()
  }
  const d = new Date(raw)
  return Number.isNaN(d.getTime()) ? new Date().toISOString() : d.toISOString()
}

export function formatStamp(iso: string): string {
  const d = new Date(iso)
  if (Number.isNaN(d.getTime())) return 'undated'
  const y = d.getUTCFullYear()
  const m = String(d.getUTCMonth() + 1).padStart(2, '0')
  const day = String(d.getUTCDate()).padStart(2, '0')
  const hh = String(d.getUTCHours()).padStart(2, '0')
  const mm = String(d.getUTCMinutes()).padStart(2, '0')
  return `${y}.${m}.${day} ${hh}:${mm}Z`
}

export function compareNewest(a: string, b: string): number {
  return new Date(b).getTime() - new Date(a).getTime()
}
