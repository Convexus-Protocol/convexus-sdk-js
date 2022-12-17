import IconService from 'icon-sdk-js';
import * as IPoolInitializer from '../artifacts/contracts/PoolInitializer/PoolInitializer.json';
import { Contract } from '@convexus/icon-toolkit';

export class PoolInitializerService {
  /**
   * Class which provides APIs of Pool Initializer contract
   */

  poolInitializerContract: Contract;

  constructor(address: string, iconService: IconService, debugService: IconService, nid: number) {
    this.poolInitializerContract = new Contract(address, IPoolInitializer, iconService, debugService, nid);
  }

}
