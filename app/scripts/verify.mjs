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

// 期待値(×1.1, Excelの式は「通常×1」の余りを 1.1 倍):
// ★3獲得 = floor(★2余り(=11) * 1.1 / 3 ではなく) max(0, F$10*1.1/3) = 15*1.1/3 = 5.5
// ★4獲得 = max(0, G$10*1.1/3) = 11*1.1/3 = 4.0333
const expGain3 = Math.max(0, (normal.surplus[3] * 1.1) / 3)
const expGain4 = Math.max(0, (normal.surplus[2] * 1.1) / 3)
checkNum('talent expect gain ★4 = max(0, ★3余り*1.1/3)', expGain3, 5.5, 1e-6)
checkNum('talent expect gain ★3 = max(0, ★2余り*1.1/3)', expGain4, (11 * 1.1) / 3, 1e-6)
// ★4余り = 22 + 5.5 - 38 = -10.5
const expSurplus4 = owned[4] + expGain3 - totals[4]
checkNum('talent expect surplus ★4', expSurplus4, -10.5, 1e-6)

// === 樹脂キャパ (Excel: B5=30, B6=2 -> B7 = 200-30+(5-2)*60 = 350) ===
const capacity = 200 - 30 + (5 - 2) * 60
checkNum('resin capacity', capacity, 350)

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
