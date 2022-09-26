import { Token } from '@convexus/sdk-core'
import { FeeAmount } from '../constants'

/**
 * Provides information about a pool factory
 */
export interface PoolFactoryProvider {
  /**
   * Return the pool address given pool tokens and fees
   * @param tokenA First token
   * @param tokenB Second token
   * @param fee The pool fee
   */
  getPool (
    tokenA: Token,
    tokenB: Token,
    fee: FeeAmount
  ): Promise<string>
}

/**
 * This pool factory provider does not know how to fetch any pool factory data. It throws whenever it is required. Useful if you
 * do not need to load factory data for your use case.
 */
export class NoPoolFactoryProvider implements PoolFactoryProvider {
  private static ERROR_MESSAGE = 'No pool factory provider was given'
  async getPool (
    _tokenA: Token,
    _tokenB: Token,
    _fee: FeeAmount
  ): Promise<string> {
    throw new Error(NoPoolFactoryProvider.ERROR_MESSAGE)
  }
}