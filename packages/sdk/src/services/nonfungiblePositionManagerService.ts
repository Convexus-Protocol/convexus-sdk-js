import * as INonfungiblePositionManager
  from '../artifacts/contracts/NonfungiblePositionManager/NonfungiblePositionManager.json';
import IconService from 'icon-sdk-js';
import { IPositionInfo } from '../entities/interface/IPositionInfo';
import { CurrencyAmount } from '@convexus/sdk-core';
import JSBI from 'jsbi';
import { Position } from '../entities';
import { Contract } from '@convexus/icon-toolkit';
import { PoolReadOnlyService } from './poolReadOnlyService';
import { FactoryService } from './factoryService';
import { PoolService } from './poolService';
import { IAddLiquidityTxs } from '../entities/interface/IAddLiquidityTxs';
import { AddLiquidityOptions, NonfungiblePositionManager } from '../nonfungiblePositionManager';
import { Address } from '../entities/types';

export class NonfungiblePositionManagerService {

  /**
   * Class which provides APIs of NonfungiblePositionManager contract
   */

  nonfungiblePositionManagerContract: Contract;
  poolReadOnlyContractService : PoolReadOnlyService;
  factoryService: FactoryService;
  poolService: PoolService;

  constructor(
    address: string,
    iconService: IconService,
    debugService: IconService,
    nid: number,
    poolReadOnlyContractService: PoolReadOnlyService,
    factoryService: FactoryService,
    poolService: PoolService
  ) {
    this.poolService = poolService;
    this.factoryService = factoryService;
    this.poolReadOnlyContractService = poolReadOnlyContractService;
    this.nonfungiblePositionManagerContract = new Contract(address, INonfungiblePositionManager, iconService, debugService, nid);
  }

  buildAddLiquidityTxs(position: Position, options: AddLiquidityOptions)
    : IAddLiquidityTxs {
    return NonfungiblePositionManager.buildAddLiquidityTxs(position, options, this.nonfungiblePositionManagerContract.address);
  }

  async getBalanceOf(user: string): Promise<JSBI> {
    return await this.nonfungiblePositionManagerContract["balanceOf"](user);
  }

  async getPositionInfos(user: Address): Promise<IPositionInfo[]> {
    const tokenIdPositions = await this.getOwnedTokenIdPositions(user);

    return await Promise.all(
      tokenIdPositions.map(async (tokenIdPosition) => {
        const owedFeesNft = await this.poolReadOnlyContractService.getOwedFeesNFT(tokenIdPosition.tokenId);
        return {
          tokenId: tokenIdPosition.tokenId,
          position: tokenIdPosition.position,
          owed0: CurrencyAmount.fromRawAmount(
            tokenIdPosition.position.pool.token0,
            JSBI.BigInt(owedFeesNft['amount0']),
          ),
          owed1: CurrencyAmount.fromRawAmount(
            tokenIdPosition.position.pool.token1,
            JSBI.BigInt(owedFeesNft['amount1']),
          ),
        }
      }),
    )
  }

  async getOwnedTokenIdPositions(user: Address): Promise<{ tokenId: number, position: Position}[]> {
    const tokenIds = await this.getAllTokensOfOwner(user);

    const positions = await Promise.all(tokenIds.map(async (tokenId) => await this.getPosition(tokenId)));

    // Associate tokenId:position
    return positions.map((position, index) => {
      return {
        tokenId: tokenIds[index],
        position: position,
      };
    });
  }

  async getAllTokensOfOwner(user: Address): Promise<number[]> {
    const count = JSBI.toNumber(await this.getBalanceOf(user));
    const indexes = [...Array(count).keys()]; // range(count)

    return Promise.all(
      indexes.map(async (index) => JSBI.toNumber(await this.getTokenOfOwnerByIndex(user, index))
      ),
    );
  }

  getTokenOfOwnerByIndex(user: Address, index: number): Promise<JSBI> {
    return this.nonfungiblePositionManagerContract["tokenOfOwnerByIndex"](user, index);
  }

  async getPosition(tokenId: number): Promise<Position> {
    const position = await this.nonfungiblePositionManagerContract["positions"](tokenId);

    const fee = parseInt(position.fee, 16);
    const poolAddress = await this.factoryService.getPoolAddress(position.token0, position.token1, fee);
    const pool = await this.poolService.getPoolFromAddress(poolAddress);

    return new Position({
      pool: pool,
      liquidity: position.liquidity,
      tickLower: parseInt(position.tickLower, 16),
      tickUpper: parseInt(position.tickUpper, 16),
    });
  }
}
