import type { MaterialUsage, SubstatType } from './types'

export const SUBSTATS: Record<SubstatType, number> = {
  Elemental_Mastery: 187,
  DEF: 58.3,
  Energy_Recharge: 51.8,
  CRIT_Rate: 31.1,
  CRIT_DMG: 62.2,
}

export const SUBSTAT_LABELS: Record<SubstatType, string> = {
  Elemental_Mastery: '元素熟知',
  DEF: '防御力%',
  Energy_Recharge: '元素チャージ効率',
  CRIT_Rate: '会心率',
  CRIT_DMG: '会心ダメージ',
}

export const SUBSTAT_ORDER: SubstatType[] = [
  'CRIT_Rate',
  'CRIT_DMG',
  'DEF',
  'Energy_Recharge',
  'Elemental_Mastery',
]

export const CUM_EXP_5STAR: number[] = [
  0, 3000, 6725, 11150, 16300, 22200, 28875, 36375, 44725, 53950, 64075, 75125,
  87150, 100175, 115325, 132925, 153300, 176800, 203850, 234900, 270475,
]

export const CUM_EXP_4STAR: number[] = [
  0, 2400, 5375, 8925, 13050, 17775, 23125, 29125, 35800, 43175, 51275, 60125,
  69750, 80175, 92300, 106375, 122675,
]

export const MATERIALS: Record<'lv1' | 'lv2' | 'lv3' | 'lv4' | 'unc' | 'ess', number> = {
  lv1: 420,
  lv2: 840,
  lv3: 1260,
  lv4: 2520,
  unc: 2500,
  ess: 10000,
}

export const MATERIAL_ORDER: (keyof MaterialUsage)[] = [
  'lv4',
  'lv3',
  'lv2',
  'lv1',
  'unc',
  'ess',
]

export const MAX_LEVEL_5STAR = 20
export const MAX_LEVEL_4STAR = 16
export const MAX_MATERIALS = 15

export const CALCULATION_CONSTANTS = {
  MAX_ENHANCEMENTS: 6,
  SUBSTAT_DIVISOR: 8,
  HIGH_ROLL_MULTIPLIER: 0.9,
  LOW_ROLL_MULTIPLIER: 0.85,
  MAX_MATERIAL_COST: 280001,
  AUTO_LEVEL_OFFSET: 4,
} as const

export const ENHANCE_FACTORS: number[] = [1, 2, 5]
