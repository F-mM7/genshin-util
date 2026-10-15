export function fmt(value: number, digits = 0): string {
  if (!Number.isFinite(value)) return '-'
  return value.toLocaleString('ja-JP', {
    minimumFractionDigits: digits,
    maximumFractionDigits: digits,
  })
}
