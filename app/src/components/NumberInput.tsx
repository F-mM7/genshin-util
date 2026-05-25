import { useEffect, useState } from 'react'

type Props = {
  value: number
  onChange: (n: number) => void
  step?: number
  min?: number
  max?: number
  className?: string
  id?: string
}

export default function NumberInput({
  value,
  onChange,
  step,
  min,
  max,
  className,
  id,
}: Props) {
  const [text, setText] = useState(String(value))

  useEffect(() => {
    setText((prev) => {
      const parsed = Number(prev)
      if (Number.isFinite(parsed) && parsed === value) return prev
      return String(value)
    })
  }, [value])

  return (
    <input
      id={id}
      type="number"
      inputMode="decimal"
      className={`input-num ${className ?? ''}`}
      value={text}
      step={step}
      min={min}
      max={max}
      onChange={(e) => {
        setText(e.target.value)
        const parsed = Number(e.target.value)
        if (Number.isFinite(parsed)) onChange(parsed)
      }}
      onBlur={() => {
        const parsed = Number(text)
        if (!Number.isFinite(parsed)) {
          setText(String(value))
        } else {
          setText(String(parsed))
        }
      }}
    />
  )
}
