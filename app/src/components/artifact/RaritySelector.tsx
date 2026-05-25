import type { ArtifactRarity } from '../../lib/artifact/types'

const RARITIES: ArtifactRarity[] = [5, 4]

type Props = {
  value: ArtifactRarity
  onChange: (next: ArtifactRarity) => void
}

export default function RaritySelector({ value, onChange }: Props) {
  return (
    <div className="flex items-center gap-2">
      <span className="label w-24 shrink-0">レアリティ</span>
      <div className="flex gap-1">
        {RARITIES.map((r) => (
          <button
            key={r}
            type="button"
            className={`btn ${
              value === r
                ? 'bg-sky-900/40 border-sky-600 text-sky-100'
                : ''
            }`}
            onClick={() => onChange(r)}
          >
            ★{r}
          </button>
        ))}
      </div>
    </div>
  )
}
