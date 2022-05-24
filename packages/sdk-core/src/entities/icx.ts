import { Currency } from './currency'
import { NativeCurrency } from './nativeCurrency'
import { Token } from './token'

/**
 * ICX is the main usage of a 'native' currency, i.e. for ICON mainnet and all testnets
 */
export class Icx extends NativeCurrency {

  public constructor() {
    super(18, 'ICX', 'ICX')
  }

  public get wrapped (): Token {
    return new Token('cx1000000000000000000000000000000000000004', 18, 'wicx')
  }

  public equals(other: Currency): boolean {
    return other.isNative && other.symbol === this.symbol
  }
}
