export type Category = '素材' | '樹脂' | 'ダメージ' | '聖遺物'

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
    description: '武器のレアリティと現在→目標突破段階から必要素材数と充足確率を計算',
    category: '素材',
    icon: '⚔️',
  },
  {
    path: '/damage',
    title: 'ダメージ計算',
    description: 'ステータスとバフから評価値・会心バランス・杯トレードオフを計算',
    category: 'ダメージ',
    icon: '💥',
  },
  {
    path: '/artifact-exp',
    title: '聖遺物経験値',
    description: '現在Lv→目標Lvに必要な聖遺物経験値素材を最小コストで算出',
    category: '聖遺物',
    icon: '🏵️',
  },
]
