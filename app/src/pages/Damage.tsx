import { useMemo } from 'react'
import PageHeader from '../components/PageHeader'
import StatTypeRadios from '../components/damage/StatTypeRadios'
import StatsForm from '../components/damage/StatsForm'
import BuffCardList from '../components/damage/BuffCardList'
import CalculationResult from '../components/damage/CalculationResult'
import { useLocalStorage } from '../lib/useLocalStorage'
import { calculateDamage } from '../lib/damage/calc'
import { DEFAULT_STATS } from '../lib/damage/constants'
import type { BuffCard, StatType, Stats } from '../lib/damage/types'

type State = {
  stats: Stats
  buffs: BuffCard[]
  statType: StatType
}

const INITIAL: State = {
  stats: DEFAULT_STATS,
  buffs: [],
  statType: 'attack',
}

export default function Damage() {
  const [state, setState, reset] = useLocalStorage<State>('damage-v1', INITIAL)

  const result = useMemo(
    () => calculateDamage(state.stats, state.buffs, state.statType),
    [state.stats, state.buffs, state.statType]
  )

  return (
    <div>
      <PageHeader
        title="ダメージ計算"
        actions={
          <button className="btn-danger" onClick={reset}>
            初期値に戻す
          </button>
        }
      />

      <div className="grid gap-4 lg:grid-cols-2">
        <div className="space-y-4">
          <div className="card p-4 space-y-4">
            <StatTypeRadios
              value={state.statType}
              onChange={(statType) => setState((s) => ({ ...s, statType }))}
            />
            <StatsForm
              stats={state.stats}
              statType={state.statType}
              onChange={(stats) => setState((s) => ({ ...s, stats }))}
            />
          </div>
          <div className="card p-4">
            <BuffCardList
              buffs={state.buffs}
              onChange={(buffs) => setState((s) => ({ ...s, buffs }))}
            />
          </div>
        </div>
        <CalculationResult
          result={result}
          stats={state.stats}
          buffs={state.buffs}
          statType={state.statType}
        />
      </div>
    </div>
  )
}
