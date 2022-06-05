import { Percent, Token } from '@convexus/sdk-core'
import JSBI from 'jsbi'
import { Payments } from '../src/payments'

const recipient = '0x0000000000000000000000000000000000000003'
const amount = JSBI.BigInt(123)

const feeOptions = {
  fee: new Percent(1, 1000),
  recipient: '0x0000000000000000000000000000000000000009'
}

const token = new Token('cx0000000000000000000000000000000000000001', 18, 't0', 'token0')

describe('Payments', () => {
  describe('#encodeUnwrapSICX', () => {
    it('works without feeOptions', () => {
      const calldata = Payments.encodeUnwrapSICX(amount, recipient)
      expect(calldata).toStrictEqual(
        '0x49404b7c000000000000000000000000000000000000000000000000000000000000007b0000000000000000000000000000000000000000000000000000000000000003'
      )
    })

    it('works with feeOptions', () => {
      const calldata = Payments.encodeUnwrapSICX(amount, recipient, feeOptions)
      expect(calldata).toStrictEqual(
        '0x9b2c0a37000000000000000000000000000000000000000000000000000000000000007b0000000000000000000000000000000000000000000000000000000000000003000000000000000000000000000000000000000000000000000000000000000a0000000000000000000000000000000000000000000000000000000000000009'
      )
    })
  })

  describe('#encodeSweepToken', () => {
    it('works without feeOptions', () => {
      const calldata = Payments.encodeSweepToken(token, amount, recipient)
      expect(calldata).toStrictEqual(
        '0xdf2ab5bb0000000000000000000000000000000000000000000000000000000000000001000000000000000000000000000000000000000000000000000000000000007b0000000000000000000000000000000000000000000000000000000000000003'
      )
    })

    it('works with feeOptions', () => {
      const calldata = Payments.encodeSweepToken(token, amount, recipient, feeOptions)
      expect(calldata).toStrictEqual(
        '0xe0e189a00000000000000000000000000000000000000000000000000000000000000001000000000000000000000000000000000000000000000000000000000000007b0000000000000000000000000000000000000000000000000000000000000003000000000000000000000000000000000000000000000000000000000000000a0000000000000000000000000000000000000000000000000000000000000009'
      )
    })
  })

  it('#encodeRefundICX', () => {
    const calldata = Payments.encodeRefundICX()
    expect(calldata).toStrictEqual('0x12210e8a')
  })
})
