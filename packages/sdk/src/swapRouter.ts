import { BigintIsh, Currency, CurrencyAmount, Icx, Percent, TradeType, validateAndParseAddress } from '@convexus/sdk-core'
import invariant from 'tiny-invariant'
import { Trade } from './entities/trade'
import { ADDRESS_ZERO } from './constants'
import { encodeRouteToPath, Interface } from './utils'
import { MethodParameters, toHex } from './utils/calldata'
import ISwapRouter from './artifacts/contracts/SwapRouter/SwapRouter.json'
import { Multicall } from './multicall'
import { FeeOptions, Payments } from './payments'

/**
 * Options for producing the arguments to send calls to the router.
 */
export interface SwapOptions {
  /**
   * How much the execution price is allowed to move unfavorably from the trade execution price.
   */
  slippageTolerance: Percent

  /**
   * The account that should receive the output.
   */
  recipient: string

  /**
   * When the transaction expires, in epoch seconds.
   */
  deadline: BigintIsh

  /**
   * The optional price limit for the trade.
   */
  sqrtPriceLimitX96?: BigintIsh

  /**
   * Optional information for taking a fee on output.
   */
  fee?: FeeOptions
}

/**
 * Represents the Convexus SwapRouter, and has static methods for helping execute trades.
 */
export abstract class SwapRouter {
  public static INTERFACE: Interface = new Interface(ISwapRouter)

  /**
   * Cannot be constructed.
   */
  private constructor() {}

  /**
   * Produces the on-chain method name to call and the hex encoded parameters to pass as arguments for a given trade.
   * @param trade to produce call parameters for
   * @param options options for the call parameters
   */
  public static swapCallParameters(
    trades: Trade<Currency, Currency, TradeType> | Trade<Currency, Currency, TradeType>[],
    options: SwapOptions
  ): MethodParameters {
    if (!Array.isArray(trades)) {
      trades = [trades]
    }

    const sampleTrade = trades[0]
    const tokenIn = sampleTrade.inputAmount.currency.wrapped
    const tokenOut = sampleTrade.outputAmount.currency.wrapped

    // All trades should have the same starting and ending token.
    invariant(
      trades.every(trade => trade.inputAmount.currency.wrapped.equals(tokenIn)),
      'TOKEN_IN_DIFF'
    )
    invariant(
      trades.every(trade => trade.outputAmount.currency.wrapped.equals(tokenOut)),
      'TOKEN_OUT_DIFF'
    )

    const calldatas: string[] = []

    const ZERO_IN: CurrencyAmount<Currency> = CurrencyAmount.fromRawAmount(trades[0].inputAmount.currency, 0)
    const ZERO_OUT: CurrencyAmount<Currency> = CurrencyAmount.fromRawAmount(trades[0].outputAmount.currency, 0)

    const totalAmountOut: CurrencyAmount<Currency> = trades.reduce(
      (sum, trade) => sum.add(trade.minimumAmountOut(options.slippageTolerance)),
      ZERO_OUT
    )

    // flag for whether a refund needs to happen
    const mustRefund = sampleTrade.inputAmount.currency.isNative && sampleTrade.tradeType === TradeType.EXACT_OUTPUT
    const inputIsNative = sampleTrade.inputAmount.currency.isNative
    // flags for whether funds should be send first to the router
    const outputIsNative = sampleTrade.outputAmount.currency.isNative
    const routerMustCustody = outputIsNative || !!options.fee

    const totalValue: CurrencyAmount<Currency> = inputIsNative
      ? trades.reduce((sum, trade) => sum.add(trade.maximumAmountIn(options.slippageTolerance)), ZERO_IN)
      : ZERO_IN

    // encode permit if necessary
    // if (options.inputTokenPermit) {
    //   invariant(sampleTrade.inputAmount.currency.isToken, 'NON_TOKEN_PERMIT')
    //   calldatas.push(SelfPermit.encodePermit(sampleTrade.inputAmount.currency, options.inputTokenPermit))
    // }

    const recipient: string = validateAndParseAddress(options.recipient)
    const deadline = toHex(options.deadline)

    for (const trade of trades) {
      for (const { route, inputAmount, outputAmount } of trade.swaps) {
        const amountIn: string = toHex(trade.maximumAmountIn(options.slippageTolerance, inputAmount).quotient)
        const amountOut: string = toHex(trade.minimumAmountOut(options.slippageTolerance, outputAmount).quotient)

        // flag for whether the trade is single hop or not
        const singleHop = route.pools.length === 1

        if (singleHop) {
          if (trade.tradeType === TradeType.EXACT_INPUT) {

            if (Icx.isWrappedAddress(route.tokenPath[0].address)) {
              const exactInputSingleParams = [
                [
                  route.tokenPath[1].address,
                  route.pools[0].fee,
                  routerMustCustody ? ADDRESS_ZERO : recipient,
                  deadline,
                  amountOut,
                  toHex(options.sqrtPriceLimitX96 ?? 0)
                ]
              ]

              calldatas.push(
                SwapRouter.INTERFACE.encodeFunctionData(
                  'exactInputSingleIcx', 
                  exactInputSingleParams
                )
              )

            } else {
              
            const exactInputSingleParams = [
              [
                route.tokenPath[0].address,
                route.tokenPath[1].address,
                route.pools[0].fee,
                routerMustCustody ? ADDRESS_ZERO : recipient,
                deadline,
                amountIn,
                amountOut,
                toHex(options.sqrtPriceLimitX96 ?? 0)
              ]
            ]

            const exactInputSingleInputs = [{
              fields: [
                { name: 'tokenIn', type: 'Address' },
                { name: 'tokenOut', type: 'Address' },
                { name: 'fee', type: 'int' },
                { name: 'recipient', type: 'Address' },
                { name: 'deadline', type: 'int' },
                { name: 'amountIn', type: 'int' },
                { name: 'amountOutMinimum', type: 'int' },
                { name: 'sqrtPriceLimitX96', type: 'int' }
              ],
              name: 'params',
              type: 'struct'
            }]
            
              calldatas.push(
                SwapRouter.INTERFACE.encodeTokenFallbackFunctionData(
                  'exactInputSingle', 
                  exactInputSingleInputs, 
                  exactInputSingleParams
                )
              )
            }
          } else {
            const exactOutputSingleParams = [[
              route.tokenPath[0].address,
              route.tokenPath[1].address,
              route.pools[0].fee,
              routerMustCustody ? ADDRESS_ZERO : recipient,
              deadline,
              amountOut,
              amountIn,
              toHex(options.sqrtPriceLimitX96 ?? 0)
            ]]

            const exactOutputSingleInputs = [{
              fields: [
                { name: 'tokenIn', type: 'Address' },
                { name: 'tokenOut', type: 'Address' },
                { name: 'fee', type: 'int' },
                { name: 'recipient', type: 'Address' },
                { name: 'deadline', type: 'int' },
                { name: 'amountOut', type: 'int' },
                { name: 'amountInMaximum', type: 'int' },
                { name: 'sqrtPriceLimitX96', type: 'int' }
              ],
              name: 'params',
              type: 'struct'
            }]

            calldatas.push(
              SwapRouter.INTERFACE.encodeTokenFallbackFunctionData(
                'exactOutputSingle', 
                exactOutputSingleInputs, 
                exactOutputSingleParams
              )
            )
          }
        } else {
          invariant(options.sqrtPriceLimitX96 === undefined, 'MULTIHOP_PRICE_LIMIT')

          const path: string = encodeRouteToPath(route, trade.tradeType === TradeType.EXACT_OUTPUT)

          if (trade.tradeType === TradeType.EXACT_INPUT) {
            const exactInputParams = [[
              path,
              routerMustCustody ? ADDRESS_ZERO : recipient,
              deadline,
              amountIn,
              amountOut
            ]]

            const exactInputInputs = [{
              fields: [
                { name: 'path', type: 'bytes' },
                { name: 'recipient', type: 'Address' },
                { name: 'deadline', type: 'int' },
                { name: 'amountIn', type: 'int' },
                { name: 'amountOutMinimum', type: 'int' }
              ],
              name: 'params',
              type: 'struct'
            }]

            calldatas.push(SwapRouter.INTERFACE.encodeTokenFallbackFunctionData(
              'exactInput',
              exactInputInputs,
              exactInputParams
            ))
          } else {
            const exactOutputParams = [[
              path,
              routerMustCustody ? ADDRESS_ZERO : recipient,
              deadline,
              amountOut,
              amountIn
            ]]

            const exactOutputInputs = [{
              fields: [
                { name: 'path', type: 'bytes' },
                { name: 'recipient', type: 'Address' },
                { name: 'deadline', type: 'int' },
                { name: 'amountOut', type: 'int' },
                { name: 'amountInMaximum', type: 'int' }
              ],
              name: 'params',
              type: 'struct'
            }]

            calldatas.push(SwapRouter.INTERFACE.encodeTokenFallbackFunctionData(
              'exactOutput', 
              exactOutputInputs,
              exactOutputParams
            ))
          }
        }
      }
    }

    // unwrap
    if (routerMustCustody) {
      if (!!options.fee) {
        if (outputIsNative) {
          calldatas.push(Payments.encodeUnwrapSICX(totalAmountOut.quotient, recipient, options.fee))
        } else {
          calldatas.push(
            Payments.encodeSweepToken(
              sampleTrade.outputAmount.currency.wrapped,
              totalAmountOut.quotient,
              recipient,
              options.fee
            )
          )
        }
      } else {
        calldatas.push(Payments.encodeUnwrapSICX(totalAmountOut.quotient, recipient))
      }
    }

    // refund
    if (mustRefund) {
      calldatas.push(Payments.encodeRefundICX())
    }

    console.log("calldatas=", JSON.stringify(calldatas, null, 4))

    return {
      calldata: Multicall.encodeMulticall(calldatas),
      value: toHex(totalValue.quotient)
    }
  }
}
