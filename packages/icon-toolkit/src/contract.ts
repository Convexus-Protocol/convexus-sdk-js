import IconService from "icon-sdk-js";
import Wallet from "icon-sdk-js/build/Wallet";
import { Interface } from "./interface";

type ContractFunction<T = any> = (...args: Array<any>) => Promise<T>;

function defineReadOnly<T, K extends keyof T>(object: T, name: K, value: any): void {
  Object.defineProperty(object, name, {
      enumerable: true,
      value: value,
      writable: false,
  });
}

export class Contract {
  readonly [ key: string ]: ContractFunction | any;
  private iconService: IconService;
  private interface: Interface;
  private poolAddress: string;
  private nid: number;

  public buildCall (method: string, ...args: any): Promise<any> {
    const data = this.interface.encodeFunctionData(method, args)

    const txObj = new IconService.IconBuilder.CallBuilder()
      .to(this.poolAddress)
      .method(data['method'])
      .params(data['params'])
      .build()

    return this.iconService.call(txObj).execute()
  }

  public buildSend (method: string, wallet: Wallet, ...args: any): Promise<any> {
    const data = this.interface.encodeFunctionData(method, args)

    const txObj = new IconService.IconBuilder.CallTransactionBuilder()
      .method(method)
      .params(data['params'])
      .from(wallet.getAddress())
      .to(this.poolAddress)
      .stepLimit(IconService.IconConverter.toBigNumber('2000000'))
      .nid(IconService.IconConverter.toBigNumber(this.nid))
      .nonce(IconService.IconConverter.toBigNumber('1'))
      .version(IconService.IconConverter.toBigNumber('3'))
      .timestamp((new Date()).getTime() * 1000)
      .build()

    const signedTx = new IconService.SignedTransaction(txObj, wallet)
    return this.iconService.sendTransaction(signedTx).execute()
  }

  public constructor (poolAddress: string, abi: Record<string, string>, iconService: IconService, nid: number) {
    this.iconService = iconService;
    this.nid = nid;
    this.poolAddress = poolAddress;
    this.interface = new Interface(abi, poolAddress);

    for (const index in this.interface.abi) {
      const obj = this.interface.abi[index];
      switch (obj['type']) {
        case 'function': {
          const name = obj['name']
          // readonly methods
          if ('readonly' in obj && parseInt(obj['readonly'], 16) === 1) {
            const buildCall = this.buildCall.bind(this, name)
            defineReadOnly(this, name, buildCall)
          } else {
            const buildSend = this.buildSend.bind(this, name)
            defineReadOnly(this, name, buildSend)
          }
        } break;
      }
    }
  }
}