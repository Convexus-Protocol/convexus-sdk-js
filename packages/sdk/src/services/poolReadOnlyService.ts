import { Contract } from '@convexus/icon-toolkit';
import IconService from 'icon-sdk-js';
import * as IPoolReadOnly from "../artifacts/contracts/PoolReadOnly/PoolReadOnly.json";
import { IAddresses } from '../entities/interface/IAddresses';


export class PoolReadOnlyService {

  /**
   * Class which provides APIs of PoolReadOnly contract
   */

  poolReadonlyContract: Contract;
  addresses: IAddresses

  constructor(address: string, iconService: IconService, debugService: IconService, nid: number, addresses: IAddresses) {
    this.poolReadonlyContract = new Contract(address, IPoolReadOnly, iconService, debugService, nid);
    this.addresses = addresses;
  }

  async getOwedFeesNFT(tokenId: number): Promise<any> {
    return await this.poolReadonlyContract["getOwedFeesNFT"](
      this.addresses.nonfungiblePositionManagerAddress,
      this.addresses.factoryAddress,
      tokenId
    );
  }
}
