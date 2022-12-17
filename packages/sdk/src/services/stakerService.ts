import IconService from 'icon-sdk-js';
import * as IStaker from '../artifacts/contracts/ConvexusStaker/ConvexusStaker.json';
import { Contract } from '@convexus/icon-toolkit';

export class StakerService {
  /**
   * Class which provides APIs of Staker contract
   */

  stakerContract: Contract;

  constructor(address: string, iconService: IconService, debugService: IconService, nid: number) {
    this.stakerContract = new Contract(address, IStaker, iconService, debugService, nid);
  }

}
