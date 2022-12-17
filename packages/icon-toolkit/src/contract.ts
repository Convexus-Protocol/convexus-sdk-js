import IconService from "icon-sdk-js";
const { IconConverter } = IconService;
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

  public static getAbi (iconService: IconService, address: string): Promise<any> {
    return iconService.getScoreApi(address).execute().then(result => {
      return result.getList()
    })
  }

  /**
   * @description Build and execute call array and return promised result
   * @param to - Address
   * @param method - Contract method
   * @param output_transform - Transform function for result
   * @param args
   */
  public buildAndExecuteCallArray (to: string, method: string, output_transform: OutputTransform, ...args: any): Promise<any> {
    const data = this.interface.encodeFunctionData(method, args, to)
    return this.buildAndExecuteCall(data).then(result => {
      if (output_transform) {
        result = output_transform(result);
      }
      return result;
    })
  }

  /**
   * @description Build and execute call transaction and return Promise of result
   * @param calldata - Call data parameters to be used in call
   */
  public buildAndExecuteCall (calldata: CallData): Promise<any> {
    const txObj = new IconService.IconBuilder.CallBuilder()
      .to(calldata['to'])
      .method(calldata['method'])
      .params(calldata['params'])
      .build()

    return this.iconService.call(txObj).execute()
  }

  /**
   * @description Build call transaction and return raw tx object
   * @param calldata - Call data parameters to be used in call
   */
  public buildCall (calldata: CallData): any {
    return new IconService.IconBuilder.CallBuilder()
      .to(calldata['to'])
      .method(calldata['method'])
      .params(calldata['params'])
      .build()
  }

  /**
   * @description Build and execute Icon send array (payable)
   * @param to - Address
   * @param method - Contract method
   * @param output_transform - Transform function for result
   * @param wallet - Wallet used to sign the transaction
   * @param args
   */
  public buildAndExecuteSendArray (to: string, method: string, output_transform: OutputTransform, wallet: Wallet, ...args: any): Promise<any> {
    return this.buildAndExecuteSendArrayPayable(to, method, "0", wallet, args).then(result => {
      if (output_transform) {
        result = output_transform(result);
      }
      return result;
    })
  }

  /**
   * @description Build and execute Icon send array (payable)
   * @param to - Address
   * @param method - Contract method
   * @param icxAmount - Amount of ICX to send as payable
   * @param wallet - Wallet used to sign the transaction
   * @param args
   */
  public buildAndExecuteSendArrayPayable (to: string, method: string, icxAmount: string, wallet: Wallet, ...args: any): Promise<any> {
    const data = this.interface.encodeFunctionDataPayable(icxAmount, method, args, to)
    return this.buildAndExecuteSend(wallet, data)
  }

  /**
   * @description Build Icon send transaction for given calldata
   * @param from - Address
   * @param calldata - Transaction data payload
   */
  public buildSend (from: string, calldata: CallData): Promise<any> {
    const icxValue = 'value' in calldata ? calldata["value"] : "0";
    return this.buildSendPayable(from, calldata['to'], calldata['method'], icxValue, calldata['params']);
  }

  /**
   * @description
   * @param wallet - Wallet used to sign the transaction
   * @param calldata - Transaction data payload
   * @param waitForResult - Boolean flag indicating whether to wait for tx result or not
   */
  public buildAndExecuteSend (wallet: Wallet, calldata: CallData, waitForResult?: boolean): Promise<any> {
    const icxValue = 'value' in calldata ? calldata["value"] : "0";
    return this.buildAndExecuteSendPayable(calldata['to'], calldata['method'], icxValue, wallet, calldata['params'], waitForResult);
  }

  /**
   * @description Build send transaction (payable option) object.
   *              **NOTE** step limit must be set on the returned object
   */
  public buildSendPayable (from: string, to: string, method: string, icxAmount: string, params: any): any {
    const txObjBuilder = new IconService.IconBuilder.CallTransactionBuilder()
      .method(method)
      .params(params)
      .from(from)
      .to(to ?? this.address)
      .nid(IconService.IconConverter.toBigNumber(this.nid))
      .nonce(IconService.IconConverter.toBigNumber('1'))
      .version(IconService.IconConverter.toBigNumber('3'))
      .timestamp((new Date()).getTime() * 1000)

    if (icxAmount) {
      txObjBuilder.value(IconService.IconConverter.toBigNumber(icxAmount))
    }

    return txObjBuilder.build();
  }

  /**
   * @description Build and execute send transactions (payable option)
   */
  public async buildAndExecuteSendPayable (to: string, method: string, icxAmount: string, wallet: Wallet, params: any, waitForResult?: boolean): Promise<any> {
    // build tx
    const tx = this.buildSendPayable(wallet.getAddress(), to, method, icxAmount, params);

    // convert tx to raw transaction
    const estimateTx = IconConverter.toRawTransaction(tx);

    // make sure there is no stepLimit already in place
    delete estimateTx.stepLimit;

    // estimate steps
    var steps
    try {
      steps = await this.debugService.estimateStep(tx).execute().catch(() => {
        return 400_000_000
      })
    } catch (e) {
      // Default steps
      steps = 400_000_000
    }

    // add some margin
    steps = JSBI.add(JSBI.BigInt(steps), JSBI.BigInt(100_000));

    tx.stepLimit = steps;
    const signedTx = new IconService.SignedTransaction(tx, wallet);
    const txhash = await this.iconService.sendTransaction(signedTx).execute();

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
    this.interface = new Interface(abi);

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
            const buildCallArray = this.buildAndExecuteCallArray.bind(this, address, name, output_transform)
            defineReadOnly(this, name, buildCallArray)
            // write methods
          } else {
            const buildSendArray = this.buildAndExecuteSendArray.bind(this, address, name, output_transform)
            defineReadOnly(this, name, buildSendArray)
          }
        } break;
      }
    }
  }
}
