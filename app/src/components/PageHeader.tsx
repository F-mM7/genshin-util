import { Link } from 'react-router-dom'
import type { ReactNode } from 'react'

type Props = {
  title: string
  description?: string
  actions?: ReactNode
}

export default function PageHeader({ title, description, actions }: Props) {
  return (
    <header className="flex flex-wrap items-end justify-between gap-3 mb-6">
      <div className="flex flex-col gap-1">
        <Link
          to="/"
          className="text-xs text-slate-400 hover:text-slate-200 transition"
        >
          ← トップに戻る
        </Link>
        <h1 className="text-2xl font-bold tracking-tight">{title}</h1>
        {description ? (
          <p className="text-sm text-slate-400">{description}</p>
        ) : null}
      </div>
      {actions ? <div className="flex gap-2">{actions}</div> : null}
    </header>
  )
}
