import { describe, it, expect } from 'vitest';
import { routes } from './app.routes';

describe('App Routes', () => {
  it('should have routes defined', () => {
    expect(routes).toBeDefined();
    expect(routes.length).toBeGreaterThan(0);
    expect(routes.some(r => r.path === 'login')).toBe(true);
  });
});
