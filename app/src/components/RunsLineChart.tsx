import { useEffect, useRef, useState } from 'react'
import { isCertain } from '../lib/sufficiency'

export type Marker =
  | 'circle'
  | 'square'
  | 'triangle'
  | 'diamond'
  | 'triangleDown'
  | 'cross'

export type RunsSeries = {
  // values[i] = i 周したときの充足確率 (0..1)
  values: number[]
  // 凡例の文言。いずれかの系列に指定があると凡例を表示する
  label?: string
  // 線・点・凡例・数値ラベルの色(CSS色)。省略時は従来の sky-400
  color?: string
  // 点マーカーの形状。省略時は丸
  marker?: Marker
}

type Props = {
  series: RunsSeries[]
}

type PaintProps = { className?: string; style?: { [k: string]: string } }

const strokePaint = (color?: string): PaintProps =>
  color ? { style: { stroke: color } } : { className: 'stroke-sky-400' }
const fillPaint = (color?: string): PaintProps =>
  color ? { style: { fill: color } } : { className: 'fill-sky-400' }

function MarkerShape({
  marker,
  x,
  y,
  paint,
}: {
  marker: Marker
  x: number
  y: number
  paint: PaintProps
}) {
  switch (marker) {
    case 'circle':
      return <circle cx={x} cy={y} r={3} {...paint} />
    case 'square':
      return <rect x={x - 3} y={y - 3} width={6} height={6} {...paint} />
    case 'triangle':
      return (
        <polygon
          points={`${x},${y - 4} ${x + 3.6},${y + 2.6} ${x - 3.6},${y + 2.6}`}
          {...paint}
        />
      )
    case 'triangleDown':
      return (
        <polygon
          points={`${x},${y + 4} ${x + 3.6},${y - 2.6} ${x - 3.6},${y - 2.6}`}
          {...paint}
        />
      )
    case 'diamond':
      return (
        <polygon
          points={`${x},${y - 4} ${x + 4},${y} ${x},${y + 4} ${x - 4},${y}`}
          {...paint}
        />
      )
    case 'cross':
      return (
        <polygon
          points={[
            [-1.2, -4], [1.2, -4], [1.2, -1.2], [4, -1.2], [4, 1.2], [1.2, 1.2],
            [1.2, 4], [-1.2, 4], [-1.2, 1.2], [-4, 1.2], [-4, -1.2], [-1.2, -1.2],
          ]
            .map(([dx, dy]) => `${x + dx},${y + dy}`)
            .join(' ')}
          {...paint}
        />
      )
  }
}

const HEIGHT_PLOT = 220
const PAD_LEFT = 40
const PAD_RIGHT = 12
const PAD_BOTTOM = 24
const DEFAULT_WIDTH = 640
const Y_TICKS = [0, 0.25, 0.5, 0.75, 1]

// 等幅フォント 1 文字の幅 ≒ 0.6em
const CHAR_EM = 0.6
// 数値ラベルの最大文字数 ("100.0%")
const LABEL_CHARS = 6
const LABEL_FONT_MAX = 11
const LABEL_FONT_MIN = 6
const HORIZONTAL_FONT_MIN = 9
const LABEL_GAP = 6

const formatProbability = (p: number) => `${(p * 100).toFixed(1)}%`

const clamp = (v: number, lo: number, hi: number) =>
  Math.min(hi, Math.max(lo, v))

export default function RunsLineChart({ series }: Props) {
  const wrapperRef = useRef<HTMLDivElement>(null)
  const [width, setWidth] = useState(DEFAULT_WIDTH)

  useEffect(() => {
    const el = wrapperRef.current
    if (!el) return
    const update = () => {
      const w = el.clientWidth
      if (w > 0) setWidth(w)
    }
    update()
    const observer = new ResizeObserver(update)
    observer.observe(el)
    return () => observer.disconnect()
  }, [])

  const n = Math.max(0, ...series.map((s) => s.values.length))
  const showLegend = series.some((s) => s.label !== undefined)
  const segments = Math.max(1, n - 1)
  const plotOuterWidth = width - PAD_LEFT - PAD_RIGHT

  // 点間隔から数値ラベルの向きと文字サイズを決める
  //   横書きが収まるなら横書き、収まらなければ縦書き(-90°)で点間隔に合わせて縮小
  const roughSpacing = plotOuterWidth / segments
  const horizontalFont = Math.min(
    LABEL_FONT_MAX,
    (roughSpacing - 4) / (LABEL_CHARS * CHAR_EM),
  )
  const rotated = horizontalFont < HORIZONTAL_FONT_MIN
  const labelFont = rotated
    ? clamp(roughSpacing - 1, LABEL_FONT_MIN, LABEL_FONT_MAX)
    : horizontalFont
  const labelLength = LABEL_CHARS * CHAR_EM * labelFont

  // 端の点のラベルがはみ出さないよう、横方向に内側余白をとる
  const inset = rotated ? labelFont / 2 + 2 : labelLength / 2
  const padTop = rotated ? labelLength + LABEL_GAP + 4 : labelFont + LABEL_GAP + 4
  const height = padTop + HEIGHT_PLOT + PAD_BOTTOM

  const xStart = PAD_LEFT + inset
  const xEnd = width - PAD_RIGHT - inset
  const spacing = n > 1 ? (xEnd - xStart) / (n - 1) : 0
  const xOf = (i: number) => (n > 1 ? xStart + spacing * i : (xStart + xEnd) / 2)
  const yOf = (p: number) => padTop + HEIGHT_PLOT * (1 - clamp(p, 0, 1))

  // 横軸の目盛り数値(周回数)も点間隔に合わせて縮小する
  const xTickChars = String(Math.max(0, n - 1)).length
  const xTickFont =
    n > 1
      ? clamp((spacing - 2) / (xTickChars * CHAR_EM), LABEL_FONT_MIN, 11)
      : 11

  const xIndices = Array.from({ length: n }, (_, i) => i)
  const plotted = series.map((s, k) => {
    const points = s.values.map((p, i) => ({ x: xOf(i), y: yOf(p), p, i }))
    const path = points
      .map((pt, i) => `${i === 0 ? 'M' : 'L'}${pt.x.toFixed(2)},${pt.y.toFixed(2)}`)
      .join(' ')
    return { k, label: s.label, color: s.color, marker: s.marker ?? 'circle', points, path }
  })

  return (
    <div ref={wrapperRef} className="w-full">
      {showLegend && (
        <div className="flex flex-wrap gap-x-4 gap-y-1 mb-2 text-xs">
          {plotted.map((s) => (
            <div
              key={s.k}
              className={`flex items-center gap-1 ${s.color ? '' : 'text-sky-400'}`}
              style={s.color ? { color: s.color } : undefined}
            >
              <svg width={18} height={10} className="block">
                <line
                  x1={1}
                  x2={17}
                  y1={5}
                  y2={5}
                  {...strokePaint(s.color)}
                  strokeWidth={2}
                  strokeLinecap="round"
                />
                <MarkerShape marker={s.marker} x={9} y={5} paint={fillPaint(s.color)} />
              </svg>
              <span>{s.label}</span>
            </div>
          ))}
        </div>
      )}
      <svg
        viewBox={`0 0 ${width} ${height}`}
        width="100%"
        className="block"
        role="img"
      >
        {Y_TICKS.map((t) => (
          <g key={t}>
            <line
              x1={PAD_LEFT}
              x2={width - PAD_RIGHT}
              y1={yOf(t)}
              y2={yOf(t)}
              className="stroke-slate-800"
              strokeWidth={1}
            />
            <text
              x={PAD_LEFT - 6}
              y={yOf(t)}
              textAnchor="end"
              dominantBaseline="middle"
              fontSize={11}
              className="fill-slate-400 stat"
            >
              {`${t * 100}%`}
            </text>
          </g>
        ))}

        {xIndices.map((i) => (
          <text
            key={`x-${i}`}
            x={xOf(i)}
            y={padTop + HEIGHT_PLOT + 6}
            textAnchor="middle"
            dominantBaseline="hanging"
            fontSize={xTickFont}
            className="fill-slate-400 stat"
          >
            {i}
          </text>
        ))}

        {plotted.map((s) => (
          <g key={`s-${s.k}`}>
            <path
              d={s.path}
              fill="none"
              {...strokePaint(s.color)}
              strokeWidth={2}
              strokeLinejoin="round"
              strokeLinecap="round"
            />
            {s.points.map((pt) => (
              <MarkerShape
                key={`p-${pt.i}`}
                marker={s.marker}
                x={pt.x}
                y={pt.y}
                paint={fillPaint(s.color)}
              />
            ))}
          </g>
        ))}

        {plotted.flatMap((s) => s.points.map((pt) => {
          const certain = isCertain(pt.p)
          const seriesColor = showLegend && !certain ? s.color : undefined
          const colorClass = certain
            ? 'stat-pos'
            : seriesColor
              ? ''
              : showLegend
                ? 'text-sky-400'
                : 'text-slate-100'
          const common = {
            fontSize: labelFont,
            fill: 'currentColor',
            className: `stat ${colorClass} stroke-slate-900`,
            style: seriesColor ? { color: seriesColor } : undefined,
            strokeWidth: 3,
            strokeLinejoin: 'round' as const,
            paintOrder: 'stroke',
          }
          return rotated ? (
            <text
              key={`l-${s.k}-${pt.i}`}
              transform={`translate(${pt.x} ${pt.y - LABEL_GAP}) rotate(-90)`}
              textAnchor="start"
              dominantBaseline="central"
              {...common}
            >
              {formatProbability(pt.p)}
            </text>
          ) : (
            <text
              key={`l-${s.k}-${pt.i}`}
              x={pt.x}
              y={pt.y - LABEL_GAP}
              textAnchor="middle"
              {...common}
            >
              {formatProbability(pt.p)}
            </text>
          )
        }))}
      </svg>
    </div>
  )
}
