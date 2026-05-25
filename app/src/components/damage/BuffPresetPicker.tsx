import { useMemo, useState } from 'react'
import {
  BUFF_PRESETS,
  PRESET_CATEGORIES,
  getCategoryLabel,
  getElementTypeLabel,
  getWeaponTypeLabel,
} from '../../lib/damage/presets'
import type {
  BuffCard,
  BuffPreset,
  ElementType,
  PresetCategory,
  WeaponType,
} from '../../lib/damage/types'

type Props = {
  onAdd: (card: BuffCard) => void
}

function presetToCard(preset: BuffPreset): BuffCard {
  return {
    id: Math.random().toString(36).slice(2, 10),
    name: preset.title,
    stats: preset.buffs.map((b) => ({ ...b })),
  }
}

function subCategoryLabel(preset: BuffPreset): string | null {
  if (!preset.subCategory) return null
  if (preset.category === 'weapon') {
    return getWeaponTypeLabel(preset.subCategory as WeaponType)
  }
  if (preset.category === 'character') {
    return getElementTypeLabel(preset.subCategory as ElementType)
  }
  return null
}

export default function BuffPresetPicker({ onAdd }: Props) {
  const [category, setCategory] = useState<PresetCategory | 'all'>('all')
  const [query, setQuery] = useState('')

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase()
    return BUFF_PRESETS.filter((p) => {
      if (category !== 'all' && p.category !== category) return false
      if (q && !p.title.toLowerCase().includes(q)) return false
      return true
    })
  }, [category, query])

  return (
    <div className="space-y-2">
      <div className="flex flex-wrap gap-2 items-center">
        <select
          className="input w-32"
          value={category}
          onChange={(e) =>
            setCategory(e.target.value as PresetCategory | 'all')
          }
        >
          <option value="all">全カテゴリ</option>
          {PRESET_CATEGORIES.map((c) => (
            <option key={c} value={c}>
              {getCategoryLabel(c)}
            </option>
          ))}
        </select>
        <input
          className="input flex-1 min-w-[8rem]"
          placeholder="バフ名で検索"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
        />
      </div>
      <div className="grid gap-2 grid-cols-1 sm:grid-cols-2 max-h-72 overflow-y-auto pr-1">
        {filtered.map((p) => {
          const sub = subCategoryLabel(p)
          return (
            <button
              key={p.id}
              className="card card-hover p-2 text-left"
              onClick={() => onAdd(presetToCard(p))}
              title={p.remarks ?? ''}
            >
              <div className="text-[10px] text-slate-400">
                {getCategoryLabel(p.category)}
                {sub ? ` / ${sub}` : ''}
              </div>
              <div className="text-sm font-medium">{p.title}</div>
              {p.remarks ? (
                <div className="text-xs text-slate-500 line-clamp-2 mt-0.5">
                  {p.remarks}
                </div>
              ) : null}
            </button>
          )
        })}
        {filtered.length === 0 ? (
          <div className="text-slate-500 text-sm col-span-full text-center py-4">
            該当するプリセットがありません
          </div>
        ) : null}
      </div>
    </div>
  )
}
