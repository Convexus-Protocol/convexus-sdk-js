import { BigintIsh, CallData, Interface, toHex, validateAndParseAddress } from '@convexus/icon-toolkit'
import {
  Percent,
  CurrencyAmount,
  Currency,
  NativeCurrency,
  Token,
  Icx,
  MaxUint256
} from '@convexus/sdk-core'
import JSBI from 'jsbi'
import invariant from 'tiny-invariant'
import { Position } from './entities/position'
import { ONE, ZERO } from './internalConstants'
import INonfungiblePositionManager from './artifacts/contracts/NonfungiblePositionManager/NonfungiblePositionManager.json'
import { IAddLiquidityTxs } from './entities/interface/IAddLiquidityTxs';
import { IIncreaseLiquidityTxs } from './entities/interface/IIncreaseLiquidityTxs';
import { IRemoveLiquidityTxs } from './entities/interface/IRemoveLiquidityTxs';

export interface MintSpecificOptions {
  /**
   * The account that should receive the minted NFT.
   */
  recipient: string
}

export interface IncreaseSpecificOptions {
  /**
   * Indicates the ID of the position to increase liquidity for.
   */
  tokenId: BigintIsh
}

/**
 * Options for producing the calldata to add liquidity.
 */
export interface CommonAddLiquidityOptions {
  /**
   * How much the pool price is allowed to move.
   */
  slippageTolerance: Percent

  /**
   * When the transaction expires, in epoch seconds.
   */
  deadline: BigintIsh

  /**
   * Whether to spend ICX. If true, one of the pool tokens must be WICX, by default false
   */
  useNative?: NativeCurrency
}

export type MintOptions = CommonAddLiquidityOptions & MintSpecificOptions
export type IncreaseOptions = CommonAddLiquidityOptions & IncreaseSpecificOptions

export type AddLiquidityOptions = MintOptions | IncreaseOptions

export interface SafeTransferOptions {
  /**
   * The account sending the NFT.
   */
  sender: string

  /**
   * The account that should receive the NFT.
   */
  recipient: string

  /**
   * The id of the token being sent.
   */
  tokenId: BigintIsh
  /**
   * The optional parameter that passes data to the `onERC721Received` call for the staker
   */
  data?: string
}

// type guard
function isMint(options: AddLiquidityOptions): options is MintOptions {
  return Object.keys(options).some(k => k === 'recipient')
}

export interface CollectOptions {
  /**
   * Indicates the ID of the position to collect for.
   */
  tokenId: BigintIsh

  /**
   * Expected value of tokensOwed0, including as-of-yet-unaccounted-for fees/liquidity value to be burned
   */
  expectedCurrencyOwed0: CurrencyAmount<Currency>

  /**
   * Expected value of tokensOwed1, including as-of-yet-unaccounted-for fees/liquidity value to be burned
   */
  expectedCurrencyOwed1: CurrencyAmount<Currency>

  /**
   * The account that should receive the tokens.
   */
  recipient: string
}

export interface NFTPermitOptions {
  v: 0 | 1 | 27 | 28
  r: string
  s: string
  deadline: BigintIsh
  spender: string
}

/**
 * Options for producing the calldata to exit a position.
 */
export interface RemoveLiquidityOptions {
  /**
   * The ID of the token to exit
   */
  tokenId: BigintIsh

  /**
   * The percentage of position liquidity to exit.
   */
  liquidityPercentage: Percent

  /**
   * How much the pool price is allowed to move.
   */
  slippageTolerance: Percent

  /**
   * When the transaction expires, in epoch seconds.
   */
  deadline: BigintIsh

  /**
   * Whether the NFT should be burned if the entire position is being exited, by default false.
   */
  burnToken?: boolean

  /**
   * The optional permit of the token ID being exited, in case the exit transaction is being sent by an account that does not own the NFT
   */
  permit?: NFTPermitOptions

  /**
   * Parameters to be passed on to collect
   */
  collectOptions: Omit<CollectOptions, 'tokenId'>
}

export abstract class NonfungiblePositionManager {
  public static INTERFACE: Interface = new Interface(INonfungiblePositionManager)

  /**
   * Cannot be constructed.
   */
  private constructor() {}

  public static encodeDeposit (token: Token, amount: BigintIsh, nonfungiblePositionManagerAddress: string): CallData {
    if (Icx.isWrappedAddress(token.address)) {
      return NonfungiblePositionManager.INTERFACE.encodeFunctionDataPayable(
        amount,
        'depositIcx', [],
        nonfungiblePositionManagerAddress
      )
    } else {
      return NonfungiblePositionManager.INTERFACE.encodeTokenFallbackFunctionData(
        token.address,
        amount,
        'deposit', [], [],
        nonfungiblePositionManagerAddress
      )
    }
  }

  public static buildAddLiquidityTxs(
    position: Position,
    options: AddLiquidityOptions,
    nonfungiblePositionManagerAddress: string
  ): IAddLiquidityTxs {
    invariant(JSBI.greaterThan(position.liquidity, ZERO), 'ZERO_LIQUIDITY')

    // get amounts
    const { amount0: amount0Desired, amount1: amount1Desired } = position.mintAmounts

    // adjust for slippage
    const minimumAmounts = position.mintAmountsWithSlippage(options.slippageTolerance)
    const amount0Min = toHex(minimumAmounts.amount0)
    const amount1Min = toHex(minimumAmounts.amount1)
    const deadline = toHex(options.deadline)

    // mint
    if (isMint(options)) {
      let deposit0Tx, deposit1Tx;
      const recipient: string = validateAndParseAddress(options.recipient)
      const ZERO = JSBI.BigInt(0)

      // make sure at least one of amounts is > 0
      NonfungiblePositionManager.validateAmounts(amount0Desired, amount1Desired);

      // deposit tokens
      if (JSBI.greaterThan(amount0Desired, ZERO)) {
        deposit0Tx = this.encodeDeposit(position.pool.token0, amount0Desired, nonfungiblePositionManagerAddress);
      }

      if (JSBI.greaterThan(amount1Desired, ZERO)) {
        deposit1Tx = this.encodeDeposit(position.pool.token1, amount1Desired, nonfungiblePositionManagerAddress);
      }

      const mintTx = NonfungiblePositionManager.INTERFACE.encodeFunctionData('mint', [
        [
          position.pool.token0.address,
          position.pool.token1.address,
          position.pool.fee,
          position.tickLower,
          position.tickUpper,
          toHex(amount0Desired),
          toHex(amount1Desired),
          amount0Min,
          amount1Min,
          recipient,
          deadline
        ]
      ],
        nonfungiblePositionManagerAddress)

      if (options.useNative) {
        const wrapped = options.useNative.wrapped
        invariant(position.pool.token0.equals(wrapped) || position.pool.token1.equals(wrapped), 'NO_WICX')
      }

      return { deposit0Tx, deposit1Tx, mintTx };
    } else {
      throw new Error("Options object doesn't contain required 'recipient' key." +
        " Did you mean to increase liquidity for existing position instead?");
    }
  }

  public static buildIncreaseLiquidityTxs(
    position: Position,
    options: AddLiquidityOptions,
    nonfungiblePositionManagerAddress: string
  ): IIncreaseLiquidityTxs {
    invariant(JSBI.greaterThan(position.liquidity, ZERO), 'ZERO_LIQUIDITY')

    // get amounts
    const { amount0: amount0Desired, amount1: amount1Desired } = position.mintAmounts

    // adjust for slippage
    const minimumAmounts = position.mintAmountsWithSlippage(options.slippageTolerance)
    const amount0Min = toHex(minimumAmounts.amount0)
    const amount1Min = toHex(minimumAmounts.amount1)
    const deadline = toHex(options.deadline)

    // increase liquidity
    if (!isMint(options)) {
      // increase

      // make sure at least one of amounts is > 0
      NonfungiblePositionManager.validateAmounts(amount0Desired, amount1Desired);

      let deposit0Tx, deposit1Tx;

      // deposit tokens
      if (JSBI.greaterThan(amount0Desired, ZERO)) {
        deposit0Tx = this.encodeDeposit(position.pool.token0, amount0Desired, nonfungiblePositionManagerAddress);
      }

      if (JSBI.greaterThan(amount1Desired, ZERO)) {
        deposit1Tx = this.encodeDeposit(position.pool.token1, amount1Desired, nonfungiblePositionManagerAddress);
      }

      const increaseLiquidityTx = NonfungiblePositionManager.INTERFACE.encodeFunctionData('increaseLiquidity',
        [[
          toHex(options.tokenId),
          toHex(amount0Desired),
          toHex(amount1Desired),
          amount0Min,
          amount1Min,
          deadline
        ]],
        nonfungiblePositionManagerAddress);

      if (options.useNative) {
        const wrapped = options.useNative.wrapped
        invariant(position.pool.token0.equals(wrapped) || position.pool.token1.equals(wrapped), 'NO_WICX')
      }

      return { deposit0Tx, deposit1Tx, increaseLiquidityTx }
    } else {
      throw new Error("Options object contain 'recipient' key." +
        " Did you mean to create and add liquidity to new position?");
    }
  }

  public static buildWithdrawDepositedTx(token: Token, nonfungiblePositionManagerAddress: string): CallData {
    return NonfungiblePositionManager.INTERFACE.encodeFunctionData(
      'withdraw',
      [token.address],
      nonfungiblePositionManagerAddress
    );
  }

  private static validateAmounts(amount0Desired: JSBI, amount1Desired: JSBI): void {
    if (!JSBI.greaterThan(amount0Desired, ZERO) && !JSBI.greaterThan(amount1Desired, ZERO)) {
      throw new Error("At least one of amount0 or amount1 must be greater than 0!");
    }
  }

  /**
   * Produces the calldata for collecting up to a maximum amount of fees owed to a specific position to the recipient
   * @param options Additional information necessary for generating the calldata
   * @param nonfungiblePositionManagerAddress SCORE address
   * @returns The call parameters
   */
  public static buildCollectFeesTx(options: CollectOptions, nonfungiblePositionManagerAddress: string): CallData {
    const tokenId = toHex(options.tokenId)

    const recipient = validateAndParseAddress(options.recipient)

    return NonfungiblePositionManager.INTERFACE.encodeFunctionData('collect', [
      [
        tokenId,
        recipient,
        MaxUint256,
        MaxUint256
      ]
    ], nonfungiblePositionManagerAddress)
  }

  /**
   * Produces the calldata for completely or partially exiting a position
   * @param position The position to exit
   * @param options Additional information necessary for generating the calldata
   * @param nonfungiblePositionManagerAddress SCORE address
   * @returns The call parameters
   */
  public static buildRemoveLiquidityTxs(
    position: Position,
    options: RemoveLiquidityOptions,
    nonfungiblePositionManagerAddress: string
  ): IRemoveLiquidityTxs {
    const deadline = toHex(options.deadline)
    const tokenId = toHex(options.tokenId)

    // construct a partial position with a percentage of liquidity
    const partialPosition = new Position({
      pool: position.pool,
      liquidity: options.liquidityPercentage.multiply(position.liquidity).quotient,
      tickLower: position.tickLower,
      tickUpper: position.tickUpper
    })
    invariant(JSBI.greaterThan(partialPosition.liquidity, ZERO), 'ZERO_LIQUIDITY')

    // slippage-adjusted underlying amounts
    const { amount0: amount0Min, amount1: amount1Min } = partialPosition.burnAmountsWithSlippage(
      options.slippageTolerance
    )

    // remove liquidity
    const decreaseLiquidityTx = NonfungiblePositionManager.INTERFACE.encodeFunctionData('decreaseLiquidity', [
      [
        tokenId,
        toHex(partialPosition.liquidity),
        toHex(amount0Min),
        toHex(amount1Min),
        deadline
      ]
    ], nonfungiblePositionManagerAddress)

    const { expectedCurrencyOwed0, expectedCurrencyOwed1, ...rest } = options.collectOptions
    const collectTx = NonfungiblePositionManager.buildCollectFeesTx({
      tokenId: toHex(options.tokenId),
      // add the underlying value to the expected currency already owed
      expectedCurrencyOwed0: expectedCurrencyOwed0.add(
        CurrencyAmount.fromRawAmount(expectedCurrencyOwed0.currency, amount0Min)
      ),
      expectedCurrencyOwed1: expectedCurrencyOwed1.add(
        CurrencyAmount.fromRawAmount(expectedCurrencyOwed1.currency, amount1Min)
      ),
      ...rest
    }, nonfungiblePositionManagerAddress);

    let burnTx = undefined;
    if (options.liquidityPercentage.equalTo(ONE)) {
      if (options.burnToken) {
        burnTx = NonfungiblePositionManager.INTERFACE.encodeFunctionData(
          'burn',
          [tokenId],
          nonfungiblePositionManagerAddress
        )
      }
    } else {
      invariant(options.burnToken !== true, 'CANNOT_BURN')
    }

    return { decreaseLiquidityTx, collectTx, burnTx }
  }

  public static safeTransferFromParameters(
    options: SafeTransferOptions,
    nonfungiblePositionManagerAddress: string
  ): CallData {
    const recipient = validateAndParseAddress(options.recipient)
    const sender = validateAndParseAddress(options.sender)

    let calldata: CallData
    if (options.data) {
      calldata = NonfungiblePositionManager.INTERFACE.encodeFunctionData(
        'safeTransferFrom',
        [sender, recipient, toHex(options.tokenId), options.data],
        nonfungiblePositionManagerAddress
      )
    } else {
      calldata = NonfungiblePositionManager.INTERFACE.encodeFunctionData('safeTransferFrom', [
        sender,
        recipient,
        toHex(options.tokenId),
        ''
      ], nonfungiblePositionManagerAddress)
    }

    return calldata
  }
}
