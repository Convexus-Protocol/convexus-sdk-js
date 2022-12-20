import { CurrencyAmount, Icx, Token } from '@convexus/sdk-core';
import { Contract } from '@convexus/icon-toolkit';
import * as IIRC2 from "../artifacts/contracts/IRC2/IRC2.json";
import IconService from 'icon-sdk-js';

export class TokenService {

  /**
   * Class which provides APIs of IRC2 tokens
   */

  iconService: IconService;
  debugService: IconService;
  nid: number;


  constructor(iconService: IconService, debugService: IconService, nid: number) {
    this.iconService = iconService;
    this.debugService = debugService;
    this.nid = nid;
  }

  getIrc2Contract(tokenAddress: string): Contract {
    return new Contract(
      tokenAddress,
      IIRC2,
      this.iconService,
      this.debugService,
      this.nid,
    );
  }

  async getTokenFromAddress(tokenAddress: string): Promise<Token> {
    if (Icx.isWrappedAddress(tokenAddress)) {
      return new Icx().wrapped;
    }

    return Token.fromContract(this.getIrc2Contract(tokenAddress));
  }

  async balanceOf(
    token: Token,
    address: string,
  ): Promise<CurrencyAmount<Token>> {
    if (!Icx.isWrappedAddress(token.address)) {
      const contract = new Contract(
        token.address,
        IIRC2,
        this.iconService,
        this.debugService,
        this.nid,
      );

      const balance = await contract["balanceOf"](address);
      return CurrencyAmount.fromRawAmount(token, balance);
    } else {
      const balance = await this.iconService.getBalance(address).execute();
      return CurrencyAmount.fromRawAmount(
        new Icx().wrapped,
        balance.toString(10),
      );
    }
  }
}
