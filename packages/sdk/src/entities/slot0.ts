import JSBI from 'jsbi'
import { BigintIsh } from '@convexus/icon-toolkit'

export interface Slot0ConstructorArgs {
  feeProtocol: number
  observationCardinality: number
  observationCardinalityNext: number
  observationIndex: number
  sqrtPriceX96: BigintIsh
  tick: number
  unlocked: boolean
}

export class Slot0 {
  public readonly feeProtocol: number
  public readonly observationCardinality: number
  public readonly observationCardinalityNext: number
  public readonly observationIndex: number
  public readonly sqrtPriceX96: JSBI
  public readonly tick: number
  public readonly unlocked: boolean

  public constructor ({
    feeProtocol,
    observationCardinality,
    observationCardinalityNext,
    observationIndex,
    sqrtPriceX96,
    tick,
    unlocked
  }: Slot0ConstructorArgs) {
    this.feeProtocol = feeProtocol
    this.observationCardinality = observationCardinality
    this.observationCardinalityNext = observationCardinalityNext
    this.observationIndex = observationIndex
    this.sqrtPriceX96 = JSBI.BigInt(sqrtPriceX96)
    this.tick = tick
    this.unlocked = unlocked
  }
  
  public static fromCall (data: any): Slot0 {
    return new Slot0 ({
      feeProtocol: parseInt(data['feeProtocol'], 16),
      observationCardinality: parseInt(data['observationCardinality'], 16),
      observationCardinalityNext: parseInt(data['observationCardinalityNext'], 16),
      observationIndex: parseInt(data['observationIndex'], 16),
      sqrtPriceX96: data['sqrtPriceX96'],
      tick: parseInt(data['tick'], 16),
      unlocked: Boolean(parseInt(data['unlocked'], 16)),
    })
  }
}