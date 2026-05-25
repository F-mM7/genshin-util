export type StatType = 'attack' | 'defense' | 'hp'

export type BuffStatType =
  | 'attack'
  | 'defense'
  | 'hp'
  | 'critRate'
  | 'critDamage'
  | 'damageBuff'

export type Stats = {
  baseAttack: number
  attack: number
  baseDefense: number
  defense: number
  baseHp: number
  hp: number
  critRate: number
  critDamage: number
  damageBuff: number
}

export type BuffStat = {
  type: BuffStatType
  value: number
  isPercentage: boolean
}

export type BuffCard = {
  id: string
  name: string
  stats: BuffStat[]
}

export type WeaponType = 'sword' | 'claymore' | 'polearm' | 'catalyst' | 'bow'

export type ElementType =
  | 'pyro'
  | 'hydro'
  | 'cryo'
  | 'electro'
  | 'anemo'
  | 'geo'
  | 'dendro'

export type PresetCategory =
  | 'weapon'
  | 'artifact'
  | 'character'
  | 'team'
  | 'other'

export type BuffPreset = {
  id: string
  title: string
  category: PresetCategory
  subCategory?: WeaponType | ElementType
  remarks?: string
  buffs: BuffStat[]
}

export type TradeoffChange = Partial<
  Record<
    'attack' | 'defense' | 'hp' | 'critRate' | 'critDamage',
    { from: number; to: number }
  >
>

export type TradeoffAnalysis = {
  name: string
  description: string
  currentValue: number
  newValue: number
  improvement: number
  beneficial: boolean
  changes: TradeoffChange
}

export type TradeoffMatrixCell = {
  statUp: StatType | 'critRate' | 'critDamage'
  statDown: StatType | 'critRate' | 'critDamage'
  improvement: number
  beneficial: boolean
  changes: TradeoffChange
} | null

export type MainStatTradeoff = {
  name: string
  currentValue: number
  newValue: number
  improvement: number
  beneficial: boolean
  description: string
}

export type BalanceResult = {
  critRateDeficit: boolean
  critDamageDeficit: boolean
  recommendation: string
  tradeoffs: TradeoffAnalysis[]
  tradeoffMatrix: TradeoffMatrixCell[][]
}

export type CalculationResult = {
  evaluationValue: number
  balance: BalanceResult
  mainStatTradeoffs: MainStatTradeoff[]
}
