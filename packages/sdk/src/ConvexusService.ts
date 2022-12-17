import IconService from "icon-sdk-js";
import { NonfungiblePositionManagerService } from './services/nonfungiblePositionManagerService';
import { IAddresses } from './entities/interface/IAddresses';
import { PoolReadOnlyService } from './services/poolReadOnlyService';
import { FactoryService } from './services/factoryService';
import { PoolService } from './services/poolService';
import { TokenService } from './services/TokenService';
import { PoolInitializerService } from './services/poolInitializerService';
import { QuoterService } from './services/quoterService';
import { SwapRouterService } from './services/swapRouterService';
import { StakerService } from './services/stakerService';


export default class ConvexusService {

  /**
   * Class which provides APIs of Convexus Contracts
   */

  public tokenService: TokenService;
  public factoryService: FactoryService;
  public nonfungiblePositionManagerService: NonfungiblePositionManagerService;
  public poolService: PoolService;
  public poolReadOnlyContractService: PoolReadOnlyService;
  public poolInitializerService: PoolInitializerService;
  public quoterService: QuoterService;
  public swapRouterService: SwapRouterService;
  public stakerService: StakerService;

  constructor(
    addresses: IAddresses,
    iconService: IconService,
    debugService: IconService,
    nid: number
  ) {
    this.tokenService = new TokenService(
      iconService,
      debugService,
      nid,
    )

    this.factoryService = new FactoryService(
      addresses.factoryAddress,
      iconService,
      debugService,
      nid,
    );

    this.poolService = new PoolService(
      iconService,
      debugService,
      nid,
      this.tokenService
    );

    this.poolReadOnlyContractService = new PoolReadOnlyService(
      addresses.poolReadonlyAddress,
      iconService,
      debugService,
      nid,
      addresses
    );

    this.nonfungiblePositionManagerService = new NonfungiblePositionManagerService(
      addresses.nonfungiblePositionManagerAddress,
      iconService,
      debugService,
      nid,
      this.poolReadOnlyContractService,
      this.factoryService,
      this.poolService
    );

    this.poolInitializerService = new PoolInitializerService(
      addresses.poolInitializerAddress,
      iconService,
      debugService,
      nid,
    );


    this.quoterService = new QuoterService(
      addresses.quoterAddress,
      iconService,
      debugService,
      nid,
    );

    this.swapRouterService = new SwapRouterService(
      addresses.swapRouterAddress,
      iconService,
      debugService,
      nid,
    );

    this.stakerService = new StakerService(
      addresses.stakerAddress,
      iconService,
      debugService,
      nid,
    )
  }


}
