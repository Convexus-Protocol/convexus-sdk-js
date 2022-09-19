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
        const calldata = SwapRouter.swapCallParameters(trade, {
          slippageTolerance,
          recipient,
          deadline
        })

        const unhexPayload = JSON.parse(Buffer.from(calldata[0]["params"]["_data"].replace("0x", ""), "hex").toString())

        expect(unhexPayload).toStrictEqual(
          {
            "method": "exactInputSingle",
            "params": {
              "params": {
                "amountIn": "0x64",
                "amountOutMinimum": "0x61",
                "deadline": "0x7b",
                "fee": "0xbb8",
                "recipient": "hx0000000000000000000000000000000000000003",
                "sqrtPriceLimitX96": "0x0",
                "tokenIn": "cx0000000000000000000000000000000000000001",
                "tokenOut": "cx0000000000000000000000000000000000000002"
              }
            }
          }
        )
        
        expect(calldata[0]["params"]["_value"]).toBe("0x64")
      })

      it('single-hop exact output', async () => {
        const trade = await Trade.fromRoute(
          poolFactoryProvider,
          new Route([pool_0_1], token0, token1),
          CurrencyAmount.fromRawAmount(token1, 100),
          TradeType.EXACT_OUTPUT
        )
        const calldata = SwapRouter.swapCallParameters(trade, {
          slippageTolerance,
          recipient,
          deadline
        })

        const unhexPayload = JSON.parse(Buffer.from(calldata[0]["params"]["_data"].replace("0x", ""), "hex").toString())

        expect(unhexPayload).toStrictEqual(
          {
            "method": "exactOutputSingle",
            "params": {
              "params": {
                "amountInMaximum": "0x67",
                "amountOut": "0x64",
                "deadline": "0x7b",
                "fee": "0xbb8",
                "recipient": "hx0000000000000000000000000000000000000003",
                "sqrtPriceLimitX96": "0x0",
                "tokenIn": "cx0000000000000000000000000000000000000001",
                "tokenOut": "cx0000000000000000000000000000000000000002"
              }
            }
          }
        )
        
        expect(calldata[0]["params"]["_value"]).toBe("0x67")
      })

      it('ICX in multi-hop exact input', async () => {
        const trade = await Trade.fromRoute(
          poolFactoryProvider,
          new Route([pool_1_wicx, pool_0_1], ICX, token0),
          CurrencyAmount.fromRawAmount(ICX, 100),
          TradeType.EXACT_INPUT
        )
        const calldata = SwapRouter.swapCallParameters(trade, {
          slippageTolerance,
          recipient,
          deadline
        })

        expect(calldata).toStrictEqual([
          {
            "to": "SwapRouter",
            "method": "exactInputIcx",
            "value": "0x64",
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
      })

      it('multi-hop exact input', async () => {
        const amountIn = CurrencyAmount.fromRawAmount(token0, 100);
        const trade = await Trade.fromRoute(
          poolFactoryProvider,
          new Route([pool_0_1, pool_1_wicx], token0, WICX),
          amountIn,
          TradeType.EXACT_INPUT
        )
        const calldata = SwapRouter.swapCallParameters(trade, {
          slippageTolerance,
          recipient,
          deadline
        })

        const unhexPayload = JSON.parse(Buffer.from(calldata[0]["params"]["_data"].replace("0x", ""), "hex").toString())

        expect(unhexPayload).toStrictEqual(
          {
            "method": "exactInput",
            "params": {
              "params": {
                "path": "0x01000000000000000000000000000000000000000100000bb801000000000000000000000000000000000000000200000bb8011111111111111111111111111111111111111111",
                "recipient": "hx0000000000000000000000000000000000000003",
                "deadline": "0x7b",
                "amountIn": "0x64",
                "amountOutMinimum": "0x5f"
              }
            }
          }
        )

        
        expect(calldata[0]["params"]["_value"]).toBe("0x" + amountIn.quotient.toString(16))
      })

      it('ICX in multi-hop exact output', async () => {
        const trade = await Trade.fromRoute(
          poolFactoryProvider,
          new Route([pool_1_wicx, pool_0_1], ICX, token0),
          CurrencyAmount.fromRawAmount(token0, 100),
          TradeType.EXACT_OUTPUT
        )
        const calldata = SwapRouter.swapCallParameters(trade, {
          slippageTolerance,
          recipient,
          deadline
        })

        expect(calldata).toStrictEqual([
          {
            "to": "SwapRouter",
            "method": "exactOutputIcx",
            "value": "0x69",
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
      })

      it('multi-hop exact output', async () => {
        const trade = await Trade.fromRoute(
          poolFactoryProvider,
          new Route([pool_0_1, pool_1_wicx], token0, WICX),
          CurrencyAmount.fromRawAmount(WICX, 100),
          TradeType.EXACT_OUTPUT
        )
        const calldata = SwapRouter.swapCallParameters(trade, {
          slippageTolerance,
          recipient,
          deadline
        })

        const unhexPayload = JSON.parse(Buffer.from(calldata[0]["params"]["_data"].replace("0x", ""), "hex").toString())

        expect(unhexPayload).toStrictEqual(
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
        )

        
        expect(calldata[0]["params"]["_value"]).toBe("0x69")
      })

      it('ICX in exact input', async () => {
        const trade = await Trade.fromRoute(
          poolFactoryProvider,
          new Route([pool_1_wicx], ICX, token1),
          CurrencyAmount.fromRawAmount(ICX, 100),
          TradeType.EXACT_INPUT
        )
        const calldata = SwapRouter.swapCallParameters(trade, {
          slippageTolerance,
          recipient,
          deadline
        })

        expect(calldata).toStrictEqual([
          {
            "to": "SwapRouter",
            "method": "exactInputSingleIcx",
            "value": "0x64",
            "params": {
              "params": {
                "amountOutMinimum": "0x61",
                "deadline": "0x7b",
                "fee": "0xbb8",
                "recipient": "hx0000000000000000000000000000000000000003",
                "sqrtPriceLimitX96": "0x0",
                "tokenOut": "cx0000000000000000000000000000000000000002"
              }
            }
          }
        ])
      })

      it('ICX in exact output', async () => {
        const trade = await Trade.fromRoute(
          poolFactoryProvider,
          new Route([pool_1_wicx], ICX, token1),
          CurrencyAmount.fromRawAmount(token1, 100),
          TradeType.EXACT_OUTPUT
        )
        const calldata = SwapRouter.swapCallParameters(trade, {
          slippageTolerance,
          recipient,
          deadline
        })

        expect(calldata).toStrictEqual([
          {
            "to": "SwapRouter",
            "method": "exactOutputSingleIcx",
            "value": "0x67",
            "params": {
              "params": {
                "amountOut": "0x64",
                "deadline": "0x7b",
                "fee": "0xbb8",
                "recipient": "hx0000000000000000000000000000000000000003",
                "sqrtPriceLimitX96": "0x0",
                "tokenOut": "cx0000000000000000000000000000000000000002"
              }
            }
          }
        ])
      })

      it('ICX out exact input', async () => {
        const trade = await Trade.fromRoute(
          poolFactoryProvider,
          new Route([pool_1_wicx], token1, ICX),
          CurrencyAmount.fromRawAmount(token1, 100),
          TradeType.EXACT_INPUT
        )
        const calldata = SwapRouter.swapCallParameters(trade, {
          slippageTolerance,
          recipient,
          deadline
        })

        const unhexPayload = JSON.parse(Buffer.from(calldata[0]["params"]["_data"].replace("0x", ""), "hex").toString())

        expect(unhexPayload).toStrictEqual(
          {
            "method": "exactInputSingle",
            "params": {
              "params": {
                "amountIn": "0x64",
                "amountOutMinimum": "0x61",
                "deadline": "0x7b",
                "fee": "0xbb8",
                "recipient": "hx0000000000000000000000000000000000000000",
                "sqrtPriceLimitX96": "0x0",
                "tokenIn": "cx0000000000000000000000000000000000000002",
                "tokenOut": "cx1111111111111111111111111111111111111111"
              }
            }
          }
        )
        
        expect(calldata[0]["params"]["_value"]).toBe("0x64")
      })

      it('ICX out exact output', async () => {
        const trade = await Trade.fromRoute(
          poolFactoryProvider,
          new Route([pool_1_wicx], token1, ICX),
          CurrencyAmount.fromRawAmount(ICX, 100),
          TradeType.EXACT_OUTPUT
        )
        const calldata = SwapRouter.swapCallParameters(trade, {
          slippageTolerance,
          recipient,
          deadline
        })

        const unhexPayload = JSON.parse(Buffer.from(calldata[0]["params"]["_data"].replace("0x", ""), "hex").toString())

        expect(unhexPayload).toStrictEqual(
          {
            "method": "exactOutputSingle",
            "params": {
              "params": {
                "amountInMaximum": "0x67",
                "amountOut": "0x64",
                "deadline": "0x7b",
                "fee": "0xbb8",
                "recipient": "hx0000000000000000000000000000000000000000",
                "sqrtPriceLimitX96": "0x0",
                "tokenIn": "cx0000000000000000000000000000000000000002",
                "tokenOut": "cx1111111111111111111111111111111111111111"
              }
            }
          }
        )
        
        expect(calldata[0]["params"]["_value"]).toBe("0x67")
      })

      it('sqrtPriceLimitX96', async () => {
        const trade = await Trade.fromRoute(
          poolFactoryProvider,
          new Route([pool_0_1], token0, token1),
          CurrencyAmount.fromRawAmount(token0, 100),
          TradeType.EXACT_INPUT
        )
        const calldata = SwapRouter.swapCallParameters(trade, {
          slippageTolerance,
          recipient,
          deadline,
          sqrtPriceLimitX96: JSBI.exponentiate(JSBI.BigInt(2), JSBI.BigInt(128))
        })

        const unhexPayload = JSON.parse(Buffer.from(calldata[0]["params"]["_data"].replace("0x", ""), "hex").toString())

        expect(unhexPayload).toStrictEqual(
          {
            "method": "exactInputSingle",
            "params": {
              "params": {
                "amountIn": "0x64",
                "amountOutMinimum": "0x61",
                "deadline": "0x7b",
                "fee": "0xbb8",
                "recipient": "hx0000000000000000000000000000000000000003",
                "sqrtPriceLimitX96": "0x100000000000000000000000000000000",
                "tokenIn": "cx0000000000000000000000000000000000000001",
                "tokenOut": "cx0000000000000000000000000000000000000002"
              }
            }
          }
        )
        
        expect(calldata[0]["params"]["_value"]).toBe("0x64")
      })

      it('fee with icx out', async () => {
        const trade = await Trade.fromRoute(
          poolFactoryProvider,
          new Route([pool_1_wicx], token1, ICX),
          CurrencyAmount.fromRawAmount(token1, 100),
          TradeType.EXACT_INPUT
        )
        
        const calldata = SwapRouter.swapCallParameters(trade, {
          slippageTolerance,
          recipient,
          deadline,
          fee: {
            fee: new Percent(5, 1000),
            recipient
          }
        })

        const unhexPayload = JSON.parse(Buffer.from(calldata[0]["params"]["_data"].replace("0x", ""), "hex").toString())

        expect(unhexPayload).toStrictEqual(
          {
            "method": "exactInputSingle",
            "params": {
                "params": {
                    "amountIn": "0x64",
                    "amountOutMinimum": "0x61",
                    "deadline": "0x7b",
                    "fee": "0xbb8",
                    "recipient": "hx0000000000000000000000000000000000000000",
                    "sqrtPriceLimitX96": "0x0",
                    "tokenIn": "cx0000000000000000000000000000000000000002",
                    "tokenOut": "cx1111111111111111111111111111111111111111"
                }
            }
          }
        )
        
        expect(calldata[0]["params"]["_value"]).toBe("0x64")
      })

      it('fee with icx in using exact output', async () => {
        const trade = await Trade.fromRoute(
          poolFactoryProvider,
          new Route([pool_1_wicx], ICX, token1),
          CurrencyAmount.fromRawAmount(token1, 10),
          TradeType.EXACT_OUTPUT
        )
        const calldata = SwapRouter.swapCallParameters(trade, {
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
            "to": "SwapRouter",
            "method": "exactOutputSingleIcx",
            "value": "0xc",
            "params": {
              "params": {
                "amountOut": "0xa",
                "deadline": "0x7b",
                "fee": "0xbb8",
                "recipient": "hx0000000000000000000000000000000000000000",
                "sqrtPriceLimitX96": "0x0",
                "tokenOut": "cx0000000000000000000000000000000000000002"
              }
            }
          }
        ])
      })

      it('fee', async () => {
        const trade = await Trade.fromRoute(
          poolFactoryProvider,
          new Route([pool_0_1], token0, token1),
          CurrencyAmount.fromRawAmount(token0, 100),
          TradeType.EXACT_INPUT
        )
        const calldata = SwapRouter.swapCallParameters(trade, {
          slippageTolerance,
          recipient,
          deadline,
          fee: {
            fee: new Percent(5, 1000),
            recipient
          }
        })

        const unhexPayload = JSON.parse(Buffer.from(calldata[0]["params"]["_data"].replace("0x", ""), "hex").toString())

        expect(unhexPayload).toStrictEqual(
          {
            "method": "exactInputSingle",
            "params": {
              "params": {
                "amountIn": "0x64",
                "amountOutMinimum": "0x61",
                "deadline": "0x7b",
                "fee": "0xbb8",
                "recipient": "hx0000000000000000000000000000000000000000",
                "sqrtPriceLimitX96": "0x0",
                "tokenIn": "cx0000000000000000000000000000000000000001",
                "tokenOut": "cx0000000000000000000000000000000000000002"
              }
            }
          }
        )
        
        expect(calldata[0]["params"]["_value"]).toBe("0x64")
      })
    })
  })
})
