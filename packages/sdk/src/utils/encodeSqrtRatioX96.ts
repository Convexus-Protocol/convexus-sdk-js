import JSBI from 'jsbi'
import { BigintIsh } from '@convexus/icon-toolkit'
import { Price, Currency, sqrt } from '@convexus/sdk-core'

/**
 * Returns the sqrt ratio as a Q64.96 corresponding to a given ratio of amount1 and amount0
 * @param amount1 The numerator amount i.e., the amount of token1
 * @param amount0 The denominator amount i.e., the amount of token0
 * @returns The sqrt ratio
 */

export function encodeSqrtRatioX96(amount1: BigintIsh, amount0: BigintIsh): JSBI {
  const numerator = JSBI.leftShift(JSBI.BigInt(amount1), JSBI.BigInt(192))
  const denominator = JSBI.BigInt(amount0)
  const ratioX192 = JSBI.divide(numerator, denominator)
  return sqrt(ratioX192)
}

export function encodeSqrtRatioX96FromPrice(price: Price<Currency, Currency>): JSBI {
  return encodeSqrtRatioX96(price.denominator, price.numerator)
}