import { binomialPMF } from './probability'
import type { TalentRarity, WeaponMatRarity } from './materials'

// 秘境IVを 0〜maxRuns 周したときの全レアリティ同時充足確率を、周回数ごとに返す。
// n 周の同時ドロップ分布を全展開せずに計算する。
//
// モデル: 1周 = 最下位レアリティの固定ドロップ + 追加枠。各枠は独立に上位レアリティの
// いずれか1個。周回同士は独立。よって n 周では
//   B = 固定ドロップ総数, S = 追加枠総数 (B と S は独立)
//   S が決まれば上位レアリティの個数は多項分布 = 低い方から順に条件付き二項分布:
//     D_j ~ Bin(残り枠 R, p_j / Σ_{k≥j} p_k), 残り枠 R ← R - D_j
// 合成モデル: 段の余り s = 所持 + ドロップ + 下位からの繰上獲得 - 必要。s < 0 なら不成立。
//   上位への獲得 = n + K (n = floor(s/3), K ~ Bin(n, 0.1))。最上位は s >= 0 で成立。
// 最下位から1段ずつ、状態 (余り s, 残り枠 R) → (繰上獲得 c, 残り枠 R) の DP で進める。
// 最悪(以降のドロップ0・全段 K=0)でも成立なら確率1、最良(以降の各段に残り枠すべて・全段 K=n)でも
// 不成立なら確率0 として打ち切る。

type Model = {
  /** 固定ドロップの個数分布 [個数, 確率] */
  baseCounts: readonly (readonly [number, number])[]
  /** 追加枠の枠数分布 [枠数, 確率] */
  slotCounts: readonly (readonly [number, number])[]
  /** 1枠あたりのレアリティ分布。昇順レアリティの2番目以降に対応する確率 */
  slotProbs: readonly number[]
}

const TALENT_MODEL: Model = {
  baseCounts: [[2, 0.8], [3, 0.2]],
  slotCounts: [[2, 0.8], [3, 0.2]],
  slotProbs: [0.9, 0.1],
}

const WEAPON_MODEL: Model = {
  baseCounts: [[2, 0.8], [3, 0.2]],
  slotCounts: [[2, 0.1], [3, 0.7], [4, 0.2]],
  slotProbs: [0.78, 0.2, 0.02],
}

const BONUS_P = 0.1

/** 周回数上限入力の最大値 */
export const MAX_RUNS_LIMIT = 40

const TALENT_ASC: readonly TalentRarity[] = [2, 3, 4]
const WEAPON_ASC: readonly WeaponMatRarity[] = [2, 3, 4, 5]

const bonusCache = new Map<number, number[]>()
function bonusPMF(n: number): number[] {
  let v = bonusCache.get(n)
  if (!v) {
    v = binomialPMF(n, BONUS_P)
    bonusCache.set(n, v)
  }
  return v
}

// 1周の個数分布 pairs を 0..maxRuns 周分たたみ込んだ分布の列。dists[n][x] = P(n 周の総数 = x)
function runDists(pairs: Model['baseCounts'], maxRuns: number): Float64Array[] {
  const one = new Float64Array(Math.max(...pairs.map(([k]) => k)) + 1)
  for (const [k, p] of pairs) one[k] += p
  const dists = [Float64Array.of(1)]
  for (let n = 1; n <= maxRuns; n++) {
    const prev = dists[n - 1]
    const next = new Float64Array(prev.length + one.length - 1)
    for (let a = 0; a < prev.length; a++) {
      const pa = prev[a]
      if (pa === 0) continue
      for (let b = 0; b < one.length; b++) next[a + b] += pa * one[b]
    }
    dists.push(next)
  }
  return dists
}

function makeByRuns(model: Model) {
  const m = model.slotProbs.length + 1
  const top = m - 1
  // ratios[j]: 段 j(1..top-1) の、残り枠に対する条件付き確率
  const ratios: number[] = [0]
  for (let j = 1; j < top; j++) {
    let rest = 0
    for (let k = j - 1; k < model.slotProbs.length; k++) rest += model.slotProbs[k]
    ratios.push(model.slotProbs[j - 1] / rest)
  }
  // splitCache[j][R] = Bin(R, ratios[j]) の pmf
  const splitCache: number[][][] = ratios.map(() => [])
  const splitPMF = (j: number, R: number) => {
    let v = splitCache[j][R]
    if (!v) {
      v = binomialPMF(R, ratios[j])
      splitCache[j][R] = v
    }
    return v
  }
  let bDists: Float64Array[] = []
  let sDists: Float64Array[] = []

  // n 周(B 分布 pb, S 分布 ps)での充足確率
  const solve = (base: readonly number[], pb: Float64Array, ps: Float64Array): number => {
    const W = ps.length // 残り枠 R = 0..W-1
    // 段 i 余り s で、以降のドロップ0・全段 K=0 でも成立するか
    const worstOk = (i: number, s: number) => {
      for (let j = i + 1; j < m; j++) {
        s = base[j] + Math.floor(s / 3)
        if (s < 0) return false
      }
      return true
    }
    // 段 i 余り s・残り枠 R で、以降の各段に残り枠すべて・全段 K=n でも成立しうるか
    const bestOk = (i: number, s: number, R: number) => {
      for (let j = i + 1; j < m; j++) {
        s = base[j] + Math.floor(s / 3) * 2 + R
        if (s < 0) return false
      }
      return true
    }

    let result = 0
    // 段0: 余り s = base[0] + B、残り枠 = S
    let sMax = base[0] + pb.length - 1
    if (sMax < 0) return 0
    let Q = new Float64Array((sMax + 1) * W)
    for (let s = Math.max(0, base[0]); s <= sMax; s++) {
      const pB = pb[s - base[0]]
      if (pB === 0) continue
      const row = s * W
      for (let R = 0; R < W; R++) Q[row + R] = pB * ps[R]
    }

    for (let i = 0; ; i++) {
      // 段 i の余り分布 Q(s, R) → 段 i+1 への繰上獲得分布 P(c, R)
      const cMax = Math.floor(sMax / 3) * 2
      const P = new Float64Array((cMax + 1) * W)
      for (let s = 0; s <= sMax; s++) {
        const row = s * W
        if (worstOk(i, s)) {
          for (let R = 0; R < W; R++) result += Q[row + R]
          continue
        }
        const n = Math.floor(s / 3)
        const q = bonusPMF(n)
        for (let R = 0; R < W; R++) {
          const w = Q[row + R]
          if (w === 0 || !bestOk(i, s, R)) continue
          for (let k = 0; k <= n; k++) {
            const pk = q[k]
            if (pk === 0) continue
            P[(n + k) * W + R] += w * pk
          }
        }
      }

      // 段 j = i+1: 余り s = base[j] + c + D_j、残り枠 R - D_j
      const j = i + 1
      if (j === top) {
        // 最上位は残り枠すべてが D_top
        for (let c = 0; c <= cMax; c++) {
          const row = c * W
          for (let R = 0; R < W; R++) {
            const w = P[row + R]
            if (w !== 0 && base[j] + c + R >= 0) result += w
          }
        }
        return result
      }
      sMax = base[j] + cMax + W - 1
      if (sMax < 0) return result
      Q = new Float64Array((sMax + 1) * W)
      for (let c = 0; c <= cMax; c++) {
        const row = c * W
        for (let R = 0; R < W; R++) {
          const w = P[row + R]
          if (w === 0) continue
          const pm = splitPMF(j, R)
          for (let d = 0; d <= R; d++) {
            const s = base[j] + c + d
            if (s < 0) continue
            Q[s * W + R - d] += w * pm[d]
          }
        }
      }
    }
  }

  return (base: readonly number[], maxRuns: number): number[] => {
    const N = Math.max(0, Math.floor(maxRuns))
    if (bDists.length <= N) {
      bDists = runDists(model.baseCounts, N)
      sDists = runDists(model.slotCounts, N)
    }
    const out: number[] = []
    for (let n = 0; n <= N; n++) out.push(solve(base, bDists[n], sDists[n]))
    return out
  }
}

const talentByRuns = makeByRuns(TALENT_MODEL)
const weaponByRuns = makeByRuns(WEAPON_MODEL)

/** 天賦IV秘境を 0〜maxRuns 周したときの充足確率。戻り値[n] = n 周後の確率。 */
export function talentSufficiencyByRuns(
  owned: Record<TalentRarity, number>,
  totals: Record<TalentRarity, number>,
  maxRuns: number,
): number[] {
  return talentByRuns(
    TALENT_ASC.map((r) => owned[r] - totals[r]),
    maxRuns,
  )
}

/** 武器IV秘境を 0〜maxRuns 周したときの充足確率。戻り値[n] = n 周後の確率。 */
export function weaponSufficiencyByRuns(
  owned: Record<WeaponMatRarity, number>,
  totals: Record<WeaponMatRarity, number>,
  maxRuns: number,
): number[] {
  return weaponByRuns(
    WEAPON_ASC.map((r) => owned[r] - totals[r]),
    maxRuns,
  )
}
