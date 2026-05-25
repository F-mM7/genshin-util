export type Category = '素材' | '樹脂'

export type RouteDef = {
  path: string
  title: string
  description: string
  category: Category
  icon: string
}

export const ROUTES: RouteDef[] = [
  {
    path: '/resin',
    title: '樹脂キャパ',
    description: 'アクセス予定日時までの樹脂回復量とあふれを計算',
    category: '樹脂',
    icon: '⏰',
  },
  {
    path: '/talent',
    title: '天賦素材',
    description: '現在Lv→目標Lvに必要な天賦本と所持差分',
    category: '素材',
    icon: '📘',
  },
  {
    path: '/weapon',
    title: '武器突破素材',
    description: '武器突破素材の必要数と所持差分（繰上含む）',
    category: '素材',
    icon: '⚔️',
  },
]
