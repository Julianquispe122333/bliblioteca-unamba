import { Injectable, inject, NgZone } from '@angular/core';
import { Router } from '@angular/router';
import { MessageService } from 'primeng/api';

export interface SessionUser {
  idUser: number;
  username: string;
  role: 'admin' | 'student';
  correo: string;
  codigo: string;
}

/**
 * AuthService — Biblioteca UNAMBA
 *
 * Gestiona la sesión JWT con expiración estricta de 60 segundos.
 * - Guarda el token y datos del usuario en sessionStorage.
 * - Inicia un timer de 60s en el cliente: si el usuario no hace requests,
 *   igual se expulsa cuando el token expira (doble protección).
 * - clearSession() limpia TODO y redirige a /login.
 */
@Injectable({
  providedIn: 'root'
})
export class AuthService {
  private router = inject(Router);
  private messageService = inject(MessageService);
  private ngZone = inject(NgZone);

  private readonly TOKEN_KEY = 'jwt_token';
  private readonly USER_KEY = 'currentUser';

  // Duración exacta del token en ms (debe coincidir con el backend: 60s)
  private readonly TOKEN_DURATION_MS = 60_000;

  private sessionTimer: ReturnType<typeof setTimeout> | null = null;

  // ─────────────────────────────────────────────
  // Guardar sesión tras login exitoso
  // ─────────────────────────────────────────────

  setSession(user: SessionUser, token: string): void {
    sessionStorage.setItem(this.TOKEN_KEY, token);
    sessionStorage.setItem(this.USER_KEY, JSON.stringify(user));

    // También en localStorage para compatibilidad con app.ts (navbar)
    localStorage.setItem(this.USER_KEY, JSON.stringify(user));

    this.startSessionTimer();
  }

  // ─────────────────────────────────────────────
  // Timer cliente — expulsa aunque no haya requests
  // ─────────────────────────────────────────────

  resetSessionTimer(): void {
    // Si la sesión está activa, reiniciamos el temporizador para extender el minuto
    if (this.isLoggedIn()) {
      this.startSessionTimer();
    }
  }

  private startSessionTimer(): void {
    this.clearSessionTimer();

    // Correr fuera de la zona Angular para no triggerar change detection innecesaria
    this.ngZone.runOutsideAngular(() => {
      this.sessionTimer = setTimeout(() => {
        // Volver a la zona Angular para la navegación/UI
        this.ngZone.run(() => {
          this.expireSession();
        });
      }, this.TOKEN_DURATION_MS);
    });
  }

  private clearSessionTimer(): void {
    if (this.sessionTimer !== null) {
      clearTimeout(this.sessionTimer);
      this.sessionTimer = null;
    }
  }

  /**
   * Llamado por el timer o por el interceptor cuando recibe 401.
   * Limpia TODO y redirige a /login con notificación.
   */
  expireSession(): void {
    this.clearSession();
    this.messageService.add({
      severity: 'warn',
      summary: 'Sesión expirada',
      detail: 'Tu sesión ha expirado por inactividad. Por favor, inicia sesión de nuevo.',
      life: 5000
    });
    this.router.navigate(['/login']);
  }

  // ─────────────────────────────────────────────
  // Cerrar sesión manual (botón logout)
  // ─────────────────────────────────────────────

  logout(): void {
    this.clearSession();
    this.router.navigate(['/login']);
  }

  // ─────────────────────────────────────────────
  // Limpiar todo el estado de sesión
  // ─────────────────────────────────────────────

  clearSession(): void {
    this.clearSessionTimer();
    sessionStorage.removeItem(this.TOKEN_KEY);
    sessionStorage.removeItem(this.USER_KEY);
    localStorage.removeItem(this.USER_KEY);
  }

  // ─────────────────────────────────────────────
  // Getters
  // ─────────────────────────────────────────────

  getToken(): string | null {
    return sessionStorage.getItem(this.TOKEN_KEY);
  }

  getCurrentUser(): SessionUser | null {
    const userStr = sessionStorage.getItem(this.USER_KEY);
    if (!userStr) return null;
    try {
      return JSON.parse(userStr) as SessionUser;
    } catch {
      return null;
    }
  }

  isLoggedIn(): boolean {
    return !!this.getToken();
  }
}
