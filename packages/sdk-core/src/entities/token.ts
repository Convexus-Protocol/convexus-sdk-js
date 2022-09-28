import invariant from 'tiny-invariant'
import { Contract, validateAndParseAddress } from '@convexus/icon-toolkit'
import { BaseCurrency } from './baseCurrency'
import { Currency } from './currency'

/**
 * Represents an IRC2 token with a unique address and some metadata.
 */
export class Token extends BaseCurrency {
  public readonly isNative: false = false
  public readonly isToken: true = true

  public static async fromContract (contract: Contract): Promise<Token> {
    const [decimals, name, symbol] = await Promise.all ([
      contract.decimals(), 
      contract.name(),
      contract.symbol()
    ]);

    return new Token(contract.address, decimals, symbol, name);
  }

  /**
   * The contract address on the chain on which this token lives
   */
  public readonly address: string

  public constructor(address: string, decimals: number, symbol?: string, name?: string) {
    super(decimals, symbol, name)
    this.address = validateAndParseAddress(address)
  }

  /**
   * Returns true if the two tokens are equivalent, i.e. have the same address.
   * @param other other token to compare
   */
  public equals(other: Currency): boolean {
    return other.isToken && this.address === other.address
  }

  /**
   * Returns true if the address of this token sorts before the address of the other token
   * @param other other token to compare
   * @throws if the tokens have the same address
   * @throws if the tokens are on different chains
   */
  public sortsBefore(other: Token): boolean {
    invariant(this.address !== other.address, 'ADDRESSES')
    return this.address.toLowerCase() < other.address.toLowerCase()
  }

  /**
   * Return this token, which does not need to be wrapped
   */
  public get wrapped(): Token {
    return this
  }
}