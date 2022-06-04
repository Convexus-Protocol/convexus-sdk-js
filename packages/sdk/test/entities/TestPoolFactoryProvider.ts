import { Token } from "@convexus/sdk-core";
import { FeeAmount } from "../../src/constants";
import { PoolFactoryProvider } from "../../src/entities/factoryProvider";

export class TestPoolFactoryProvider implements PoolFactoryProvider {

  // Generate fake contract addresses from a simple checksum 
  // algorithm based on the token addresses
  checksum (s: String)
  {
    var chk = 1103515245;
    var len = s.length;
    for (var i = 0; i < len; i++) {
        chk += (s.charCodeAt(i) * (i + 1));
    }

    const n = (chk & 0xffffffff).toString(16);
    return "00000000".substring(n.length) + n;
  }

  getPool (tokenA: Token, tokenB: Token, fee: FeeAmount): Promise<string> {
    return new Promise((resolve, reject) => { 
      if (!tokenA.sortsBefore(tokenB)) {
        const tokenC = tokenA
        tokenA = tokenB
        tokenB = tokenC
      }

      // need 40 characters for contracts: 8 * 5 characters will be enough, so 5 checksums calls
      const seed = tokenA.address.replace("cx", "") + tokenB.address.replace("cx", "")
      // get 5 chunks
      const chunks = seed.match(/.{1,16}/g)

      if (chunks !== null && chunks.length == 5) {
        return resolve("cx" 
          + this.checksum(fee.toString(10) + chunks[0] + seed)
          + this.checksum(fee.toString(10) + chunks[1] + seed)
          + this.checksum(fee.toString(10) + chunks[2] + seed)
          + this.checksum(fee.toString(10) + chunks[3] + seed)
          + this.checksum(fee.toString(10) + chunks[4] + seed))
      }

      return reject("Invalid chunks")
    });
  }
}
  