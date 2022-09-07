import JSBI from 'jsbi'
import { Token, Icx, Percent, CurrencyAmount, Price, MaxUint256 } from '@convexus/sdk-core'
import { FeeAmount, TICK_SPACINGS } from '../src/constants'
import { Pool } from '../src/entities/pool'
import { Position } from '../src/entities/position'
import { NonfungiblePositionManager } from '../src/nonfungiblePositionManager'
import { encodeSqrtRatioX96 } from '../src/utils/encodeSqrtRatioX96'
import { maxLiquidityForAmounts } from '../src/utils/maxLiquidityForAmounts'
import { priceToClosestTick } from '../src/utils/priceTickConversions'
import { nearestUsableTick } from '../src/utils/nearestUsableTick'
import { TickMath } from '../src/utils'

describe('NonfungiblePositionManager', () => {
  const token0 = new Token('cx0000000000000000000000000000000000000001', 18, 't0', 'token0')
  const token1 = new Token('cx0000000000000000000000000000000000000002', 18, 't1', 'token1')
  const token2 = new Token('cx0000000000000000000000000000000000000003', 18, 't2', 'token2')

  const fee = FeeAmount.MEDIUM
  const ICX = new Icx()
  const WICX = ICX.wrapped

  const pool_0_1 = new Pool(token0, token1, fee, encodeSqrtRatioX96(1, 1), 0, 0, [])
  const pool_1_wicx = new Pool(token1, WICX, fee, encodeSqrtRatioX96(1, 1), 0, 0, [])

  const recipient = 'hx0000000000000000000000000000000000000003'
  const sender = 'hx0000000000000000000000000000000000000004'
  const tokenId = 1
  const slippageTolerance = new Percent(1, 100)
  const deadline = 123

  describe('#addCallParameters', () => {
    it('throws if liquidity is 0', () => {
      expect(() =>
        NonfungiblePositionManager.addCallParameters(
          new Position({
            pool: pool_0_1,
            tickLower: -TICK_SPACINGS[FeeAmount.MEDIUM],
            tickUpper: TICK_SPACINGS[FeeAmount.MEDIUM],
            liquidity: 0
          }),
          { recipient, slippageTolerance, deadline }
        )
      ).toThrow('ZERO_LIQUIDITY')
    })

    it('throws if pool does not involve ICX and useNative is true', () => {
      expect(() =>
        NonfungiblePositionManager.addCallParameters(
          new Position({
            pool: pool_0_1,
            tickLower: -TICK_SPACINGS[FeeAmount.MEDIUM],
            tickUpper: TICK_SPACINGS[FeeAmount.MEDIUM],
            liquidity: 1
          }),
          { recipient, slippageTolerance, deadline, useNative: ICX }
        )
      ).toThrow('NO_WICX')
    })

    it('succeeds for mint', () => {
      const { calldata, value } = NonfungiblePositionManager.addCallParameters(
        new Position({
          pool: pool_0_1,
          tickLower: -TICK_SPACINGS[FeeAmount.MEDIUM],
          tickUpper: TICK_SPACINGS[FeeAmount.MEDIUM],
          liquidity: 1
        }),
        { recipient, slippageTolerance, deadline }
      )

      expect(calldata).toStrictEqual(
        [
          {
            "to": "NonfungiblePositionManager",
            "method": "mint",
            "params": {
              "params": {
                "amount0Desired": "0x1",
                "amount0Min": "0x0",
                "amount1Desired": "0x1",
                "amount1Min": "0x0",
                "deadline": "0x7b",
                "fee": "0xbb8",
                "recipient": "hx0000000000000000000000000000000000000003",
                "tickLower": "-0x3c",
                "tickUpper": "0x3c",
                "token0": "cx0000000000000000000000000000000000000001",
                "token1": "cx0000000000000000000000000000000000000002"
              }
            }
          }
        ]
      )
      expect(value).toEqual('0x0')
    })

    it('succeeds for mint pool CRV/WETH', () => {
      // https://i.imgur.com/xTZj9Hp.png

      const highFee = FeeAmount.HIGH // 1% fee

      // Current Price: 1364 CRV per WETH
      const pool_1_2_price = JSBI.BigInt("2926833475291797893971652918731") // ~ equals to encodeSqrtRatioX96(1364, 1)
      const pool_1_2_liquidity = JSBI.BigInt("270755706369106903362800")
      const pool_1_2_tick = 72190
      const pool_1_2 = new Pool(token1, token2, highFee, pool_1_2_price, pool_1_2_liquidity, pool_1_2_tick, [])

      // Provide liquidity between 953 and 1843
      const lowerBoundPrice = 953
      const higherBoundPrice = 1843

      const EXA = JSBI.BigInt("1000000000000000000")
      const amount0 = JSBI.multiply(EXA, JSBI.BigInt("1")) // 1 ETH provided
      const amount1 = MaxUint256 // should result in ~1605 CRV

      // Compute the max liquidity for 1 ETH
      const liquidity = maxLiquidityForAmounts (
        pool_1_2_price, // Pool price
        encodeSqrtRatioX96(lowerBoundPrice, 1), // lower bound price
        encodeSqrtRatioX96(higherBoundPrice, 1), // upper bound price
        amount0, amount1, // amounts of token provided
        true
      )

      // Compute lower & upper ticks from prices
      const tickLower = nearestUsableTick(priceToClosestTick(new Price(token1, token2, 1, lowerBoundPrice)), TICK_SPACINGS[highFee])
      const tickUpper = nearestUsableTick(priceToClosestTick(new Price(token1, token2, 1, higherBoundPrice)), TICK_SPACINGS[highFee])

      const { calldata, value } = NonfungiblePositionManager.addCallParameters(
        new Position({
          pool: pool_1_2,
          tickLower: tickLower,
          tickUpper: tickUpper,
          liquidity: liquidity
        }),
        { recipient, slippageTolerance, deadline }
      )

      expect(calldata).toStrictEqual(
        [
          {
            "to": "NonfungiblePositionManager",
            "method": "mint",
            "params": {
              "params": {
                "amount0Desired": "0xde5e8740bb55a8a", // 1.0014620772700884
                "amount0Min": "0xd67824c75ca970c", // 0.9658839099995973
                "amount1Desired": "0x5726f15f7a74a5b555", // 1607.6728634351073
                "amount1Min": "0x547e5f6be63db8890e", // 1558.632617799791
                "deadline": "0x7b",
                "fee": "0x2710", // 1%
                "recipient": "hx0000000000000000000000000000000000000003",
                "tickLower": "0x10bf8",
                "tickUpper": "0x125c0",
                "token0": "cx0000000000000000000000000000000000000002",
                "token1": "cx0000000000000000000000000000000000000003"
              }
            }
          }
        ]
      )
      expect(value).toEqual('0x0')
    })

    it('succeeds for full range', () => {
      const { calldata, value } = NonfungiblePositionManager.addCallParameters(
        new Position({
          pool: pool_0_1,
          tickLower: nearestUsableTick(TickMath.MIN_TICK, TICK_SPACINGS[fee]),
          tickUpper: nearestUsableTick(TickMath.MAX_TICK, TICK_SPACINGS[fee]),
          liquidity: 1
        }),
        { recipient, slippageTolerance, deadline }
      )

      expect(calldata).toStrictEqual(
        [
          {
            "to": "NonfungiblePositionManager",
            "method": "mint",
            "params": {
              "params": {
                "amount0Desired": "0x1",
                "amount0Min": "0x1",
                "amount1Desired": "0x1",
                "amount1Min": "0x1",
                "deadline": "0x7b",
                "fee": "0xbb8",
                "recipient": "hx0000000000000000000000000000000000000003",
                "tickLower": "-0xd89b4",
                "tickUpper": "0xd89b4",
                "token0": "cx0000000000000000000000000000000000000001",
                "token1": "cx0000000000000000000000000000000000000002"
              }
            }
          }
        ]
      )
      expect(value).toEqual('0x0')
    })

    it('succeeds for increase', () => {
      const { calldata, value } = NonfungiblePositionManager.addCallParameters(
        new Position({
          pool: pool_0_1,
          tickLower: -TICK_SPACINGS[FeeAmount.MEDIUM],
          tickUpper: TICK_SPACINGS[FeeAmount.MEDIUM],
          liquidity: 1
        }),
        { tokenId, slippageTolerance, deadline }
      )

      expect(calldata).toStrictEqual(
        [
          {
            "to": "NonfungiblePositionManager",
            "method": "increaseLiquidity",
            "params": {
              "params": {
                "amount0Desired": "0x1",
                "amount0Min": "0x0",
                "amount1Desired": "0x1",
                "amount1Min": "0x0",
                "deadline": "0x7b",
                "tokenId": "0x1"
                }
            }
          }
        ]
      )
      expect(value).toEqual('0x0')
    })
 
    it('useNative', () => {
      const { calldata, value } = NonfungiblePositionManager.addCallParameters(
        new Position({
          pool: pool_1_wicx,
          tickLower: -TICK_SPACINGS[FeeAmount.MEDIUM],
          tickUpper: TICK_SPACINGS[FeeAmount.MEDIUM],
          liquidity: 1
        }),
        { recipient, slippageTolerance, deadline, useNative: ICX }
      )

      expect(calldata).toStrictEqual(
        [
          {
            "to": "NonfungiblePositionManager",
            "method": "mint",
            "params": {
              "params": {
                "amount0Desired": "0x1",
                "amount0Min": "0x0",
                "amount1Desired": "0x1",
                "amount1Min": "0x0",
                "deadline": "0x7b",
                "fee": "0xbb8",
                "recipient": "hx0000000000000000000000000000000000000003",
                "tickLower": "-0x3c",
                "tickUpper": "0x3c",
                "token0": "cx0000000000000000000000000000000000000002",
                "token1": "cx1111111111111111111111111111111111111111"
              }
            }
          }
        ]
      )
      expect(value).toEqual('0x0')
    })
  })

  describe('#collectCallParameters', () => {
    it('works', () => {
      const { calldata, value } = NonfungiblePositionManager.collectCallParameters({
        tokenId,
        expectedCurrencyOwed0: CurrencyAmount.fromRawAmount(token0, 0),
        expectedCurrencyOwed1: CurrencyAmount.fromRawAmount(token1, 0),
        recipient
      })

      expect(calldata).toStrictEqual(
        [
          {
              "to": "NonfungiblePositionManager",
              "method": "collect",
              "params": {
                  "params": {
                    "amount0Max": "0xffffffffffffffffffffffffffffffff",
                    "amount1Max": "0xffffffffffffffffffffffffffffffff",
                    "recipient": "hx0000000000000000000000000000000000000003",
                    "tokenId": "0x1"
                  }
              }
          }
        ]
      )
      expect(value).toEqual('0x0')
    })

    it('works with ICX', () => {
      const { calldata, value } = NonfungiblePositionManager.collectCallParameters({
        tokenId,
        expectedCurrencyOwed0: CurrencyAmount.fromRawAmount(token1, 0),
        expectedCurrencyOwed1: CurrencyAmount.fromRawAmount(ICX, 0),
        recipient
      })

      expect(calldata).toStrictEqual(
        [
          {
            "to": "NonfungiblePositionManager",
            "method": "collect",
            "params": {
              "params": {
                "amount0Max": "0xffffffffffffffffffffffffffffffff",
                "amount1Max": "0xffffffffffffffffffffffffffffffff",
                "recipient": "hx0000000000000000000000000000000000000003",
                "tokenId": "0x1"
              }
            }
          }
        ]
      )
      expect(value).toEqual('0x0')
    })
  })

  describe('#removeCallParameters', () => {
    it('throws for 0 liquidity', () => {
      expect(() =>
        NonfungiblePositionManager.removeCallParameters(
          new Position({
            pool: pool_0_1,
            tickLower: -TICK_SPACINGS[FeeAmount.MEDIUM],
            tickUpper: TICK_SPACINGS[FeeAmount.MEDIUM],
            liquidity: 0
          }),
          {
            tokenId,
            liquidityPercentage: new Percent(1),
            slippageTolerance,
            deadline,
            collectOptions: {
              expectedCurrencyOwed0: CurrencyAmount.fromRawAmount(token0, 0),
              expectedCurrencyOwed1: CurrencyAmount.fromRawAmount(token1, 0),
              recipient
            }
          }
        )
      ).toThrow('ZERO_LIQUIDITY')
    })

    it('throws for 0 liquidity from small percentage', () => {
      expect(() =>
        NonfungiblePositionManager.removeCallParameters(
          new Position({
            pool: pool_0_1,
            tickLower: -TICK_SPACINGS[FeeAmount.MEDIUM],
            tickUpper: TICK_SPACINGS[FeeAmount.MEDIUM],
            liquidity: 50
          }),
          {
            tokenId,
            liquidityPercentage: new Percent(1, 100),
            slippageTolerance,
            deadline,
            collectOptions: {
              expectedCurrencyOwed0: CurrencyAmount.fromRawAmount(token0, 0),
              expectedCurrencyOwed1: CurrencyAmount.fromRawAmount(token1, 0),
              recipient
            }
          }
        )
      ).toThrow('ZERO_LIQUIDITY')
    })
 
    it('throws for bad burn', () => {
      expect(() =>
        NonfungiblePositionManager.removeCallParameters(
          new Position({
            pool: pool_0_1,
            tickLower: -TICK_SPACINGS[FeeAmount.MEDIUM],
            tickUpper: TICK_SPACINGS[FeeAmount.MEDIUM],
            liquidity: 50
          }),
          {
            tokenId,
            liquidityPercentage: new Percent(99, 100),
            slippageTolerance,
            deadline,
            burnToken: true,
            collectOptions: {
              expectedCurrencyOwed0: CurrencyAmount.fromRawAmount(token0, 0),
              expectedCurrencyOwed1: CurrencyAmount.fromRawAmount(token1, 0),
              recipient
            }
          }
        )
      ).toThrow('CANNOT_BURN')
    })

    it('works', () => {
      const { calldata, value } = NonfungiblePositionManager.removeCallParameters(
        new Position({
          pool: pool_0_1,
          tickLower: -TICK_SPACINGS[FeeAmount.MEDIUM],
          tickUpper: TICK_SPACINGS[FeeAmount.MEDIUM],
          liquidity: 100
        }),
        {
          tokenId,
          liquidityPercentage: new Percent(1),
          slippageTolerance,
          deadline,
          collectOptions: {
            expectedCurrencyOwed0: CurrencyAmount.fromRawAmount(token0, 0),
            expectedCurrencyOwed1: CurrencyAmount.fromRawAmount(token1, 0),
            recipient
          }
        }
      )

      expect(calldata).toStrictEqual(
        [
          {
            "to": "NonfungiblePositionManager",
            "method": "decreaseLiquidity",
            "params": {
              "params": {
                "amount0Min": "0x0",
                "amount1Min": "0x0",
                "deadline": "0x7b",
                "liquidity": "0x64",
                "tokenId": "0x1"
              }
            }
          },
          {
            "to": "NonfungiblePositionManager",
            "method": "collect",
            "params": {
              "params": {
                "amount0Max": "0xffffffffffffffffffffffffffffffff",
                "amount1Max": "0xffffffffffffffffffffffffffffffff",
                "recipient": "hx0000000000000000000000000000000000000003",
                "tokenId": "0x1"
              }
            }
          }
        ]
      )
      expect(value).toEqual('0x0')
    })

    it('works for partial', () => {
      const { calldata, value } = NonfungiblePositionManager.removeCallParameters(
        new Position({
          pool: pool_0_1,
          tickLower: -TICK_SPACINGS[FeeAmount.MEDIUM],
          tickUpper: TICK_SPACINGS[FeeAmount.MEDIUM],
          liquidity: 100
        }),
        {
          tokenId,
          liquidityPercentage: new Percent(1, 2),
          slippageTolerance,
          deadline,
          collectOptions: {
            expectedCurrencyOwed0: CurrencyAmount.fromRawAmount(token0, 0),
            expectedCurrencyOwed1: CurrencyAmount.fromRawAmount(token1, 0),
            recipient
          }
        }
      )

      expect(calldata).toStrictEqual(
        [
          {
              "to": "NonfungiblePositionManager",
              "method": "decreaseLiquidity",
              "params": {
                  "params": {
                      "amount0Min": "0x0",
                      "amount1Min": "0x0",
                      "deadline": "0x7b",
                      "liquidity": "0x32",
                      "tokenId": "0x1"
                  }
              }
          },
          {
              "to": "NonfungiblePositionManager",
              "method": "collect",
              "params": {
                  "params": {
                      "amount0Max": "0xffffffffffffffffffffffffffffffff",
                      "amount1Max": "0xffffffffffffffffffffffffffffffff",
                      "recipient": "hx0000000000000000000000000000000000000003",
                      "tokenId": "0x1"
                  }
              }
          }
        ]
      )
      expect(value).toEqual('0x0')
    })

    it('works with ICX', () => {
      const icxAmount = CurrencyAmount.fromRawAmount(ICX, 0)
      const tokenAmount = CurrencyAmount.fromRawAmount(token1, 0)

      const { calldata, value } = NonfungiblePositionManager.removeCallParameters(
        new Position({
          pool: pool_1_wicx,
          tickLower: -TICK_SPACINGS[FeeAmount.MEDIUM],
          tickUpper: TICK_SPACINGS[FeeAmount.MEDIUM],
          liquidity: 100
        }),
        {
          tokenId,
          liquidityPercentage: new Percent(1),
          slippageTolerance,
          deadline,
          collectOptions: {
            expectedCurrencyOwed0: pool_1_wicx.token0.equals(token1) ? tokenAmount : icxAmount,
            expectedCurrencyOwed1: pool_1_wicx.token0.equals(token1) ? icxAmount : tokenAmount,
            recipient
          }
        }
      )

      expect(calldata).toStrictEqual(
        [
          {
              "to": "NonfungiblePositionManager",
              "method": "decreaseLiquidity",
              "params": {
                  "params": {
                      "amount0Min": "0x0",
                      "amount1Min": "0x0",
                      "deadline": "0x7b",
                      "liquidity": "0x64",
                      "tokenId": "0x1"
                  }
              }
          },
          {
              "to": "NonfungiblePositionManager",
              "method": "collect",
              "params": {
                  "params": {
                      "amount0Max": "0xffffffffffffffffffffffffffffffff",
                      "amount1Max": "0xffffffffffffffffffffffffffffffff",
                      "recipient": "hx0000000000000000000000000000000000000003",
                      "tokenId": "0x1"
                  }
              }
          }
        ]
      )
      expect(value).toEqual('0x0')
    })

    it('works for partial with ICX', () => {
      const icxAmount = CurrencyAmount.fromRawAmount(ICX, 0)
      const tokenAmount = CurrencyAmount.fromRawAmount(token1, 0)

      const { calldata, value } = NonfungiblePositionManager.removeCallParameters(
        new Position({
          pool: pool_1_wicx,
          tickLower: -TICK_SPACINGS[FeeAmount.MEDIUM],
          tickUpper: TICK_SPACINGS[FeeAmount.MEDIUM],
          liquidity: 100
        }),
        {
          tokenId,
          liquidityPercentage: new Percent(1, 2),
          slippageTolerance,
          deadline,
          collectOptions: {
            expectedCurrencyOwed0: pool_1_wicx.token0.equals(token1) ? tokenAmount : icxAmount,
            expectedCurrencyOwed1: pool_1_wicx.token0.equals(token1) ? icxAmount : tokenAmount,
            recipient
          }
        }
      )

      expect(calldata).toStrictEqual(
        [
          {
              "to": "NonfungiblePositionManager",
              "method": "decreaseLiquidity",
              "params": {
                  "params": {
                      "amount0Min": "0x0",
                      "amount1Min": "0x0",
                      "deadline": "0x7b",
                      "liquidity": "0x32",
                      "tokenId": "0x1"
                  }
              }
          },
          {
              "to": "NonfungiblePositionManager",
              "method": "collect",
              "params": {
                  "params": {
                      "amount0Max": "0xffffffffffffffffffffffffffffffff",
                      "amount1Max": "0xffffffffffffffffffffffffffffffff",
                      "recipient": "hx0000000000000000000000000000000000000003",
                      "tokenId": "0x1"
                  }
              }
          }
        ]
      )
      expect(value).toEqual('0x0')
    })
  })
  
  describe('#safeTransferFromParameters', () => {
    it('succeeds no data param', () => {
      const options = {
        sender,
        recipient,
        tokenId
      }
      const { calldata, value } = NonfungiblePositionManager.safeTransferFromParameters(options)

      expect(calldata).toStrictEqual(
        [
          {
              "to": "NonfungiblePositionManager",
              "method": "safeTransferFrom",
              "params": {
                  "_data": "",
                  "from": "hx0000000000000000000000000000000000000004",
                  "to": "hx0000000000000000000000000000000000000003",
                  "tokenId": "0x1"
              }
          }
      ]
      )
      expect(value).toEqual('0x0')
    })
    
    it('succeeds data param', () => {
      const data = '0x0000000000000000000000000000000000009004'
      const options = {
        sender,
        recipient,
        tokenId,
        data
      }
      const { calldata, value } = NonfungiblePositionManager.safeTransferFromParameters(options)

      expect(calldata).toStrictEqual(
        [
          {
              "to": "NonfungiblePositionManager",
              "method": "safeTransferFrom",
              "params": {
                  "_data": "0x0000000000000000000000000000000000009004",
                  "from": "hx0000000000000000000000000000000000000004",
                  "to": "hx0000000000000000000000000000000000000003",
                  "tokenId": "0x1"
              }
          }
        ]
      )
      expect(value).toEqual('0x0')
    })
  })
})
