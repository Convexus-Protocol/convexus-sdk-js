import { CallData, Interface, toHex } from '@convexus/icon-toolkit'
import IPoolInitializer from './artifacts/contracts/PoolInitializer/PoolInitializer.json'
import { Pool } from './entities'

export abstract class PoolInitializer {
  public static INTERFACE: Interface = new Interface(IPoolInitializer, "PoolInitializer")

  public static setContractAddress (contractAddress: string) {
    this.INTERFACE = new Interface(IPoolInitializer, contractAddress)
  }

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

  public static createCallParameters(pool: Pool): CallData[] {
    return [this.encodeCreate(pool)]
  }
}
