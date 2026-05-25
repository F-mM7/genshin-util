import { Link } from 'react-router-dom'
import { ROUTES, type Category } from '../routes'

const CATEGORY_ORDER: Category[] = ['聖遺物', '樹脂', '素材', 'ダメージ']

export default function Home() {
  const grouped = CATEGORY_ORDER.map((cat) => ({
    category: cat,
    items: ROUTES.filter((r) => r.category === cat),
  })).filter((g) => g.items.length > 0)

  return (
    <div className="space-y-10">
      <section className="text-center pt-8 pb-2">
        <h1 className="text-3xl sm:text-4xl font-bold tracking-tight">
          原神ユーティリティ
        </h1>
      </section>

      {grouped.map((g) => (
        <section key={g.category}>
          <h2 className="text-lg font-semibold text-slate-300 mb-3">
            {g.category}
          </h2>
          <div className="grid gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3">
            {g.items.map((r) => (
              <Link
                key={r.path}
                to={r.path}
                className="card card-hover p-4 flex gap-3 items-center"
              >
                <div className="text-3xl leading-none">{r.icon}</div>
                <div className="flex-1 min-w-0">
                  <div className="text-base font-semibold">{r.title}</div>
                </div>
              </Link>
            ))}
          </div>
        </section>
      ))}
    </div>
  )
}
