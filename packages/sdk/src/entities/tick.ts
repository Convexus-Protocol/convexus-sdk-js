import JSBI from 'jsbi'
import invariant from 'tiny-invariant'
import { BigintIsh } from '@convexus/icon-toolkit'
import { TickMath } from '../utils'

export interface FeeGrowthOutside {
  feeGrowthOutside0X128: JSBI
  feeGrowthOutside1X128: JSBI
}

export interface TickConstructorArgs {
  index: number
  liquidityGross: BigintIsh
  liquidityNet: BigintIsh
  feeGrowthOutside?: FeeGrowthOutside
  secondsOutside?: BigintIsh
  secondsPerLiquidityOutsideX128?: BigintIsh
  tickCumulativeOutside?: BigintIsh
  initialized?: boolean
}

export class Tick {
  public readonly index: number
  public readonly liquidityGross: JSBI
  public readonly liquidityNet: JSBI
  public readonly feeGrowthOutside?: FeeGrowthOutside
  public readonly secondsOutside?: JSBI
  public readonly secondsPerLiquidityOutsideX128?: JSBI
  public readonly tickCumulativeOutside?: JSBI
  public readonly initialized?: boolean

  constructor({
    index, 
    liquidityGross, 
    liquidityNet, 
    feeGrowthOutside, 
    secondsOutside,
    secondsPerLiquidityOutsideX128,
    tickCumulativeOutside,
    initialized
  }: TickConstructorArgs) {
    invariant(index >= TickMath.MIN_TICK && index <= TickMath.MAX_TICK, 'TICK')
    this.index = index
    this.liquidityGross = JSBI.BigInt(liquidityGross)
    this.liquidityNet = JSBI.BigInt(liquidityNet)
    this.feeGrowthOutside = feeGrowthOutside
    this.secondsOutside = secondsOutside ? JSBI.BigInt(secondsOutside) : undefined
    this.secondsPerLiquidityOutsideX128 = secondsPerLiquidityOutsideX128 ? JSBI.BigInt(secondsPerLiquidityOutsideX128) : undefined
    this.tickCumulativeOutside = tickCumulativeOutside ? JSBI.BigInt(tickCumulativeOutside) : undefined
    this.initialized = initialized
  }

  public static fromCall (data: any): Tick {
    return new Tick ({
      index: parseInt(data['index'], 16),
      liquidityGross: data['liquidityGross'],
      liquidityNet: data['liquidityNet'],
      feeGrowthOutside: {
        feeGrowthOutside0X128: data['feeGrowthOutside0X128'],
        feeGrowthOutside1X128: data['feeGrowthOutside1X128']
      },
      secondsOutside: data['secondsOutside'],
      secondsPerLiquidityOutsideX128: data['secondsPerLiquidityOutsideX128'],
      tickCumulativeOutside: data['tickCumulativeOutside'],
      initialized: Boolean(parseInt(data['initialized'], 16)),
    })
  }
}
