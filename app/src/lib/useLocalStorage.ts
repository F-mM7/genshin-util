import { useCallback, useEffect, useRef, useState } from 'react'

const STORAGE_PREFIX = 'genshin-util:'

type Initial<T> = T | (() => T)

function resolve<T>(initial: Initial<T>): T {
  return typeof initial === 'function' ? (initial as () => T)() : initial
}

function readStorage<T>(key: string, fallback: T): T {
  if (typeof window === 'undefined') return fallback
  try {
    const raw = window.localStorage.getItem(STORAGE_PREFIX + key)
    if (raw === null) return fallback
    return JSON.parse(raw) as T
  } catch {
    return fallback
  }
}

function writeStorage<T>(key: string, value: T) {
  if (typeof window === 'undefined') return
  try {
    window.localStorage.setItem(STORAGE_PREFIX + key, JSON.stringify(value))
  } catch {
    // ignore quota errors etc.
  }
}

/**
 * localStorage と同期するステート。
 *
 * 初期値は値または関数で渡せる。関数は「マウント時 & リセット時」に評価される。
 * 「現在時刻ベースの初期値」など、最新の値で評価したい場合に関数を使う。
 *
 * NOTE: スキーマを変更したい場合は、後方互換マイグレーションを書くのではなく
 * `key` 自体を変更して別エントリとして扱うこと（プロジェクトルール参照）。
 */
export function useLocalStorage<T>(
  key: string,
  initial: Initial<T>
): [T, (next: T | ((prev: T) => T)) => void, () => void] {
  const initialRef = useRef(initial)
  initialRef.current = initial

  const [state, setState] = useState<T>(() => readStorage(key, resolve(initial)))

  useEffect(() => {
    writeStorage(key, state)
  }, [key, state])

  const reset = useCallback(() => {
    setState(resolve(initialRef.current))
    if (typeof window !== 'undefined') {
      window.localStorage.removeItem(STORAGE_PREFIX + key)
    }
  }, [key])

  return [state, setState, reset]
}
