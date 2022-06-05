import JSBI from 'jsbi'
import { CurrencyAmount, Icx, Token, TradeType } from '@convexus/sdk-core'
import { FeeAmount, TICK_SPACINGS } from '../src/constants'
import { Pool } from '../src/entities/pool'
import { SwapQuoter } from '../src/quoter'
import { nearestUsableTick, TickMath } from '../src/utils'
import { encodeSqrtRatioX96 } from '../src/utils/encodeSqrtRatioX96'
import { Route, Trade } from '../src/entities'
import { TestPoolFactoryProvider } from './entities/TestPoolFactoryProvider'

describe('SwapQuoter', () => {
  const token0 = new Token('cx0000000000000000000000000000000000000001', 18, 't0', 'token0')
  const token1 = new Token('cx0000000000000000000000000000000000000002', 18, 't1', 'token1')

  const poolFactoryProvider = new TestPoolFactoryProvider()

  const feeAmount = FeeAmount.MEDIUM
  const sqrtRatioX96 = encodeSqrtRatioX96(1, 1)
  const liquidity = 1_000_000
  const ICX = new Icx()
  const WICX = ICX.wrapped

  const makePool = (token0: Token, token1: Token) => {
    return new Pool(token0, token1, feeAmount, sqrtRatioX96, liquidity, TickMath.getTickAtSqrtRatio(sqrtRatioX96), [
      {
        index: nearestUsableTick(TickMath.MIN_TICK, TICK_SPACINGS[feeAmount]),
        liquidityNet: liquidity,
        liquidityGross: liquidity
      },
      {
        index: nearestUsableTick(TickMath.MAX_TICK, TICK_SPACINGS[feeAmount]),
        liquidityNet: -liquidity,
        liquidityGross: liquidity
      }
    ])
  }

  const pool_0_1 = makePool(token0, token1)
  const pool_1_wicx = makePool(token1, WICX)

  describe('#swapCallParameters', () => {
    describe('single trade input', () => {
      it('single-hop exact input', async () => {
        const trade = await Trade.fromRoute(
          poolFactoryProvider,
          new Route([pool_0_1], token0, token1),
          CurrencyAmount.fromRawAmount(token0, 100),
          TradeType.EXACT_INPUT
        )
        const { calldata, value } = SwapQuoter.quoteCallParameters(
          trade.swaps[0].route,
          trade.inputAmount,
          trade.tradeType
        )

        expect(calldata).toStrictEqual(
          {
            "method": "quoteExactInputSingle",
            "params": {
                "params": {
                    "amountIn": "0xbb8",
                    "fee": "0x64",
                    "sqrtPriceLimitX96": "0x0",
                    "tokenIn": "cx0000000000000000000000000000000000000001",
                    "tokenOut": "cx0000000000000000000000000000000000000002"
                }
            }
          }
        )
        expect(value).toBe('0x00')
      })

      it('single-hop exact output', async () => {
        const trade = await Trade.fromRoute(
          poolFactoryProvider,
          new Route([pool_0_1], token0, token1),
          CurrencyAmount.fromRawAmount(token1, 100),
          TradeType.EXACT_OUTPUT
        )
        const { calldata, value } = SwapQuoter.quoteCallParameters(
          trade.swaps[0].route,
          trade.outputAmount,
          trade.tradeType
        )

        expect(calldata).toStrictEqual(
          {
            "method": "quoteExactOutputSingle",
            "params": {
                "params": {
                    "amount": "0xbb8",
                    "fee": "0x64",
                    "sqrtPriceLimitX96": "0x0",
                    "tokenIn": "cx0000000000000000000000000000000000000001",
                    "tokenOut": "cx0000000000000000000000000000000000000002"
                }
            }
          }
        )
        expect(value).toBe('0x00')
      })

      it('multi-hop exact input', async () => {
        const trade = await Trade.fromRoute(
          poolFactoryProvider,
          new Route([pool_0_1, pool_1_wicx], token0, WICX),
          CurrencyAmount.fromRawAmount(token0, 100),
          TradeType.EXACT_INPUT
        )
        const { calldata, value } = SwapQuoter.quoteCallParameters(trade.route, trade.inputAmount, trade.tradeType)

        expect(calldata).toStrictEqual(
          {
            "method": "quoteExactInput",
            "params": {
              "params": {
                "amountIn": "0x64",
                "path": "0x01000000000000000000000000000000000000000100000bb801000000000000000000000000000000000000000200000bb8011111111111111111111111111111111111111111"
              }
            }
          }
        )
        expect(value).toBe('0x00')
      })

      it('multi-hop exact output', async () => {
        const trade = await Trade.fromRoute(
          poolFactoryProvider,
          new Route([pool_0_1, pool_1_wicx], token0, WICX),
          CurrencyAmount.fromRawAmount(WICX, 100),
          TradeType.EXACT_OUTPUT
        )
        const { calldata, value } = SwapQuoter.quoteCallParameters(trade.route, trade.outputAmount, trade.tradeType)

        expect(calldata).toStrictEqual(
          {
            "method": "quoteExactOutput",
            "params": {
                "params": {
                    "amountOut": "0x64",
                    "path": "0x01111111111111111111111111111111111111111100000bb801000000000000000000000000000000000000000200000bb8010000000000000000000000000000000000000001"
                }
            }
          }
        )
        expect(value).toBe('0x00')
      })
      it('sqrtPriceLimitX96', async () => {
        const trade = await Trade.fromRoute(
          poolFactoryProvider,
          new Route([pool_0_1], token0, token1),
          CurrencyAmount.fromRawAmount(token0, 100),
          TradeType.EXACT_INPUT
        )
        const { calldata, value } = SwapQuoter.quoteCallParameters(trade.route, trade.inputAmount, trade.tradeType, {
          sqrtPriceLimitX96: JSBI.exponentiate(JSBI.BigInt(2), JSBI.BigInt(128))
        })

        expect(calldata).toStrictEqual(
          {
            "method": "quoteExactInputSingle",
            "params": {
                "params": {
                    "amountIn": "0xbb8",
                    "fee": "0x64",
                    "sqrtPriceLimitX96": "0x100000000000000000000000000000000",
                    "tokenIn": "cx0000000000000000000000000000000000000001",
                    "tokenOut": "cx0000000000000000000000000000000000000002"
                }
            }
          }
        )
        expect(value).toBe('0x00')
      })
    })
  })
})
