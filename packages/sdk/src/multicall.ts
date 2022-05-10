import IMulticall from './artifacts/contracts/interfaces/IMulticall/IMulticall.json'
import { Interface } from './utils'

export abstract class Multicall {
  public static INTERFACE: Interface = new Interface(IMulticall.abi)

  /**
   * Cannot be constructed.
   */
  private constructor() {}

  public static encodeMulticall(calldatas: string | string[]): string {
    if (!Array.isArray(calldatas)) {
      calldatas = [calldatas]
    }

    return calldatas.length === 1 ? calldatas[0] : Multicall.INTERFACE.encodeFunctionData('multicall', [calldatas])
  }
}