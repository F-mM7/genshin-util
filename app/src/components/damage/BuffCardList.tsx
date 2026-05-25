import type { BuffCard } from '../../lib/damage/types'
import BuffCardForm from './BuffCardForm'
import BuffPresetPicker from './BuffPresetPicker'

type Props = {
  buffs: BuffCard[]
  onChange: (next: BuffCard[]) => void
}

function newCard(): BuffCard {
  return {
    id: Math.random().toString(36).slice(2, 10),
    name: '新規バフ',
    stats: [{ type: 'attack', value: 0, isPercentage: true }],
  }
}

export default function BuffCardList({ buffs, onChange }: Props) {
  const addNew = () => onChange([...buffs, newCard()])
  const updateCard = (index: number, next: BuffCard) =>
    onChange(buffs.map((b, i) => (i === index ? next : b)))
  const removeCard = (index: number) =>
    onChange(buffs.filter((_, i) => i !== index))
  const addFromPreset = (card: BuffCard) => onChange([...buffs, card])
  const clearAll = () => onChange([])

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <h2 className="font-semibold">
          バフ <span className="text-slate-500 text-sm">({buffs.length})</span>
        </h2>
        <div className="flex gap-2">
          {buffs.length > 0 ? (
            <button className="btn" onClick={clearAll}>
              全消去
            </button>
          ) : null}
          <button className="btn" onClick={addNew}>
            ＋ 空のバフ
          </button>
        </div>
      </div>

      <div className="space-y-2">
        {buffs.map((b, i) => (
          <BuffCardForm
            key={b.id}
            card={b}
            onChange={(next) => updateCard(i, next)}
            onRemove={() => removeCard(i)}
          />
        ))}
      </div>

      <div className="border-t border-slate-800 pt-3">
        <h3 className="font-semibold text-sm mb-2">プリセットから追加</h3>
        <BuffPresetPicker onAdd={addFromPreset} />
      </div>
    </div>
  )
}
