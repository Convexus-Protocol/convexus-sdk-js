import { BigintIsh } from "@convexus/icon-toolkit"

export const ADDRESS_ZERO = 'hx0000000000000000000000000000000000000000'

/**
 * The default factory enabled fee amounts, denominated in hundredths of bips.
 */
export enum FeeAmount {
  LOWEST = 100,
  LOW = 500,
  MEDIUM = 3000,
  HIGH = 10000
}

export function parseFeeAmount (s: BigintIsh): FeeAmount {
  switch (Number(s)) {
    case 100: return FeeAmount.LOWEST;
    case 500: return FeeAmount.LOW;
    case 3000: return FeeAmount.MEDIUM;
    case 10000: return FeeAmount.HIGH;
    default: throw Error("Invalid fee amount");
  }
}

/**
 * The default factory tick spacings by fee amount.
 */
export const TICK_SPACINGS: { [amount in FeeAmount]: number } = {
  [FeeAmount.LOWEST]: 1,
  [FeeAmount.LOW]: 10,
  [FeeAmount.MEDIUM]: 60,
  [FeeAmount.HIGH]: 200
}
