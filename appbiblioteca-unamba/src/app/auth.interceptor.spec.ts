import { TestBed } from '@angular/core/testing';
import {
  HttpRequest,
  HttpResponse,
  HttpErrorResponse,
  HttpHandlerFn,
  HttpEvent,
  HttpHeaders
} from '@angular/common/http';
import { Router } from '@angular/router';
import { MessageService } from 'primeng/api';
import { AuthService } from './service/auth.service';
import { authInterceptor } from './auth.interceptor';
import { Observable, of, throwError } from 'rxjs';
import { describe, it, expect, beforeEach, vi } from 'vitest';

describe('authInterceptor', () => {
  let authService: AuthService;
  let routerSpy: { navigate: ReturnType<typeof vi.fn> };
  let messageServiceSpy: { add: ReturnType<typeof vi.fn> };

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

    authService = TestBed.inject(AuthService);
  });

  function runInterceptor(
    req: HttpRequest<unknown>,
    nextFn: HttpHandlerFn
  ): Observable<HttpEvent<unknown>> {
    return TestBed.runInInjectionContext(() => authInterceptor(req, nextFn));
  }

  it('should pass request without Authorization header when no token', () => {
    return new Promise<void>((resolve) => {
      const req = new HttpRequest('GET', '/api/test');
      const next: HttpHandlerFn = (r) => {
        expect(r.headers.has('Authorization')).toBe(false);
        return of(new HttpResponse({ status: 200 }));
      };
      runInterceptor(req, next).subscribe({ complete: () => resolve() });
    });
  });

  it('should add Authorization header when token exists', () => {
    return new Promise<void>((resolve) => {
      authService.setSession(
        { idUser: 1, username: 'U', role: 'student', correo: 'a@b.com', codigo: '123' },
        'fake_token'
      );
      const req = new HttpRequest('GET', '/api/test');
      const next: HttpHandlerFn = (r) => {
        expect(r.headers.get('Authorization')).toBe('Bearer fake_token');
        return of(new HttpResponse({ status: 200 }));
      };
      runInterceptor(req, next).subscribe({ complete: () => resolve() });
    });
  });

  it('should update session token when response has Authorization header', () => {
    return new Promise<void>((resolve) => {
      authService.setSession(
        { idUser: 1, username: 'U', role: 'admin', correo: 'a@b.com', codigo: '123' },
        'old_token'
      );
      const req = new HttpRequest('GET', '/api/test');
      const headers = new HttpHeaders({ Authorization: 'Bearer new_token_refreshed' });
      const next: HttpHandlerFn = () =>
        of(new HttpResponse({ status: 200, headers }));

      runInterceptor(req, next).subscribe({
        complete: () => {
          expect(authService.getToken()).toBe('new_token_refreshed');
          resolve();
        }
      });
    });
  });

  it('should call expireSession on 401 error', () => {
    return new Promise<void>((resolve) => {
      const req = new HttpRequest('GET', '/api/protected');
      const error = new HttpErrorResponse({ status: 401, url: '/api/protected' });
      const next: HttpHandlerFn = () => throwError(() => error);

      runInterceptor(req, next).subscribe({
        error: () => {
          expect(messageServiceSpy.add).toHaveBeenCalledWith(
            expect.objectContaining({ severity: 'warn' })
          );
          expect(routerSpy.navigate).toHaveBeenCalledWith(['/login']);
          resolve();
        }
      });
    });
  });

  it('should re-throw non-401 errors', () => {
    return new Promise<void>((resolve) => {
      const req = new HttpRequest('GET', '/api/data');
      const error = new HttpErrorResponse({ status: 500 });
      const next: HttpHandlerFn = () => throwError(() => error);

      runInterceptor(req, next).subscribe({
        error: (err: HttpErrorResponse) => {
          expect(err.status).toBe(500);
          resolve();
        }
      });
    });
  });

  it('should NOT update session when response has no Authorization header', () => {
    return new Promise<void>((resolve) => {
      authService.setSession(
        { idUser: 1, username: 'U', role: 'student', correo: 'a@b.com', codigo: '123' },
        'stable_token'
      );
      const req = new HttpRequest('GET', '/api/test');
      const next: HttpHandlerFn = () => of(new HttpResponse({ status: 200 }));

      runInterceptor(req, next).subscribe({
        complete: () => {
          expect(authService.getToken()).toBe('stable_token');
          resolve();
        }
      });
    });
  });
});
