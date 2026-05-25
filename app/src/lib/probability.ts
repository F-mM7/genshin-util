// 二項分布 B(n, p) の確率質量関数。pmf[k] = P(K = k), k = 0..n。
// 数値オーバーフロー回避のため log 空間で計算。
export function binomialPMF(n: number, p: number): number[] {
  if (n <= 0) return [1]
  if (p <= 0) return Array.from({ length: n + 1 }, (_, k) => (k === 0 ? 1 : 0))
  if (p >= 1) return Array.from({ length: n + 1 }, (_, k) => (k === n ? 1 : 0))
  const logP = Math.log(p)
  const log1mP = Math.log(1 - p)
  const logFact: number[] = [0]
  for (let i = 1; i <= n; i++) logFact.push(logFact[i - 1] + Math.log(i))
  const pmf: number[] = new Array(n + 1)
  for (let k = 0; k <= n; k++) {
    const logChoose = logFact[n] - logFact[k] - logFact[n - k]
    pmf[k] = Math.exp(logChoose + k * logP + (n - k) * log1mP)
  }
  return pmf
}
