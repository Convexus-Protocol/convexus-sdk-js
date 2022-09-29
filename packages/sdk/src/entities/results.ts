export class NextInitializedTickWithinOneWordResult {
  public readonly tickNext: number
  public readonly initialized: boolean

  public constructor (
    tickNext: number,
    initialized: boolean
  ) {
    this.tickNext = tickNext
    this.initialized = initialized
  }
  
  public static fromCall (data: any): NextInitializedTickWithinOneWordResult {
    return new NextInitializedTickWithinOneWordResult (
      parseInt(data['tickNext'], 16),
      Boolean(parseInt(data['initialized'], 16)),
    )
  }
}