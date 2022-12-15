import IconService from 'icon-sdk-js'

/**
 * Validates an address and returns the parsed version of that address
 * @param address the address
 */
export function validateAndParseAddress(address: string): string {
  if (!IconService.IconValidator.isAddress(address.trim().toLowerCase())) {
    throw new Error(`${address} is not a valid address.`)
  }

  return address.trim().toLowerCase()
}

/**
 * Validates a score address and returns the parsed version of that address
 * @param address the address
 */
export function validateAndParseScoreAddress(address: string): string {
  if (!IconService.IconValidator.isScoreAddress(address.trim().toLowerCase())) {
    throw new Error(`${address} is not a valid SCORE address.`)
  }

  return address.trim().toLowerCase()
}
