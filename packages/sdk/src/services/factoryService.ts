import { Contract } from '@convexus/icon-toolkit';
import { FeeAmount } from '../constants';
import { Token } from '@convexus/sdk-core';
import IconService from 'icon-sdk-js';
import * as IConvexusFactory from '../artifacts/contracts/ConvexusFactory/ConvexusFactory.json';

export class FactoryService {
  /**
   * Class which provides APIs of Factory contract
   */

  factoryContract: Contract;

  constructor(address: string, iconService: IconService, debugService: IconService, nid: number) {
    this.factoryContract = new Contract(address, IConvexusFactory, iconService, debugService, nid);
  }

  async getPoolAddress(
    tokenA: string,
    tokenB: string,
    fee: number,
  ) {
    return this.factoryContract['getPool'](tokenA, tokenB, fee);
  }

  getPool (tokenA: Token, tokenB: Token, fee: FeeAmount): Promise<string> {
    return this.factoryContract['getPool'](tokenA.address, tokenB.address, fee)
  }
}
