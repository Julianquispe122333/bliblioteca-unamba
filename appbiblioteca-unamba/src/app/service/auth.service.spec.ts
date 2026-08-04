import { TestBed, fakeAsync, tick } from '@angular/core/testing';
import { Router } from '@angular/router';
import { MessageService } from 'primeng/api';
import { AuthService, SessionUser } from './auth.service';
import { describe, it, expect, beforeEach, vi } from 'vitest';

describe('AuthService', () => {
  let service: AuthService;
  let routerSpy: { navigate: ReturnType<typeof vi.fn> };
  let messageServiceSpy: { add: ReturnType<typeof vi.fn> };

  const mockUser: SessionUser = {
    idUser: 1,
    username: 'TestUser',
    role: 'student',
    correo: 'test@unamba.edu.pe',
    codigo: '2024001'
  };

  beforeEach(() => {
    routerSpy = { navigate: vi.fn().mockResolvedValue(true) };
    messageServiceSpy = { add: vi.fn() };

    sessionStorage.clear();
    localStorage.clear();

    TestBed.configureTestingModule({
      providers: [
        AuthService,
        { provide: Router, useValue: routerSpy },
        { provide: MessageService, useValue: messageServiceSpy }
      ]
    });
    service = TestBed.inject(AuthService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  it('should return null token when not logged in', () => {
    expect(service.getToken()).toBeNull();
  });

  it('should return false for isLoggedIn when no token', () => {
    expect(service.isLoggedIn()).toBe(false);
  });

  it('should return null for getCurrentUser when no session', () => {
    expect(service.getCurrentUser()).toBeNull();
  });

  it('should set session and store token', () => {
    service.setSession(mockUser, 'token_abc_123');
    expect(service.getToken()).toBe('token_abc_123');
  });

  it('should set session and store user in sessionStorage', () => {
    service.setSession(mockUser, 'tok123');
    const stored = service.getCurrentUser();
    expect(stored).not.toBeNull();
    expect(stored!.username).toBe('TestUser');
    expect(stored!.role).toBe('student');
  });

  it('should set session and also store user in localStorage', () => {
    service.setSession(mockUser, 'tok123');
    const raw = localStorage.getItem('currentUser');
    expect(raw).not.toBeNull();
    const parsed = JSON.parse(raw!);
    expect(parsed.correo).toBe('test@unamba.edu.pe');
  });

  it('should return true for isLoggedIn after setSession', () => {
    service.setSession(mockUser, 'tok_valid');
    expect(service.isLoggedIn()).toBe(true);
  });

  it('should clear session on clearSession()', () => {
    service.setSession(mockUser, 'tok_to_clear');
    service.clearSession();
    expect(service.getToken()).toBeNull();
    expect(service.getCurrentUser()).toBeNull();
    expect(localStorage.getItem('currentUser')).toBeNull();
  });

  it('should return false for isLoggedIn after clearSession', () => {
    service.setSession(mockUser, 'tok_before_clear');
    service.clearSession();
    expect(service.isLoggedIn()).toBe(false);
  });

  it('should call router.navigate(["/login"]) on logout', () => {
    service.logout();
    expect(routerSpy.navigate).toHaveBeenCalledWith(['/login']);
  });

  it('should clear session on logout', () => {
    service.setSession(mockUser, 'tok_for_logout');
    service.logout();
    expect(service.getToken()).toBeNull();
  });

  it('should call expireSession and show message', () => {
    service.expireSession();
    expect(messageServiceSpy.add).toHaveBeenCalledWith(
      expect.objectContaining({ severity: 'warn', summary: 'Sesión expirada' })
    );
    expect(routerSpy.navigate).toHaveBeenCalledWith(['/login']);
  });

  it('should not reset timer if not logged in (resetSessionTimer)', () => {
    // Without session, resetSessionTimer should be a no-op
    expect(() => service.resetSessionTimer()).not.toThrow();
  });

  it('should reset timer if logged in (resetSessionTimer)', () => {
    service.setSession(mockUser, 'tok_timer');
    expect(() => service.resetSessionTimer()).not.toThrow();
  });

  it('should return null for getCurrentUser when sessionStorage has invalid JSON', () => {
    sessionStorage.setItem('currentUser', 'NOT_VALID_JSON{{{');
    expect(service.getCurrentUser()).toBeNull();
  });
});
