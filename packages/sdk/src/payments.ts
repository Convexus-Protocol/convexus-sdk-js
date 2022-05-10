import JSBI from 'jsbi'
import { Interface } from './utils/interface'
import IPeripheryPaymentsWithFee from './artifacts/contracts/interfaces/IPeripheryPaymentsWithFee/IPeripheryPaymentsWithFee.json'
import { Percent, Token, validateAndParseAddress } from '@convexus/sdk-core'
import { toHex } from './utils/calldata'

export interface FeeOptions {
  /**
   * The percent of the output that will be taken as a fee.
   */
  fee: Percent

  /**
   * The recipient of the fee.
   */
  recipient: string
}

export abstract class Payments {
  public static INTERFACE: Interface = new Interface(IPeripheryPaymentsWithFee.abi)

  /**
   * Cannot be constructed.
   */
  private constructor() {}

  private static encodeFeeBips(fee: Percent): string {
    return toHex(fee.multiply(10_000).quotient)
  }

  public static encodeUnwrapSICX(amountMinimum: JSBI, recipient: string, feeOptions?: FeeOptions): string {
    recipient = validateAndParseAddress(recipient)

    if (!!feeOptions) {
      const feeBips = this.encodeFeeBips(feeOptions.fee)
      const feeRecipient: string = validateAndParseAddress(feeOptions.recipient)

      return Payments.INTERFACE.encodeFunctionData('unwrapSICXWithFee', [
        toHex(amountMinimum),
        recipient,
        feeBips,
        feeRecipient
      ])
    } else {
      return Payments.INTERFACE.encodeFunctionData('unwrapSICX', [toHex(amountMinimum), recipient])
    }
  }

  public static encodeSweepToken(
    token: Token,
    amountMinimum: JSBI,
    recipient: string,
    feeOptions?: FeeOptions
  ): string {
    recipient = validateAndParseAddress(recipient)

    if (!!feeOptions) {
      const feeBips = this.encodeFeeBips(feeOptions.fee)
      const feeRecipient: string = validateAndParseAddress(feeOptions.recipient)

      return Payments.INTERFACE.encodeFunctionData('sweepTokenWithFee', [
        token.address,
        toHex(amountMinimum),
        recipient,
        feeBips,
        feeRecipient
      ])
    } else {
      return Payments.INTERFACE.encodeFunctionData('sweepToken', [token.address, toHex(amountMinimum), recipient])
    }
  }

  public static encodeRefundICX(): string {
    return Payments.INTERFACE.encodeFunctionData('refundICX')
  }
}