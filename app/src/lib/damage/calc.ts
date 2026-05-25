import {
  ATTACK_PERCENT_UNIT,
  CRIT_DAMAGE_UNIT,
  CRIT_RATE_UNIT,
  DEFENSE_PERCENT_UNIT,
  HP_PERCENT_UNIT,
  MAIN_STAT_VALUES,
} from './constants'
import type {
  BalanceResult,
  BuffCard,
  CalculationResult,
  MainStatTradeoff,
  StatType,
  Stats,
  TradeoffAnalysis,
  TradeoffMatrixCell,
} from './types'

const STAT_LABELS: Record<StatType, string> = {
  attack: '攻撃力',
  defense: '防御力',
  hp: 'HP',
}

export function calculateDamage(
  stats: Stats,
  buffs: BuffCard[],
  statType: StatType = 'attack'
): CalculationResult {
  const totalStats = applyBuffs(stats, buffs)

  const critRateDecimal = Math.min(1, totalStats.critRate / 100)
  const critDamageDecimal = totalStats.critDamage / 100
  const damageBuffDecimal = totalStats.damageBuff / 100

  const referenceStatValue = pickStat(totalStats, statType)

  const evaluationValue =
    referenceStatValue *
    (1 + critRateDecimal * critDamageDecimal) *
    (1 + damageBuffDecimal)

  return {
    evaluationValue,
    balance: calculateBalance(totalStats, statType),
    mainStatTradeoffs: calculateMainStatTradeoffs(totalStats, statType),
  }
}

export function applyBuffs(baseStats: Stats, buffs: BuffCard[]): Stats {
  const result: Stats = { ...baseStats }

  for (const buff of buffs) {
    for (const stat of buff.stats) {
      const value = stat.value
      switch (stat.type) {
        case 'attack':
          result.attack += stat.isPercentage
            ? (baseStats.baseAttack * value) / 100
            : value
          break
        case 'defense':
          result.defense += stat.isPercentage
            ? (baseStats.baseDefense * value) / 100
            : value
          break
        case 'hp':
          result.hp += stat.isPercentage
            ? (baseStats.baseHp * value) / 100
            : value
          break
        case 'critRate':
          result.critRate += value
          break
        case 'critDamage':
          result.critDamage += value
          break
        case 'damageBuff':
          result.damageBuff += value
          break
      }
    }
  }

  return result
}

function pickStat(stats: Stats, statType: StatType): number {
  switch (statType) {
    case 'defense':
      return stats.defense
    case 'hp':
      return stats.hp
    default:
      return stats.attack
  }
}

function pickBaseStat(stats: Stats, statType: StatType): number {
  switch (statType) {
    case 'defense':
      return stats.baseDefense
    case 'hp':
      return stats.baseHp
    default:
      return stats.baseAttack
  }
}

function pickStatPercentUnit(statType: StatType): number {
  switch (statType) {
    case 'defense':
      return DEFENSE_PERCENT_UNIT / 100
    case 'hp':
      return HP_PERCENT_UNIT / 100
    default:
      return ATTACK_PERCENT_UNIT / 100
  }
}

function pickMainStatPercent(statType: StatType): number {
  switch (statType) {
    case 'defense':
      return MAIN_STAT_VALUES.DEF_PERCENT
    case 'hp':
      return MAIN_STAT_VALUES.HP_PERCENT
    default:
      return MAIN_STAT_VALUES.ATK_PERCENT
  }
}

function calculateBalance(stats: Stats, statType: StatType): BalanceResult {
  const currentCritRate = stats.critRate / 100
  const currentCritDamage = stats.critDamage / 100

  const critRateUnit = CRIT_RATE_UNIT / 100
  const critDamageUnit = CRIT_DAMAGE_UNIT / 100
  const statPercentUnit = pickStatPercentUnit(statType)
  const baseStatValue = pickBaseStat(stats, statType)
  const currentStatValue = pickStat(stats, statType)
  const statName = STAT_LABELS[statType]

  const currentValue =
    currentStatValue *
    (1 + Math.min(1, currentCritRate) * currentCritDamage)

  const critRateUpValue =
    currentStatValue *
    (1 +
      Math.min(1, currentCritRate + critRateUnit) *
        (currentCritDamage - critDamageUnit))
  const critRateUpBeneficial = critRateUpValue > currentValue

  const critDamageUpValue =
    currentStatValue *
    (1 +
      Math.min(1, currentCritRate - critRateUnit) *
        (currentCritDamage + critDamageUnit))
  const critDamageUpBeneficial = critDamageUpValue > currentValue

  const statUpFromCritRateValue =
    (currentStatValue + baseStatValue * statPercentUnit) *
    (1 + Math.min(1, currentCritRate - critRateUnit) * currentCritDamage)
  const statUpFromCritRateBeneficial = statUpFromCritRateValue > currentValue

  const statUpFromCritDamageValue =
    (currentStatValue + baseStatValue * statPercentUnit) *
    (1 +
      Math.min(1, currentCritRate) * (currentCritDamage - critDamageUnit))
  const statUpFromCritDamageBeneficial =
    statUpFromCritDamageValue > currentValue

  const critRateUpFromStatValue =
    (currentStatValue - baseStatValue * statPercentUnit) *
    (1 + Math.min(1, currentCritRate + critRateUnit) * currentCritDamage)
  const critRateUpFromStatBeneficial = critRateUpFromStatValue > currentValue

  const critDamageUpFromStatValue =
    (currentStatValue - baseStatValue * statPercentUnit) *
    (1 +
      Math.min(1, currentCritRate) * (currentCritDamage + critDamageUnit))
  const critDamageUpFromStatBeneficial =
    critDamageUpFromStatValue > currentValue

  const tradeoffs: TradeoffAnalysis[] = [
    {
      name: '会心率↑、会心ダメージ↓',
      description: '',
      currentValue,
      newValue: critRateUpValue,
      improvement: critRateUpValue - currentValue,
      beneficial: critRateUpBeneficial,
      changes: {
        critRate: {
          from: currentCritRate * 100,
          to: (currentCritRate + critRateUnit) * 100,
        },
        critDamage: {
          from: currentCritDamage * 100,
          to: (currentCritDamage - critDamageUnit) * 100,
        },
      },
    },
    {
      name: '会心ダメージ↑、会心率↓',
      description: '',
      currentValue,
      newValue: critDamageUpValue,
      improvement: critDamageUpValue - currentValue,
      beneficial: critDamageUpBeneficial,
      changes: {
        critRate: {
          from: currentCritRate * 100,
          to: (currentCritRate - critRateUnit) * 100,
        },
        critDamage: {
          from: currentCritDamage * 100,
          to: (currentCritDamage + critDamageUnit) * 100,
        },
      },
    },
    {
      name: `${statName}%↑、会心率↓`,
      description: '',
      currentValue,
      newValue: statUpFromCritRateValue,
      improvement: statUpFromCritRateValue - currentValue,
      beneficial: statUpFromCritRateBeneficial,
      changes: {
        [statType]: {
          from: currentStatValue,
          to: currentStatValue + baseStatValue * statPercentUnit,
        },
        critRate: {
          from: currentCritRate * 100,
          to: (currentCritRate - critRateUnit) * 100,
        },
      },
    },
    {
      name: `${statName}%↑、会心ダメージ↓`,
      description: '',
      currentValue,
      newValue: statUpFromCritDamageValue,
      improvement: statUpFromCritDamageValue - currentValue,
      beneficial: statUpFromCritDamageBeneficial,
      changes: {
        [statType]: {
          from: currentStatValue,
          to: currentStatValue + baseStatValue * statPercentUnit,
        },
        critDamage: {
          from: currentCritDamage * 100,
          to: (currentCritDamage - critDamageUnit) * 100,
        },
      },
    },
    {
      name: `会心率↑、${statName}%↓`,
      description: '',
      currentValue,
      newValue: critRateUpFromStatValue,
      improvement: critRateUpFromStatValue - currentValue,
      beneficial: critRateUpFromStatBeneficial,
      changes: {
        [statType]: {
          from: currentStatValue,
          to: currentStatValue - baseStatValue * statPercentUnit,
        },
        critRate: {
          from: currentCritRate * 100,
          to: (currentCritRate + critRateUnit) * 100,
        },
      },
    },
    {
      name: `会心ダメージ↑、${statName}%↓`,
      description: '',
      currentValue,
      newValue: critDamageUpFromStatValue,
      improvement: critDamageUpFromStatValue - currentValue,
      beneficial: critDamageUpFromStatBeneficial,
      changes: {
        [statType]: {
          from: currentStatValue,
          to: currentStatValue - baseStatValue * statPercentUnit,
        },
        critDamage: {
          from: currentCritDamage * 100,
          to: (currentCritDamage + critDamageUnit) * 100,
        },
      },
    },
  ]

  const beneficialTradeoffs = tradeoffs.filter((t) => t.beneficial)
  const recommendation =
    beneficialTradeoffs.length === 0
      ? '現在のバランスは良好です。どの交換でも評価値は下がります。'
      : `次の交換で評価値が向上します:\n${beneficialTradeoffs
          .map((t) => `${t.name}: ${t.description}`)
          .join('\n')}`

  const tradeoffMatrix = buildTradeoffMatrix(tradeoffs, statType)

  return {
    critRateDeficit: critRateUpBeneficial || critRateUpFromStatBeneficial,
    critDamageDeficit: critDamageUpBeneficial || critDamageUpFromStatBeneficial,
    recommendation,
    tradeoffs,
    tradeoffMatrix,
  }
}

function buildTradeoffMatrix(
  tradeoffs: TradeoffAnalysis[],
  statType: StatType
): TradeoffMatrixCell[][] {
  const statTypes = [statType, 'critRate', 'critDamage'] as const
  const matrix: TradeoffMatrixCell[][] = []

  for (let i = 0; i < statTypes.length; i++) {
    matrix[i] = []
    for (let j = 0; j < statTypes.length; j++) {
      if (i === j) {
        matrix[i][j] = null
        continue
      }
      const statUp = statTypes[i]
      const statDown = statTypes[j]

      const tradeoff = tradeoffs.find((t) => {
        const up = t.changes[statUp]
        const down = t.changes[statDown]
        return up && down && up.to > up.from && down.to < down.from
      })

      matrix[i][j] = tradeoff
        ? {
            statUp,
            statDown,
            improvement: tradeoff.improvement,
            beneficial: tradeoff.beneficial,
            changes: tradeoff.changes,
          }
        : null
    }
  }

  return matrix
}

function calculateMainStatTradeoffs(
  stats: Stats,
  statType: StatType
): MainStatTradeoff[] {
  const critRateDecimal = Math.min(1, stats.critRate / 100)
  const critDamageDecimal = stats.critDamage / 100
  const damageBuffDecimal = stats.damageBuff / 100
  const referenceStatValue = pickStat(stats, statType)
  const baseStatValue = pickBaseStat(stats, statType)
  const mainStatPercent = pickMainStatPercent(statType)
  const statName = STAT_LABELS[statType]

  const currentEvaluation =
    referenceStatValue *
    (1 + critRateDecimal * critDamageDecimal) *
    (1 + damageBuffDecimal)

  const statDelta = (baseStatValue * mainStatPercent) / 100
  const buffDelta = MAIN_STAT_VALUES.DAMAGE_BUFF

  const statWithoutGoblet = referenceStatValue - statDelta
  const damageBuffWithGoblet = (stats.damageBuff + buffDelta) / 100
  const newValueStatToDamage =
    statWithoutGoblet *
    (1 + critRateDecimal * critDamageDecimal) *
    (1 + damageBuffWithGoblet)

  const statWithGoblet = referenceStatValue + statDelta
  const damageBuffWithoutGoblet =
    Math.max(0, stats.damageBuff - buffDelta) / 100
  const newValueDamageToStat =
    statWithGoblet *
    (1 + critRateDecimal * critDamageDecimal) *
    (1 + damageBuffWithoutGoblet)

  return [
    {
      name: `${statName}%杯 → ダメージバフ杯`,
      currentValue: currentEvaluation,
      newValue: newValueStatToDamage,
      improvement: newValueStatToDamage - currentEvaluation,
      beneficial: newValueStatToDamage > currentEvaluation,
      description: `${statName}${statDelta.toFixed(0)}減少、ダメージバフ${buffDelta}%増加`,
    },
    {
      name: `ダメージバフ杯 → ${statName}%杯`,
      currentValue: currentEvaluation,
      newValue: newValueDamageToStat,
      improvement: newValueDamageToStat - currentEvaluation,
      beneficial: newValueDamageToStat > currentEvaluation,
      description: `${statName}${statDelta.toFixed(0)}増加、ダメージバフ${buffDelta}%減少`,
    },
  ]
}
