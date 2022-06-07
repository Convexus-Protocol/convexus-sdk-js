import { MethodParameters, toHex } from './utils/calldata'
import { Interface } from './utils'
import IPoolInitializer from './artifacts/contracts/PoolInitializer/PoolInitializer.json'
import { Pool } from './entities'

export abstract class PoolInitializer {
  public static INTERFACE: Interface = new Interface(IPoolInitializer)

  /**
   * Cannot be constructed.
   */
  private constructor() {}

  public static encodeCreate(pool: Pool): string {
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
