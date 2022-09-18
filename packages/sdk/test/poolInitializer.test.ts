import { Token } from '@convexus/sdk-core'
import { FeeAmount } from '../src/constants'
import { Pool } from '../src/entities/pool'
import { PoolInitializer } from '../src/poolInitializer'
import { encodeSqrtRatioX96 } from '../src/utils/encodeSqrtRatioX96'

describe('PoolInitializer', () => {
  // Create two tokens
  const token0 = new Token('cx0000000000000000000000000000000000000001', 18, 't0', 'token0')
  const token1 = new Token('cx0000000000000000000000000000000000000002', 18, 't1', 'token1')
  // Medium fee (0.3%)
  const fee = FeeAmount.MEDIUM
  // Default pool price : 1 token0 = 1 token1 (1:1)
  const poolPrice = encodeSqrtRatioX96(1, 1)
  // Initial liquidity : 0
  const liquidity = 0
  // Current tick doesn't need to be computed for deployment
  const tickCurrent = 0
  // Create a new pool
  const pool_0_1 = new Pool(token0, token1, fee, poolPrice, liquidity, tickCurrent)

  describe('#createCallParameters', () => {
    it('succeeds', () => {
      // Pool initializer needs a Pool instance
      const { calldata, value } = PoolInitializer.createCallParameters(pool_0_1)

      expect(calldata).toStrictEqual(
        [
          {
            "to": "PoolInitializer",
            "method": "createAndInitializePoolIfNecessary",
            "params": {
              "fee": "0xbb8",
              "sqrtPriceX96": "0x1000000000000000000000000",
              "token0": "cx0000000000000000000000000000000000000001",
              "token1": "cx0000000000000000000000000000000000000002"
            }
          }
        ]
      )
      
      // No ICX needed to be sent
      expect(value).toEqual('0x0')
    })
  })
})
