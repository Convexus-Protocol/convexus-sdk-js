import IconService from 'icon-sdk-js';
import * as IQuoter from '../artifacts/contracts/Quoter/Quoter.json';
import { CallData, Contract } from '@convexus/icon-toolkit';

export class QuoterService {
  /**
   * Class which provides APIs of Quoter contract
   */

  quoterContract: Contract;

  constructor(address: string, iconService: IconService, debugService: IconService, nid: number) {
    this.quoterContract = new Contract(address, IQuoter, iconService, debugService, nid);
  }

  buildAndExecuteCall(callData: CallData) {
    return this.quoterContract.buildAndExecuteCall(callData);
  }
}
