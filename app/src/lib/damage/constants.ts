import type { Stats } from './types'

export const CRIT_RATE_UNIT = 3.9
export const CRIT_DAMAGE_UNIT = 7.8
export const ATTACK_PERCENT_UNIT = 5.8
export const DEFENSE_PERCENT_UNIT = 7.3
export const HP_PERCENT_UNIT = 5.8

export const MAIN_STAT_VALUES = {
  ATK_PERCENT: 46.6,
  HP_PERCENT: 46.6,
  DEF_PERCENT: 58.3,
  DAMAGE_BUFF: 46.6,
  CRIT_RATE: 31.1,
  CRIT_DAMAGE: 62.2,
} as const

export const DEFAULT_STATS: Stats = {
  baseAttack: 1033,
  attack: 1861,
  baseDefense: 876,
  defense: 1200,
  baseHp: 13348,
  hp: 20000,
  critRate: 86.2,
  critDamage: 204.2,
  damageBuff: 61.6,
}
