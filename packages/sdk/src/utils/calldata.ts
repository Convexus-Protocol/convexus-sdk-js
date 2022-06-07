import { BigintIsh } from '@convexus/sdk-core'
import JSBI from 'jsbi'

/**
 * Generated method parameters for executing a call.
 */
export interface MethodParameters {
  /**
   * The calldata to perform the given operation
   */
  calldata: string[]
  /**
   * The amount of ICX (in loops) to send in hex.
   */
  value: string
}

/**
 * Converts a big int to a hex string
 * @param bigintIsh
 * @returns The hex encoded calldata
 */
export function toHex(bigintIsh: BigintIsh) {
  const bigInt = JSBI.BigInt(bigintIsh)
  let hex = bigInt.toString(16)
  if (hex.length % 2 !== 0) {
    hex = `0${hex}`
  }
  return `0x${hex}`
}

export function toHexString(str: string) {
  var hex = "";
  for (var i = 0; i < str.length; i++) {
    hex += str.charCodeAt(i).toString(16);
  }
  return `0x${hex}`;
}