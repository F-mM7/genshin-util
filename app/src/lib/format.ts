export function fmt(value: number, digits = 0): string {
  if (!Number.isFinite(value)) return '-'
  return value.toLocaleString('ja-JP', {
    minimumFractionDigits: digits,
    maximumFractionDigits: digits,
  })
}

export function signClass(value: number): string {
  if (!Number.isFinite(value)) return ''
  if (value > 0) return 'stat-pos'
  if (value < 0) return 'stat-neg'
  return ''
}
