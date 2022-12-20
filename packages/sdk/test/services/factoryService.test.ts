import IconService from 'icon-sdk-js';
import ConvexusService from '../../src';

jest.setTimeout(30_000)

describe('FactoryService', () => {
  const iconService = new IconService(new IconService.HttpProvider("https://lisbon.net.solidwallet.io/api/v3"));
  const debugService = new IconService(new IconService.HttpProvider("https://lisbon.net.solidwallet.io/api/v3d"));
  const NID = 2;

  const convexusService = new ConvexusService({
    factoryAddress: "cx0763c3b98532e7cf91dfb7623f73f4dfcaeed9b6",
    nonfungiblePositionManagerAddress: "cx87c9d4c8e94031ebd178e5ffa556bdf1390bfd11",
    poolReadonlyAddress: "cx94e27f8985787821ee3f5ff0d9ca8004cdce911a",
    poolInitializerAddress: "cx18e3ef0e6a431023cee24c9458bcdbd0bc21bb0b",
    quoterAddress: "cxf1edbb5ce83dd8a902e64adb7fc073b20632a6c6",
    swapRouterAddress: "cx5aef04ae6e642363568664ecc8e20c6c8af54c9d",
    stakerAddress: "cx5aef04ae6e642363568664ecc8e20c6c8af54c9d",
  }, iconService, debugService, NID);

    describe('Get pools size', () => {
    it.skip('succeeds', async () => {
      // Pool initializer needs a Pool instance
      const poolsSize = parseInt((await convexusService.factoryService.getPoolsSize()).toString());
      console.log("poolsSize = ", poolsSize)

      expect(poolsSize).toStrictEqual(9)
    })
  })
})
