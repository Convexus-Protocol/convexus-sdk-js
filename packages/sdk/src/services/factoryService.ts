import { Contract } from '@convexus/icon-toolkit';
import IconService from 'icon-sdk-js';
import * as IConvexusFactory from '../artifacts/contracts/ConvexusFactory/ConvexusFactory.json';
import { Address } from '../entities/types';
import { PoolFactoryProvider } from '../entities';
import { Token } from '@convexus/sdk-core';
import { FeeAmount } from '../constants';
import JSBI from 'jsbi';

export class FactoryService implements PoolFactoryProvider {
  /**
   * Class which provides APIs of Factory contract
   */

  factoryContract: Contract;

  constructor(address: Address, iconService: IconService, debugService: IconService, nid: number) {
    this.factoryContract = new Contract(address, IConvexusFactory, iconService, debugService, nid);
  }

  poolFactoryProvider(): PoolFactoryProvider {
    return this;
  }

  getPool(tokenA: Token, tokenB: Token, fee: FeeAmount): Promise<string> {
      return this.getPoolAddress(tokenA.address, tokenB.address, fee);
    }

  /**
   * @description Get the deployed pools list size
   * @return number - Pools size, i.e. number of pools
   */
  async getPoolsSize(): Promise<JSBI> {
    return this.factoryContract["poolsSize"]();
  }


  /**
   * @description Get pool contract address from given tokens and fee
   * @param tokenA - 1st token address
   * @param tokenB - 2nd token address
   * @param fee - Pool fee
   */
  getPoolAddress(tokenA: Address, tokenB: Address, fee: number): Promise<Address> {
    return this.factoryContract['getPool'](tokenA, tokenB, fee);
  }

  /**
   * @description Get pool contract address from given pool index. Index < Pools size!
   * @param index - the index of the item to read from the deployed pools list
   * @return Address - Address of pool contract
   */
  getPoolAddressFromIndex(index: number): Promise<Address> {
    return this.factoryContract['pools'](index);
  }

}
