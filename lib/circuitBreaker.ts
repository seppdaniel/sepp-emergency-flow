type CircuitState = 'closed' | 'open' | 'half-open';

interface CircuitBreakerOptions {
  failureThreshold: number;
  recoveryTimeMs: number;
  successThreshold: number;
}

export class CircuitBreaker {
  private state: CircuitState = 'closed';
  private failures = 0;
  private successes = 0;
  private lastFailureTime = 0;
  private readonly options: CircuitBreakerOptions;

  constructor(options: CircuitBreakerOptions) {
    this.options = options;
  }

  async execute<T>(fn: () => Promise<T>): Promise<T> {
    if (this.state === 'open') {
      const elapsed = Date.now() - this.lastFailureTime;
      if (elapsed >= this.options.recoveryTimeMs) {
        this.state = 'half-open';
        this.successes = 0;
      } else {
        throw new Error('Circuit breaker is OPEN — backend unavailable');
      }
    }

    try {
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
    if (this.state === 'half-open') {
      this.successes++;
      if (this.successes >= this.options.successThreshold) {
        this.state = 'closed';
      }
    }
  }

  private onFailure(): void {
    this.failures++;
    this.lastFailureTime = Date.now();
    if (
      this.state === 'half-open' ||
      this.failures >= this.options.failureThreshold
    ) {
      this.state = 'open';
    }
  }

  getState(): CircuitState {
    return this.state;
  }
}

export const decisionBreaker = new CircuitBreaker({
  failureThreshold: 3,
  recoveryTimeMs: 15000,
  successThreshold: 2,
});
