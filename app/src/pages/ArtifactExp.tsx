import { useCallback, useEffect, useMemo } from 'react'
import PageHeader from '../components/PageHeader'
import RaritySelector from '../components/artifact/RaritySelector'
import SubstatSelector from '../components/artifact/SubstatSelector'
import ArtifactEnhancer from '../components/artifact/ArtifactEnhancer'
import MaterialCalculator from '../components/artifact/MaterialCalculator'
import TargetArtifactManager from '../components/artifact/TargetArtifactManager'
import { useLocalStorage } from '../lib/useLocalStorage'
import {
  applyExpGain,
  calculateSubstatValue,
  display,
  getMaxLevel,
  planMaterials,
} from '../lib/artifact/calc'
import { CALCULATION_CONSTANTS } from '../lib/artifact/constants'
import type {
  ArtifactRarity,
  MaterialToggleState,
  MaterialType,
  SubstatType,
  SubstatValues,
  TargetArtifact,
  TargetLevel,
} from '../lib/artifact/types'

type State = {
  rarity: ArtifactRarity
  level: number
  exp: number
  selectedSubstats: SubstatType[]
  substatValues: SubstatValues
  enabledMaterials: MaterialToggleState
  targetArtifacts: TargetArtifact[]
  capDivisor: number
  targetLevel: TargetLevel
}

const INITIAL: State = {
  rarity: 5,
  level: 0,
  exp: 0,
  selectedSubstats: ['CRIT_Rate', 'CRIT_DMG'],
  substatValues: {},
  enabledMaterials: {
    lv1: true,
    lv2: true,
    lv3: true,
    lv4: true,
    unc: true,
    ess: false,
  },
  targetArtifacts: [],
  capDivisor: 2,
  targetLevel: 'auto',
}

export default function ArtifactExp() {
  const [state, setState, reset] = useLocalStorage<State>(
    'artifact-exp-v1',
    INITIAL
  )

  const maxLevel = getMaxLevel(state.rarity)

  useEffect(() => {
    setState((s) => {
      const next = { ...s.substatValues }
      let changed = false
      for (const sub of s.selectedSubstats) {
        if (next[sub] === undefined) {
          next[sub] = parseFloat(
            display(
              calculateSubstatValue(
                sub,
                CALCULATION_CONSTANTS.HIGH_ROLL_MULTIPLIER
              )
            )
          )
          changed = true
        }
      }
      return changed ? { ...s, substatValues: next } : s
    })
  }, [state.selectedSubstats, setState])

  const plan = useMemo(
    () =>
      planMaterials({
        selectedSubstats: state.selectedSubstats,
        substatValues: state.substatValues,
        level: state.level,
        exp: state.exp,
        targetArtifacts: state.targetArtifacts,
        enabledMaterials: state.enabledMaterials,
        capDivisor: state.capDivisor,
        targetLevel: state.targetLevel,
        rarity: state.rarity,
      }),
    [
      state.selectedSubstats,
      state.substatValues,
      state.level,
      state.exp,
      state.targetArtifacts,
      state.enabledMaterials,
      state.capDivisor,
      state.targetLevel,
      state.rarity,
    ]
  )

  const handleRarityChange = useCallback(
    (rarity: ArtifactRarity) => {
      setState((s) => {
        const newMax = getMaxLevel(rarity)
        return {
          ...s,
          rarity,
          level: Math.min(s.level, newMax),
          targetLevel:
            typeof s.targetLevel === 'number' && s.targetLevel > newMax
              ? 'auto'
              : s.targetLevel,
          targetArtifacts: rarity === 4 ? [] : s.targetArtifacts,
        }
      })
    },
    [setState]
  )

  const handleSubstatChange = useCallback(
    (selectedSubstats: SubstatType[]) => {
      setState((s) => ({
        ...s,
        selectedSubstats,
        targetArtifacts: [],
      }))
    },
    [setState]
  )

  const handleSubstatValueChange = useCallback(
    (substat: SubstatType, value: number) => {
      setState((s) => ({
        ...s,
        substatValues: { ...s.substatValues, [substat]: value },
      }))
    },
    [setState]
  )

  const handleMaterialToggle = useCallback(
    (mat: MaterialType) => {
      setState((s) => ({
        ...s,
        enabledMaterials: {
          ...s.enabledMaterials,
          [mat]: !s.enabledMaterials[mat],
        },
      }))
    },
    [setState]
  )

  const handleExpGain = useCallback(
    (multiplier: number) => {
      const totalGain = plan.givenExp * multiplier
      if (totalGain <= 0) return
      setState((s) => {
        const r = applyExpGain(s.level, s.exp, totalGain, s.rarity)
        return { ...s, level: r.level, exp: r.exp }
      })
    },
    [plan.givenExp, setState]
  )

  const handleResetLevel = useCallback(() => {
    setState((s) => ({ ...s, level: 0, exp: 0 }))
  }, [setState])

  return (
    <div>
      <PageHeader
        title="聖遺物経験値"
        actions={
          <button className="btn-danger" onClick={reset}>
            初期値に戻す
          </button>
        }
      />

      <div className="space-y-4">
        <div className="grid gap-4 lg:grid-cols-2">
          <div className="card p-4 space-y-4">
            <RaritySelector
              value={state.rarity}
              onChange={handleRarityChange}
            />
            <SubstatSelector
              selected={state.selectedSubstats}
              onChange={handleSubstatChange}
            />
          </div>

          <div className="card p-4">
            <ArtifactEnhancer
              level={state.level}
              exp={state.exp}
              maxLevel={maxLevel}
              selectedSubstats={state.selectedSubstats}
              substatValues={state.substatValues}
              onLevelChange={(level) => setState((s) => ({ ...s, level }))}
              onExpChange={(exp) => setState((s) => ({ ...s, exp }))}
              onSubstatValueChange={handleSubstatValueChange}
              onReset={handleResetLevel}
            />
          </div>
        </div>

        {state.rarity === 5 ? (
          <div className="card p-4">
            <TargetArtifactManager
              selectedSubstats={state.selectedSubstats}
              targetArtifacts={state.targetArtifacts}
              onAdd={(arts) =>
                setState((s) => ({
                  ...s,
                  targetArtifacts: [...s.targetArtifacts, ...arts],
                }))
              }
              onClear={() =>
                setState((s) => ({ ...s, targetArtifacts: [] }))
              }
            />
          </div>
        ) : null}

        <div className="card p-4">
          <MaterialCalculator
            expReq={plan.expReq}
            expCap={plan.expCap}
            givenExp={plan.givenExp}
            materialUsage={plan.materialUsage}
            currentStepEnd={plan.currentStepEnd}
            futureMaterialUsages={plan.futureMaterialUsages}
            futureStepEnds={plan.futureStepEnds}
            enabledMaterials={state.enabledMaterials}
            capDivisor={state.capDivisor}
            targetLevel={state.targetLevel}
            maxLevel={maxLevel}
            onMaterialToggle={handleMaterialToggle}
            onExpGain={handleExpGain}
            onCapDivisorChange={(d) =>
              setState((s) => ({ ...s, capDivisor: d }))
            }
            onTargetLevelChange={(lv) =>
              setState((s) => ({ ...s, targetLevel: lv }))
            }
          />
        </div>
      </div>
    </div>
  )
}
