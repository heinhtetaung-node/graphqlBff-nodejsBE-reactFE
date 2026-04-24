const STATES = { CLOSED: "CLOSED", OPEN: "OPEN", HALF_OPEN: "HALF_OPEN" };

class CircuitBreaker {
  constructor(name, options = {}) {
    this.name = name;
    this.failureThreshold = options.failureThreshold || 5;
    this.resetTimeout = options.resetTimeout || 30000; // 30s
    this.halfOpenMax = options.halfOpenMax || 1;

    this.state = STATES.CLOSED;
    this.failures = 0;
    this.lastFailureTime = null;
    this.halfOpenAttempts = 0;
  }

  async exec(fn) {
    if (this.state === STATES.OPEN) {
      if (Date.now() - this.lastFailureTime >= this.resetTimeout) {
        this.state = STATES.HALF_OPEN;
        this.halfOpenAttempts = 0;
      } else {
        throw new Error(
          `Circuit breaker OPEN for ${this.name} — service unavailable`,
        );
      }
    }

    if (
      this.state === STATES.HALF_OPEN &&
      this.halfOpenAttempts >= this.halfOpenMax
    ) {
      throw new Error(
        `Circuit breaker HALF_OPEN for ${this.name} — too many probes`,
      );
    }

    try {
      if (this.state === STATES.HALF_OPEN) this.halfOpenAttempts++;
      const result = await fn();
      this.onSuccess();
      return result;
    } catch (err) {
      this.onFailure();
      throw err;
    }
  }

  onSuccess() {
    this.failures = 0;
    this.state = STATES.CLOSED;
  }

  onFailure() {
    this.failures++;
    this.lastFailureTime = Date.now();
    if (this.failures >= this.failureThreshold) {
      this.state = STATES.OPEN;
    }
  }

  getState() {
    return { name: this.name, state: this.state, failures: this.failures };
  }
}

function wrapClientWithCircuitBreaker(client, serviceName, options) {
  const breaker = new CircuitBreaker(serviceName, options);
  const wrapper = {};

  for (const method of Object.keys(client)) {
    wrapper[method] = (request) => {
      return breaker.exec(() => client[method](request));
    };
  }

  wrapper.__breaker = breaker;
  return wrapper;
}

module.exports = { CircuitBreaker, wrapClientWithCircuitBreaker };
