import type {
  BuffPreset,
  ElementType,
  PresetCategory,
  WeaponType,
} from './types'

const WEAPON_PRESETS: BuffPreset[] = [
  {
    id: 'weapon-souyo',
    title: '蒼耀',
    category: 'weapon',
    subCategory: 'sword',
    remarks: 'スカーク向け片手剣。攻撃力と会心ダメージを大幅上昇',
    buffs: [
      { type: 'attack', value: 48, isPercentage: true },
      { type: 'critDamage', value: 40, isPercentage: false },
    ],
  },
  {
    id: 'weapon-shuenwonagekuuta-c4',
    title: '終焉を嘆く詩4凸',
    category: 'weapon',
    subCategory: 'bow',
    remarks: 'サポート向け弓。チーム全体の攻撃力と元素熟知を上昇',
    buffs: [{ type: 'attack', value: 35, isPercentage: true }],
  },
  {
    id: 'weapon-kuonrutennotaiten-c2',
    title: '久遠流転の大典2凸',
    category: 'weapon',
    subCategory: 'catalyst',
    remarks: 'ヌヴィレット向け法器。HPとダメージバフを大幅に上昇',
    buffs: [
      { type: 'hp', value: 60, isPercentage: true },
      { type: 'damageBuff', value: 54, isPercentage: false },
    ],
  },
  {
    id: 'weapon-seisuiruten-c1',
    title: '静水流転の輝き1凸',
    category: 'weapon',
    subCategory: 'sword',
    buffs: [
      { type: 'damageBuff', value: 24, isPercentage: true },
      { type: 'hp', value: 28, isPercentage: true },
    ],
  },
  {
    id: 'weapon-ganpou-c1',
    title: '岩峰を巡る歌1凸',
    category: 'weapon',
    subCategory: 'sword',
    buffs: [{ type: 'damageBuff', value: 25.6, isPercentage: true }],
  },
  {
    id: 'AThousandBlazingSuns',
    title: '千烈の日輪',
    category: 'weapon',
    subCategory: 'polearm',
    buffs: [
      { type: 'critDamage', value: 25, isPercentage: false },
      { type: 'attack', value: 35, isPercentage: true },
    ],
  },
  {
    id: 'VividNotions',
    title: 'ヴィヴィット・ハート',
    category: 'weapon',
    subCategory: 'catalyst',
    buffs: [
      { type: 'attack', value: 28, isPercentage: true },
      { type: 'critDamage', value: 68, isPercentage: false },
    ],
  },
]

const ARTIFACT_PRESETS: BuffPreset[] = [
  {
    id: 'artifact-shimenawa-4',
    title: '追憶のしめ縄4セット',
    category: 'artifact',
    remarks:
      'スキル使用後15秒間通常・重撃・落下攻撃ダメージ+50%。元素エネルギー15消費',
    buffs: [
      { type: 'attack', value: 18, isPercentage: true },
      { type: 'damageBuff', value: 50, isPercentage: false },
    ],
  },
  {
    id: 'artifact-emblem-4',
    title: '絶縁の旗印4セット',
    category: 'artifact',
    remarks: '元素チャージ効率の25%を元素爆発ダメージに変換（最大75%）',
    buffs: [{ type: 'damageBuff', value: 75, isPercentage: false }],
  },
  {
    id: 'artifact-gladiator-2',
    title: '剣闘士2セット',
    category: 'artifact',
    remarks: '攻撃力+18%のシンプルなバフ',
    buffs: [{ type: 'attack', value: 18, isPercentage: true }],
  },
  {
    id: 'artifact-wanderer-2',
    title: '大地を流浪する楽団2セット',
    category: 'artifact',
    remarks: '元素熟知+80',
    buffs: [{ type: 'damageBuff', value: 35, isPercentage: false }],
  },
  {
    id: 'artifact-phantomhunter-2',
    title: 'ファントムハンター4セット',
    category: 'artifact',
    remarks: '夜霊状態時のダメージバフ+15%、会心率+36%',
    buffs: [
      { type: 'damageBuff', value: 15, isPercentage: false },
      { type: 'critRate', value: 36, isPercentage: false },
    ],
  },
  {
    id: 'artifact-GoldenTroupe-4',
    title: '黄金の劇団4セット',
    category: 'artifact',
    remarks: '2/4セット',
    buffs: [{ type: 'damageBuff', value: 70, isPercentage: false }],
  },
  {
    id: 'artifact-husk-4',
    title: '華館夢醒形骸記4セット',
    category: 'artifact',
    remarks: '防御力依存キャラ向け。防御力+54%、岩ダメージ+24%（最大）',
    buffs: [
      { type: 'defense', value: 54, isPercentage: true },
      { type: 'damageBuff', value: 24, isPercentage: false },
    ],
  },
  {
    id: 'artifact-tenacity-2',
    title: '千岩牢固2セット',
    category: 'artifact',
    remarks: 'HP+20%のシンプルなバフ',
    buffs: [{ type: 'hp', value: 20, isPercentage: true }],
  },
  {
    id: 'artifact-gilded-4',
    title: '金メッキの夢4セット',
    category: 'artifact',
    remarks: '元素反応トリガー時、チーム構成に応じて熟知/攻撃力上昇',
    buffs: [{ type: 'hp', value: 14, isPercentage: true }],
  },
  {
    id: 'artifact-ArchaicPetra-4',
    title: '悠久の盤岩4セット',
    category: 'artifact',
    buffs: [{ type: 'damageBuff', value: 35, isPercentage: true }],
  },
  {
    id: 'artifact-ObsidianCodex-4',
    title: '黒曜の秘典4セット',
    category: 'artifact',
    buffs: [
      { type: 'damageBuff', value: 15, isPercentage: false },
      { type: 'critRate', value: 40, isPercentage: false },
    ],
  },
]

const CHARACTER_PRESETS: BuffPreset[] = [
  {
    id: 'char-skirk-c2',
    title: 'スカーク2凸',
    category: 'character',
    subCategory: 'cryo',
    remarks: '剣舞状態時に攻撃力+70%',
    buffs: [{ type: 'attack', value: 70, isPercentage: true }],
  },
  {
    id: 'char-skirk-c4',
    title: 'スカーク4凸',
    category: 'character',
    subCategory: 'cryo',
    remarks: '爆発使用後チーム全体の攻撃力+40%（10秒間）',
    buffs: [{ type: 'attack', value: 40, isPercentage: true }],
  },
  {
    id: 'char-neuvillette-c2',
    title: 'ヌヴィレット2凸',
    category: 'character',
    subCategory: 'hydro',
    remarks: '重撃持続時間延長、会心ダメージ+42%',
    buffs: [{ type: 'critDamage', value: 42, isPercentage: true }],
  },
  {
    id: 'char-Furina-c4',
    title: 'フリーナ4凸',
    category: 'character',
    subCategory: 'hydro',
    remarks: '本人',
    buffs: [
      { type: 'damageBuff', value: 68, isPercentage: true },
      { type: 'hp', value: 140, isPercentage: true },
    ],
  },
  {
    id: 'char-Furina-c4-surroundings',
    title: 'フリーナ4凸周囲',
    category: 'character',
    subCategory: 'hydro',
    remarks: '周囲',
    buffs: [{ type: 'damageBuff', value: 124, isPercentage: true }],
  },
  {
    id: 'char-bennett-burst',
    title: 'ベネット元素爆発',
    category: 'character',
    subCategory: 'pyro',
    remarks: '鼓舞領域内で基礎攻撃力の一定割合を攻撃力として付与',
    buffs: [{ type: 'attack', value: 1000, isPercentage: false }],
  },
  {
    id: 'char-kazuha-c2',
    title: '楓原万葉2凸',
    category: 'character',
    subCategory: 'anemo',
    remarks: '元素熟知200付与、元素ダメージバフ増加',
    buffs: [{ type: 'damageBuff', value: 40, isPercentage: false }],
  },
  {
    id: 'char-xilonen-c2-hydro',
    title: 'シロネン2凸水',
    category: 'character',
    subCategory: 'geo',
    buffs: [{ type: 'hp', value: 45, isPercentage: true }],
  },
  {
    id: 'char-sara-c6',
    title: '九条裟羅6凸',
    category: 'character',
    subCategory: 'electro',
    remarks: '雷元素ダメージの会心ダメージ+60%',
    buffs: [{ type: 'critDamage', value: 60, isPercentage: false }],
  },
  {
    id: 'char-rosaria-burst',
    title: 'ロサリア元素爆発',
    category: 'character',
    subCategory: 'cryo',
    remarks: '自身の会心率の15%をチーム全体に付与（最大15%）',
    buffs: [{ type: 'critRate', value: 15, isPercentage: false }],
  },
  {
    id: 'char-gorou-skill',
    title: 'ゴロー元素スキル',
    category: 'character',
    subCategory: 'geo',
    remarks: '岩元素キャラの数に応じて防御力、岩ダメージ、岩元素耐性を上昇',
    buffs: [{ type: 'defense', value: 350, isPercentage: false }],
  },
  {
    id: 'char-yelan-passive',
    title: '夜蘭天賦',
    category: 'character',
    subCategory: 'hydro',
    remarks: 'チーム内元素タイプの数に応じてHP上昇（最大30%）',
    buffs: [{ type: 'hp', value: 30, isPercentage: true }],
  },
  {
    id: 'char-mavuika-c3',
    title: 'マヴィーカ3凸',
    category: 'character',
    subCategory: 'pyro',
    buffs: [
      { type: 'attack', value: 30, isPercentage: true },
      { type: 'attack', value: 40, isPercentage: true },
      { type: 'critDamage', value: 48, isPercentage: false },
    ],
  },
  {
    id: 'char-iansan-c6',
    title: 'イアンサ6凸',
    category: 'character',
    subCategory: 'electro',
    buffs: [
      { type: 'attack', value: 810, isPercentage: false },
      { type: 'attack', value: 30, isPercentage: true },
    ],
  },
  {
    id: 'char-varesa-c6',
    title: 'ヴァレサ2凸',
    category: 'character',
    subCategory: 'electro',
    buffs: [
      { type: 'attack', value: 70, isPercentage: true },
      { type: 'attack', value: 30, isPercentage: true },
    ],
  },
]

const TEAM_PRESETS: BuffPreset[] = [
  {
    id: 'team-pyro-resonance',
    title: '元素共鳴・熱誠の炎',
    category: 'team',
    remarks: '炎元素2名で攻撃力+25%',
    buffs: [{ type: 'attack', value: 25, isPercentage: true }],
  },
  {
    id: 'team-hydro-resonance',
    title: '元素共鳴・治療の水',
    category: 'team',
    remarks: '水元素2名でHP+25%',
    buffs: [{ type: 'hp', value: 25, isPercentage: true }],
  },
  {
    id: 'team-geo-resonance',
    title: '元素共鳴・堅固な岩',
    category: 'team',
    remarks: '岩元素2名でシールド強化+15%、シールド時ダメージ+15%',
    buffs: [{ type: 'damageBuff', value: 15, isPercentage: false }],
  },
  {
    id: 'team-cryo-resonance',
    title: '元素共鳴・粉砕の氷',
    category: 'team',
    remarks: '氷元素2名で凍結/氷元素付着の敵に会心率+15%',
    buffs: [{ type: 'critRate', value: 15, isPercentage: false }],
  },
]

export const BUFF_PRESETS: BuffPreset[] = [
  ...WEAPON_PRESETS,
  ...ARTIFACT_PRESETS,
  ...CHARACTER_PRESETS,
  ...TEAM_PRESETS,
]

const CATEGORY_LABELS: Record<PresetCategory, string> = {
  weapon: '武器',
  artifact: '聖遺物',
  character: 'キャラクター',
  team: 'チーム',
}

const WEAPON_TYPE_LABELS: Record<WeaponType, string> = {
  sword: '片手剣',
  claymore: '両手剣',
  polearm: '長柄武器',
  catalyst: '法器',
  bow: '弓',
}

const ELEMENT_TYPE_LABELS: Record<ElementType, string> = {
  pyro: '炎',
  hydro: '水',
  cryo: '氷',
  electro: '雷',
  anemo: '風',
  geo: '岩',
  dendro: '草',
}

export function getCategoryLabel(category: PresetCategory): string {
  return CATEGORY_LABELS[category]
}

export function getWeaponTypeLabel(weaponType: WeaponType): string {
  return WEAPON_TYPE_LABELS[weaponType]
}

export function getElementTypeLabel(elementType: ElementType): string {
  return ELEMENT_TYPE_LABELS[elementType]
}

export const PRESET_CATEGORIES: PresetCategory[] = [
  'weapon',
  'artifact',
  'character',
  'team',
]
