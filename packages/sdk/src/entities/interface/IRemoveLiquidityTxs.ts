import { CallData } from '@convexus/icon-toolkit';

export interface IRemoveLiquidityTxs {
  decreaseLiquidityTx: CallData,
  collectTx: CallData,
  burnTx?: CallData,
}
