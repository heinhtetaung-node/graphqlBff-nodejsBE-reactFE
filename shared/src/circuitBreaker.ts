type CircuitState = "CLOSED" | "OPEN" | "HALF_OPEN";

interface CircuitBreakerOptions {
  failureThreshold?: number;
  resetTimeout?: number;
  halfOpenMax?: number;
}

interface CircuitBreakerState {
  name: string;
  state: CircuitState;
  failures: number;
}

export class CircuitBreaker {
  private readonly name: string;
  private readonly failureThreshold: number;
  private readonly resetTimeout: number;
  private readonly halfOpenMax: number;

  private state: CircuitState = "CLOSED";
  private failures = 0;
  private lastFailureTime: number | null = null;
  private halfOpenAttempts = 0;

  constructor(name: string, options: CircuitBreakerOptions = {}) {
    this.name = name;
    this.failureThreshold = options.failureThreshold ?? 5;
    this.resetTimeout = options.resetTimeout ?? 30_000;
    this.halfOpenMax = options.halfOpenMax ?? 1;
  }

  async exec<T>(fn: () => Promise<T>): Promise<T> {
    if (this.state === "OPEN") {
      if (Date.now() - (this.lastFailureTime ?? 0) >= this.resetTimeout) {
        this.state = "HALF_OPEN";
        this.halfOpenAttempts = 0;
      } else {
        throw new Error(
          `Circuit breaker OPEN for ${this.name} — service unavailable`,
        );
      }
    }

    if (
      this.state === "HALF_OPEN" &&
      this.halfOpenAttempts >= this.halfOpenMax
    ) {
      throw new Error(
        `Circuit breaker HALF_OPEN for ${this.name} — too many probes`,
      );
    }

    try {
      if (this.state === "HALF_OPEN") this.halfOpenAttempts++;
      const result = await fn();
      this.onSuccess();
      return result;
    } catch (err) {
      this.onFailure();
      throw err;
    }
  }

  private onSuccess(): void {
    this.failures = 0;
    this.state = "CLOSED";
  }

  private onFailure(): void {
    this.failures++;
    this.lastFailureTime = Date.now();
    if (this.failures >= this.failureThreshold) {
      this.state = "OPEN";
    }
  }

  getState(): CircuitBreakerState {
    return { name: this.name, state: this.state, failures: this.failures };
  }
}

export function wrapClientWithCircuitBreaker<
  T extends Record<string, (request: unknown) => Promise<unknown>>,
>(
  client: T,
  serviceName: string,
  options?: CircuitBreakerOptions,
): T & { __breaker: CircuitBreaker } {
  const breaker = new CircuitBreaker(serviceName, options);
  const wrapper = {} as Record<string, unknown>;

  for (const method of Object.keys(client)) {
    wrapper[method] = (request: unknown) =>
      breaker.exec(() => client[method](request));
  }

  wrapper.__breaker = breaker;
  return wrapper as T & { __breaker: CircuitBreaker };
}
