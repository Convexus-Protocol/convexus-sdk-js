import { validateAndParseAddress} from './validateAndParseAddress';
import invariant from 'tiny-invariant'
import { toHex } from './calldata'
import IconService from "icon-sdk-js";
import { BigintIsh } from './constants';
import JSBI from 'jsbi';

export type CallData = {[key: string] : any}

export class Interface {
  abi: []

  public constructor (abi: any) {
    this.abi = abi
  }

  public getAbiObject (name: string) {
    for (const index in this.abi) {
      const obj = this.abi[index]
      if (obj['name'] === name) {
        return obj
      }
    }

    throw new Error("INVALID_ABI_NAME: " + name)
  }

  public buildParam (value: any, input: any) {

    const inputType: string = input['type']
    const result: any = {}

    switch (inputType) {
      case "struct": {
        invariant (value.length === input['fields'].length, "INVALID_STRUCT_COUNT")
        result[input['name']] = {}
        for (var i in value) {
          result[input['name']] = Object.assign(result[input['name']], this.buildParam(value[i], input['fields'][i]))
        }
      } break

      case "Address": {
        const address = validateAndParseAddress(value)
        result[input['name']] = address
      } break

      case "int": {
        result[input['name']] = toHex(value)
      } break

      case "str": {
        result[input['name']] = value
      } break

      case "bytes": {
        result[input['name']] = value
      } break

      case "bool": {
        result[input['name']] = toHex(value ? 1 : 0)
      } break

      default:
        throw new Error("INVALID_PARAM_TYPE: " + inputType)
    }

    return result
  }

  public encodeFunctionDataPayable (
    icxAmount: BigintIsh,
    method: string,
    values: Array<String|number|[]|{}>,
    to: string
  ): CallData {
    const abiObject = this.getAbiObject(method)
    const inputs: [] = abiObject['inputs']

    // make sure provided "to" string is a valid Icon address
    to = validateAndParseAddress(to);

    if (values === undefined) {
      values = []
    }

    invariant(inputs.length == values?.length, `INVALID_ARGS_COUNT (expected ${inputs.length}, got ${values?.length})`)
    var payload: any = {
      "to": to,
      "method": method
    }

    if (icxAmount && JSBI.greaterThan(JSBI.BigInt(icxAmount), JSBI.BigInt(0))) {
      payload["value"] = toHex(icxAmount)
    }

    if (inputs.length > 0) {
      payload["params"] = {}
      for (const index in inputs) {
        payload["params"] = Object.assign(payload["params"], this.buildParam(values[index], inputs[index]))
      }
    }

    return payload
  }

  public encodeFunctionData (
    method: string,
    values: Array<String|number|[]|{}>,
    to: string
  ): CallData {
    return this.encodeFunctionDataPayable("0", method, values, to);
  }

  public encodeTokenFallbackFunctionData (
    token: string,
    amount: BigintIsh,
    method: string,
    inputs: Array<{}>,
    values: Array<{}>,
    to: string
  ): CallData {
    invariant(inputs.length == values.length, `INVALID_ARGS_COUNT (expected ${inputs.length}, got ${values?.length})`)

    // make sure provided "to" string is a valid Icon address
    to = validateAndParseAddress(to);

    var tokenFallbackPayload: any = {
      "method": method,
      "params": {}
    }

    if (inputs.length > 0) {
      tokenFallbackPayload["params"] = {}
      for (const index in inputs) {
        tokenFallbackPayload["params"] = Object.assign(tokenFallbackPayload["params"], this.buildParam(values[index], inputs[index]))
      }
    }

    var payload: any = {
      "to": token,
      "method": "transfer",
      "params": {
        "_to": to,
        "_value": toHex(amount),
        "_data": IconService.IconConverter.toHex(JSON.stringify(tokenFallbackPayload))
      }
    }

    return payload
  }
}
