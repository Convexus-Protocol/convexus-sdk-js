import { BigintIsh, Currency, CurrencyAmount, TradeType } from '@convexus/sdk-core'
import { encodeRouteToPath } from './utils'
import { MethodParameters, toHex } from './utils/calldata'
import IQuoter from './artifacts/contracts/Quoter/Quoter.json'
import { Interface } from './utils'
import { Route } from './entities'
import invariant from 'tiny-invariant'

/**
 * Optional arguments to send to the quoter.
 */
export interface QuoteOptions {
  /**
   * The optional price limit for the trade.
   */
  sqrtPriceLimitX96?: BigintIsh
}

/**
 * Represents the Uniswap V3 QuoterV1 contract with a method for returning the formatted
 * calldata needed to call the quoter contract.
 */
export abstract class SwapQuoter {
  public static INTERFACE: Interface = new Interface(IQuoter.abi)

  /**
   * Produces the on-chain method name of the appropriate function within QuoterV2,
   * and the relevant hex encoded parameters.
   * @template TInput The input token, either ICX or an IRC-2
   * @template TOutput The output token, either ICX or an IRC-2
   * @param route The swap route, a list of pools through which a swap can occur
   * @param amount The amount of the quote, either an amount in, or an amount out
   * @param tradeType The trade type, either exact input or exact output
   * @returns The formatted calldata
   */
  public static quoteCallParameters<TInput extends Currency, TOutput extends Currency>(
    route: Route<TInput, TOutput>,
    amount: CurrencyAmount<TInput | TOutput>,
    tradeType: TradeType,
    options: QuoteOptions = {}
  ): MethodParameters {
    const singleHop = route.pools.length === 1
    const quoteAmount: string = toHex(amount.quotient)
    let calldata: string

    if (singleHop) {
      if (tradeType === TradeType.EXACT_INPUT) {
        calldata = SwapQuoter.INTERFACE.encodeFunctionData(`quoteExactInputSingle`, [
          route.tokenPath[0].address,
          route.tokenPath[1].address,
          route.pools[0].fee,
          quoteAmount,
          toHex(options?.sqrtPriceLimitX96 ?? 0)
        ])
      } else {
        calldata = SwapQuoter.INTERFACE.encodeFunctionData(`quoteExactOutputSingle`, [
          route.tokenPath[0].address,
          route.tokenPath[1].address,
          route.pools[0].fee,
          quoteAmount,
          toHex(options?.sqrtPriceLimitX96 ?? 0)
        ])
      }
    } else {
      invariant(options?.sqrtPriceLimitX96 === undefined, 'MULTIHOP_PRICE_LIMIT')
      const path: string = encodeRouteToPath(route, tradeType === TradeType.EXACT_OUTPUT)

      if (tradeType === TradeType.EXACT_INPUT) {
        calldata = SwapQuoter.INTERFACE.encodeFunctionData('quoteExactInput', [path, quoteAmount])
      } else {
        calldata = SwapQuoter.INTERFACE.encodeFunctionData('quoteExactOutput', [path, quoteAmount])
      }
    }
    return {
      calldata,
      value: toHex(0)
    }
  }
}
