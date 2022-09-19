import { Currency } from './currency'
import { NativeCurrency } from './nativeCurrency'
import { Token } from './token'

/**
 * ICX is the main usage of a 'native' currency, i.e. for ICON mainnet and all testnets
 */
export class Icx extends NativeCurrency {

  public static wrappedAddress: string = 'cx1111111111111111111111111111111111111111'

  public constructor() {
    super(18, 'ICX', 'ICX')
  }

  public get wrapped (): Token {
    return new Token(Icx.wrappedAddress, 18, 'ICX', 'ICX')
  }

  public equals(other: Currency): boolean {
    return other.isNative && other.symbol === this.symbol
  }

  public static isWrappedAddress (address: string): boolean {
    return Icx.wrappedAddress === address
  }
}
