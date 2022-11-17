import { CallData } from '@convexus/icon-toolkit';

export interface IAddLiquidityTxs {
  deposit0Tx?: CallData,
  deposit1Tx?: CallData,
  mintTx: CallData
}
