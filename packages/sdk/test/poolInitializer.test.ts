import { MaxUint256, Percent, Price, Token } from '@convexus/sdk-core'
import JSBI from 'jsbi'
import { FeeAmount, TICK_SPACINGS } from '../src/constants'
import { Pool } from '../src/entities/pool'
import { Position } from '../src/entities/position'
import { NonfungiblePositionManager } from '../src/nonfungiblePositionManager'
import { PoolInitializer } from '../src/poolInitializer'
import { encodeSqrtRatioX96 } from '../src/utils/encodeSqrtRatioX96'
import { maxLiquidityForAmounts } from '../src/utils/maxLiquidityForAmounts'
import { nearestUsableTick } from '../src/utils/nearestUsableTick'
import { priceToClosestTick } from '../src/utils/priceTickConversions'

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

  describe('Create new pool', () => {
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

  it('succeeds and deposit liquidity', () => {
    // Initialize the pool
    PoolInitializer.createCallParameters(pool_0_1)

    // Provide liquidity between 500 and 800
    const lowerBoundPrice = 500
    const higherBoundPrice = 800

    const EXA = JSBI.BigInt("1000000000000000000")
    const amount0 = JSBI.multiply(EXA, JSBI.BigInt("5")) // 5 token0
    const amount1 = MaxUint256 // compute amount1 needed

    // Compute the max liquidity for 5 token0
    const liquidity = maxLiquidityForAmounts (
      poolPrice, // Pool price
      encodeSqrtRatioX96(lowerBoundPrice, 1), // lower bound price
      encodeSqrtRatioX96(higherBoundPrice, 1), // upper bound price
      amount0, amount1, // amounts of token provided
      true
    )

    // Compute lower & upper ticks from prices
    const tickLower = nearestUsableTick(priceToClosestTick(new Price(token0, token1, 1, lowerBoundPrice)), TICK_SPACINGS[fee])
    const tickUpper = nearestUsableTick(priceToClosestTick(new Price(token0, token1, 1, higherBoundPrice)), TICK_SPACINGS[fee])

    // adress that will receive the position NFT
    const recipient = 'hx0000000000000000000000000000000000000003'
    const slippageTolerance = new Percent(1, 100)
    const deadline = 123

    NonfungiblePositionManager.addCallParameters(
      new Position({
        pool: pool_0_1,
        tickLower: tickLower,
        tickUpper: tickUpper,
        liquidity: liquidity
      }),
      { recipient, slippageTolerance, deadline }
    )
  })
})
