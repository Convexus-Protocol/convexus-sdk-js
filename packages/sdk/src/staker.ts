import { BigintIsh, CallData, Interface, toHex, toHexString, validateAndParseAddress } from '@convexus/icon-toolkit'
import { Token } from '@convexus/sdk-core'
import IConvexusStaker from './artifacts/contracts/ConvexusStaker/ConvexusStaker.json'
import { Pool, PoolFactoryProvider } from './entities'
import { IClaimTxs } from './entities/interface/IClaimTxs';

export type FullWithdrawOptions = ClaimOptions & WithdrawOptions
/**
 * Represents a unique staking program.
 */
export interface IncentiveKey {
  /**
   * The token rewarded for participating in the staking program.
   */
  rewardToken: Token
  /**
   * The pool that the staked positions must provide in.
   */
  pool: Pool
  /**
   * The time when the incentive program begins.
   */
  startTime: BigintIsh
  /**
   * The time that the incentive program ends.
   */
  endTime: BigintIsh
  /**
   * The address which receives any remaining reward tokens at `endTime`.
   */
  refundee: string
}

/**
 * Options to specify when claiming rewards.
 */
export interface ClaimOptions {
  /**
   * The id of the NFT
   */
  tokenId: BigintIsh

  /**
   * Address to send rewards to.
   */
  recipient: string

  /**
   * The amount of `rewardToken` to claim. 0 claims all.
   */
  amount?: BigintIsh
}
/**
 * Options to specify when withdrawing a position.
 */
export interface WithdrawOptions {
  /**
   * Set when withdrawing. The position will be sent to `owner` on withdraw.
   */
  owner: string

  /**
   * Set when withdrawing. `data` is passed to `safeTransferFrom` when transferring the position from contract back to owner.
   */
  data?: string
}

export abstract class Staker {
  public static INTERFACE: Interface = new Interface(IConvexusStaker)

  protected constructor() {}

  /**
   *  To claim rewards, must unstake and then claim.
   * @param poolFactoryProvider
   * @param incentiveKey The unique identifier of a staking program.
   * @param options Options for producing the calldata to claim. Can't claim unless you unstake.
   * @param stakerAddress Score address
   * @returns The calldatas for 'unstakeToken' and 'claimReward'.
   */
  private static async encodeClaim(
    poolFactoryProvider: PoolFactoryProvider,
    incentiveKey: IncentiveKey,
    options: ClaimOptions,
    stakerAddress: string
  ): Promise<IClaimTxs> {
    const unstakeTokenTx = Staker.INTERFACE.encodeFunctionData('unstakeToken', [
      await this._encodeIncentiveKey(poolFactoryProvider, incentiveKey),
      toHex(options.tokenId)
    ], stakerAddress)

    const recipient: string = validateAndParseAddress(options.recipient)
    const amount = options.amount ?? 0

    const claimRewardTx = Staker.INTERFACE.encodeFunctionData('claimReward',
      [incentiveKey.rewardToken.address, recipient, toHex(amount)], stakerAddress)

    return { unstakeTokenTx, claimRewardTx }
  }

  /**
   *
   * Note:  A `tokenId` can be staked in many programs but to claim rewards and continue the program you must unstake, claim, and then restake.
   * @param incentiveKeys An IncentiveKey or array of IncentiveKeys that `tokenId` is staked in.
   * Input an array of IncentiveKeys to claim rewards for each program.
   * @param options ClaimOptions to specify tokenId, recipient, and amount wanting to collect.
   * Note that you can only specify one amount and one recipient across the various programs if you are collecting from multiple programs at once.
   * @param stakerAddress Staker SCORE address
   * @returns
   */
  public static async collectRewards(
    poolFactoryProvider: PoolFactoryProvider,
    incentiveKeys: IncentiveKey | IncentiveKey[],
    options: ClaimOptions,
    stakerAddress: string
  ): Promise<CallData[]> {
    incentiveKeys = Array.isArray(incentiveKeys) ? incentiveKeys : [incentiveKeys]
    let calldatas: CallData[] = []

    for (let i = 0; i < incentiveKeys.length; i++) {
      // the unique program tokenId is staked in
      const incentiveKey = incentiveKeys[i]
      // unstakes and claims for the unique program
      calldatas = calldatas.concat(await this.encodeClaim(poolFactoryProvider, incentiveKey, options, stakerAddress))
      // re-stakes the position for the unique program
      calldatas.push(
        Staker.INTERFACE.encodeFunctionData('stakeToken', [
          await this._encodeIncentiveKey(poolFactoryProvider, incentiveKey),
          toHex(options.tokenId)
        ], stakerAddress)
      )
    }
    return calldatas
  }

  /**
   *
   * @param incentiveKeys A list of incentiveKeys to unstake from. Should include all incentiveKeys (unique staking programs) that `options.tokenId` is staked in.
   * @param withdrawOptions Options for producing claim calldata and withdraw calldata. Can't withdraw without unstaking all programs for `tokenId`.
   * @returns Calldata for unstaking, claiming, and withdrawing.
   */
  public static async withdrawToken(
    poolFactoryProvider: PoolFactoryProvider,
    incentiveKeys: IncentiveKey | IncentiveKey[],
    withdrawOptions: FullWithdrawOptions,
    stakerAddress: string
  ): Promise<CallData[]> {
    let calldatas: CallData[] = []

    incentiveKeys = Array.isArray(incentiveKeys) ? incentiveKeys : [incentiveKeys]

    const claimOptions = {
      tokenId: withdrawOptions.tokenId,
      recipient: withdrawOptions.recipient,
      amount: withdrawOptions.amount
    }

    for (let i = 0; i < incentiveKeys.length; i++) {
      const incentiveKey = incentiveKeys[i]
      calldatas = calldatas.concat(await this.encodeClaim(poolFactoryProvider, incentiveKey, claimOptions, stakerAddress))
    }
    const owner = validateAndParseAddress(withdrawOptions.owner)
    calldatas.push(
      Staker.INTERFACE.encodeFunctionData('withdrawToken', [
        toHex(withdrawOptions.tokenId),
        owner,
        withdrawOptions.data ? withdrawOptions.data : toHex(0)
      ], stakerAddress)
    )
    return calldatas
  }

  /**
   * @param incentiveKeys A single IncentiveKey or array of IncentiveKeys to be encoded and used in the data parameter in `safeTransferFrom`
   * @returns An IncentiveKey as a string
   */
  public static async encodeDeposit(
    poolFactoryProvider: PoolFactoryProvider,
    incentiveKeys: IncentiveKey | IncentiveKey[]
  ): Promise<string> {
    incentiveKeys = Array.isArray(incentiveKeys) ? incentiveKeys : [incentiveKeys]
    let data: [string, string, string, string, string][]

    if (incentiveKeys.length > 1) {
      const keys = []
      for (let i = 0; i < incentiveKeys.length; i++) {
        const incentiveKey = incentiveKeys[i]
        keys.push(await this._encodeIncentiveKey(poolFactoryProvider, incentiveKey))
      }
      data = keys
    } else {
      data = [await this._encodeIncentiveKey(poolFactoryProvider, incentiveKeys[0])]
    }

    // FIXME: RLP encode instead of JSON encode
    return toHexString(JSON.stringify(data))
  }

  /**
   * @param incentiveKey An `IncentiveKey` which represents a unique staking program.
   * @returns An encoded IncentiveKey to be read
   */
  private static async _encodeIncentiveKey(
    poolFactoryProvider: PoolFactoryProvider,
    incentiveKey: IncentiveKey
  ): Promise<[string, string, string, string, string]> {
    const { token0, token1, fee } = incentiveKey.pool
    const refundee = validateAndParseAddress(incentiveKey.refundee)
    return [
      incentiveKey.rewardToken.address,
      await Pool.getAddress(poolFactoryProvider, token0, token1, fee),
      toHex(incentiveKey.startTime),
      toHex(incentiveKey.endTime),
      refundee
    ]
  }
}
