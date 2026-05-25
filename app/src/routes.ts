export type Category = '素材' | '樹脂' | 'ダメージ' | '聖遺物'

export type RouteDef = {
  path: string
  title: string
  category: Category
  icon: string
}

export const ROUTES: RouteDef[] = [
  {
    path: '/resin',
    title: '樹脂キャパ',
    category: '樹脂',
    icon: '⏰',
  },
  {
    path: '/talent',
    title: '天賦素材',
    category: '素材',
    icon: '📘',
  },
  {
    path: '/weapon',
    title: '武器突破素材',
    category: '素材',
    icon: '⚔️',
  },
  {
    path: '/damage',
    title: 'ダメージ計算',
    category: 'ダメージ',
    icon: '💥',
  },
  {
    path: '/artifact-exp',
    title: '聖遺物経験値',
    category: '聖遺物',
    icon: '🏵️',
  },
]
