import JSBI from 'jsbi'
import { CurrencyAmount, Icx, Percent, Token, TradeType } from '@convexus/sdk-core'
import { FeeAmount, TICK_SPACINGS } from '../src/constants'
import { Pool } from '../src/entities/pool'
import { SwapRouter } from '../src/swapRouter'
import { nearestUsableTick, TickMath } from '../src/utils'
import { encodeSqrtRatioX96 } from '../src/utils/encodeSqrtRatioX96'
import { Route, Trade } from '../src/entities'
import { TestPoolFactoryProvider } from './entities/TestPoolFactoryProvider'

describe('SwapRouter', () => {
  const ICX = new Icx()
  const WICX = ICX.wrapped
  const token0 = new Token('cx0000000000000000000000000000000000000001', 18, 't0', 'token0')
  const token1 = new Token('cx0000000000000000000000000000000000000002', 18, 't1', 'token1')

  const feeAmount = FeeAmount.MEDIUM
  const sqrtRatioX96 = encodeSqrtRatioX96(1, 1)
  const liquidity = 1_000_000

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
  const poolFactoryProvider = new TestPoolFactoryProvider()

  const slippageTolerance = new Percent(1, 100)
  const recipient = 'hx0000000000000000000000000000000000000003'
  const deadline = 123

  describe('#swapCallParameters', () => {
    describe('single trade input', () => {
      it('single-hop exact input', async () => {
        const trade = await Trade.fromRoute(
          poolFactoryProvider,
          new Route([pool_0_1], token0, token1),
          CurrencyAmount.fromRawAmount(token0, 100),
          TradeType.EXACT_INPUT
        )
        const { calldata, value } = SwapRouter.swapCallParameters(trade, {
          slippageTolerance,
          recipient,
          deadline
        })

        expect(calldata).toStrictEqual([
          {
            "method": "exactInputSingle",
            "params": {
              "params": {
                "amountIn": "0x64",
                "amountOutMinimum": "0x61",
                "deadline": "0x7b",
                "fee": "0x0bb8",
                "recipient": "hx0000000000000000000000000000000000000003",
                "sqrtPriceLimitX96": "0x00",
                "tokenIn": "cx0000000000000000000000000000000000000001",
                "tokenOut": "cx0000000000000000000000000000000000000002"
              }
            }
          }
        ])
        expect(value).toBe('0x00')
      })

      it('single-hop exact output', async () => {
        const trade = await Trade.fromRoute(
          poolFactoryProvider,
          new Route([pool_0_1], token0, token1),
          CurrencyAmount.fromRawAmount(token1, 100),
          TradeType.EXACT_OUTPUT
        )
        const { calldata, value } = SwapRouter.swapCallParameters(trade, {
          slippageTolerance,
          recipient,
          deadline
        })

        expect(calldata).toStrictEqual([
          {
            "method": "exactOutputSingle",
            "params": {
              "params": {
                "amountInMaximum": "0x67",
                "amountOut": "0x64",
                "deadline": "0x7b",
                "fee": "0x0bb8",
                "recipient": "hx0000000000000000000000000000000000000003",
                "sqrtPriceLimitX96": "0x00",
                "tokenIn": "cx0000000000000000000000000000000000000001",
                "tokenOut": "cx0000000000000000000000000000000000000002"
              }
            }
          }
        ])
        expect(value).toBe('0x00')
      })

      it('ICX in multi-hop exact input', async () => {
        const trade = await Trade.fromRoute(
          poolFactoryProvider,
          new Route([pool_1_wicx, pool_0_1], ICX, token0),
          CurrencyAmount.fromRawAmount(ICX, 100),
          TradeType.EXACT_INPUT
        )
        const { calldata, value } = SwapRouter.swapCallParameters(trade, {
          slippageTolerance,
          recipient,
          deadline
        })

        expect(calldata).toStrictEqual([
          {
            "method": "exactInputIcx",
            "params": {
              "params": {
                "amountOutMinimum": "0x5f",
                "deadline": "0x7b",
                "path": "0x01111111111111111111111111111111111111111100000bb801000000000000000000000000000000000000000200000bb8010000000000000000000000000000000000000001",
                "recipient": "hx0000000000000000000000000000000000000003"
              }
            }
          }
        ])
        expect(value).toBe('0x64')
      })

      it('multi-hop exact input', async () => {
        const trade = await Trade.fromRoute(
          poolFactoryProvider,
          new Route([pool_0_1, pool_1_wicx], token0, WICX),
          CurrencyAmount.fromRawAmount(token0, 100),
          TradeType.EXACT_INPUT
        )
        const { calldata, value } = SwapRouter.swapCallParameters(trade, {
          slippageTolerance,
          recipient,
          deadline
        })

        expect(calldata).toStrictEqual([
          {
            "method": "exactInput",
            "params": {
              "params": {
                "amountIn": "0x64",
                "amountOutMinimum": "0x5f",
                "deadline": "0x7b",
                "path": "0x01000000000000000000000000000000000000000100000bb801000000000000000000000000000000000000000200000bb8011111111111111111111111111111111111111111",
                "recipient": "hx0000000000000000000000000000000000000003"
              }
            }
          }
        ])
        expect(value).toBe('0x00')
      })

      it('ICX in multi-hop exact output', async () => {
        const trade = await Trade.fromRoute(
          poolFactoryProvider,
          new Route([pool_1_wicx, pool_0_1], ICX, token0),
          CurrencyAmount.fromRawAmount(token0, 100),
          TradeType.EXACT_OUTPUT
        )
        const { calldata, value } = SwapRouter.swapCallParameters(trade, {
          slippageTolerance,
          recipient,
          deadline
        })

        expect(calldata).toStrictEqual([
          {
            "method": "exactOutputIcx",
            "params": {
              "params": {
                "amountOut": "0x64",
                "deadline": "0x7b",
                "path": "0x01000000000000000000000000000000000000000100000bb801000000000000000000000000000000000000000200000bb8011111111111111111111111111111111111111111",
                "recipient": "hx0000000000000000000000000000000000000003"
              }
            }
          }
        ])
        expect(value).toBe('0x69')
      })

      it('multi-hop exact output', async () => {
        const trade = await Trade.fromRoute(
          poolFactoryProvider,
          new Route([pool_0_1, pool_1_wicx], token0, WICX),
          CurrencyAmount.fromRawAmount(WICX, 100),
          TradeType.EXACT_OUTPUT
        )
        const { calldata, value } = SwapRouter.swapCallParameters(trade, {
          slippageTolerance,
          recipient,
          deadline
        })

        expect(calldata).toStrictEqual([
          {
            "method": "exactOutput",
            "params": {
              "params": {
                "amountInMaximum": "0x69",
                "amountOut": "0x64",
                "deadline": "0x7b",
                "path": "0x01111111111111111111111111111111111111111100000bb801000000000000000000000000000000000000000200000bb8010000000000000000000000000000000000000001",
                "recipient": "hx0000000000000000000000000000000000000003"
              }
            }
          }
        ])
        expect(value).toBe('0x00')
      })

      it('ICX in exact input', async () => {
        const trade = await Trade.fromRoute(
          poolFactoryProvider,
          new Route([pool_1_wicx], ICX, token1),
          CurrencyAmount.fromRawAmount(ICX, 100),
          TradeType.EXACT_INPUT
        )
        const { calldata, value } = SwapRouter.swapCallParameters(trade, {
          slippageTolerance,
          recipient,
          deadline
        })

        expect(calldata).toStrictEqual([
          {
            "method": "exactInputSingleIcx",
            "params": {
              "params": {
                "amountOutMinimum": "0x61",
                "deadline": "0x7b",
                "fee": "0x0bb8",
                "recipient": "hx0000000000000000000000000000000000000003",
                "sqrtPriceLimitX96": "0x00",
                "tokenOut": "cx0000000000000000000000000000000000000002"
              }
            }
          }
        ])
        expect(value).toBe('0x64')
      })

      it('ICX in exact output', async () => {
        const trade = await Trade.fromRoute(
          poolFactoryProvider,
          new Route([pool_1_wicx], ICX, token1),
          CurrencyAmount.fromRawAmount(token1, 100),
          TradeType.EXACT_OUTPUT
        )
        const { calldata, value } = SwapRouter.swapCallParameters(trade, {
          slippageTolerance,
          recipient,
          deadline
        })

        expect(calldata).toStrictEqual([
          {
            "method": "exactOutputSingleIcx",
            "params": {
              "params": {
                "amountOut": "0x64",
                "deadline": "0x7b",
                "fee": "0x0bb8",
                "recipient": "hx0000000000000000000000000000000000000003",
                "sqrtPriceLimitX96": "0x00",
                "tokenOut": "cx0000000000000000000000000000000000000002"
              }
            }
          }
        ])
        expect(value).toBe('0x67')
      })

      it('ICX out exact input', async () => {
        const trade = await Trade.fromRoute(
          poolFactoryProvider,
          new Route([pool_1_wicx], token1, ICX),
          CurrencyAmount.fromRawAmount(token1, 100),
          TradeType.EXACT_INPUT
        )
        const { calldata, value } = SwapRouter.swapCallParameters(trade, {
          slippageTolerance,
          recipient,
          deadline
        })

        expect(calldata).toStrictEqual([
          {
            "method": "exactInputSingle",
            "params": {
              "params": {
                "amountIn": "0x64",
                "amountOutMinimum": "0x61",
                "deadline": "0x7b",
                "fee": "0x0bb8",
                "recipient": "hx0000000000000000000000000000000000000000",
                "sqrtPriceLimitX96": "0x00",
                "tokenIn": "cx0000000000000000000000000000000000000002",
                "tokenOut": "cx1111111111111111111111111111111111111111"
              }
            }
          }
        ])
        expect(value).toBe('0x00')
      })

      it('ICX out exact output', async () => {
        const trade = await Trade.fromRoute(
          poolFactoryProvider,
          new Route([pool_1_wicx], token1, ICX),
          CurrencyAmount.fromRawAmount(ICX, 100),
          TradeType.EXACT_OUTPUT
        )
        const { calldata, value } = SwapRouter.swapCallParameters(trade, {
          slippageTolerance,
          recipient,
          deadline
        })

        expect(calldata).toStrictEqual([
          {
            "method": "exactOutputSingle",
            "params": {
              "params": {
                "amountInMaximum": "0x67",
                "amountOut": "0x64",
                "deadline": "0x7b",
                "fee": "0x0bb8",
                "recipient": "hx0000000000000000000000000000000000000000",
                "sqrtPriceLimitX96": "0x00",
                "tokenIn": "cx0000000000000000000000000000000000000002",
                "tokenOut": "cx1111111111111111111111111111111111111111"
              }
            }
          }
        ])
        expect(value).toBe('0x00')
      })

      it('sqrtPriceLimitX96', async () => {
        const trade = await Trade.fromRoute(
          poolFactoryProvider,
          new Route([pool_0_1], token0, token1),
          CurrencyAmount.fromRawAmount(token0, 100),
          TradeType.EXACT_INPUT
        )
        const { calldata, value } = SwapRouter.swapCallParameters(trade, {
          slippageTolerance,
          recipient,
          deadline,
          sqrtPriceLimitX96: JSBI.exponentiate(JSBI.BigInt(2), JSBI.BigInt(128))
        })

        expect(calldata).toStrictEqual([
          {
            "method": "exactInputSingle",
            "params": {
              "params": {
                "amountIn": "0x64",
                "amountOutMinimum": "0x61",
                "deadline": "0x7b",
                "fee": "0x0bb8",
                "recipient": "hx0000000000000000000000000000000000000003",
                "sqrtPriceLimitX96": "0x0100000000000000000000000000000000",
                "tokenIn": "cx0000000000000000000000000000000000000001",
                "tokenOut": "cx0000000000000000000000000000000000000002"
              }
            }
          }
        ])
        expect(value).toBe('0x00')
      })

      it('fee with icx out', async () => {
        const trade = await Trade.fromRoute(
          poolFactoryProvider,
          new Route([pool_1_wicx], token1, ICX),
          CurrencyAmount.fromRawAmount(token1, 100),
          TradeType.EXACT_INPUT
        )
        const { calldata, value } = SwapRouter.swapCallParameters(trade, {
          slippageTolerance,
          recipient,
          deadline,
          fee: {
            fee: new Percent(5, 1000),
            recipient
          }
        })

        expect(calldata).toStrictEqual([
          {
            "method": "exactInputSingle",
            "params": {
                "params": {
                    "amountIn": "0x64",
                    "amountOutMinimum": "0x61",
                    "deadline": "0x7b",
                    "fee": "0x0bb8",
                    "recipient": "hx0000000000000000000000000000000000000000",
                    "sqrtPriceLimitX96": "0x00",
                    "tokenIn": "cx0000000000000000000000000000000000000002",
                    "tokenOut": "cx1111111111111111111111111111111111111111"
                }
            }
          }
        ])
        expect(value).toBe('0x00')
      })

      it('fee with icx in using exact output', async () => {
        const trade = await Trade.fromRoute(
          poolFactoryProvider,
          new Route([pool_1_wicx], ICX, token1),
          CurrencyAmount.fromRawAmount(token1, 10),
          TradeType.EXACT_OUTPUT
        )
        const { calldata, value } = SwapRouter.swapCallParameters(trade, {
          slippageTolerance,
          recipient,
          deadline,
          fee: {
            fee: new Percent(5, 1000),
            recipient
          }
        })

        expect(calldata).toStrictEqual([
          {
            "method": "exactOutputSingleIcx",
            "params": {
              "params": {
                "amountOut": "0x0a",
                "deadline": "0x7b",
                "fee": "0x0bb8",
                "recipient": "hx0000000000000000000000000000000000000000",
                "sqrtPriceLimitX96": "0x00",
                "tokenOut": "cx0000000000000000000000000000000000000002"
              }
            }
          }
        ])
        expect(value).toBe('0x0c')
      })

      it('fee', async () => {
        const trade = await Trade.fromRoute(
          poolFactoryProvider,
          new Route([pool_0_1], token0, token1),
          CurrencyAmount.fromRawAmount(token0, 100),
          TradeType.EXACT_INPUT
        )
        const { calldata, value } = SwapRouter.swapCallParameters(trade, {
          slippageTolerance,
          recipient,
          deadline,
          fee: {
            fee: new Percent(5, 1000),
            recipient
          }
        })

        expect(calldata).toStrictEqual([
          {
            "method": "exactInputSingle",
            "params": {
              "params": {
                "amountIn": "0x64",
                "amountOutMinimum": "0x61",
                "deadline": "0x7b",
                "fee": "0x0bb8",
                "recipient": "hx0000000000000000000000000000000000000000",
                "sqrtPriceLimitX96": "0x00",
                "tokenIn": "cx0000000000000000000000000000000000000001",
                "tokenOut": "cx0000000000000000000000000000000000000002"
              }
            }
          }
        ])
        expect(value).toBe('0x00')
      })
    })
  })
})
