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

/** 武器のレアリティ（クオリティ）。武器突破素材を持つのは ★3〜★5。 */
export type WeaponQuality = 3 | 4 | 5

/** 武器突破素材のレアリティ。系列内で ★2〜★5。 */
export type WeaponMatRarity = 2 | 3 | 4 | 5

export type WeaponBreakCost = {
  rarity: WeaponMatRarity
  count: number
}

/**
 * 武器を突破段階 (Phase-1)→Phase に上げる時の素材表（同レアリティの武器なら共通）。
 * 公開データ（Wiki / 各種ガイド）に基づく。
 *   ★3武器: 2 / 2 / 4 / 2 / 4 / 3
 *   ★4武器: 3 / 3 / 6 / 3 / 6 / 4
 *   ★5武器: 5 / 5 / 9 / 5 / 9 / 6
 * Phase は 1〜6（Lv 20→40, 40→50, 50→60, 60→70, 70→80, 80→90）。
 */
export const WEAPON_BREAK_COSTS: Record<
  WeaponQuality,
  Record<number, WeaponBreakCost>
> = {
  3: {
    1: { rarity: 2, count: 2 },
    2: { rarity: 3, count: 2 },
    3: { rarity: 3, count: 4 },
    4: { rarity: 4, count: 2 },
    5: { rarity: 4, count: 4 },
    6: { rarity: 5, count: 3 },
  },
  4: {
    1: { rarity: 2, count: 3 },
    2: { rarity: 3, count: 3 },
    3: { rarity: 3, count: 6 },
    4: { rarity: 4, count: 3 },
    5: { rarity: 4, count: 6 },
    6: { rarity: 5, count: 4 },
  },
  5: {
    1: { rarity: 2, count: 5 },
    2: { rarity: 3, count: 5 },
    3: { rarity: 3, count: 9 },
    4: { rarity: 4, count: 5 },
    5: { rarity: 4, count: 9 },
    6: { rarity: 5, count: 6 },
  },
}

export const WEAPON_BREAK_MIN = 0
export const WEAPON_BREAK_MAX = 6

export function weaponBreakCost(
  quality: WeaponQuality,
  fromBreak: number,
  toBreak: number
): Record<WeaponMatRarity, number> {
  const result: Record<WeaponMatRarity, number> = { 2: 0, 3: 0, 4: 0, 5: 0 }
  if (fromBreak >= toBreak) return result
  const lo = Math.max(WEAPON_BREAK_MIN, Math.floor(fromBreak)) + 1
  const hi = Math.min(WEAPON_BREAK_MAX, Math.floor(toBreak))
  const table = WEAPON_BREAK_COSTS[quality]
  for (let b = lo; b <= hi; b++) {
    const c = table[b]
    if (!c) continue
    result[c.rarity] += c.count
  }
  return result
}
