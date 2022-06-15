import { CallData, Interface, MethodParameters, toHex } from '@convexus/icon-toolkit'
import IPoolInitializer from './artifacts/contracts/PoolInitializer/PoolInitializer.json'
import { Pool } from './entities'

export abstract class PoolInitializer {
  public static INTERFACE: Interface = new Interface(IPoolInitializer, "PoolInitializer")

  /**
   * Cannot be constructed.
   */
  private constructor() {}

  public static encodeCreate(pool: Pool): CallData {
    return PoolInitializer.INTERFACE.encodeFunctionData('createAndInitializePoolIfNecessary', [
      pool.token0.address,
      pool.token1.address,
      pool.fee,
      toHex(pool.sqrtRatioX96)
    ])
  }

  public static createCallParameters(pool: Pool): MethodParameters {
    return {
      calldata: [this.encodeCreate(pool)],
      value: toHex(0)
    }
  }
}
