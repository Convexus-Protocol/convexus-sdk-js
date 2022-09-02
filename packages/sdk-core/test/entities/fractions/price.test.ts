import { Token } from '../../../src/entities/token'
import { CurrencyAmount } from '../../../src/entities/fractions/currencyAmount'
import { Price } from '../../../src/entities/fractions/price'
import JSBI from 'jsbi'

describe('Price', () => {
  const t0_18 = new Token('cx0000000000000000000000000000000000000000', 18)
  const t1_6 = new Token('cx0000000000000000000000000000000000000001', 6)
  const t2_18 = new Token('cx0000000000000000000000000000000000000002', 18)

  describe('#constructor', () => {
    it('array format works', () => {
      const price = new Price(t0_18, t2_18, 1, 54321)
      expect(price.toSignificant(5)).toEqual('54321')
      expect(price.baseCurrency.equals(t0_18))
      expect(price.quoteCurrency.equals(t2_18))
    })
    it('object format works', () => {
      const price = new Price({
        baseAmount: CurrencyAmount.fromRawAmount(t0_18, 1),
        quoteAmount: CurrencyAmount.fromRawAmount(t2_18, 54321)
      })
      expect(price.toSignificant(5)).toEqual('54321')
      expect(price.baseCurrency.equals(t0_18))
      expect(price.quoteCurrency.equals(t2_18))
    })
  })

  describe('#quote', () => {
    it('returns correct value', () => {
      const price = new Price(t0_18, t2_18, 1, 5)
      expect(price.quote(CurrencyAmount.fromRawAmount(t0_18, 10))).toEqual(CurrencyAmount.fromRawAmount(t2_18, 50))
    })
  })

  describe('#toSignificant', () => {
    it('no decimals', () => {
      const p = new Price(t0_18, t2_18, 123, 456)
      expect(p.toSignificant(4)).toEqual('3.707')
    })
    it('no decimals flip ratio', () => {
      const p = new Price(t0_18, t2_18, 456, 123)
      expect(p.toSignificant(4)).toEqual('0.2697')
    })
    it('with decimal difference', () => {
      const p = new Price(t1_6, t2_18, 123, 456)
      expect(p.toSignificant(4)).toEqual('0.000000000003707')
    })

    it('with decimal difference again', () => {
      const p = new Price(
        t1_6,
        t2_18,
        JSBI.exponentiate(JSBI.BigInt(10), JSBI.BigInt(6)), 
        JSBI.exponentiate(JSBI.BigInt(10), JSBI.BigInt(18))
      )
      expect(p.toSignificant(4)).toEqual('1')
    })

    it('with decimal difference flipped', () => {
      const p = new Price(t1_6, t2_18, 456, 123)
      expect(p.toSignificant(4)).toEqual('0.0000000000002697')
    })
    it('with decimal difference flipped base quote flipped', () => {
      const p = new Price(t2_18, t1_6, 456, 123)
      expect(p.toSignificant(4)).toEqual('269700000000')
    })
  })
})
