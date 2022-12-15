import { BigintIsh, CallData, Interface, toHex, validateAndParseAddress } from '@convexus/icon-toolkit'
import { Icx, Token } from '@convexus/sdk-core'
import IPoolInitializer from './artifacts/contracts/PoolInitializer/PoolInitializer.json'
import { Pool, Position } from './entities'

export abstract class PoolInitializer {
  public static INTERFACE: Interface = new Interface(IPoolInitializer)


  /**
   * Cannot be constructed.
   */
  private constructor() {}

  public static encodeCreate(pool: Pool, poolInitializerAddress: string): CallData {
    return PoolInitializer.INTERFACE.encodeFunctionData('createAndInitializePoolIfNecessary', [
      pool.token0.address,
      pool.token1.address,
      pool.fee,
      toHex(pool.sqrtRatioX96),
    ], poolInitializerAddress);
  }

  public static encodeDeposit (token: Token, amount: BigintIsh, poolInitializerAddress: string): CallData {
    if (Icx.isWrappedAddress(token.address)) {
      return PoolInitializer.INTERFACE.encodeFunctionDataPayable(
        amount,
        'depositIcx', [],
        poolInitializerAddress
      )
    } else {
      return PoolInitializer.INTERFACE.encodeTokenFallbackFunctionData(
        token.address,
        amount,
        'deposit', [], [],
        poolInitializerAddress
      )
    }
  }

  static encodeCreateAndMint(
    position: Position,
    recipient: string,
    deadline: number,
    poolInitializerAddress: string
  ): CallData {
    const pool = position.pool
    const {amount0, amount1} = position.mintAmounts

    return PoolInitializer.INTERFACE.encodeFunctionData('createAndInitializePoolIfNecessaryAndMintPosition', [
      // For the pool creation+initialization
      pool.token0.address,
      pool.token1.address,
      pool.fee,
      toHex(pool.sqrtRatioX96),
      // For the position minting
      position.tickLower,
      position.tickUpper,
      toHex(amount0),
      toHex(amount1),
      // Slippage shouldn't be an issue as we're creating the pool + mint in a single transaction
      toHex(0),
      toHex(0),
      validateAndParseAddress(recipient),
      toHex(deadline)
    ], poolInitializerAddress)
  }

  public static createCallParameters(pool: Pool, poolInitializerAddress: string): CallData[] {
    return [this.encodeCreate(pool, poolInitializerAddress)]
  }

  public static createAndMintCallParameters (
    position: Position,
    recipient: string,
    deadline: number,
    poolInitializerAddress: string
  ): CallData[] {
    return [
      PoolInitializer.encodeDeposit(position.pool.token0, position.amount0.quotient, poolInitializerAddress),
      PoolInitializer.encodeDeposit(position.pool.token1, position.amount1.quotient, poolInitializerAddress),
      PoolInitializer.encodeCreateAndMint(position, recipient, deadline, poolInitializerAddress)
    ]
  }
}
