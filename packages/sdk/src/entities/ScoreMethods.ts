export class ScoreMethods {
  /**
   * Convexus Factory SCORE
   */
  public static POOLS = "pools"; // Get a deployed pools list item
  public static POOLS_SIZE = "poolsSize"; // Get the deployed pools list size
  public static GET_POOL = "getPool"; // Get a deployed pool address from its parameters

  /**
   * Convexus Pool SCORE
   */
  public static LIQUIDITY = "liquidity"; // Get pools liquidity
  public static SLOT0 = "slot0" // get pools slot0

  // POOL IMMUTABLES
  public static FACTORY = "factory"; // Get pool factory
  public static TOKEN0 = "token0"; // Get first token of pool pair
  public static TOKEN1 = "token1"; // Get second token of pool pair
  public static FEE = "fee"; // Get pools fee
  public static TICK_SPACING = "tickSpacing"; // Get pools tick spacing
  public static MAX_LIQUIDITY_PER_TICK = "maxLiquidityPerTick"; // Get max pool liquidity per tick



  /**
   * Convexus PoolInitializer SCORE
   */
  public static CREATE_AND_INIT_POOL = "createAndInitializePoolIfNecessary"; // create pool and init if necessary

  /**
   * Convexus NFT Position Manager SCORE
   */
  public static MINT = "mint"; // mint NFT liquidity position
  public static DEPOSITED = "deposited"; // Returns the amount of tokens previously deposited for a given user and token
  public static WITHDRAW = "withdraw"; // withdraw deposited token


  /**
   * IRC2 interface methods
   */
  public static TRANSFER = "transfer";
  public static BALANCE_OF = "balanceOf";
  public static AVAILABLE_BALANCE_OF = "availableBalanceOf";

  /**
   * ICX interface methods
   */
  public static DEPOSIT_ICX = "depositIcx"
}
