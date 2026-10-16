// 合成元として1つ下のレアリティを消費する個数
export const SYNTH_COST = 3
export const SYNTH_AMOUNTS = [1, 2]

// lowest より上のレアリティのみ合成できる
export const lowerRarity = <R extends number>(r: R, lowest: R): R | null =>
  r > lowest ? ((r - 1) as R) : null

export const canSynth = <R extends number>(
  owned: Record<R, number>,
  r: R,
  lowest: R
) => {
  const lo = lowerRarity(r, lowest)
  return lo != null && owned[lo] >= SYNTH_COST
}

// 1つ下のレアリティを SYNTH_COST 個消費して r を n 個増やす。合成できなければ null
export const synthesize = <R extends number>(
  owned: Record<R, number>,
  r: R,
  n: number,
  lowest: R
): Record<R, number> | null => {
  const lo = lowerRarity(r, lowest)
  if (lo == null || !canSynth(owned, r, lowest)) return null
  return { ...owned, [r]: owned[r] + n, [lo]: owned[lo] - SYNTH_COST }
}
