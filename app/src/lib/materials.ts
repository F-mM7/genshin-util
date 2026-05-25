export type TalentRarity = 2 | 3 | 4

export type TalentLevelCost = {
  /** その天賦レベルに上げる時の素材レアリティ (★) */
  rarity: TalentRarity
  /** 必要数 */
  count: number
}

/**
 * 天賦をレベル(L-1)→Lに上げる時の素材表 (キャラ1人分)。
 * Excel「天賦」シートの I/J/K/L 列をベースに復元。
 */
export const TALENT_LEVEL_COSTS: Record<number, TalentLevelCost> = {
  2: { rarity: 2, count: 3 },
  3: { rarity: 3, count: 2 },
  4: { rarity: 3, count: 4 },
  5: { rarity: 3, count: 6 },
  6: { rarity: 3, count: 9 },
  7: { rarity: 4, count: 4 },
  8: { rarity: 4, count: 6 },
  9: { rarity: 4, count: 12 },
  10: { rarity: 4, count: 16 },
}

export const TALENT_MIN = 1
export const TALENT_MAX = 10

export function talentCost(
  fromLv: number,
  toLv: number,
  count = 1
): Record<TalentRarity, number> {
  const result: Record<TalentRarity, number> = { 2: 0, 3: 0, 4: 0 }
  if (fromLv >= toLv) return result
  const lo = Math.max(TALENT_MIN, Math.floor(fromLv)) + 1
  const hi = Math.min(TALENT_MAX, Math.floor(toLv))
  for (let lv = lo; lv <= hi; lv++) {
    const c = TALENT_LEVEL_COSTS[lv]
    if (!c) continue
    result[c.rarity] += c.count * count
  }
  return result
}
