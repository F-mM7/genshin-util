/** 浮動小数誤差(0.9999999999999999 等)を許容して、確率が 100% とみなせるか。 */
export function isCertain(probability: number): boolean {
  return probability >= 1 - 1e-9
}

/** 浮動小数誤差を許容して、確率が 0% とみなせるか。 */
export function isImpossible(probability: number): boolean {
  return probability <= 1e-9
}
