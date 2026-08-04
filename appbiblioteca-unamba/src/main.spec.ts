import { describe, it, expect } from 'vitest';

describe('Main Entry Point', () => {
  it('should load main without bootstrapping in test environment', async () => {
    (globalThis as any).IS_TESTING_ENVIRONMENT = true;
    const main = await import('./main');
    expect(main).toBeDefined();
  }, 30000);
});
