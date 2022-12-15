import { CallData } from '@convexus/icon-toolkit';

export interface IClaimTxs {

  /**
   * @description To claim rewards, must unstake and then claim.
   */

  unstakeTokenTx: CallData,
  claimRewardTx: CallData
}
