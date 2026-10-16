import { SYNTH_AMOUNTS } from '../lib/synthesis'

const SMALL_BTN =
  'h-6 shrink-0 flex items-center justify-center rounded bg-white/[0.04] hover:bg-white/[0.08] text-neutral-300 text-xs disabled:opacity-40 disabled:cursor-not-allowed disabled:hover:bg-white/[0.04]'

type Props = {
  disabled: boolean
  onSynth: (n: number) => void
}

export default function SynthButtons({ disabled, onSynth }: Props) {
  return (
    <>
      {SYNTH_AMOUNTS.map((n) => (
        <button
          key={n}
          type="button"
          tabIndex={-1}
          className={`${SMALL_BTN} px-1.5`}
          onClick={() => onSynth(n)}
          disabled={disabled}
        >
          x{n}
        </button>
      ))}
    </>
  )
}
