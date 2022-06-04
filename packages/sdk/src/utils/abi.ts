export class AbiCoder {
  
  encode (arg0: string[], arg1: any): string {
    throw new Error('Method not implemented.');
  }

}

export const defaultAbiCoder: AbiCoder = new AbiCoder();