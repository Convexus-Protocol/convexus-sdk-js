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

function parseBigInt (s: string): JSBI {
  if (s.startsWith('-0x')) {
      return JSBI.unaryMinus(JSBI.BigInt(s.substring(1)));
  } else {
      return JSBI.BigInt(s);
  }
};

type OutputTransform = ((x: string) => JSBI) | ((x: string) => Uint8Array) | null

export class Contract {
  readonly [ key: string ]: ContractFunction | any;
  public iconService: IconService;
  public debugService: IconService;
  public interface: Interface;
  public address: string;
  public nid: number;

  public buildCallArray (method: string, output_transform: OutputTransform, ...args: any): Promise<any> {
    const data = this.interface.encodeFunctionData(method, args)
    return this.buildCall(data).then(result => {
      if (output_transform) {
        result = output_transform(result);
      }
      return result;
    })
  }

  public buildCall (calldata: CallData): Promise<any> {
    const txObj = new IconService.IconBuilder.CallBuilder()
      .to(calldata['to'])
      .method(calldata['method'])
      .params(calldata['params'])
      .build()

    return this.iconService.call(txObj).execute()
  }

  public buildSendArray (method: string, output_transform: OutputTransform, wallet: Wallet, ...args: any): Promise<any> {
    return this.buildSendArrayPayable(method, "0", wallet, args).then(result => {
      if (output_transform) {
        result = output_transform(result);
      }
      return result;
    })
  }

  public buildSendArrayPayable (method: string, icxAmount: string, wallet: Wallet, ...args: any): Promise<any> {
    const data = this.interface.encodeFunctionDataPayable(icxAmount, method, args)
    return this.buildSend(wallet, data)
  }

  public buildSend (wallet: Wallet, calldata: CallData, waitForResult?: boolean): Promise<any> {
    const icxValue = 'value' in calldata ? calldata["value"] : "0"
    return this.buildSendPayable(calldata['to'], calldata['method'], icxValue, wallet, calldata['params'], waitForResult)
  }

  public async buildSendPayable (to: string, method: string, icxAmount: string, wallet: Wallet, params: any, waitForResult?: boolean): Promise<any> {
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
      steps = await this.debugService.estimateStep(txObjEstimate).execute().catch(() => {
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
    const txhash = await this.iconService.sendTransaction(signedTx).execute()

    if (waitForResult) {
      await this.iconService.waitTransactionResult(txhash)
    }

    return txhash
  }

  public constructor (
    address: string, 
    abi: any, 
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
          let output_transform = null
          if ('outputs' in obj) {
            const outputs: [] = obj['outputs'];
            if (outputs.length > 0) {
              const output_type = obj['outputs'][0]['type']
              switch (output_type) {
                case "int":
                  output_transform = (x: string) => parseBigInt(x);
                break;

                case "bytes":
                  output_transform = (x: string) => Uint8Array.from(Buffer.from(x.substring(2), 'hex'));
                break;
              }
            }
          }

          // readonly methods
          if ('readonly' in obj && parseInt(obj['readonly'], 16) === 1) {
            const buildCallArray = this.buildCallArray.bind(this, name, output_transform)
            defineReadOnly(this, name, buildCallArray)
            // write methods
          } else {
            const buildSendArray = this.buildSendArray.bind(this, name, output_transform)
            defineReadOnly(this, name, buildSendArray)
          }
        } break;
      }
    }
  }
}