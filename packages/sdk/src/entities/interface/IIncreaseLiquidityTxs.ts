import { CallData } from '@convexus/icon-toolkit';

export interface IIncreaseLiquidityTxs {
  deposit0Tx?: CallData,
  deposit1Tx?: CallData,
  increaseLiquidityTx: CallData
}
