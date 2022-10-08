import { BigintIsh } from '@convexus/icon-toolkit';
import JSBI from 'jsbi'

export enum TradeType {
  EXACT_INPUT = 0,
  EXACT_OUTPUT = 1
}

export function parseTradeType (s: BigintIsh): TradeType {
  switch (JSBI.toNumber(JSBI.BigInt(s))) {
    case 0: return TradeType.EXACT_INPUT;
    case 1: return TradeType.EXACT_OUTPUT;
    default: throw Error("Invalid trade type");
  }
}

export enum Rounding {
  ROUND_DOWN,
  ROUND_HALF_UP,
  ROUND_UP
}

export const MaxUint256 = JSBI.BigInt('0xffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffff')
