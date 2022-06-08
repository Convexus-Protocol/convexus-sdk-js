import { Token } from '@convexus/sdk-core'
import { FeeAmount } from '../src/constants'
import { Pool } from '../src/entities/pool'
import { PoolInitializer } from '../src/poolInitializer'
import { encodeSqrtRatioX96 } from '../src/utils/encodeSqrtRatioX96'

describe('PoolInitializer', () => {
  const token0 = new Token('cx0000000000000000000000000000000000000001', 18, 't0', 'token0')
  const token1 = new Token('cx0000000000000000000000000000000000000002', 18, 't1', 'token1')
  const fee = FeeAmount.MEDIUM
  const pool_0_1 = new Pool(token0, token1, fee, encodeSqrtRatioX96(1, 1), 0, 0, [])

  describe('#createCallParameters', () => {
    it('succeeds', () => {
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
      expect(value).toEqual('0x0')
    })
  })
})
