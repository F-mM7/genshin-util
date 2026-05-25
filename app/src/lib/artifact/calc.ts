import {
  CALCULATION_CONSTANTS,
  CUM_EXP_4STAR,
  CUM_EXP_5STAR,
  MATERIALS,
  MAX_LEVEL_4STAR,
  MAX_LEVEL_5STAR,
  MAX_MATERIALS,
  SUBSTATS,
} from './constants'
import type {
  ArtifactRarity,
  MaterialToggleState,
  MaterialUsage,
  SubstatType,
  SubstatValues,
  TargetArtifact,
} from './types'

export function getCumExp(rarity: ArtifactRarity): number[] {
  return rarity === 5 ? CUM_EXP_5STAR : CUM_EXP_4STAR
}

export function getMaxLevel(rarity: ArtifactRarity): number {
  return rarity === 5 ? MAX_LEVEL_5STAR : MAX_LEVEL_4STAR
}

export function display(x: number): string {
  return (Math.round(x * 10) / 10).toFixed(1)
}

export function calculateSubstatValue(
  substat: SubstatType,
  factor: number
): number {
  return (SUBSTATS[substat] / CALCULATION_CONSTANTS.SUBSTAT_DIVISOR) * factor
}

export function enumerateArrays(n: number, m: number): number[][] {
  const result: number[][] = []

  const generate = (current: number[]): void => {
    if (current.length === n) {
      result.push([...current])
      return
    }
    for (let i = 0; i < m; i++) {
      current.push(i)
      generate(current)
      current.pop()
    }
  }

  generate([])
  return result
}

export type ExpRequirement = {
  expReq: number
  expCap: number
}

export function calculateExpRequirement(
  currentLevel: number,
  currentExp: number,
  requiredEnhances: number,
  capDivisor: number,
  manualTargetLevel: number | undefined,
  rarity: ArtifactRarity
): ExpRequirement {
  const cumExp = getCumExp(rarity)
  const maxLevel = getMaxLevel(rarity)
  const autoTargetLevel = Math.min(
    maxLevel,
    (CALCULATION_CONSTANTS.MAX_ENHANCEMENTS - requiredEnhances) *
      CALCULATION_CONSTANTS.AUTO_LEVEL_OFFSET
  )
  const targetLevel =
    manualTargetLevel !== undefined ? manualTargetLevel : autoTargetLevel
  const totalCurrentExp = currentExp + cumExp[currentLevel]
  const targetExp = cumExp[Math.max(targetLevel, currentLevel)]

  const expReq = targetExp - totalCurrentExp
  const expCap = (cumExp[maxLevel] - totalCurrentExp) / capDivisor

  return { expReq, expCap }
}

export type MaterialUsageResult = {
  usage: MaterialUsage
  totalExp: number
}

export function calculateMaterialUsage(
  expNeeded: number,
  enabledMaterials: MaterialToggleState
): MaterialUsageResult {
  let minCost: number = CALCULATION_CONSTANTS.MAX_MATERIAL_COST
  let bestUsage: MaterialUsage = {
    lv1: 0,
    lv2: 0,
    lv3: 0,
    lv4: 0,
    unc: 0,
    ess: 0,
  }

  for (let n4 = MAX_MATERIALS; n4 >= 0; --n4) {
    for (let n3 = MAX_MATERIALS - n4; n3 >= 0; --n3) {
      for (let n2 = MAX_MATERIALS - n4 - n3; n2 >= 0; --n2) {
        for (let n1 = MAX_MATERIALS - n4 - n3 - n2; n1 >= 0; --n1) {
          for (let useEss = 1; useEss >= 0; --useEss) {
            for (let useUnc = 0; useUnc < 2; ++useUnc) {
              if (n4 && !enabledMaterials.lv4) continue
              if (n3 && !enabledMaterials.lv3) continue
              if (n2 && !enabledMaterials.lv2) continue
              if (n1 && !enabledMaterials.lv1) continue
              if (useEss && !enabledMaterials.ess) continue
              if (useUnc && !enabledMaterials.unc) continue
              if (n1 + n2 + n3 + n4 + useEss + useUnc > MAX_MATERIALS) continue

              let totalExp = 0
              totalExp += n4 * MATERIALS.lv4
              totalExp += n3 * MATERIALS.lv3
              totalExp += n2 * MATERIALS.lv2
              totalExp += n1 * MATERIALS.lv1

              const usage: MaterialUsage = {
                lv4: n4,
                lv3: n3,
                lv2: n2,
                lv1: n1,
                ess: 0,
                unc: 0,
              }

              if (useUnc) {
                usage.unc = Math.max(
                  Math.ceil((expNeeded - totalExp) / MATERIALS.unc),
                  0
                )
                totalExp += usage.unc * MATERIALS.unc
                if (useEss) {
                  usage.ess = Math.floor(usage.unc / 4)
                  usage.unc = usage.unc % 4
                }
              } else if (useEss) {
                usage.ess = Math.max(
                  Math.ceil((expNeeded - totalExp) / MATERIALS.ess),
                  0
                )
                totalExp += usage.ess * MATERIALS.ess
              }

              if (totalExp < expNeeded) continue
              if (totalExp < minCost) {
                minCost = totalExp
                bestUsage = usage
              }
            }
          }
        }
      }
    }
  }

  return { usage: bestUsage, totalExp: minCost }
}

export function calculateRequiredEnhances(
  selectedSubstats: SubstatType[],
  substatValues: SubstatValues,
  targetArtifacts: TargetArtifact[]
): number {
  let minEnhances = 100
  const arrays = enumerateArrays(
    selectedSubstats.length,
    CALCULATION_CONSTANTS.MAX_ENHANCEMENTS
  )

  for (const enhanceArray of arrays) {
    const newValues: number[] = []

    for (let i = 0; i < selectedSubstats.length; i++) {
      const substat = selectedSubstats[i]
      const baseValue = substatValues[substat] ?? 0
      newValues[i] = baseValue + calculateSubstatValue(substat, enhanceArray[i])
    }

    let isInferior = false
    for (const target of targetArtifacts) {
      let isSuperior = false
      for (let i = 0; i < selectedSubstats.length; i++) {
        if (newValues[i] > target.val[i]) {
          isSuperior = true
          break
        }
      }
      if (!isSuperior) {
        isInferior = true
        break
      }
    }

    const totalEnhances = enhanceArray.reduce((sum, x) => sum + x, 0)
    if (!isInferior && totalEnhances < minEnhances) {
      minEnhances = totalEnhances
    }
  }

  return minEnhances
}

export type ApplyExpGainResult = {
  level: number
  exp: number
}

export function applyExpGain(
  currentLevel: number,
  currentExp: number,
  expGain: number,
  rarity: ArtifactRarity
): ApplyExpGainResult {
  const cumExp = getCumExp(rarity)
  const maxLevel = getMaxLevel(rarity)
  let level = currentLevel
  const exp = currentExp + cumExp[level] + expGain

  while (level < maxLevel && cumExp[level + 1] <= exp) {
    level++
  }

  return {
    level,
    exp: exp - cumExp[level],
  }
}

export type StepEnd = {
  level: number
  exp: number
}

export type MaterialPlan = {
  materialUsage: MaterialUsage
  expReq: number
  expCap: number
  givenExp: number
  currentStepEnd: StepEnd
  futureMaterialUsages: MaterialUsage[]
  futureStepEnds: StepEnd[]
}

export function planMaterials(input: {
  selectedSubstats: SubstatType[]
  substatValues: SubstatValues
  level: number
  exp: number
  targetArtifacts: TargetArtifact[]
  enabledMaterials: MaterialToggleState
  capDivisor: number
  targetLevel: number | 'auto'
  rarity: ArtifactRarity
}): MaterialPlan {
  const {
    selectedSubstats,
    substatValues,
    level,
    exp,
    targetArtifacts,
    enabledMaterials,
    capDivisor,
    targetLevel,
    rarity,
  } = input

  const requiredEnhances = calculateRequiredEnhances(
    selectedSubstats,
    substatValues,
    targetArtifacts
  )
  const manualTargetLevel = targetLevel === 'auto' ? undefined : targetLevel

  const { expReq, expCap } = calculateExpRequirement(
    level,
    exp,
    requiredEnhances,
    capDivisor,
    manualTargetLevel,
    rarity
  )

  const expGive = Math.min(expReq, expCap)
  const { usage, totalExp } = calculateMaterialUsage(expGive, enabledMaterials)

  const afterCurrent = applyExpGain(level, exp, totalExp, rarity)
  const currentStepEnd: StepEnd = {
    level: afterCurrent.level,
    exp: afterCurrent.exp,
  }

  const futureMaterialUsages: MaterialUsage[] = []
  const futureStepEnds: StepEnd[] = []
  let currentLevel = level
  let currentExp = exp
  let currentTotalExp = totalExp

  while (currentTotalExp > 0 && futureMaterialUsages.length < 30) {
    const nextState = applyExpGain(
      currentLevel,
      currentExp,
      currentTotalExp,
      rarity
    )
    const next = calculateExpRequirement(
      nextState.level,
      nextState.exp,
      requiredEnhances,
      capDivisor,
      manualTargetLevel,
      rarity
    )
    const nextExpGive = Math.min(next.expReq, next.expCap)
    if (nextExpGive <= 0) break

    const nextUsage = calculateMaterialUsage(nextExpGive, enabledMaterials)
    const afterInvest = applyExpGain(
      nextState.level,
      nextState.exp,
      nextUsage.totalExp,
      rarity
    )
    futureMaterialUsages.push(nextUsage.usage)
    futureStepEnds.push({
      level: afterInvest.level,
      exp: afterInvest.exp,
    })

    currentLevel = nextState.level
    currentExp = nextState.exp
    currentTotalExp = nextUsage.totalExp
  }

  return {
    materialUsage: usage,
    expReq,
    expCap,
    givenExp: totalExp,
    currentStepEnd,
    futureMaterialUsages,
    futureStepEnds,
  }
}
