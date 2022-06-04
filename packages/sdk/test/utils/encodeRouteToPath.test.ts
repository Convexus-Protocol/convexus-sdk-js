import { Icx, Token } from '@convexus/sdk-core'
import { FeeAmount } from '../../src/constants'
import { Pool } from '../../src/entities/pool'
import { Route } from '../../src/entities/route'
import { encodeRouteToPath } from '../../src/utils/encodeRouteToPath'
import { encodeSqrtRatioX96 } from '../../src/utils/encodeSqrtRatioX96'

describe('#encodeRouteToPath', () => {
  const ICX = new Icx()
  const WICX = ICX.wrapped
  const token0 = new Token('cx0000000000000000000000000000000000000001', 18, 't0', 'token0')
  const token1 = new Token('cx0000000000000000000000000000000000000002', 18, 't1', 'token1')
  const token2 = new Token('cx0000000000000000000000000000000000000003', 18, 't2', 'token2')
  // const token3 = new Token('cx0000000000000000000000000000000000000004', 18, 't3', 'token3')

  const wicx = WICX

  const pool_0_1_medium = new Pool(token0, token1, FeeAmount.MEDIUM, encodeSqrtRatioX96(1, 1), 0, 0, [])
  const pool_1_2_low = new Pool(token1, token2, FeeAmount.LOW, encodeSqrtRatioX96(1, 1), 0, 0, [])
  const pool_0_wicx = new Pool(token0, wicx, FeeAmount.MEDIUM, encodeSqrtRatioX96(1, 1), 0, 0, [])
  const pool_1_wicx = new Pool(token1, wicx, FeeAmount.MEDIUM, encodeSqrtRatioX96(1, 1), 0, 0, [])

  const route_0_1 = new Route([pool_0_1_medium], token0, token1)
  const route_0_1_2 = new Route([pool_0_1_medium, pool_1_2_low], token0, token2)

  const route_0_wicx = new Route([pool_0_wicx], token0, ICX)
  const route_0_1_wicx = new Route([pool_0_1_medium, pool_1_wicx], token0, ICX)
  const route_wicx_0 = new Route([pool_0_wicx], ICX, token0)
  const route_wicx_0_1 = new Route([pool_0_wicx, pool_0_1_medium], ICX, token1)

  it('packs them for exact input single hop', () => {
    expect(encodeRouteToPath(route_0_1, false)).toEqual(
      '0x01000000000000000000000000000000000000000100000bb8010000000000000000000000000000000000000002'
    )
  })

  it('packs them correctly for exact output single hop', () => {
    expect(encodeRouteToPath(route_0_1, true)).toEqual(
      '0x01000000000000000000000000000000000000000200000bb8010000000000000000000000000000000000000001'
    )
  })

  it('packs them correctly for multihop exact input', () => {
    expect(encodeRouteToPath(route_0_1_2, false)).toEqual(
      '0x01000000000000000000000000000000000000000100000bb8010000000000000000000000000000000000000002000001f4010000000000000000000000000000000000000003'
    )
  })

  it('packs them correctly for multihop exact output', () => {
    expect(encodeRouteToPath(route_0_1_2, true)).toEqual(
      '0x010000000000000000000000000000000000000003000001f401000000000000000000000000000000000000000200000bb8010000000000000000000000000000000000000001'
    )
  })

  it('wraps ICX input for exact input single hop', () => {
    expect(encodeRouteToPath(route_wicx_0, false)).toEqual(
      '0x01111111111111111111111111111111111111111100000bb8010000000000000000000000000000000000000001'
    )
  })
  it('wraps ICX input for exact output single hop', () => {
    expect(encodeRouteToPath(route_wicx_0, true)).toEqual(
      '0x01000000000000000000000000000000000000000100000bb8011111111111111111111111111111111111111111'
    )
  })
  it('wraps ICX input for exact input multihop', () => {
    expect(encodeRouteToPath(route_wicx_0_1, false)).toEqual(
      '0x01111111111111111111111111111111111111111100000bb801000000000000000000000000000000000000000100000bb8010000000000000000000000000000000000000002'
    )
  })
  it('wraps ICX input for exact output multihop', () => {
    expect(encodeRouteToPath(route_wicx_0_1, true)).toEqual(
      '0x01000000000000000000000000000000000000000200000bb801000000000000000000000000000000000000000100000bb8011111111111111111111111111111111111111111'
    )
  })

  it('wraps ICX output for exact input single hop', () => {
    expect(encodeRouteToPath(route_0_wicx, false)).toEqual(
      '0x01000000000000000000000000000000000000000100000bb8011111111111111111111111111111111111111111'
    )
  })
  it('wraps ICX output for exact output single hop', () => {
    expect(encodeRouteToPath(route_0_wicx, true)).toEqual(
      '0x01111111111111111111111111111111111111111100000bb8010000000000000000000000000000000000000001'
    )
  })
  it('wraps ICX output for exact input multihop', () => {
    expect(encodeRouteToPath(route_0_1_wicx, false)).toEqual(
      '0x01000000000000000000000000000000000000000100000bb801000000000000000000000000000000000000000200000bb8011111111111111111111111111111111111111111'
    )
  })
  it('wraps ICX output for exact output multihop', () => {
    expect(encodeRouteToPath(route_0_1_wicx, true)).toEqual(
      '0x01111111111111111111111111111111111111111100000bb801000000000000000000000000000000000000000200000bb8010000000000000000000000000000000000000001'
    )
  })
})
