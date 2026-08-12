export class Clock {
  static currentTimeMillis(): bigint {
    return BigInt(Date.now());
  }

  static collectGarbage(): void {
    // Browsers and Python runtimes manage garbage collection themselves.
  }

  static sleep(_milliseconds: bigint): void {
    // The browser game loop is driven externally and must never block.
  }

  static yield(): void {
    // Kept as a non-blocking compatibility point for the original audio loop.
  }
}
