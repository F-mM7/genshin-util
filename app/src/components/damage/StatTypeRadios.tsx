import type { StatType } from '../../lib/damage/types'

const OPTIONS: { value: StatType; label: string }[] = [
  { value: 'attack', label: '攻撃力' },
  { value: 'defense', label: '防御力' },
  { value: 'hp', label: 'HP' },
]

type Props = {
  value: StatType
  onChange: (next: StatType) => void
}

export default function StatTypeRadios({ value, onChange }: Props) {
  return (
    <div className="flex items-center gap-3 flex-wrap">
      <span className="label">参照ステータス</span>
      <div className="flex gap-3">
        {OPTIONS.map((o) => (
          <label
            key={o.value}
            className="flex items-center gap-1.5 text-sm cursor-pointer"
          >
            <input
              type="radio"
              name="damage-stat-type"
              checked={value === o.value}
              onChange={() => onChange(o.value)}
              className="accent-sky-500"
            />
            <span>{o.label}</span>
          </label>
        ))}
      </div>
    </div>
  )
}
