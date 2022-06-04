import { CurrencyAmount, Icx, Percent, Price, sqrt, Token, TradeType } from '@convexus/sdk-core'
import JSBI from 'jsbi'
import { FeeAmount, TICK_SPACINGS } from '../src/constants'
import { encodeSqrtRatioX96 } from '../src/utils/encodeSqrtRatioX96'
import { nearestUsableTick } from '../src/utils/nearestUsableTick'
import { TickMath } from '../src/utils/tickMath'
import { Pool } from '../src/entities/pool'
import { Route } from '../src/entities/route'
import { Trade } from '../src/entities/trade'
import { TestPoolFactoryProvider } from './TestPoolFactoryProvider'

describe('Trade', () => {
  const ICX = new Icx()
  const WICX = ICX.wrapped
  const token0 = new Token('cx0000000000000000000000000000000000000001', 18, 't0', 'token0')
  const token1 = new Token('cx0000000000000000000000000000000000000002', 18, 't1', 'token1')
  const token2 = new Token('cx0000000000000000000000000000000000000003', 18, 't2', 'token2')
  const token3 = new Token('cx0000000000000000000000000000000000000004', 18, 't3', 'token3')

  const poolFactoryProvider = new TestPoolFactoryProvider()

  function simplePool(
    reserve0: CurrencyAmount<Token>,
    reserve1: CurrencyAmount<Token>,
    feeAmount: FeeAmount = FeeAmount.MEDIUM
  ) {
    const sqrtRatioX96 = encodeSqrtRatioX96(reserve1.quotient, reserve0.quotient)
    const liquidity = sqrt(JSBI.multiply(reserve0.quotient, reserve1.quotient))
    return new Pool(
      reserve0.currency,
      reserve1.currency,
      feeAmount,
      sqrtRatioX96,
      liquidity,
      TickMath.getTickAtSqrtRatio(sqrtRatioX96),
      [
        {
          index: nearestUsableTick(TickMath.MIN_TICK, TICK_SPACINGS[feeAmount]),
          liquidityNet: liquidity,
          liquidityGross: liquidity
        },
        {
          index: nearestUsableTick(TickMath.MAX_TICK, TICK_SPACINGS[feeAmount]),
          liquidityNet: JSBI.multiply(liquidity, JSBI.BigInt(-1)),
          liquidityGross: liquidity
        }
      ]
    )
  }

  const pool_0_1 = simplePool(
    CurrencyAmount.fromRawAmount(token0, 100000),
    CurrencyAmount.fromRawAmount(token1, 100000)
  )
  const pool_0_2 = simplePool(
    CurrencyAmount.fromRawAmount(token0, 100000),
    CurrencyAmount.fromRawAmount(token2, 110000)
  )
  const pool_0_3 = simplePool(
    CurrencyAmount.fromRawAmount(token0, 100000),
    CurrencyAmount.fromRawAmount(token3, 90000)
  )
  const pool_1_2 = simplePool(
    CurrencyAmount.fromRawAmount(token1, 120000),
    CurrencyAmount.fromRawAmount(token2, 100000)
  )
  const pool_1_3 = simplePool(
    CurrencyAmount.fromRawAmount(token1, 120000),
    CurrencyAmount.fromRawAmount(token3, 130000)
  )

  const pool_wicx_0 = simplePool(
    CurrencyAmount.fromRawAmount(WICX, JSBI.BigInt(100000)),
    CurrencyAmount.fromRawAmount(token0, JSBI.BigInt(100000))
  )

  const pool_wicx_1 = simplePool(
    CurrencyAmount.fromRawAmount(WICX, JSBI.BigInt(100000)),
    CurrencyAmount.fromRawAmount(token1, JSBI.BigInt(100000))
  )

  const pool_wicx_2 = simplePool(
    CurrencyAmount.fromRawAmount(WICX, JSBI.BigInt(100000)),
    CurrencyAmount.fromRawAmount(token2, JSBI.BigInt(100000))
  )

  describe('#fromRoute', () => {
    
    it('can be constructed with ICX as input', async () => {
      const trade = await Trade.fromRoute(
        poolFactoryProvider,
        new Route([pool_wicx_0], ICX, token0),
        CurrencyAmount.fromRawAmount(ICX, JSBI.BigInt(10000)),
        TradeType.EXACT_INPUT
      )
      expect(trade.inputAmount.currency).toEqual(ICX)
      expect(trade.outputAmount.currency).toEqual(token0)
    })
    it('can be constructed with ICX as input for exact output', async () => {
      const trade = await Trade.fromRoute(
        poolFactoryProvider,
        new Route([pool_wicx_0], ICX, token0),
        CurrencyAmount.fromRawAmount(token0, JSBI.BigInt(10000)),
        TradeType.EXACT_OUTPUT
      )
      expect(trade.inputAmount.currency).toEqual(ICX)
      expect(trade.outputAmount.currency).toEqual(token0)
    })

    it('can be constructed with ICX as output', async () => {
      const trade = await Trade.fromRoute(
        poolFactoryProvider,
        new Route([pool_wicx_0], token0, ICX),
        CurrencyAmount.fromRawAmount(ICX, JSBI.BigInt(10000)),
        TradeType.EXACT_OUTPUT
      )
      expect(trade.inputAmount.currency).toEqual(token0)
      expect(trade.outputAmount.currency).toEqual(ICX)
    })
    it('can be constructed with ICX as output for exact input', async () => {
      const trade = await Trade.fromRoute(
        poolFactoryProvider,
        new Route([pool_wicx_0], token0, ICX),
        CurrencyAmount.fromRawAmount(token0, JSBI.BigInt(10000)),
        TradeType.EXACT_INPUT
      )
      expect(trade.inputAmount.currency).toEqual(token0)
      expect(trade.outputAmount.currency).toEqual(ICX)
    })
  })

  describe('#fromRoutes', () => {
    it('can be constructed with ICX as input with multiple routes', async () => {
      const trade = await Trade.fromRoutes<Icx, Token, TradeType.EXACT_INPUT>(
        poolFactoryProvider,
        [
          {
            amount: CurrencyAmount.fromRawAmount(ICX, JSBI.BigInt(10000)),
            route: new Route([pool_wicx_0], ICX, token0)
          }
        ],
        TradeType.EXACT_INPUT
      )
      expect(trade.inputAmount.currency).toEqual(ICX)
      expect(trade.outputAmount.currency).toEqual(token0)
    })

    it('can be constructed with ICX as input for exact output with multiple routes', async () => {
      const trade = await Trade.fromRoutes<Icx, Token, TradeType.EXACT_OUTPUT>(
        poolFactoryProvider,
        [
          {
            amount: CurrencyAmount.fromRawAmount(token0, JSBI.BigInt(3000)),
            route: new Route([pool_wicx_0], ICX, token0)
          },
          {
            amount: CurrencyAmount.fromRawAmount(token0, JSBI.BigInt(7000)),
            route: new Route([pool_wicx_1, pool_0_1], ICX, token0)
          }
        ],
        TradeType.EXACT_OUTPUT
      )
      expect(trade.inputAmount.currency).toEqual(ICX)
      expect(trade.outputAmount.currency).toEqual(token0)
    })

    it('can be constructed with ICX as output with multiple routes', async () => {
      const trade = await Trade.fromRoutes<Token, Icx, TradeType.EXACT_OUTPUT>(
        poolFactoryProvider,
        [
          {
            amount: CurrencyAmount.fromRawAmount(ICX, JSBI.BigInt(4000)),
            route: new Route([pool_wicx_0], token0, ICX)
          },
          {
            amount: CurrencyAmount.fromRawAmount(ICX, JSBI.BigInt(6000)),
            route: new Route([pool_0_1, pool_wicx_1], token0, ICX)
          }
        ],
        TradeType.EXACT_OUTPUT
      )
      expect(trade.inputAmount.currency).toEqual(token0)
      expect(trade.outputAmount.currency).toEqual(ICX)
    })
    it('can be constructed with ICX as output for exact input with multiple routes', async () => {
      const trade = await Trade.fromRoutes<Token, Icx, TradeType.EXACT_INPUT>(
        poolFactoryProvider,
        [
          {
            amount: CurrencyAmount.fromRawAmount(token0, JSBI.BigInt(3000)),
            route: new Route([pool_wicx_0], token0, ICX)
          },
          {
            amount: CurrencyAmount.fromRawAmount(token0, JSBI.BigInt(7000)),
            route: new Route([pool_0_1, pool_wicx_1], token0, ICX)
          }
        ],
        TradeType.EXACT_INPUT
      )
      expect(trade.inputAmount.currency).toEqual(token0)
      expect(trade.outputAmount.currency).toEqual(ICX)
    })

    it('throws if pools are re-used between routes', async () => {
      expect(
        Trade.fromRoutes<Token, Icx, TradeType.EXACT_INPUT>(
          poolFactoryProvider,
          [
            {
              amount: CurrencyAmount.fromRawAmount(token0, JSBI.BigInt(4500)),
              route: new Route([pool_0_1, pool_wicx_1], token0, ICX)
            },
            {
              amount: CurrencyAmount.fromRawAmount(token0, JSBI.BigInt(5500)),
              route: new Route([pool_0_1, pool_1_2, pool_wicx_2], token0, ICX)
            }
          ],
          TradeType.EXACT_INPUT
        )
      ).rejects.toThrow('POOLS_DUPLICATED')
    })
  })

  describe('#createUncheckedTrade', () => {
    it('throws if input currency does not match route', async () => {
      await expect(async () => 
        await Trade.createUncheckedTrade(
        poolFactoryProvider, {
            route: new Route([pool_0_1], token0, token1),
            inputAmount: CurrencyAmount.fromRawAmount(token2, 10000),
            outputAmount: CurrencyAmount.fromRawAmount(token1, 10000),
            tradeType: TradeType.EXACT_INPUT
          }
        )
      )
      .rejects
      .toThrow("INPUT_CURRENCY_MATCH")
    })
    it('throws if output currency does not match route', async () => {
      await expect(async () =>
        await Trade.createUncheckedTrade(
          poolFactoryProvider, {
            route: new Route([pool_0_1], token0, token1),
            inputAmount: CurrencyAmount.fromRawAmount(token0, 10000),
            outputAmount: CurrencyAmount.fromRawAmount(token2, 10000),
            tradeType: TradeType.EXACT_INPUT
          }
        )
      )
      .rejects
      .toThrow('OUTPUT_CURRENCY_MATCH')
    })
    it('can create an exact input trade without simulating', () => {
      Trade.createUncheckedTrade(
        poolFactoryProvider, {
        route: new Route([pool_0_1], token0, token1),
        inputAmount: CurrencyAmount.fromRawAmount(token0, 10000),
        outputAmount: CurrencyAmount.fromRawAmount(token1, 100000),
        tradeType: TradeType.EXACT_INPUT
      })
    })
    it('can create an exact output trade without simulating', () => {
      Trade.createUncheckedTrade(
        poolFactoryProvider, {
        route: new Route([pool_0_1], token0, token1),
        inputAmount: CurrencyAmount.fromRawAmount(token0, 10000),
        outputAmount: CurrencyAmount.fromRawAmount(token1, 100000),
        tradeType: TradeType.EXACT_OUTPUT
      })
    })
  })
  describe('#createUncheckedTradeWithMultipleRoutes', () => {
    it('throws if input currency does not match route with multiple routes', async () => {
      await expect(async () =>
        await Trade.createUncheckedTradeWithMultipleRoutes(poolFactoryProvider, {
          routes: [
            {
              route: new Route([pool_1_2], token2, token1),
              inputAmount: CurrencyAmount.fromRawAmount(token2, 2000),
              outputAmount: CurrencyAmount.fromRawAmount(token1, 2000)
            },
            {
              route: new Route([pool_0_1], token0, token1),
              inputAmount: CurrencyAmount.fromRawAmount(token2, 8000),
              outputAmount: CurrencyAmount.fromRawAmount(token1, 8000)
            }
          ],
          tradeType: TradeType.EXACT_INPUT
        })
      ).rejects.toThrow('INPUT_CURRENCY_MATCH')
    })
    it('throws if output currency does not match route with multiple routes', async () => {
      await expect(async () =>
        await Trade.createUncheckedTradeWithMultipleRoutes(poolFactoryProvider, {
          routes: [
            {
              route: new Route([pool_0_2], token0, token2),
              inputAmount: CurrencyAmount.fromRawAmount(token0, 10000),
              outputAmount: CurrencyAmount.fromRawAmount(token2, 10000)
            },
            {
              route: new Route([pool_0_1], token0, token1),
              inputAmount: CurrencyAmount.fromRawAmount(token0, 10000),
              outputAmount: CurrencyAmount.fromRawAmount(token2, 10000)
            }
          ],
          tradeType: TradeType.EXACT_INPUT
        })
      ).rejects.toThrow('OUTPUT_CURRENCY_MATCH')
    })

    it('can create an exact input trade without simulating with multiple routes', () => {
      Trade.createUncheckedTradeWithMultipleRoutes(poolFactoryProvider, {
        routes: [
          {
            route: new Route([pool_0_1], token0, token1),
            inputAmount: CurrencyAmount.fromRawAmount(token0, 5000),
            outputAmount: CurrencyAmount.fromRawAmount(token1, 50000)
          },
          {
            route: new Route([pool_0_2, pool_1_2], token0, token1),
            inputAmount: CurrencyAmount.fromRawAmount(token0, 5000),
            outputAmount: CurrencyAmount.fromRawAmount(token1, 50000)
          }
        ],
        tradeType: TradeType.EXACT_INPUT
      })
    })

    it('can create an exact output trade without simulating with multiple routes', () => {
      Trade.createUncheckedTradeWithMultipleRoutes(poolFactoryProvider, {
        routes: [
          {
            route: new Route([pool_0_1], token0, token1),
            inputAmount: CurrencyAmount.fromRawAmount(token0, 5001),
            outputAmount: CurrencyAmount.fromRawAmount(token1, 50000)
          },
          {
            route: new Route([pool_0_2, pool_1_2], token0, token1),
            inputAmount: CurrencyAmount.fromRawAmount(token0, 4999),
            outputAmount: CurrencyAmount.fromRawAmount(token1, 50000)
          }
        ],
        tradeType: TradeType.EXACT_OUTPUT
      })
    })
  })

  describe('#route and #swaps', () => {
    const singleRoute = Trade.createUncheckedTrade(poolFactoryProvider, {
      route: new Route([pool_0_1, pool_1_2], token0, token2),
      inputAmount: CurrencyAmount.fromRawAmount(token0, 100),
      outputAmount: CurrencyAmount.fromRawAmount(token2, 69),
      tradeType: TradeType.EXACT_INPUT
    })
    const multiRoute = Trade.createUncheckedTradeWithMultipleRoutes(poolFactoryProvider, {
      routes: [
        {
          route: new Route([pool_0_1, pool_1_2], token0, token2),
          inputAmount: CurrencyAmount.fromRawAmount(token0, 50),
          outputAmount: CurrencyAmount.fromRawAmount(token2, 35)
        },
        {
          route: new Route([pool_0_2], token0, token2),
          inputAmount: CurrencyAmount.fromRawAmount(token0, 50),
          outputAmount: CurrencyAmount.fromRawAmount(token2, 34)
        }
      ],
      tradeType: TradeType.EXACT_INPUT
    })
    it('can access route for single route trade if less than 0', async () => {
      expect((await singleRoute).route).toBeDefined()
    })
    it('can access routes for both single and multi route trades', async () => {
      expect((await singleRoute).swaps).toBeDefined()
      expect((await singleRoute).swaps).toHaveLength(1)
      expect((await multiRoute).swaps).toBeDefined()
      expect((await multiRoute).swaps).toHaveLength(2)
    })
    it('throws if access route on multi route trade', async () => {
      await expect(async () => (await multiRoute).route).rejects.toThrow('MULTIPLE_ROUTES')
    })
  })

  describe('#worstExecutionPrice', () => {
    describe('tradeType = EXACT_INPUT', () => {
      const exactIn = Trade.createUncheckedTrade(poolFactoryProvider, {
        route: new Route([pool_0_1, pool_1_2], token0, token2),
        inputAmount: CurrencyAmount.fromRawAmount(token0, 100),
        outputAmount: CurrencyAmount.fromRawAmount(token2, 69),
        tradeType: TradeType.EXACT_INPUT
      })
      const exactInMultiRoute = Trade.createUncheckedTradeWithMultipleRoutes(poolFactoryProvider, {
        routes: [
          {
            route: new Route([pool_0_1, pool_1_2], token0, token2),
            inputAmount: CurrencyAmount.fromRawAmount(token0, 50),
            outputAmount: CurrencyAmount.fromRawAmount(token2, 35)
          },
          {
            route: new Route([pool_0_2], token0, token2),
            inputAmount: CurrencyAmount.fromRawAmount(token0, 50),
            outputAmount: CurrencyAmount.fromRawAmount(token2, 34)
          }
        ],
        tradeType: TradeType.EXACT_INPUT
      })
      it('throws if less than 0', async () => {
        await expect(async () => (await exactIn).minimumAmountOut(new Percent(-1, 100))).rejects.toThrow('SLIPPAGE_TOLERANCE')
      })
      it('returns exact if 0', async () => {
        expect((await exactIn).worstExecutionPrice(new Percent(0, 100))).toEqual((await exactIn).executionPrice)
      })
      it('returns exact if nonzero', async () => {
        expect((await exactIn).worstExecutionPrice(new Percent(0, 100))).toEqual(new Price(token0, token2, 100, 69))
        expect((await exactIn).worstExecutionPrice(new Percent(5, 100))).toEqual(new Price(token0, token2, 100, 65))
        expect((await exactIn).worstExecutionPrice(new Percent(200, 100))).toEqual(new Price(token0, token2, 100, 23))
      })
      it('returns exact if nonzero with multiple routes', async () => {
        expect((await exactInMultiRoute).worstExecutionPrice(new Percent(0, 100))).toEqual(new Price(token0, token2, 100, 69))
        expect((await exactInMultiRoute).worstExecutionPrice(new Percent(5, 100))).toEqual(new Price(token0, token2, 100, 65))
        expect((await exactInMultiRoute).worstExecutionPrice(new Percent(200, 100))).toEqual(new Price(token0, token2, 100, 23))
      })
    })
    describe('tradeType = EXACT_OUTPUT', () => {
      const exactOut = Trade.createUncheckedTrade(poolFactoryProvider, {
        route: new Route([pool_0_1, pool_1_2], token0, token2),
        inputAmount: CurrencyAmount.fromRawAmount(token0, 156),
        outputAmount: CurrencyAmount.fromRawAmount(token2, 100),
        tradeType: TradeType.EXACT_OUTPUT
      })
      const exactOutMultiRoute = Trade.createUncheckedTradeWithMultipleRoutes(poolFactoryProvider, {
        routes: [
          {
            route: new Route([pool_0_1, pool_1_2], token0, token2),
            inputAmount: CurrencyAmount.fromRawAmount(token0, 78),
            outputAmount: CurrencyAmount.fromRawAmount(token2, 50)
          },
          {
            route: new Route([pool_0_2], token0, token2),
            inputAmount: CurrencyAmount.fromRawAmount(token0, 78),
            outputAmount: CurrencyAmount.fromRawAmount(token2, 50)
          }
        ],
        tradeType: TradeType.EXACT_OUTPUT
      })

      it('throws if less than 0', async () => {
        await expect(async () => (await exactOut).worstExecutionPrice(new Percent(-1, 100))).rejects.toThrow('SLIPPAGE_TOLERANCE')
      })
      it('returns exact if 0', async () => {
        expect((await exactOut).worstExecutionPrice(new Percent(0, 100))).toEqual((await exactOut).executionPrice)
      })
      it('returns slippage amount if nonzero', async () => {
        expect(
          (await exactOut).worstExecutionPrice(new Percent(0, 100)).equalTo(new Price(token0, token2, 156, 100))
        ).toBeTruthy()
        expect(
          (await exactOut).worstExecutionPrice(new Percent(5, 100)).equalTo(new Price(token0, token2, 163, 100))
        ).toBeTruthy()
        expect(
          (await exactOut).worstExecutionPrice(new Percent(200, 100)).equalTo(new Price(token0, token2, 468, 100))
        ).toBeTruthy()
      })
      it('returns exact if nonzero with multiple routes', async () => {
        expect(
          (await exactOutMultiRoute).worstExecutionPrice(new Percent(0, 100)).equalTo(new Price(token0, token2, 156, 100))
        ).toBeTruthy()
        expect(
          (await exactOutMultiRoute).worstExecutionPrice(new Percent(5, 100)).equalTo(new Price(token0, token2, 163, 100))
        ).toBeTruthy()
        expect(
          (await exactOutMultiRoute).worstExecutionPrice(new Percent(200, 100)).equalTo(new Price(token0, token2, 468, 100))
        ).toBeTruthy()
      })
    })
  })

  describe('#priceImpact', () => {
    describe('tradeType = EXACT_INPUT', () => {
      const exactIn = Trade.createUncheckedTradeWithMultipleRoutes(poolFactoryProvider, {
        routes: [
          {
            route: new Route([pool_0_1, pool_1_2], token0, token2),
            inputAmount: CurrencyAmount.fromRawAmount(token0, 100),
            outputAmount: CurrencyAmount.fromRawAmount(token2, 69)
          }
        ],
        tradeType: TradeType.EXACT_INPUT
      })
      const exactInMultipleRoutes = Trade.createUncheckedTradeWithMultipleRoutes(poolFactoryProvider, {
        routes: [
          {
            route: new Route([pool_0_1, pool_1_2], token0, token2),
            inputAmount: CurrencyAmount.fromRawAmount(token0, 90),
            outputAmount: CurrencyAmount.fromRawAmount(token2, 62)
          },
          {
            route: new Route([pool_0_2], token0, token2),
            inputAmount: CurrencyAmount.fromRawAmount(token0, 10),
            outputAmount: CurrencyAmount.fromRawAmount(token2, 7)
          }
        ],
        tradeType: TradeType.EXACT_INPUT
      })
      it('is cached', async () => {
        expect((await exactIn).priceImpact === (await exactIn).priceImpact).toStrictEqual(true)
      })
      it('is correct', async () => {
        expect((await exactIn).priceImpact.toSignificant(3)).toEqual('17.2')
      })

      it('is cached with multiple routes', async () => {
        expect((await exactInMultipleRoutes).priceImpact === (await exactInMultipleRoutes).priceImpact).toStrictEqual(true)
      })
      it('is correct with multiple routes', async () => {
        expect((await exactInMultipleRoutes).priceImpact.toSignificant(3)).toEqual('19.8')
      })
    })
    describe('tradeType = EXACT_OUTPUT', () => {
      const exactOut = Trade.createUncheckedTradeWithMultipleRoutes(poolFactoryProvider, {
        routes: [
          {
            route: new Route([pool_0_1, pool_1_2], token0, token2),
            inputAmount: CurrencyAmount.fromRawAmount(token0, 156),
            outputAmount: CurrencyAmount.fromRawAmount(token2, 100)
          }
        ],
        tradeType: TradeType.EXACT_OUTPUT
      })
      const exactOutMultipleRoutes = Trade.createUncheckedTradeWithMultipleRoutes(poolFactoryProvider, {
        routes: [
          {
            route: new Route([pool_0_1, pool_1_2], token0, token2),
            inputAmount: CurrencyAmount.fromRawAmount(token0, 140),
            outputAmount: CurrencyAmount.fromRawAmount(token2, 90)
          },
          {
            route: new Route([pool_0_2], token0, token2),
            inputAmount: CurrencyAmount.fromRawAmount(token0, 16),
            outputAmount: CurrencyAmount.fromRawAmount(token2, 10)
          }
        ],
        tradeType: TradeType.EXACT_OUTPUT
      })

      it('is cached', async () => {
        expect((await exactOut).priceImpact === (await exactOut).priceImpact).toStrictEqual(true)
      })
      it('is correct', async () => {
        expect((await exactOut).priceImpact.toSignificant(3)).toEqual('23.1')
      })

      it('is cached with multiple routes', async () => {
        expect((await exactOutMultipleRoutes).priceImpact === (await exactOutMultipleRoutes).priceImpact).toStrictEqual(true)
      })
      it('is correct with multiple routes', async () => {
        expect((await exactOutMultipleRoutes).priceImpact.toSignificant(3)).toEqual('25.5')
      })
    })
  })

  describe('#bestTradeExactIn', () => {
    it('throws with empty pools', async () => {
      await expect(
        Trade.bestTradeExactIn(poolFactoryProvider, [], CurrencyAmount.fromRawAmount(token0, JSBI.BigInt(10000)), token2)
      ).rejects.toThrow('POOLS')
    })
    it('throws with max hops of 0', async () => {
      await expect(
        Trade.bestTradeExactIn(poolFactoryProvider, [pool_0_2], CurrencyAmount.fromRawAmount(token0, JSBI.BigInt(10000)), token2, {
          maxHops: 0
        })
      ).rejects.toThrow('MAX_HOPS')
    })

    it('provides best route', async () => {
      const result = await Trade.bestTradeExactIn(
        poolFactoryProvider, 
        [pool_0_1, pool_0_2, pool_1_2],
        CurrencyAmount.fromRawAmount(token0, 10000),
        token2
      )
      expect(result).toHaveLength(2)
      expect(result[0].swaps[0].route.pools).toHaveLength(1) // 0 -> 2 at 10:11
      expect(result[0].swaps[0].route.tokenPath).toEqual([token0, token2])
      expect(result[0].inputAmount.equalTo(CurrencyAmount.fromRawAmount(token0, JSBI.BigInt(10000)))).toBeTruthy()
      expect(result[0].outputAmount.equalTo(CurrencyAmount.fromRawAmount(token2, JSBI.BigInt(9971)))).toBeTruthy()
      expect(result[1].swaps[0].route.pools).toHaveLength(2) // 0 -> 1 -> 2 at 12:12:10
      expect(result[1].swaps[0].route.tokenPath).toEqual([token0, token1, token2])
      expect(result[1].inputAmount.equalTo(CurrencyAmount.fromRawAmount(token0, JSBI.BigInt(10000)))).toBeTruthy()
      expect(result[1].outputAmount.equalTo(CurrencyAmount.fromRawAmount(token2, JSBI.BigInt(7004)))).toBeTruthy()
    })

    it('respects maxHops', async () => {
      const result = await Trade.bestTradeExactIn(
        poolFactoryProvider, 
        [pool_0_1, pool_0_2, pool_1_2],
        CurrencyAmount.fromRawAmount(token0, JSBI.BigInt(10)),
        token2,
        { maxHops: 1 }
      )
      expect(result).toHaveLength(1)
      expect(result[0].swaps[0].route.pools).toHaveLength(1) // 0 -> 2 at 10:11
      expect(result[0].swaps[0].route.tokenPath).toEqual([token0, token2])
    })

    it('insufficient input for one pool', async () => {
      const result = await Trade.bestTradeExactIn(
        poolFactoryProvider, 
        [pool_0_1, pool_0_2, pool_1_2],
        CurrencyAmount.fromRawAmount(token0, 1),
        token2
      )
      expect(result).toHaveLength(2)
      expect(result[0].swaps[0].route.pools).toHaveLength(1) // 0 -> 2 at 10:11
      expect(result[0].swaps[0].route.tokenPath).toEqual([token0, token2])
      expect(result[0].outputAmount).toEqual(CurrencyAmount.fromRawAmount(token2, 0))
    })

    it('respects n', async () => {
      const result = await Trade.bestTradeExactIn(
        poolFactoryProvider, 
        [pool_0_1, pool_0_2, pool_1_2],
        CurrencyAmount.fromRawAmount(token0, JSBI.BigInt(10)),
        token2,
        { maxNumResults: 1 }
      )

      expect(result).toHaveLength(1)
    })

    it('no path', async () => {
      const result = await Trade.bestTradeExactIn(
        poolFactoryProvider, 
        [pool_0_1, pool_0_3, pool_1_3],
        CurrencyAmount.fromRawAmount(token0, JSBI.BigInt(10)),
        token2
      )
      expect(result).toHaveLength(0)
    })

    it('works for ICX currency input', async () => {
      const result = await Trade.bestTradeExactIn(
        poolFactoryProvider, 
        [pool_wicx_0, pool_0_1, pool_0_3, pool_1_3],
        CurrencyAmount.fromRawAmount(ICX, JSBI.BigInt(100)),
        token3
      )
      expect(result).toHaveLength(2)
      expect(result[0].inputAmount.currency).toEqual(ICX)
      expect(result[0].swaps[0].route.tokenPath).toEqual([WICX, token0, token1, token3])
      expect(result[0].outputAmount.currency).toEqual(token3)
      expect(result[1].inputAmount.currency).toEqual(ICX)
      expect(result[1].swaps[0].route.tokenPath).toEqual([WICX, token0, token3])
      expect(result[1].outputAmount.currency).toEqual(token3)
    })

    it('works for ICX currency output', async () => {
      const result = await Trade.bestTradeExactIn(
        poolFactoryProvider, 
        [pool_wicx_0, pool_0_1, pool_0_3, pool_1_3],
        CurrencyAmount.fromRawAmount(token3, JSBI.BigInt(100)),
        ICX
      )
      expect(result).toHaveLength(2)
      expect(result[0].inputAmount.currency).toEqual(token3)
      expect(result[0].swaps[0].route.tokenPath).toEqual([token3, token0, WICX])
      expect(result[0].outputAmount.currency).toEqual(ICX)
      expect(result[1].inputAmount.currency).toEqual(token3)
      expect(result[1].swaps[0].route.tokenPath).toEqual([token3, token1, token0, WICX])
      expect(result[1].outputAmount.currency).toEqual(ICX)
    })
  })

  describe('#maximumAmountIn', () => {
    describe('tradeType = EXACT_INPUT', () => {
      let exactIn: Trade<Token, Token, TradeType.EXACT_INPUT>
      beforeEach(async () => {
        exactIn = await Trade.fromRoute(
          poolFactoryProvider, 
          new Route([pool_0_1, pool_1_2], token0, token2),
          CurrencyAmount.fromRawAmount(token0, JSBI.BigInt(100)),
          TradeType.EXACT_INPUT
        )
      })
      it('throws if less than 0', () => {
        expect(() => exactIn.maximumAmountIn(new Percent(JSBI.BigInt(-1), JSBI.BigInt(100)))).toThrow(
          'SLIPPAGE_TOLERANCE'
        )
      })
      it('returns exact if 0', () => {
        expect(exactIn.maximumAmountIn(new Percent(JSBI.BigInt(0), JSBI.BigInt(100)))).toEqual(exactIn.inputAmount)
      })
      it('returns exact if nonzero', () => {
        expect(
          exactIn
            .maximumAmountIn(new Percent(JSBI.BigInt(0), JSBI.BigInt(100)))
            .equalTo(CurrencyAmount.fromRawAmount(token0, JSBI.BigInt(100)))
        ).toBeTruthy()
        expect(
          exactIn
            .maximumAmountIn(new Percent(JSBI.BigInt(5), JSBI.BigInt(100)))
            .equalTo(CurrencyAmount.fromRawAmount(token0, JSBI.BigInt(100)))
        ).toBeTruthy()
        expect(
          exactIn
            .maximumAmountIn(new Percent(JSBI.BigInt(200), JSBI.BigInt(100)))
            .equalTo(CurrencyAmount.fromRawAmount(token0, JSBI.BigInt(100)))
        ).toBeTruthy()
      })
    })

    describe('tradeType = EXACT_OUTPUT', () => {
      let exactOut: Trade<Token, Token, TradeType.EXACT_OUTPUT>
      beforeEach(async () => {
        exactOut = await Trade.fromRoute(
          poolFactoryProvider, 
          new Route([pool_0_1, pool_1_2], token0, token2),
          CurrencyAmount.fromRawAmount(token2, 10000),
          TradeType.EXACT_OUTPUT
        )
      })

      it('throws if less than 0', () => {
        expect(() => exactOut.maximumAmountIn(new Percent(JSBI.BigInt(-1), 10000))).toThrow('SLIPPAGE_TOLERANCE')
      })

      it('returns exact if 0', () => {
        expect(exactOut.maximumAmountIn(new Percent(JSBI.BigInt(0), 10000))).toEqual(exactOut.inputAmount)
      })

      it('returns slippage amount if nonzero', () => {
        expect(
          exactOut
            .maximumAmountIn(new Percent(JSBI.BigInt(0), 100))
            .equalTo(CurrencyAmount.fromRawAmount(token0, 15488))
        ).toBeTruthy()
        expect(
          exactOut
            .maximumAmountIn(new Percent(JSBI.BigInt(5), JSBI.BigInt(100)))
            .equalTo(CurrencyAmount.fromRawAmount(token0, 16262))
        ).toBeTruthy()
        expect(
          exactOut
            .maximumAmountIn(new Percent(JSBI.BigInt(200), JSBI.BigInt(100)))
            .equalTo(CurrencyAmount.fromRawAmount(token0, 46464))
        ).toBeTruthy()
      })
    })
  })

  describe('#minimumAmountOut', () => {
    describe('tradeType = EXACT_INPUT', () => {
      let exactIn: Trade<Token, Token, TradeType.EXACT_INPUT>
      beforeEach(
        async () =>
          (exactIn = await Trade.fromRoute(
            poolFactoryProvider, 
            new Route([pool_0_1, pool_1_2], token0, token2),
            CurrencyAmount.fromRawAmount(token0, 10000),
            TradeType.EXACT_INPUT
          ))
      )

      it('throws if less than 0', () => {
        expect(() => exactIn.minimumAmountOut(new Percent(JSBI.BigInt(-1), 100))).toThrow('SLIPPAGE_TOLERANCE')
      })

      it('returns exact if 0', () => {
        expect(exactIn.minimumAmountOut(new Percent(JSBI.BigInt(0), 10000))).toEqual(exactIn.outputAmount)
      })

      it('returns exact if nonzero', () => {
        expect(exactIn.minimumAmountOut(new Percent(JSBI.BigInt(0), 100))).toEqual(
          CurrencyAmount.fromRawAmount(token2, 7004)
        )
        expect(exactIn.minimumAmountOut(new Percent(JSBI.BigInt(5), 100))).toEqual(
          CurrencyAmount.fromRawAmount(token2, 6670)
        )
        expect(exactIn.minimumAmountOut(new Percent(JSBI.BigInt(200), 100))).toEqual(
          CurrencyAmount.fromRawAmount(token2, 2334)
        )
      })
    })
    describe('tradeType = EXACT_OUTPUT', () => {
      let exactOut: Trade<Token, Token, TradeType.EXACT_OUTPUT>
      beforeEach(async () => {
        exactOut = await Trade.fromRoute(
          poolFactoryProvider, 
          new Route([pool_0_1, pool_1_2], token0, token2),
          CurrencyAmount.fromRawAmount(token2, JSBI.BigInt(100)),
          TradeType.EXACT_OUTPUT
        )
      })

      it('throws if less than 0', () => {
        expect(() => exactOut.minimumAmountOut(new Percent(JSBI.BigInt(-1), JSBI.BigInt(100)))).toThrow(
          'SLIPPAGE_TOLERANCE'
        )
      })
      it('returns exact if 0', () => {
        expect(exactOut.minimumAmountOut(new Percent(JSBI.BigInt(0), JSBI.BigInt(100)))).toEqual(exactOut.outputAmount)
      })
      it('returns slippage amount if nonzero', () => {
        expect(
          exactOut
            .minimumAmountOut(new Percent(JSBI.BigInt(0), JSBI.BigInt(100)))
            .equalTo(CurrencyAmount.fromRawAmount(token2, JSBI.BigInt(100)))
        ).toBeTruthy()
        expect(
          exactOut
            .minimumAmountOut(new Percent(JSBI.BigInt(5), JSBI.BigInt(100)))
            .equalTo(CurrencyAmount.fromRawAmount(token2, JSBI.BigInt(100)))
        ).toBeTruthy()
        expect(
          exactOut
            .minimumAmountOut(new Percent(JSBI.BigInt(200), JSBI.BigInt(100)))
            .equalTo(CurrencyAmount.fromRawAmount(token2, JSBI.BigInt(100)))
        ).toBeTruthy()
      })
    })
  })

  describe('#bestTradeExactOut', () => {
    it('throws with empty pools', async () => {
      await expect(
        Trade.bestTradeExactOut(poolFactoryProvider, [], token0, CurrencyAmount.fromRawAmount(token2, JSBI.BigInt(100)))
      ).rejects.toThrow('POOLS')
    })
    it('throws with max hops of 0', async () => {
      await expect(
        Trade.bestTradeExactOut(poolFactoryProvider, [pool_0_2], token0, CurrencyAmount.fromRawAmount(token2, JSBI.BigInt(100)), {
          maxHops: 0
        })
      ).rejects.toThrow('MAX_HOPS')
    })

    it('provides best route', async () => {
      const result = await Trade.bestTradeExactOut(
        poolFactoryProvider, 
        [pool_0_1, pool_0_2, pool_1_2],
        token0,
        CurrencyAmount.fromRawAmount(token2, 10000)
      )
      expect(result).toHaveLength(2)
      expect(result[0].swaps[0].route.pools).toHaveLength(1) // 0 -> 2 at 10:11
      expect(result[0].swaps[0].route.tokenPath).toEqual([token0, token2])
      expect(result[0].inputAmount.equalTo(CurrencyAmount.fromRawAmount(token0, 10032))).toBeTruthy()
      expect(result[0].outputAmount.equalTo(CurrencyAmount.fromRawAmount(token2, 10000))).toBeTruthy()
      expect(result[1].swaps[0].route.pools).toHaveLength(2) // 0 -> 1 -> 2 at 12:12:10
      expect(result[1].swaps[0].route.tokenPath).toEqual([token0, token1, token2])
      expect(result[1].inputAmount.equalTo(CurrencyAmount.fromRawAmount(token0, 15488))).toBeTruthy()
      expect(result[1].outputAmount.equalTo(CurrencyAmount.fromRawAmount(token2, 10000))).toBeTruthy()
    })

    it('respects maxHops', async () => {
      const result = await Trade.bestTradeExactOut(
        poolFactoryProvider, 
        [pool_0_1, pool_0_2, pool_1_2],
        token0,
        CurrencyAmount.fromRawAmount(token2, JSBI.BigInt(10)),
        { maxHops: 1 }
      )
      expect(result).toHaveLength(1)
      expect(result[0].swaps[0].route.pools).toHaveLength(1) // 0 -> 2 at 10:11
      expect(result[0].swaps[0].route.tokenPath).toEqual([token0, token2])
    })

    it.skip('insufficient liquidity', () => {
      const result = Trade.bestTradeExactOut(
        poolFactoryProvider, 
        [pool_0_1, pool_0_2, pool_1_2],
        token0,
        CurrencyAmount.fromRawAmount(token2, 1200)
      )
      expect(result).toHaveLength(0)
    })

    it.skip('insufficient liquidity in one pool but not the other', () => {
      const result = Trade.bestTradeExactOut(
        poolFactoryProvider, 
        [pool_0_1, pool_0_2, pool_1_2],
        token0,
        CurrencyAmount.fromRawAmount(token2, JSBI.BigInt(1050))
      )
      expect(result).toHaveLength(1)
    })

    it('respects n', async () => {
      const result = await Trade.bestTradeExactOut(
        poolFactoryProvider, 
        [pool_0_1, pool_0_2, pool_1_2],
        token0,
        CurrencyAmount.fromRawAmount(token2, JSBI.BigInt(10)),
        { maxNumResults: 1 }
      )

      expect(result).toHaveLength(1)
    })

    it('no path', async () => {
      const result = await Trade.bestTradeExactOut(
        poolFactoryProvider, 
        [pool_0_1, pool_0_3, pool_1_3],
        token0,
        CurrencyAmount.fromRawAmount(token2, JSBI.BigInt(10))
      )
      expect(result).toHaveLength(0)
    })

    it('works for ICX currency input', async () => {
      const result = await Trade.bestTradeExactOut(
        poolFactoryProvider, 
        [pool_wicx_0, pool_0_1, pool_0_3, pool_1_3],
        ICX,
        CurrencyAmount.fromRawAmount(token3, 10000)
      )
      expect(result).toHaveLength(2)
      expect(result[0].inputAmount.currency).toEqual(ICX)
      expect(result[0].swaps[0].route.tokenPath).toEqual([WICX, token0, token1, token3])
      expect(result[0].outputAmount.currency).toEqual(token3)
      expect(result[1].inputAmount.currency).toEqual(ICX)
      expect(result[1].swaps[0].route.tokenPath).toEqual([WICX, token0, token3])
      expect(result[1].outputAmount.currency).toEqual(token3)
    })
    it('works for ICX currency output', async () => {
      const result = await Trade.bestTradeExactOut(
        poolFactoryProvider, 
        [pool_wicx_0, pool_0_1, pool_0_3, pool_1_3],
        token3,
        CurrencyAmount.fromRawAmount(ICX, JSBI.BigInt(100))
      )
      expect(result).toHaveLength(2)
      expect(result[0].inputAmount.currency).toEqual(token3)
      expect(result[0].swaps[0].route.tokenPath).toEqual([token3, token0, WICX])
      expect(result[0].outputAmount.currency).toEqual(ICX)
      expect(result[1].inputAmount.currency).toEqual(token3)
      expect(result[1].swaps[0].route.tokenPath).toEqual([token3, token1, token0, WICX])
      expect(result[1].outputAmount.currency).toEqual(ICX)
    })
  })
})
