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

  async getBalanceOf(user: string): Promise<number> {
    return parseInt(await this.nonfungiblePositionManagerContract["balanceOf"](user));
  }

  async getPositionInfos(user: string): Promise<IPositionInfo[]> {
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

  async getOwnedTokenIdPositions(user: string): Promise<{ tokenId: number, position: Position}[]> {
    const tokenIds = await this.getAllTokensOfOwner(user);

    const res = Promise.all(
      tokenIds.map(async (tokenId) => await this.getPosition(tokenId)),
    ).then((positions) => {
      // Associate tokenId:position
      return positions.map((position, index) => {
        return {
          tokenId: tokenIds[index],
          position: position,
        };
      });
    });

    return res;
  }

  async getAllTokensOfOwner(user: string): Promise<number[]> {
    const count = await this.getBalanceOf(user);
    const indexes = [...Array(count).keys()]; // range(count)

    return Promise.all(
      indexes.map(async (index) =>
        parseInt(
          await this.nonfungiblePositionManagerContract["tokenOfOwnerByIndex"](
            user,
            index,
          ),
        ),
      ),
    );
  }

  async getPosition(tokenId: number): Promise<Position> {
    const position = await this.nonfungiblePositionManagerContract["positions"](tokenId);

    const fee = parseInt(position.fee);
    const poolAddress = await this.factoryService.getPoolAddress(position.token0.address, position.token1.address, fee);
    const pool = await this.poolService.getPoolFromAddress(poolAddress);

    return new Position({
      pool: pool,
      liquidity: position.liquidity,
      tickLower: parseInt(position.tickLower, 16),
      tickUpper: parseInt(position.tickUpper, 16),
    });
  }
}
