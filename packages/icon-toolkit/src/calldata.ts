import { BigintIsh } from './constants'
import JSBI from 'jsbi'

/**
 * Converts a big int to a hex string
 * @param bigintIsh
 * @returns The hex encoded calldata
 */
export function toHex(bigintIsh: BigintIsh) {
  const bigInt = JSBI.BigInt(bigintIsh)
  
  if (JSBI.greaterThanOrEqual(bigInt, JSBI.BigInt(0))) {
    let hex = bigInt.toString(16)
    return `0x${hex}`
  } else {
    const neg = JSBI.multiply(bigInt, JSBI.BigInt('-1'))
    let negHex = neg.toString(16)
    return `-0x${negHex}`
  }
}

export function toHexString(str: string) {
  var hex = "";
  for (var i = 0; i < str.length; i++) {
    hex += str.charCodeAt(i).toString(16);
  }
  return `0x${hex}`;
}