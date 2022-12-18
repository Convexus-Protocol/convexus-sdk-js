import { Contract } from '@convexus/icon-toolkit';
import IconService from 'icon-sdk-js';
import * as IConvexusFactory from '../artifacts/contracts/ConvexusFactory/ConvexusFactory.json';
import { Address } from '../entities/types';
import { ScoreMethods } from '../entities/ScoreMethods';

export class FactoryService {
  /**
   * Class which provides APIs of Factory contract
   */

  factoryContract: Contract;

  constructor(address: string, iconService: IconService, debugService: IconService, nid: number) {
    this.factoryContract = new Contract(address, IConvexusFactory, iconService, debugService, nid);
  }

  /**
   * @description Get the deployed pools list size
   * @return number - Pools size, i.e. number of pools
   */
  public async getPoolsSize(): Promise<number> {
    return parseInt(this.factoryContract[ScoreMethods.POOLS_SIZE](), 16);
  }

  /**
   * @description Get pool contract address from given tokens and fee
   * @param tokenA - 1st token address
   * @param tokenB - 2nd token address
   * @param fee - Pool fee
   */
  async getPoolAddress(tokenA: string, tokenB: string, fee: number): Promise<Address> {
    return this.factoryContract['getPool'](tokenA, tokenB, fee);
  }

  /**
   * @description Get pool contract address from given pool index. Index < Pools size!
   * @param index - the index of the item to read from the deployed pools list
   * @return Address - Address of pool contract
   */
  async getPoolAddressFromIndex(index: number): Promise<Address> {
    return this.factoryContract['pools'](index);
  }

}
