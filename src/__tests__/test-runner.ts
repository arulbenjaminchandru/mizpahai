/**
 * Lightweight test runner helpers replacing external test frameworks
 * for zero-dependency local and CI execution.
 */
export function describe(name: string, fn: () => void) {
  fn();
}

export function it(name: string, fn: () => void) {
  fn();
}

export function expect(actual: any) {
  return {
    toBe(expected: any) {
      if (actual !== expected) {
        throw new Error(`Assertion failed: expected ${JSON.stringify(expected)} but got ${JSON.stringify(actual)}`);
      }
    },
    toBeNull() {
      if (actual !== null) {
        throw new Error(`Assertion failed: expected null but got ${JSON.stringify(actual)}`);
      }
    },
  };
}

