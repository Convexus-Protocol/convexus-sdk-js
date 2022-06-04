import { Icx, Token } from '@convexus/sdk-core'
import { FeeAmount } from '../../src/constants'
import { encodeSqrtRatioX96 } from '../../src/utils/encodeSqrtRatioX96'
import { TickMath } from '../../src/utils/tickMath'
import { Pool } from '../../src/entities/pool'
import { Route } from '../../src/entities/route'

describe('Route', () => {
  const ICX = new Icx()
  const token0 = new Token('cx0000000000000000000000000000000000000001', 18, 't0')
  const token1 = new Token('cx0000000000000000000000000000000000000002', 18, 't1')
  const token2 = new Token('cx0000000000000000000000000000000000000003', 18, 't2')
  const wicx = ICX.wrapped

  const pool_0_1 = new Pool(token0, token1, FeeAmount.MEDIUM, encodeSqrtRatioX96(1, 1), 0, 0, [])
  const pool_0_wicx = new Pool(token0, wicx, FeeAmount.MEDIUM, encodeSqrtRatioX96(1, 1), 0, 0, [])
  const pool_1_wicx = new Pool(token1, wicx, FeeAmount.MEDIUM, encodeSqrtRatioX96(1, 1), 0, 0, [])

  describe('path', () => {
    it('constructs a path from the tokens', () => {
      const route = new Route([pool_0_1], token0, token1)
      expect(route.pools).toEqual([pool_0_1])
      expect(route.tokenPath).toEqual([token0, token1])
      expect(route.input).toEqual(token0)
      expect(route.output).toEqual(token1)
    })
    it('should fail if the input is not in the first pool', () => {
      expect(() => new Route([pool_0_1], wicx, token1)).toThrow()
    })
    it('should fail if output is not in the last pool', () => {
      expect(() => new Route([pool_0_1], token0, wicx)).toThrow()
    })
  })

  it('can have a token as both input and output', () => {
    const route = new Route([pool_0_wicx, pool_0_1, pool_1_wicx], wicx, wicx)
    expect(route.pools).toEqual([pool_0_wicx, pool_0_1, pool_1_wicx])
    expect(route.input).toEqual(wicx)
    expect(route.output).toEqual(wicx)
  })

  it('supports icx input', () => {
    const route = new Route([pool_0_wicx], ICX, token0)
    expect(route.pools).toEqual([pool_0_wicx])
    expect(route.input).toEqual(ICX)
    expect(route.output).toEqual(token0)
  })

  it('supports icx output', () => {
    const route = new Route([pool_0_wicx], token0, ICX)
    expect(route.pools).toEqual([pool_0_wicx])
    expect(route.input).toEqual(token0)
    expect(route.output).toEqual(ICX)
  })

  describe('#midPrice', () => {
    const pool_0_1 = new Pool(
      token0,
      token1,
      FeeAmount.MEDIUM,
      encodeSqrtRatioX96(1, 5),
      0,
      TickMath.getTickAtSqrtRatio(encodeSqrtRatioX96(1, 5)),
      []
    )
    const pool_1_2 = new Pool(
      token1,
      token2,
      FeeAmount.MEDIUM,
      encodeSqrtRatioX96(15, 30),
      0,
      TickMath.getTickAtSqrtRatio(encodeSqrtRatioX96(15, 30)),
      []
    )
    const pool_0_wicx = new Pool(
      token0,
      wicx,
      FeeAmount.MEDIUM,
      encodeSqrtRatioX96(3, 1),
      0,
      TickMath.getTickAtSqrtRatio(encodeSqrtRatioX96(3, 1)),
      []
    )
    const pool_1_wicx = new Pool(
      token1,
      wicx,
      FeeAmount.MEDIUM,
      encodeSqrtRatioX96(1, 7),
      0,
      TickMath.getTickAtSqrtRatio(encodeSqrtRatioX96(1, 7)),
      []
    )

    it('correct for 0 -> 1', () => {
      const price = new Route([pool_0_1], token0, token1).midPrice
      expect(price.toFixed(4)).toEqual('0.2000')
      expect(price.baseCurrency.equals(token0)).toEqual(true)
      expect(price.quoteCurrency.equals(token1)).toEqual(true)
    })

    it('is cached', () => {
      const route = new Route([pool_0_1], token0, token1)
      expect(route.midPrice).toStrictEqual(route.midPrice)
    })

    it('correct for 1 -> 0', () => {
      const price = new Route([pool_0_1], token1, token0).midPrice
      expect(price.toFixed(4)).toEqual('5.0000')
      expect(price.baseCurrency.equals(token1)).toEqual(true)
      expect(price.quoteCurrency.equals(token0)).toEqual(true)
    })

    it('correct for 0 -> 1 -> 2', () => {
      const price = new Route([pool_0_1, pool_1_2], token0, token2).midPrice
      expect(price.toFixed(4)).toEqual('0.1000')
      expect(price.baseCurrency.equals(token0)).toEqual(true)
      expect(price.quoteCurrency.equals(token2)).toEqual(true)
    })

    it('correct for 2 -> 1 -> 0', () => {
      const price = new Route([pool_1_2, pool_0_1], token2, token0).midPrice
      expect(price.toFixed(4)).toEqual('10.0000')
      expect(price.baseCurrency.equals(token2)).toEqual(true)
      expect(price.quoteCurrency.equals(token0)).toEqual(true)
    })

    it('correct for icx -> 0', () => {
      const price = new Route([pool_0_wicx], ICX, token0).midPrice
      expect(price.toFixed(4)).toEqual('0.3333')
      expect(price.baseCurrency.equals(ICX)).toEqual(true)
      expect(price.quoteCurrency.equals(token0)).toEqual(true)
    })

    it('correct for 1 -> wicx', () => {
      const price = new Route([pool_1_wicx], token1, wicx).midPrice
      expect(price.toFixed(4)).toEqual('0.1429')
      expect(price.baseCurrency.equals(token1)).toEqual(true)
      expect(price.quoteCurrency.equals(wicx)).toEqual(true)
    })

    it('correct for icx -> 0 -> 1 -> wicx', () => {
      const price = new Route([pool_0_wicx, pool_0_1, pool_1_wicx], ICX, wicx).midPrice
      expect(price.toSignificant(4)).toEqual('0.009524')
      expect(price.baseCurrency.equals(ICX)).toEqual(true)
      expect(price.quoteCurrency.equals(wicx)).toEqual(true)
    })

    it('correct for wicx -> 0 -> 1 -> icx', () => {
      const price = new Route([pool_0_wicx, pool_0_1, pool_1_wicx], wicx, ICX).midPrice
      expect(price.toSignificant(4)).toEqual('0.009524')
      expect(price.baseCurrency.equals(wicx)).toEqual(true)
      expect(price.quoteCurrency.equals(ICX)).toEqual(true)
    })
  })
})
