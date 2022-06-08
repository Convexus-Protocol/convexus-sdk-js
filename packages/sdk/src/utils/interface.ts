import { validateAndParseAddress } from '@convexus/sdk-core'
import invariant from 'tiny-invariant'
import { toHex } from '../utils/calldata'

export class Interface {
  abi: []
  contractName: string

  public constructor (abi: any, contractName: string) {
    this.abi = abi
    this.contractName = contractName
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

      default:
        throw new Error("INVALID_PARAM_TYPE: " + inputType)
    }

    return result
  }

  public encodeFunctionData (fragment: string, values?: Array<String|number|[]|{}>): string {
    const abiObject = this.getAbiObject(fragment)
    const inputs: [] = abiObject['inputs']

    invariant(inputs.length == values?.length, "INVALID_ARGS_COUNT")
    var payload: any = {
      "to": this.contractName,
      "method": fragment,
      "params": {}
    }

    for (const index in inputs) {
      payload["params"] = Object.assign(payload["params"], this.buildParam(values[index], inputs[index]))
    }

    return payload
  }
  
  encodeTokenFallbackFunctionData (
    method: string,
    inputs: Array<{}>,
    values: Array<{}>,
  ): string {
    invariant(inputs.length == values.length, "INVALID_ARGS_COUNT")
    
    var payload: any = {
      "to": this.contractName,
      "method": method,
      "params": {}
    }

    for (const index in inputs) {
      payload["params"] = Object.assign(payload["params"], this.buildParam(values[index], inputs[index]))
    }
    
    return payload
  }
}