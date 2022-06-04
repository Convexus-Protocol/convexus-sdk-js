import IconService from 'icon-sdk-js'

function uint32ToBytes (num: number): Uint8Array {
  const arr = new Uint8Array([
    (num & 0xff000000) >> 24,
    (num & 0x00ff0000) >> 16,
    (num & 0x0000ff00) >> 8,
    (num & 0x000000ff)
  ]);
  return arr;
}

function addressToBytes (address: string): Uint8Array {
  if (!IconService.IconValidator.isAddress(address)) {
    throw new Error(`Invalid address ${address}`)
  }

  const isEoa = IconService.IconValidator.isEoaAddress(address);
  const hexAddress = Uint8Array.from(Buffer.from(address.substring(2), 'hex'));

  return new Uint8Array([
    ... isEoa ? new Uint8Array([0]) : new Uint8Array([1]),
    ... hexAddress
  ])
}

function packSingle (type: string, value: any): Uint8Array {
  switch (type) {
    case "address":
      return addressToBytes(value)
    case "string":
      let utf8Encode = new TextEncoder();
      return utf8Encode.encode(value);
    case "bytes":
      return value;

    case "uint32":
      return uint32ToBytes(value)

    default:
      throw new Error(`invalid type : ${type}`)
  }
}

function concat (arrays: Array<Uint8Array>) : Uint8Array {
  let totalLength = arrays.reduce((acc, value) => acc + value.length, 0);
  let result = new Uint8Array(totalLength);

  let length = 0;
  for (let array of arrays) {
    result.set(array, length);
    length += array.length;
  }

  return result;
}

export function pack (types: ReadonlyArray<string>, values: ReadonlyArray<any>) {
  if (types.length != values.length) {
    throw new Error(`Wrong number of values; expected ${types.length}, got ${values.length}`)
  }

  const tight: Array<Uint8Array> = [];

  types.forEach(function(type, index) {
    tight.push(packSingle(type, values[index]));
  });

  return "0x" + Buffer.from(concat(tight)).toString('hex');
}
