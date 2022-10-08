import { BigintIsh } from '@convexus/icon-toolkit'
import JSBI from 'jsbi'

export class NextInitializedTickWithinOneWordResult {
  public readonly tickNext: number
  public readonly initialized: boolean

  public constructor (
    tickNext: number,
    initialized: boolean
  ) {
    this.tickNext = tickNext
    this.initialized = initialized
  }
  
  public static fromCall (data: any): NextInitializedTickWithinOneWordResult {
    return new NextInitializedTickWithinOneWordResult (
      parseInt(data['tickNext'], 16),
      Boolean(parseInt(data['initialized'], 16)),
    )
  }
}

export class QuoteResult {
  public readonly amountOut: JSBI;
  public readonly sqrtPriceX96After: JSBI;
  public readonly initializedTicksCrossed: number;

  public constructor (
    amountOut: BigintIsh,
    sqrtPriceX96After: BigintIsh,
    initializedTicksCrossed: number
  ) {
    this.amountOut = JSBI.BigInt(amountOut)
    this.sqrtPriceX96After = JSBI.BigInt(sqrtPriceX96After)
    this.initializedTicksCrossed = initializedTicksCrossed
  }
  
  public static fromCall (data: any): QuoteResult {
    return new QuoteResult (
      data['amountOut'],
      data['sqrtPriceX96After'],
      parseInt(data['initializedTicksCrossed'], 16),
    )
  }
}

export class QuoteMultiResult {
  public readonly amountOut: JSBI;
  public readonly sqrtPriceX96AfterList: JSBI[];
  public readonly initializedTicksCrossedList: number[];
  
  public constructor (
    amountOut: BigintIsh,
    sqrtPriceX96AfterList: BigintIsh[],
    initializedTicksCrossedList: number[]
  ) {
    this.amountOut = JSBI.BigInt(amountOut)
    this.sqrtPriceX96AfterList = sqrtPriceX96AfterList.map(JSBI.BigInt)
    this.initializedTicksCrossedList = initializedTicksCrossedList
  }
  
  public static fromCall (data: any): QuoteMultiResult {
    return new QuoteMultiResult (
      data['amountOut'],
      data['sqrtPriceX96AfterList'],
      data['initializedTicksCrossedList'].map((i: string) => parseInt(i, 16)),
    )
  }
}
