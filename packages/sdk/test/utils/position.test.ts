import JSBI from 'jsbi'
import { PositionLibrary } from '../../src/utils/'
import { ZERO } from '../../src/internalConstants'

describe('PositionLibrary', () => {
  describe('#getTokensOwed', () => {
    it('0', () => {
      const [tokensOwed0, tokensOwed1] = PositionLibrary.getTokensOwed(ZERO, ZERO, ZERO, ZERO, ZERO)
      expect(tokensOwed0).toEqual(ZERO)
      expect(tokensOwed1).toEqual(ZERO)
    })

    it('non-0', () => {
      const [tokensOwed0, tokensOwed1] = PositionLibrary.getTokensOwed(
        ZERO,
        ZERO,
        JSBI.BigInt(1),
        JSBI.exponentiate(JSBI.BigInt(2), JSBI.BigInt(128)),
        JSBI.exponentiate(JSBI.BigInt(2), JSBI.BigInt(128))
      )
      expect(tokensOwed0).toEqual(JSBI.BigInt(1))
      expect(tokensOwed1).toEqual(JSBI.BigInt(1))
    })
  })

  describe('#getKey', () => {
    it('SHA3256', () => {
      expect(PositionLibrary.getKey(
        "cx0000000000000000000000000000000000000001", 
        123, 456
      )).toEqual('0xa8f446f2bcc0799eb6b025c457e4638f11bbfaa62180d4b64be3e72b6cf1d54c')
    })
  })
})
