import type { TalentRarity, WeaponMatRarity } from './materials'

// 秘境IV（1周=天然樹脂20）のドロップを確率モデル化し、n周分の獲得数の同時分布を返す。
// ドロップ率は推定値。根拠と推定方法は docs/domain-drop-rates.md を参照。
// モデル: 1周 = 固定の★2（個数に揺れあり）+ 追加枠（枠数に揺れあり）。
//         各追加枠は独立に上位レアリティのいずれか1個になる。周回同士は独立。

export type DropOutcome<R extends number> = { counts: Record<R, number>; p: number }

type DropModel<R extends number> = {
  rarities: readonly R[]
  /** 固定ドロップのレアリティ */
  baseRarity: R
  /** 固定ドロップの個数分布 [個数, 確率] */
  baseCounts: readonly (readonly [number, number])[]
  /** 追加枠の枠数分布 [枠数, 確率] */
  slotCounts: readonly (readonly [number, number])[]
  /** 1枠あたりのレアリティ分布 [レアリティ, 確率] */
  slotRarities: readonly (readonly [R, number])[]
}

/** 天賦IV: ★2 2個80%/3個20% + 2枠80%/3枠20%、各枠 ★3 90% / ★4 10%。 */
const TALENT_MODEL: DropModel<TalentRarity> = {
  rarities: [2, 3, 4],
  baseRarity: 2,
  baseCounts: [[2, 0.8], [3, 0.2]],
  slotCounts: [[2, 0.8], [3, 0.2]],
  slotRarities: [[3, 0.9], [4, 0.1]],
}

/** 武器IV: ★2 2個80%/3個20% + 2枠10%/3枠70%/4枠20%（枠数は仮定）、各枠 ★3 78% / ★4 20% / ★5 2%。 */
const WEAPON_MODEL: DropModel<WeaponMatRarity> = {
  rarities: [2, 3, 4, 5],
  baseRarity: 2,
  baseCounts: [[2, 0.8], [3, 0.2]],
  slotCounts: [[2, 0.1], [3, 0.7], [4, 0.2]],
  slotRarities: [[3, 0.78], [4, 0.2], [5, 0.02]],
}

// 同じ counts を1要素にまとめるため、counts を rarities 順の個数配列として扱う。
type Dist = Map<string, { vec: number[]; p: number }>

function addTo(dist: Dist, vec: number[], p: number) {
  const key = vec.join(',')
  const cur = dist.get(key)
  if (cur) cur.p += p
  else dist.set(key, { vec, p })
}

// 1周分の同時分布
function oneRun<R extends number>(model: DropModel<R>): Dist {
  const idx = (r: R) => model.rarities.indexOf(r)
  // 追加枠 k 枠分の分布を枠ごとに積み上げる
  let slots: Dist = new Map([[model.rarities.map(() => 0).join(','), { vec: model.rarities.map(() => 0), p: 1 }]])
  const bySlotCount: Dist[] = [slots]
  const maxSlots = Math.max(...model.slotCounts.map(([k]) => k))
  for (let k = 1; k <= maxSlots; k++) {
    const next: Dist = new Map()
    for (const { vec, p } of slots.values()) {
      for (const [r, q] of model.slotRarities) {
        const v = vec.slice()
        v[idx(r)] += 1
        addTo(next, v, p * q)
      }
    }
    slots = next
    bySlotCount.push(slots)
  }
  const result: Dist = new Map()
  const b = idx(model.baseRarity)
  for (const [baseN, baseP] of model.baseCounts) {
    for (const [k, slotP] of model.slotCounts) {
      for (const { vec, p } of bySlotCount[k].values()) {
        const v = vec.slice()
        v[b] += baseN
        addTo(result, v, baseP * slotP * p)
      }
    }
  }
  return result
}

function convolve(a: Dist, b: Dist): Dist {
  const result: Dist = new Map()
  for (const x of a.values()) {
    for (const y of b.values()) {
      addTo(result, x.vec.map((n, i) => n + y.vec[i]), x.p * y.p)
    }
  }
  return result
}

// runs 周分の分布を返す。runs ごとにメモ化。
function makeDomainDrops<R extends number>(model: DropModel<R>) {
  const zero: Dist = new Map([[model.rarities.map(() => 0).join(','), { vec: model.rarities.map(() => 0), p: 1 }]])
  const memo: Dist[] = [zero]
  let single: Dist | null = null
  return (runs: number): DropOutcome<R>[] => {
    const n = Math.max(0, Math.floor(runs))
    if (!single) single = oneRun(model)
    while (memo.length <= n) memo.push(convolve(memo[memo.length - 1], single))
    return Array.from(memo[n].values(), ({ vec, p }) => {
      const counts = {} as Record<R, number>
      model.rarities.forEach((r, i) => (counts[r] = vec[i]))
      return { counts, p }
    })
  }
}

/** 天賦IV秘境を runs 周(1周=天然樹脂20)したときの、レアリティ別獲得数の同時分布。runs=0 は {counts:全0, p:1} の1要素。p の総和は1。 */
const talentDrops = makeDomainDrops(TALENT_MODEL)
export function talentDomainDrops(runs: number): DropOutcome<TalentRarity>[] {
  return talentDrops(runs)
}

/** 武器IV秘境を runs 周したときの同時分布(★2〜★5)。 */
const weaponDrops = makeDomainDrops(WEAPON_MODEL)
export function weaponDomainDrops(runs: number): DropOutcome<WeaponMatRarity>[] {
  return weaponDrops(runs)
}

export const DOMAIN_RUNS = [0, 1, 2, 3] as const
