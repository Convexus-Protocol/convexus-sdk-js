import IconService from 'icon-sdk-js';
import * as ISwapRouter from '../artifacts/contracts/SwapRouter/SwapRouter.json';
import { Contract } from '@convexus/icon-toolkit';

export class SwapRouterService {
  /**
   * Class which provides APIs of Swap Router contract
   */

  swapRouterContract: Contract;

  constructor(address: string, iconService: IconService, debugService: IconService, nid: number) {
    this.swapRouterContract = new Contract(address, ISwapRouter, iconService, debugService, nid);
  }
}
