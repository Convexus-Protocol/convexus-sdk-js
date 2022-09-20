import IconService from "icon-sdk-js";
import Wallet from "icon-sdk-js/build/Wallet";
import JSBI from "jsbi";
import { CallData, Interface } from "./interface";

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
  private debugService: IconService;
  private interface: Interface;
  public address: string;
  private nid: number;

  public buildCallArray (method: string, ...args: any): Promise<any> {
    const data = this.interface.encodeFunctionData(method, args)
    return this.buildCall(method, data)
  }

  public buildCall (method: string, data: any): Promise<any> {
    const txObj = new IconService.IconBuilder.CallBuilder()
      .to(this.address)
      .method(method)
      .params(data['params'])
      .build()

    return this.iconService.call(txObj).execute()
  }

  public buildSendArray (method: string, wallet: Wallet, ...args: any): Promise<any> {
    return this.buildSendArrayPayable(method, "0", wallet, args)
  }

  public buildSendArrayPayable (method: string, icxAmount: string, wallet: Wallet, ...args: any): Promise<any> {
    const data = this.interface.encodeFunctionDataPayable(icxAmount, method, args)
    return this.buildSend(wallet, data)
  }

  public buildSend (wallet: Wallet, calldata: CallData): Promise<any> {
    const icxValue = 'value' in calldata ? calldata["value"] : "0"
    return this.buildSendPayable(calldata['to'], calldata['method'], icxValue, wallet, calldata['params'])
  }

  public async buildSendPayable (to: string, method: string, icxAmount: string, wallet: Wallet, params: any): Promise<any> {
    const txObjBuilder = new IconService.IconBuilder.CallTransactionBuilder()
      .method(method)
      .params(params)
      .from(wallet.getAddress())
      .to(to ?? this.address)
      .nid(IconService.IconConverter.toBigNumber(this.nid))
      .nonce(IconService.IconConverter.toBigNumber('1'))
      .version(IconService.IconConverter.toBigNumber('3'))
      .timestamp((new Date()).getTime() * 1000)

    if (icxAmount) {
      txObjBuilder.value(IconService.IconConverter.toBigNumber(icxAmount))
    }
    
    const txObjEstimate = txObjBuilder.build()

    // estimate steps
    var steps
    try {
      steps = await this.debugService.estimateStep(txObjEstimate).execute().catch(e => {
        return 400_000_000
      })
    } catch (e) {
      // Default steps
      steps = 400_000_000
    }

    // add some margin
    steps = JSBI.add(JSBI.BigInt(steps), JSBI.BigInt(100_000))

    const txObj = txObjBuilder.stepLimit(steps.toString()).build()
    const signedTx = new IconService.SignedTransaction(txObj, wallet)
    return this.iconService.sendTransaction(signedTx).execute()
  }

  public constructor (
    address: string, 
    abi: Record<string, string>, 
    iconService: IconService, 
    debugService: IconService, 
    nid: number
  ) {
    this.iconService = iconService;
    this.debugService = debugService;
    this.nid = nid;
    this.address = address;
    this.interface = new Interface(abi, address);

    for (const index in this.interface.abi) {
      const obj = this.interface.abi[index];
      switch (obj['type']) {
        case 'function': {
          const name = obj['name']
          // readonly methods
          if ('readonly' in obj && parseInt(obj['readonly'], 16) === 1) {
            const buildCallArray = this.buildCallArray.bind(this, name)
            defineReadOnly(this, name, buildCallArray)
          } else {
            const buildSendArray = this.buildSendArray.bind(this, name)
            defineReadOnly(this, name, buildSendArray)
          }
        } break;
      }
    }
  }
}