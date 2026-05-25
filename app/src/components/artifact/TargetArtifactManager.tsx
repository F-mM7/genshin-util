import { useState } from 'react'
import { SUBSTAT_LABELS } from '../../lib/artifact/constants'
import type { SubstatType, TargetArtifact } from '../../lib/artifact/types'

type Props = {
  selectedSubstats: SubstatType[]
  targetArtifacts: TargetArtifact[]
  onAdd: (next: TargetArtifact[]) => void
  onClear: () => void
}

export default function TargetArtifactManager({
  selectedSubstats,
  targetArtifacts,
  onAdd,
  onClear,
}: Props) {
  const [text, setText] = useState('')
  const [error, setError] = useState('')

  const push = () => {
    if (selectedSubstats.length === 0) {
      setError('サブステを 1 つ以上選択してください')
      return
    }
    const matches = text.match(/[0-9]+\.?[0-9]*/g)
    if (!matches || matches.length % selectedSubstats.length !== 0) {
      setError(`数値の個数を ${selectedSubstats.length} の倍数にしてください`)
      return
    }

    const numbers = matches.map((s) => Number(s))
    const newArtifacts: TargetArtifact[] = []
    for (let i = 0; i < numbers.length; i += selectedSubstats.length) {
      const values: number[] = []
      for (let j = 0; j < selectedSubstats.length; j++) {
        values.push(numbers[i + j])
      }
      newArtifacts.push({ val: values, validity: true })
    }
    onAdd(newArtifacts)
    setText('')
    setError('')
  }

  const handleClear = () => {
    onClear()
    setText('')
    setError('')
  }

  return (
    <div className="space-y-3">
      <div className="flex items-baseline justify-between">
        <h2 className="font-semibold">目標聖遺物（★5）</h2>
        <span className="text-xs text-slate-500">
          {targetArtifacts.length} 件
        </span>
      </div>
      <textarea
        className="input min-h-[5rem] font-mono text-sm"
        value={text}
        placeholder={
          selectedSubstats.length > 0
            ? selectedSubstats.map(() => '0.0').join(' ')
            : 'サブステを選択してください'
        }
        onChange={(e) => setText(e.target.value)}
      />
      <div className="flex items-center gap-2">
        <button className="btn" onClick={push}>
          追加
        </button>
        <button
          className="btn-danger"
          onClick={handleClear}
          disabled={targetArtifacts.length === 0 && !text}
        >
          全クリア
        </button>
        {error ? (
          <span className="text-xs text-rose-400">{error}</span>
        ) : null}
      </div>
      {targetArtifacts.length > 0 ? (
        <div className="overflow-x-auto">
          <table className="table-mini">
            <thead>
              <tr>
                {selectedSubstats.map((s) => (
                  <th key={s} className="text-right">
                    {SUBSTAT_LABELS[s]}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {targetArtifacts.map((a, i) => (
                <tr key={i} className={a.validity ? '' : 'opacity-50'}>
                  {selectedSubstats.map((_, j) => (
                    <td key={j} className="text-right stat">
                      {(a.val[j] ?? 0).toFixed(1)}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : null}
    </div>
  )
}
