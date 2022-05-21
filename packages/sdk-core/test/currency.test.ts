import { Icx, Token } from '../src/entities'

describe('Currency', () => {
  const ADDRESS_ZERO = 'hx0000000000000000000000000000000000000000'
  const ADDRESS_ONE = 'hx0000000000000000000000000000000000000001'

  const t0 = new Token(ADDRESS_ZERO, 18)
  const t1 = new Token(ADDRESS_ONE, 18)

  describe('#equals', () => {
    it('icx on same chains is icx', () => {
      expect(new Icx().equals(new Icx()))
    })
    it('icx is not token0', () => {
      expect(new Icx().equals(t0)).toStrictEqual(false)
    })
    it('token1 is not token0', () => {
      expect(t1.equals(t0)).toStrictEqual(false)
    })
    it('token0 is token0', () => {
      expect(t0.equals(t0)).toStrictEqual(true)
    })
    it('token0 is equal to another token0', () => {
      expect(t0.equals(new Token(ADDRESS_ZERO, 18, 'symbol', 'name'))).toStrictEqual(true)
    })
  })
})
