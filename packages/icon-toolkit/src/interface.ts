import { validateAndParseAddress } from './validateAndParseAddress'
import invariant from 'tiny-invariant'
import { toHex } from './calldata'

export type CallData = {[key: string] : any}

export class Interface {
  abi: []
  contractAddress: string

  public constructor (abi: any, contractAddress: string) {
    this.abi = abi
    this.contractAddress = contractAddress
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

  public encodeFunctionData (
    method: string, 
    values?: Array<String|number|[]|{}>
  ): CallData {
    const abiObject = this.getAbiObject(method)
    const inputs: [] = abiObject['inputs']

    if (values === undefined) {
      values = []
    }

    invariant(inputs.length == values?.length, `INVALID_ARGS_COUNT (expected ${inputs.length}, got ${values?.length})`)
    var payload: any = {
      "to": this.contractAddress,
      "method": method,
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
  ): CallData {
    invariant(inputs.length == values.length, `INVALID_ARGS_COUNT (expected ${inputs.length}, got ${values?.length})`)
    
    var payload: any = {
      "to": this.contractAddress,
      "method": method,
      "params": {}
    }

    for (const index in inputs) {
      payload["params"] = Object.assign(payload["params"], this.buildParam(values[index], inputs[index]))
    }
    
    return payload
  }
}