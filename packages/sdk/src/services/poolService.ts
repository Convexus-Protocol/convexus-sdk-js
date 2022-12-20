import { Contract } from '@convexus/icon-toolkit';
import IconService from 'icon-sdk-js';
import * as IPool from '../artifacts/contracts/ConvexusPool/ConvexusPool.json';
import { Pool } from '../entities';
import { Token } from '@convexus/sdk-core';
import { TokenService } from './TokenService';
import JSBI from 'jsbi';

export class PoolService {

  /**
   * Class which provides APIs of Pool contract
   */

  iconService: IconService;
  debugService: IconService;
  nid: number;
  tokenService: TokenService;

  constructor(iconService: IconService, debugService: IconService, nid: number, tokenService: TokenService) {
    this.iconService = iconService;
    this.debugService = debugService;
    this.nid = nid;
    this.tokenService = tokenService;
  }

  getPoolContract(poolAddress: string) {
    return new Contract(
      poolAddress,
      IPool,
      this.iconService,
      this.debugService,
      this.nid,
    );
  }

  async getPoolFromAddress(poolAddress: string): Promise<Pool> {
    const poolContract = this.getPoolContract(poolAddress);
    const [poolImmutables, poolState] = await Promise.all([
      this.getPoolImmutables(poolContract),
      this.getPoolState(poolContract),
    ]);

    const token0: Token = await this.tokenService.getTokenFromAddress(poolImmutables.token0);
    const token1: Token = await this.tokenService.getTokenFromAddress(poolImmutables.token1);

    return new Pool(
      token0,
      token1,
      poolImmutables.fee,
      poolState.sqrtPriceX96.toString(),
      poolState.liquidity.toString(),
      poolState.tick,
    );
  }

  async getPoolImmutables(poolContract: Contract) {
    const [factory, token0, token1, fee, tickSpacing, maxLiquidityPerTick] =
      await Promise.all([
        poolContract['factory'](),
        poolContract['token0'](),
        poolContract['token1'](),
        poolContract['fee'](),
        poolContract['tickSpacing'](),
        poolContract['maxLiquidityPerTick'](),
      ]);

    const immutables = {
      factory,
      token0,
      token1,
      fee: JSBI.toNumber(fee),
      tickSpacing: tickSpacing,
      maxLiquidityPerTick,
    };

    return immutables;
  }

  async getPoolState(poolContract: Contract) {
    const [liquidity, slot0] = await Promise.all([
      poolContract['liquidity'](),
      poolContract['slot0'](),
    ]);

    return {
      liquidity,
      sqrtPriceX96: slot0.sqrtPriceX96,
      tick: parseInt(slot0.tick, 16),
      observationIndex: slot0.observationIndex,
      observationCardinality: slot0.observationCardinality,
      observationCardinalityNext: slot0.observationCardinalityNext,
      feeProtocol: slot0.feeProtocol,
      unlocked: slot0.unlocked,
    };
  }

}
