import { CallData } from '@convexus/icon-toolkit';

export interface IRemoveCallTxs {
  decreaseLiquidityTx: CallData,
  collectTx: CallData,
  burnTx?: CallData,
}
