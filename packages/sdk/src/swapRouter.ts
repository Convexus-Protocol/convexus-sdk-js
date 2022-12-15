import { BigintIsh, CallData, Interface, toHex, validateAndParseAddress } from '@convexus/icon-toolkit'
import { Currency, Icx, Percent, TradeType } from '@convexus/sdk-core'
import invariant from 'tiny-invariant'
import { Trade } from './entities/trade'
import { ADDRESS_ZERO } from './constants'
import { encodeRouteToPath } from './utils'
import ISwapRouter from './artifacts/contracts/SwapRouter/SwapRouter.json'
import { FeeOptions } from './payments'
import { Route } from './entities'

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
    options: SwapOptions,
    swapRouterAddress: string
  ): CallData[] {
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

    const calldatas: CallData[] = []

    // flags for whether funds should be send first to the router
    const outputIsNative = sampleTrade.outputAmount.currency.isNative
    const routerMustCustody = outputIsNative || !!options.fee

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
            calldatas.push(SwapRouter.encodeExactInputSingle(route, routerMustCustody, recipient, deadline, amountOut, amountIn, options, swapRouterAddress))
          } else {
            calldatas.push(SwapRouter.encodeExactOutputSingle(route, routerMustCustody, recipient, deadline, amountOut, amountIn, options, swapRouterAddress))
          }
        } else {
          invariant(options.sqrtPriceLimitX96 === undefined, 'MULTIHOP_PRICE_LIMIT')
          if (trade.tradeType === TradeType.EXACT_INPUT) {
            calldatas.push(SwapRouter.encodeExactInput(trade, route, routerMustCustody, recipient, deadline, amountIn, amountOut, swapRouterAddress))
          } else {
            calldatas.push(SwapRouter.encodeExactOutput(trade, route, routerMustCustody, recipient, deadline, amountOut, amountIn, swapRouterAddress))
          }
        }
      }
    }

    return calldatas
  }

  private static encodeExactOutput (
    trade: Trade<Currency, Currency, TradeType>,
    route: Route<Currency, Currency>,
    routerMustCustody: boolean,
    recipient: string,
    deadline: string,
    amountOut: string,
    amountIn: string,
    swapRouterAddress: string
  ): CallData {

    const path: string = encodeRouteToPath(route, trade.tradeType === TradeType.EXACT_OUTPUT)

    if (Icx.isWrappedAddress(route.tokenPath[0].address)) {
      const exactOutputParams = [
        [
          path,
          routerMustCustody ? ADDRESS_ZERO : recipient,
          deadline,
          amountOut
        ]
      ]

      return SwapRouter.INTERFACE.encodeFunctionDataPayable(
        amountIn,
        'exactOutputIcx',
        exactOutputParams,
        swapRouterAddress
      )
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

      return SwapRouter.INTERFACE.encodeTokenFallbackFunctionData(
        route.tokenPath[0].address,
        amountIn,
        'exactOutput',
        exactOutputInputs,
        exactOutputParams,
        swapRouterAddress
      )
    }
  }

  private static encodeExactInput (
    trade: Trade<Currency, Currency, TradeType>,
    route: Route<Currency, Currency>,
    routerMustCustody: boolean,
    recipient: string,
    deadline: string,
    amountIn: string,
    amountOut: string,
    swapRouterAddress: string
  ): CallData {
    const path: string = encodeRouteToPath(route, trade.tradeType === TradeType.EXACT_OUTPUT)

    if (Icx.isWrappedAddress(route.tokenPath[0].address)) {
      const exactInputParams = [[
        path,
        routerMustCustody ? ADDRESS_ZERO : recipient,
        deadline,
        amountOut
      ]]

      return SwapRouter.INTERFACE.encodeFunctionDataPayable(
        amountIn,
        'exactInputIcx',
        exactInputParams,
        swapRouterAddress
      )
    } else {
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

      return SwapRouter.INTERFACE.encodeTokenFallbackFunctionData(
        route.tokenPath[0].address,
        amountIn,
        'exactInput',
        exactInputInputs,
        exactInputParams,
        swapRouterAddress
      )
    }
  }

  private static encodeExactOutputSingle (
    route: Route<Currency, Currency>,
    routerMustCustody: boolean,
    recipient: string,
    deadline: string,
    amountOut: string,
    amountIn: string,
    options: SwapOptions,
    swapRouterAddress: string
  ): CallData {
    if (Icx.isWrappedAddress(route.tokenPath[0].address)) {
      const exactOutputSingleParams = [[
        route.tokenPath[1].address,
        route.pools[0].fee,
        routerMustCustody ? ADDRESS_ZERO : recipient,
        deadline,
        amountOut,
        toHex(options.sqrtPriceLimitX96 ?? 0)
      ]]

      return SwapRouter.INTERFACE.encodeFunctionDataPayable(
        amountIn,
        'exactOutputSingleIcx',
        exactOutputSingleParams,
        swapRouterAddress
      )
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

      return SwapRouter.INTERFACE.encodeTokenFallbackFunctionData(
        route.tokenPath[0].address,
        amountIn,
        'exactOutputSingle',
        exactOutputSingleInputs,
        exactOutputSingleParams,
        swapRouterAddress
      )
    }
  }

  private static encodeExactInputSingle (
    route: Route<Currency, Currency>,
    routerMustCustody: boolean,
    recipient: string,
    deadline: string,
    amountOut: string,
    amountIn: string,
    options: SwapOptions,
    swapRouterAddress: string
  ): CallData {
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

      return SwapRouter.INTERFACE.encodeFunctionDataPayable(
        amountIn,
        'exactInputSingleIcx',
        exactInputSingleParams,
        swapRouterAddress
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

      return SwapRouter.INTERFACE.encodeTokenFallbackFunctionData(
        route.tokenPath[0].address,
        amountIn,
        'exactInputSingle',
        exactInputSingleInputs,
        exactInputSingleParams,
        swapRouterAddress
      )
    }
  }
}
