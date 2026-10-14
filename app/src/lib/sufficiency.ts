import { binomialPMF } from './probability'
import type { DropOutcome } from './domainDrops'

// 繰上合成で「+2個」になる確率。合成 n 回の上位獲得 = n + K, K ~ Binomial(n, 0.1)。
const BONUS_P = 0.1

const pmfCache = new Map<number, number[]>()
function pmf(n: number): number[] {
  let v = pmfCache.get(n)
  if (!v) {
    v = binomialPMF(n, BONUS_P)
    pmfCache.set(n, v)
  }
  return v
}

/**
 * 秘境ドロップ分布を加味した、全レアリティ同時充足の確率。
 *   = Σ_outcome p × P(所持 + ドロップ で 必要数を満たす)
 * 合成モデル: 段 r の余り s = 所持 + ドロップ + 下位からの繰上獲得 - 必要。s < 0 なら不成立。
 *   上位への獲得 = n + K (n = floor(s/3), K ~ Bin(n, 0.1))。最上位は s >= 0 で成立。
 *
 * ドロップ結果ごとに全計算せず、最下位から1段ずつ DP で進める。
 *   状態 = (当該段に加わる数 t = 繰上獲得 + 当該段のドロップ, 未処理の上位段のドロップ数組)。
 *   同じ状態は確率を合算してまとめる。
 * 最悪(全段 K=0)でも成立する状態は確率1、最良(全段 K=n)でも不成立の状態は確率0 として打ち切る。
 *
 * @param rarities レアリティ(昇順)
 */
export function sufficiencyProbability<R extends number>(
  rarities: readonly R[],
  owned: Record<R, number>,
  totals: Record<R, number>,
  drops: readonly DropOutcome<R>[],
): number {
  const m = rarities.length
  if (m === 0) throw new Error('rarities must not be empty')
  const base = rarities.map((r) => owned[r] - totals[r])
  const top = m - 1

  // 段 i で余り s のとき、上位段の追加数 rest(段 i+1.. のドロップ)で、
  // 全段の倍率を factor(1=最悪, 2=最良) とした決定的連鎖が成立するか。
  const chainOk = (i: number, s: number, rest: readonly number[], factor: number) => {
    for (let j = i + 1; j < m; j++) {
      s = base[j] + Math.floor(s / 3) * factor + rest[j - i - 1]
      if (s < 0) return false
    }
    return true
  }

  // 状態のグループ: 未処理上位段のドロップ数組ごとに、t → 確率 の分布。
  type Group = { rest: number[]; dist: Map<number, number> }
  let groups = new Map<string, Group>()
  for (const { counts, p } of drops) {
    const rest = rarities.slice(1).map((r) => counts[r])
    const key = rest.join(',')
    let g = groups.get(key)
    if (!g) {
      g = { rest, dist: new Map() }
      groups.set(key, g)
    }
    const t = counts[rarities[0]]
    g.dist.set(t, (g.dist.get(t) ?? 0) + p)
  }

  let result = 0
  for (let i = 0; i < m; i++) {
    const next = new Map<string, Group>()
    for (const { rest, dist } of groups.values()) {
      if (i === top) {
        for (const [t, w] of dist) if (base[i] + t >= 0) result += w
        continue
      }
      const nextRest = rest.slice(1)
      const nextKey = nextRest.join(',')
      let ng: Group | undefined
      for (const [t, w] of dist) {
        const s = base[i] + t
        if (s < 0) continue
        if (chainOk(i, s, rest, 1)) {
          result += w
          continue
        }
        if (!chainOk(i, s, rest, 2)) continue
        const n = Math.floor(s / 3)
        const q = pmf(n)
        if (!ng) {
          ng = next.get(nextKey)
          if (!ng) {
            ng = { rest: nextRest, dist: new Map() }
            next.set(nextKey, ng)
          }
        }
        const nd = ng.dist
        const offset = n + rest[0]
        for (let k = 0; k <= n; k++) {
          const pk = q[k]
          if (pk === 0) continue
          const t2 = offset + k
          nd.set(t2, (nd.get(t2) ?? 0) + w * pk)
        }
      }
    }
    groups = next
  }
  return result
}

/** 浮動小数誤差(0.9999999999999999 等)を許容して、確率が 100% とみなせるか。 */
export function isCertain(probability: number): boolean {
  return probability >= 1 - 1e-9
}

/** 浮動小数誤差を許容して、確率が 0% とみなせるか。 */
export function isImpossible(probability: number): boolean {
  return probability <= 1e-9
}
