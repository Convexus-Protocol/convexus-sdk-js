import IconService from 'icon-sdk-js'

/**
 * Validates an address and returns the parsed version of that address
 * @param address the address
 */
export function validateAndParseAddress(address: string): string {
  if (!IconService.IconValidator.isAddress(address.trim())) {
    throw new Error(`${address} is not a valid address.`)
  }

  return address.trim()
}