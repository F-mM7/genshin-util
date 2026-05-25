// Excelシートの計算結果と materials.ts のロジックが一致するか検証
// Node 20 で TS をインポートできないため、ロジックを複製して比較する

const TALENT_LEVEL_COSTS = {
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

function talentCost(fromLv, toLv, count = 1) {
  const result = { 2: 0, 3: 0, 4: 0 }
  if (fromLv >= toLv) return result
  const lo = Math.max(1, Math.floor(fromLv)) + 1
  const hi = Math.min(10, Math.floor(toLv))
  for (let lv = lo; lv <= hi; lv++) {
    const c = TALENT_LEVEL_COSTS[lv]
    if (!c) continue
    result[c.rarity] += c.count * count
  }
  return result
}

const GEM_BREAK_COSTS = {
  1: { rarity: 2, count: 1 },
  2: { rarity: 3, count: 3 },
  3: { rarity: 3, count: 6 },
  4: { rarity: 4, count: 3 },
  5: { rarity: 4, count: 6 },
  6: { rarity: 5, count: 6 },
}

function gemCost(fromBreak, toBreak) {
  const result = { 2: 0, 3: 0, 4: 0, 5: 0 }
  if (fromBreak >= toBreak) return result
  const lo = Math.max(0, Math.floor(fromBreak)) + 1
  const hi = Math.min(6, Math.floor(toBreak))
  for (let b = lo; b <= hi; b++) {
    const c = GEM_BREAK_COSTS[b]
    if (!c) continue
    result[c.rarity] += c.count
  }
  return result
}

const assertions = []
function check(name, got, want) {
  const ok = JSON.stringify(got) === JSON.stringify(want)
  assertions.push({ name, got, want, ok })
}

function checkNum(name, got, want, tol = 1e-6) {
  const ok = Math.abs(got - want) <= tol
  assertions.push({ name, got, want, ok })
}

// === 天賦 ===
// Excel: B2=1, C2=10, D2=1 -> E2=★4=38, F2=★3=21, G2=★2=3
check('talent Lv1->10 x1', talentCost(1, 10, 1), { 2: 3, 3: 21, 4: 38 })
check('talent Lv10->10', talentCost(10, 10, 1), { 2: 0, 3: 0, 4: 0 })
check('talent Lv1->1', talentCost(1, 1, 0), { 2: 0, 3: 0, 4: 0 })
check('talent Lv1->2', talentCost(1, 2, 1), { 2: 3, 3: 0, 4: 0 })
check('talent Lv5->6', talentCost(5, 6, 1), { 2: 0, 3: 9, 4: 0 })
check('talent Lv6->7', talentCost(6, 7, 1), { 2: 0, 3: 0, 4: 4 })
check('talent Lv1->10 x2', talentCost(1, 10, 2), { 2: 6, 3: 42, 4: 76 })

// === 宝石 ===
check('gem 5->6', gemCost(5, 6), { 2: 0, 3: 0, 4: 0, 5: 6 })
check('gem 6->6', gemCost(6, 6), { 2: 0, 3: 0, 4: 0, 5: 0 })
check('gem 0->6', gemCost(0, 6), { 2: 1, 3: 9, 4: 9, 5: 6 })
check('gem 0->1', gemCost(0, 1), { 2: 1, 3: 0, 4: 0, 5: 0 })
check('gem 3->4', gemCost(3, 4), { 2: 0, 3: 0, 4: 3, 5: 0 })

// === 天賦 繰上シナリオ ===
// Excel:
//   合計: ★4=38, ★3=21, ★2=3
//   所持: ★4=22, ★3=33, ★2=14
//   エウルア(×2): ★3獲得=floor((14-3)/3)*2 = floor(11/3)*2 = 3*2 = 6
//                ★3余り = 33+6-21 = 18
//                ★4獲得 = floor(18/3)*2 = 12
//                ★4余り = 22+12-38 = -4
function talentChain(owned, totals, factor, floorEach) {
  const surplus = { 2: 0, 3: 0, 4: 0 }
  const gain = { 2: 0, 3: 0, 4: 0 }
  surplus[2] = owned[2] - totals[2]
  const calc = (s) =>
    floorEach
      ? Math.max(0, Math.floor(s / 3)) * factor
      : Math.max(0, (s * factor) / 3)
  gain[3] = calc(surplus[2])
  surplus[3] = owned[3] + gain[3] - totals[3]
  gain[4] = calc(surplus[3])
  surplus[4] = owned[4] + gain[4] - totals[4]
  return { surplus, gain }
}
const owned = { 2: 14, 3: 33, 4: 22 }
const totals = { 2: 3, 3: 21, 4: 38 }
const eurua = talentChain(owned, totals, 2, true)
check('talent boss surplus ★4', eurua.surplus[4], -4)
check('talent boss surplus ★3', eurua.surplus[3], 18)
check('talent boss surplus ★2', eurua.surplus[2], 11)
check('talent boss gain ★3', eurua.gain[3], 6)
check('talent boss gain ★4', eurua.gain[4], 12)

// 通常(×1):
// ★3獲得 = floor(11/3) = 3
// ★3余り = 33+3-21 = 15
// ★4獲得 = floor(15/3) = 5
// ★4余り = 22+5-38 = -11
const normal = talentChain(owned, totals, 1, true)
check('talent normal surplus ★4', normal.surplus[4], -11)
check('talent normal surplus ★3', normal.surplus[3], 15)
check('talent normal gain ★3', normal.gain[3], 3)
check('talent normal gain ★4', normal.gain[4], 5)

// 期待値（厳密）:
//   繰上1回ドロップ K ~ Binomial(n, 0.1)、合計獲得 = n + K
//   ★3獲得 = n3 * 1.1
//   ★4獲得 = 1.1 * Σ_{k3} pmf3[k3] * n4(k3)
//
// owned = {2:14, 3:33, 4:22}, totals = {2:3, 3:21, 4:38} のとき
//   n3 = floor(11/3) = 3, pmf3 = [0.729, 0.243, 0.027, 0.001]
//   各 k3 における s3 と n4:
//     k3=0: s3=15, n4=5
//     k3=1: s3=16, n4=5
//     k3=2: s3=17, n4=5
//     k3=3: s3=18, n4=6
//   E[n4] = 0.999*5 + 0.001*6 = 5.001
//   ★3獲得 = 3.3
//   ★4獲得 = 1.1 * 5.001 = 5.5011
function binomialPMF(n, p) {
  if (n <= 0) return [1]
  const logP = Math.log(p)
  const log1mP = Math.log(1 - p)
  const logFact = [0]
  for (let i = 1; i <= n; i++) logFact.push(logFact[i - 1] + Math.log(i))
  const pmf = []
  for (let k = 0; k <= n; k++) {
    const logChoose = logFact[n] - logFact[k] - logFact[n - k]
    pmf.push(Math.exp(logChoose + k * logP + (n - k) * log1mP))
  }
  return pmf
}
const surplus2Owned = owned[2] - totals[2]
const n3 = Math.max(0, Math.floor(surplus2Owned / 3))
const pmf3 = binomialPMF(n3, 0.1)
let expN4 = 0
for (let k3 = 0; k3 <= n3; k3++) {
  const s3 = owned[3] + n3 + k3 - totals[3]
  const n4 = Math.max(0, Math.floor(s3 / 3))
  expN4 += pmf3[k3] * n4
}
const expGain3 = n3 * 1.1
const expGain4 = expN4 * 1.1
checkNum('talent expect gain ★3', expGain3, 3.3, 1e-6)
checkNum('talent expect gain ★4', expGain4, 5.5011, 1e-6)
const expSurplus3 = owned[3] + expGain3 - totals[3]
const expSurplus4 = owned[4] + expGain4 - totals[4]
checkNum('talent expect surplus ★3', expSurplus3, 15.3, 1e-6)
checkNum('talent expect surplus ★4', expSurplus4, -10.4989, 1e-6)

// === 樹脂キャパ (Excel: B5=30, B6=2 -> B7 = 200-30+(5-2)*60 = 350) ===
const capacity = 200 - 30 + (5 - 2) * 60
checkNum('resin capacity', capacity, 350)

// === 武器突破素材 ===
const WEAPON_BREAK_COSTS = {
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

function weaponBreakCost(quality, fromBreak, toBreak) {
  const result = { 2: 0, 3: 0, 4: 0, 5: 0 }
  if (fromBreak >= toBreak) return result
  const lo = Math.max(0, Math.floor(fromBreak)) + 1
  const hi = Math.min(6, Math.floor(toBreak))
  for (let b = lo; b <= hi; b++) {
    const c = WEAPON_BREAK_COSTS[quality][b]
    if (!c) continue
    result[c.rarity] += c.count
  }
  return result
}

// フル突破の合計が公開データと一致するか
check('weapon ★3 full', weaponBreakCost(3, 0, 6), { 2: 2, 3: 6, 4: 6, 5: 3 })
check('weapon ★4 full', weaponBreakCost(4, 0, 6), { 2: 3, 3: 9, 4: 9, 5: 4 })
check('weapon ★5 full', weaponBreakCost(5, 0, 6), { 2: 5, 3: 14, 4: 14, 5: 6 })
check('weapon ★5 6->6', weaponBreakCost(5, 6, 6), { 2: 0, 3: 0, 4: 0, 5: 0 })
check('weapon ★5 0->1', weaponBreakCost(5, 0, 1), { 2: 5, 3: 0, 4: 0, 5: 0 })
check('weapon ★5 5->6', weaponBreakCost(5, 5, 6), { 2: 0, 3: 0, 4: 0, 5: 6 })
check('weapon ★4 2->4', weaponBreakCost(4, 2, 4), { 2: 0, 3: 6, 4: 3, 5: 0 })

// === 結果 ===
let ok = 0
let ng = 0
for (const a of assertions) {
  if (a.ok) {
    ok++
    console.log(`  OK  ${a.name}`)
  } else {
    ng++
    console.log(
      `  NG  ${a.name}\n      got  = ${JSON.stringify(a.got)}\n      want = ${JSON.stringify(a.want)}`
    )
  }
}
console.log(`\n${ok}/${ok + ng} passed`)
process.exit(ng === 0 ? 0 : 1)
