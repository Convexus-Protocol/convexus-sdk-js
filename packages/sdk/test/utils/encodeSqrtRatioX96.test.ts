import { Price, Token } from '@convexus/sdk-core'
import JSBI from 'jsbi'
import { Q96 } from '../../src/internalConstants'
import { encodeSqrtRatioX96, encodeSqrtRatioX96FromPrice } from '../../src/utils/encodeSqrtRatioX96'

describe('#encodeSqrtRatioX96', () => {
  it('1/1', () => {
    expect(encodeSqrtRatioX96(1, 1)).toEqual(Q96)
  })

  it('100/1', () => {
    expect(encodeSqrtRatioX96(100, 1)).toEqual(JSBI.BigInt('792281625142643375935439503360'))
  })

  it('1/100', () => {
    expect(encodeSqrtRatioX96(1, 100)).toEqual(JSBI.BigInt('7922816251426433759354395033'))
  })

  it('111/333', () => {
    expect(encodeSqrtRatioX96(111, 333)).toEqual(JSBI.BigInt('45742400955009932534161870629'))
  })

  it('333/111', () => {
    expect(encodeSqrtRatioX96(333, 111)).toEqual(JSBI.BigInt('137227202865029797602485611888'))
  })
})

describe('#encodeSqrtRatioX96FromPrice', () => {
  const t0 = new Token('cx0000000000000000000000000000000000000000', 18)
  const t1 = new Token('cx0000000000000000000000000000000000000001', 18)

  it('1/1', () => {
    const price = new Price(t0, t1, 1, 1);
    expect(encodeSqrtRatioX96FromPrice(price)).toEqual(Q96)
  })

  it('100/1', () => {
    expect(encodeSqrtRatioX96(100, 1)).toEqual(JSBI.BigInt('792281625142643375935439503360'))
  })

  it('1/100', () => {
    expect(encodeSqrtRatioX96(1, 100)).toEqual(JSBI.BigInt('7922816251426433759354395033'))
  })

  it('111/333', () => {
    expect(encodeSqrtRatioX96(111, 333)).toEqual(JSBI.BigInt('45742400955009932534161870629'))
  })

  it('333/111', () => {
    expect(encodeSqrtRatioX96(333, 111)).toEqual(JSBI.BigInt('137227202865029797602485611888'))
  })
})
