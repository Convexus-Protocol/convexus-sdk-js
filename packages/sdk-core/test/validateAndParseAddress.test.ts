import { validateAndParseAddress } from '../src/utils/validateAndParseAddress'

describe('#validateAndParseAddress', () => {
  it('returns same address', () => {
    expect(validateAndParseAddress('hx23b9aa06f3a0413c40a91591cb8d28319e05bbb9')).toEqual(
      'hx23b9aa06f3a0413c40a91591cb8d28319e05bbb9'
    )
  })

  it('returns address if spaces', () => {
    expect(validateAndParseAddress('hx23b9aa06f3a0413c40a91591cb8d28319e05bbb9  '.toLowerCase())).toEqual(
      'hx23b9aa06f3a0413c40a91591cb8d28319e05bbb9'
    )
  })

  it('throws if not valid', () => {
    expect(() => validateAndParseAddress('0x23b9aa06f3a0413c40a91591cb8d28319e05bbb9')).toThrow(
      '0x23b9aa06f3a0413c40a91591cb8d28319e05bbb9 is not a valid address.'
    )
  })
})
