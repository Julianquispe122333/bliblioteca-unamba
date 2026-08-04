import { describe, it, expect } from 'vitest';
import { appConfig } from './app.config';

describe('App Config', () => {
  it('should have providers configured', () => {
    expect(appConfig).toBeDefined();
    expect(appConfig.providers).toBeDefined();
    expect(appConfig.providers.length).toBeGreaterThan(0);
  });
});
