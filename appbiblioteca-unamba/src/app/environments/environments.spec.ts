import { describe, it, expect } from 'vitest';
import { environment as devEnv } from './environments.development';
import { environment as prodEnv } from './environments.prod';

describe('Environments', () => {
  it('should define development environment details', () => {
    expect(devEnv).toBeDefined();
    expect(devEnv.production).toBe(false);
    expect(devEnv.urlBase).toContain('bliblioteca-unamba-production-3c76.up.railway.app');
  });

  it('should define production environment details', () => {
    expect(prodEnv).toBeDefined();
    expect(prodEnv.production).toBe(true);
    expect(prodEnv.urlBase).toContain('bliblioteca-unamba-production-3c76.up.railway.app');
  });
});
