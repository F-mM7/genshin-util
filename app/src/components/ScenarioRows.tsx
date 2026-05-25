import { fmt, signClass } from '../lib/format'

type Props = {
  rarities: readonly number[]
  title: string
  gain: Record<number, number>
  surplus: Record<number, number>
  decimals?: number
}

export default function ScenarioRows({
  rarities,
  title,
  gain,
  surplus,
  decimals = 0,
}: Props) {
  return (
    <>
      <tr>
        <td rowSpan={2} className="font-medium align-top">
          {title}
        </td>
        <td className="text-slate-400">繰上獲得</td>
        {rarities.map((r) => (
          <td key={r} className="text-right stat text-slate-300">
            {fmt(gain[r], decimals)}
          </td>
        ))}
      </tr>
      <tr className="border-b border-slate-800">
        <td className="text-slate-400">最終余り</td>
        {rarities.map((r) => (
          <td
            key={r}
            className={`text-right stat ${signClass(surplus[r])}`}
          >
            {fmt(surplus[r], decimals)}
          </td>
        ))}
      </tr>
    </>
  )
}
