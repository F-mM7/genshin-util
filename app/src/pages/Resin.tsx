import { useEffect, useState } from 'react'
import PageHeader from '../components/PageHeader'
import NumberInput from '../components/NumberInput'
import { useLocalStorage } from '../lib/useLocalStorage'
import { fmt } from '../lib/format'

type State = {
  /** datetime-local 形式 'YYYY-MM-DDTHH:mm' */
  accessAt: string
  currentResin: number
  fragileResin: number
  /** アクセス予定時刻までに消費する樹脂量 */
  plannedSpend: number
}

const makeInitial = (): State => ({
  accessAt: nextHour(5, new Date()),
  currentResin: 30,
  fragileResin: 2,
  plannedSpend: 0,
})

function pad2(n: number) {
  return String(n).padStart(2, '0')
}

function toLocalIso(d: Date): string {
  return (
    `${d.getFullYear()}-${pad2(d.getMonth() + 1)}-${pad2(d.getDate())}` +
    `T${pad2(d.getHours())}:${pad2(d.getMinutes())}`
  )
}

/** datetime-local 形式の文字列を Date に変換。無効なら null を返す */
function parseLocalIso(s: string): Date | null {
  if (!s) return null
  const m = /^(\d{4})-(\d{2})-(\d{2})T(\d{2}):(\d{2})$/.exec(s)
  if (!m) return null
  const [, y, mo, d, h, mi] = m
  const date = new Date(
    Number(y),
    Number(mo) - 1,
    Number(d),
    Number(h),
    Number(mi)
  )
  return Number.isNaN(date.getTime()) ? null : date
}

/** 'YYYY-MM-DD' + 'HH:MM' を combined ISO に */
function combine(date: string, time: string): string {
  if (!date || !time) return ''
  // time が 'HH:MM:SS' で来た場合は最初の 5 文字だけ採用
  return `${date}T${time.slice(0, 5)}`
}

/** 現在より未来の次の指定時刻 (hour:00) */
function nextHour(hour: number, from: Date): string {
  const t = new Date(from)
  t.setSeconds(0, 0)
  t.setHours(hour, 0)
  if (t.getTime() <= from.getTime()) t.setDate(t.getDate() + 1)
  return toLocalIso(t)
}

/** 現在より未来の、指定曜日 (0=日, 3=水...) の指定時刻 */
function nextWeekday(weekday: number, hour: number, from: Date): string {
  const t = new Date(from)
  t.setSeconds(0, 0)
  t.setHours(hour, 0)
  const diff = (weekday - t.getDay() + 7) % 7
  if (diff === 0 && t.getTime() <= from.getTime()) {
    t.setDate(t.getDate() + 7)
  } else if (diff > 0) {
    t.setDate(t.getDate() + diff)
  }
  return toLocalIso(t)
}

const WEEKDAY_JP = ['日', '月', '火', '水', '木', '金', '土']

function clamp(n: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, n))
}

function ResinRow({
  id,
  label,
  value,
  min,
  max,
  steps,
  onChange,
  onShift,
}: {
  id: string
  label: string
  value: number
  min?: number
  max?: number
  steps: number[]
  onChange: (v: number) => void
  onShift: (delta: number) => void
}) {
  return (
    <div className="flex items-center gap-2 flex-wrap">
      <label htmlFor={id} className="label w-24 shrink-0">
        {label}
      </label>
      <div className="w-28">
        <NumberInput
          id={id}
          value={value}
          min={min}
          max={max}
          onChange={onChange}
        />
      </div>
      <div className="flex gap-1 flex-wrap">
        {steps.map((s) => (
          <button
            key={s}
            className="btn"
            onClick={() => onShift(s)}
            aria-label={`${label}を${s > 0 ? s : -s}${s > 0 ? '増やす' : '減らす'}`}
          >
            {s > 0 ? `+${s}` : `−${-s}`}
          </button>
        ))}
      </div>
    </div>
  )
}

export default function Resin() {
  const [state, setState, reset] = useLocalStorage<State>('resin', makeInitial)
  const [now, setNow] = useState(() => new Date())

  useEffect(() => {
    const id = window.setInterval(() => setNow(new Date()), 30 * 1000)
    return () => window.clearInterval(id)
  }, [])

  const accessDate = parseLocalIso(state.accessAt)
  const datePart = state.accessAt ? state.accessAt.split('T')[0] : ''
  const timePart = state.accessAt ? state.accessAt.split('T')[1] ?? '' : ''
  const remainMin = accessDate
    ? (accessDate.getTime() - now.getTime()) / 1000 / 60
    : 0
  const recover = remainMin / 8
  const capacity = 200 - state.currentResin + (5 - state.fragileResin) * 60
  const overflow = Math.max(0, recover - capacity)
  const disposable = Math.max(0, overflow - state.plannedSpend)
  const isPast = remainMin < 0

  const setAccess = (iso: string) =>
    setState((s) => ({ ...s, accessAt: iso }))
  const shiftDate = (days: number) => {
    setState((s) => {
      const d = parseLocalIso(s.accessAt)
      if (!d) return s
      d.setDate(d.getDate() + days)
      return { ...s, accessAt: toLocalIso(d) }
    })
  }
  const shiftHour = (hours: number) => {
    setState((s) => {
      const d = parseLocalIso(s.accessAt)
      if (!d) return s
      d.setHours(d.getHours() + hours)
      return { ...s, accessAt: toLocalIso(d) }
    })
  }
  const onDateInput = (v: string) => {
    if (!v) return
    setState((s) => {
      const t = s.accessAt.split('T')[1] ?? '00:00'
      return { ...s, accessAt: combine(v, t) }
    })
  }
  const onTimeInput = (v: string) => {
    if (!v) return
    setState((s) => {
      const d = s.accessAt.split('T')[0] || toLocalIso(new Date()).split('T')[0]
      return { ...s, accessAt: combine(d, v) }
    })
  }

  return (
    <div>
      <PageHeader
        title="樹脂キャパ"
        actions={
          <button className="btn-danger" onClick={reset}>
            初期値に戻す
          </button>
        }
      />

      <div className="grid gap-4 md:grid-cols-2">
        <div className="card p-4">
          <h2 className="font-semibold mb-3">入力</h2>
          <div className="space-y-3">
            <div className="flex items-center gap-3">
              <label htmlFor="date" className="label w-24 shrink-0">
                日付
              </label>
              <input
                id="date"
                type="date"
                className="input flex-1"
                value={datePart}
                onChange={(e) => onDateInput(e.target.value)}
              />
              <button
                className="btn"
                onClick={() => shiftDate(-1)}
                aria-label="日付を1日戻す"
              >
                −1d
              </button>
              <button
                className="btn"
                onClick={() => shiftDate(1)}
                aria-label="日付を1日進める"
              >
                +1d
              </button>
            </div>
            <div className="flex items-center gap-3">
              <label htmlFor="time" className="label w-24 shrink-0">
                時刻
              </label>
              <input
                id="time"
                type="time"
                className="input flex-1"
                value={timePart.slice(0, 5)}
                onChange={(e) => onTimeInput(e.target.value)}
              />
              <button
                className="btn"
                onClick={() => shiftHour(-1)}
                aria-label="時刻を1時間戻す"
              >
                −1h
              </button>
              <button
                className="btn"
                onClick={() => shiftHour(1)}
                aria-label="時刻を1時間進める"
              >
                +1h
              </button>
            </div>
            <div className="flex items-center gap-3">
              <label className="label w-24 shrink-0">クイック設定</label>
              <div className="flex flex-wrap gap-2">
                <button
                  className="btn"
                  onClick={() => setAccess(nextHour(5, now))}
                >
                  次の 5 時
                </button>
                <button
                  className="btn"
                  onClick={() => setAccess(nextWeekday(3, 5, now))}
                >
                  次の水曜 5 時
                </button>
              </div>
            </div>
            <ResinRow
              id="cur"
              label="現在樹脂"
              value={state.currentResin}
              min={0}
              max={200}
              steps={[-10, -1, 1, 10]}
              onChange={(v) =>
                setState((s) => ({ ...s, currentResin: v }))
              }
              onShift={(delta) =>
                setState((s) => ({
                  ...s,
                  currentResin: clamp(s.currentResin + delta, 0, 200),
                }))
              }
            />
            <ResinRow
              id="frag"
              label="濃縮樹脂"
              value={state.fragileResin}
              min={0}
              max={5}
              steps={[-1, 1]}
              onChange={(v) =>
                setState((s) => ({ ...s, fragileResin: v }))
              }
              onShift={(delta) =>
                setState((s) => ({
                  ...s,
                  fragileResin: clamp(s.fragileResin + delta, 0, 5),
                }))
              }
            />
            <ResinRow
              id="spend"
              label="消費予定"
              value={state.plannedSpend}
              min={0}
              steps={[-30, -20, 20, 30]}
              onChange={(v) =>
                setState((s) => ({ ...s, plannedSpend: v }))
              }
              onShift={(delta) =>
                setState((s) => ({
                  ...s,
                  plannedSpend: Math.max(0, s.plannedSpend + delta),
                }))
              }
            />
          </div>
        </div>

        <div className="card p-4">
          <h2 className="font-semibold mb-3">結果</h2>
          <dl className="space-y-2 text-sm">
            <Row label="現在時刻" value={formatDate(now)} />
            <Row
              label="アクセス時刻"
              value={accessDate ? formatDate(accessDate) : '-'}
              valueClass={isPast ? 'stat-neg' : ''}
            />
            <Row
              label="残り(分)"
              value={fmt(remainMin, 1)}
              valueClass={isPast ? 'stat-neg' : ''}
            />
            <Row
              label="残り(時間)"
              value={fmt(remainMin / 60, 2)}
              valueClass={isPast ? 'stat-neg' : ''}
            />
            <Row label="回復樹脂" value={fmt(Math.max(0, recover), 1)} />
            <Row label="キャパ" value={fmt(capacity)} />
            <Row
              label="あふれる"
              value={fmt(overflow, 1)}
              valueClass={overflow > 0 ? 'stat-neg' : 'stat-pos'}
            />
            <Row
              label="可処分"
              value={fmt(disposable, 1)}
              valueClass={disposable > 0 ? 'stat-neg' : 'stat-pos'}
            />
          </dl>
          {isPast ? (
            <p className="mt-3 text-xs text-rose-400">
              アクセス予定時刻が現在より過去になっています。
            </p>
          ) : null}
        </div>
      </div>
    </div>
  )
}

function formatDate(d: Date): string {
  return (
    `${d.getFullYear()}-${pad2(d.getMonth() + 1)}-${pad2(d.getDate())}` +
    `(${WEEKDAY_JP[d.getDay()]}) ${pad2(d.getHours())}:${pad2(d.getMinutes())}`
  )
}

function Row({
  label,
  value,
  valueClass,
}: {
  label: string
  value: string
  valueClass?: string
}) {
  return (
    <div className="flex justify-between border-b border-slate-800/60 py-1">
      <dt className="label">{label}</dt>
      <dd className={`stat ${valueClass ?? ''}`}>{value}</dd>
    </div>
  )
}
