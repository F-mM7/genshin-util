import { SUBSTAT_LABELS, SUBSTAT_ORDER } from '../../lib/artifact/constants'
import type { SubstatType } from '../../lib/artifact/types'

type Props = {
  selected: SubstatType[]
  onChange: (next: SubstatType[]) => void
}

const MAX_SUBSTATS = 4

export default function SubstatSelector({ selected, onChange }: Props) {
  const toggle = (s: SubstatType) => {
    if (selected.includes(s)) {
      onChange(selected.filter((x) => x !== s))
    } else if (selected.length < MAX_SUBSTATS) {
      onChange([...selected, s])
    }
  }

  return (
    <div className="space-y-2">
      <div className="flex items-baseline justify-between">
        <h2 className="font-semibold">サブステータス</h2>
        <span className="text-xs text-slate-500">
          選択中 {selected.length} / {MAX_SUBSTATS}
        </span>
      </div>
      <div className="flex flex-wrap gap-2">
        {SUBSTAT_ORDER.map((s) => {
          const active = selected.includes(s)
          const disabled = !active && selected.length >= MAX_SUBSTATS
          return (
            <button
              key={s}
              type="button"
              disabled={disabled}
              className={`btn ${
                active
                  ? 'bg-sky-900/40 border-sky-600 text-sky-100'
                  : disabled
                    ? 'opacity-40 cursor-not-allowed'
                    : ''
              }`}
              onClick={() => toggle(s)}
            >
              {SUBSTAT_LABELS[s]}
            </button>
          )
        })}
      </div>
    </div>
  )
}
