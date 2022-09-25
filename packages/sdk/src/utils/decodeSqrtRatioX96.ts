import { Fraction } from '@convexus/sdk-core'
import JSBI from 'jsbi'

/**
 * Returns a floating point price from a sqrt ratio as a Q64.96
 * @param sqrtRatiox96 The sqrt ratio
 * @returns A floating point price
 */
export function decodeSqrtRatioX96(sqrtRatiox96: JSBI): Fraction {
  // sqrtRatiox96**2 / 2**192
  const TWO = JSBI.BigInt(2)
  return new Fraction(
      JSBI.exponentiate(TWO, sqrtRatiox96),
      JSBI.exponentiate(TWO, JSBI.BigInt(192))
  )
}
