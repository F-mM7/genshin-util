export type SubstatType =
  | 'Elemental_Mastery'
  | 'DEF'
  | 'Energy_Recharge'
  | 'CRIT_Rate'
  | 'CRIT_DMG'

export type MaterialType = 'lv1' | 'lv2' | 'lv3' | 'lv4' | 'unc' | 'ess'

export type ArtifactRarity = 4 | 5

export type SubstatValues = Partial<Record<SubstatType, number>>

export type MaterialToggleState = Record<MaterialType, boolean>

export type MaterialUsage = Record<MaterialType, number>

export type TargetArtifact = {
  val: number[]
  validity: boolean
}

export type TargetLevel = number | 'auto'
