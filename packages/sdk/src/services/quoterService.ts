import IconService from 'icon-sdk-js';
import * as IQuoter from '../artifacts/contracts/Quoter/Quoter.json';
import { Contract } from '@convexus/icon-toolkit';

export class QuoterService {
  /**
   * Class which provides APIs of Quoter contract
   */

  poolInitializerContract: Contract;

  constructor(address: string, iconService: IconService, debugService: IconService, nid: number) {
    this.poolInitializerContract = new Contract(address, IQuoter, iconService, debugService, nid);
  }
}
