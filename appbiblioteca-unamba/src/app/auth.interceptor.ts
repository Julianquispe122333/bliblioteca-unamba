import { inject } from '@angular/core';
import { HttpInterceptorFn, HttpErrorResponse, HttpResponse } from '@angular/common/http';
import { catchError, throwError, tap } from 'rxjs';
import { AuthService } from './service/auth.service';

/**
 * authInterceptor — Biblioteca UNAMBA
 *
 * Interceptor HTTP funcional (Angular 17+ standalone).
 *
 * 1. Agrega el header "Authorization: Bearer <token>" a toda petición saliente.
 * 2. Escucha respuestas del servidor:
 *    - Si la respuesta es exitosa y trae un nuevo token en "Authorization", actualiza la sesión (renovación por actividad).
 *    - Si recibe HTTP 401 → llama a AuthService.expireSession():
 *      limpia sessionStorage/localStorage, redirige a /login y muestra toast.
 */
export const authInterceptor: HttpInterceptorFn = (req, next) => {
  const authService = inject(AuthService);
  const token = authService.getToken();

  // Clonar la petición con el header Authorization si hay token disponible
  const authReq = token
    ? req.clone({
        setHeaders: {
          Authorization: `Bearer ${token}`
        }
      })
    : req;

  // Si hay actividad de red exitosa, restablecemos el temporizador de sesión local
  authService.resetSessionTimer();

  return next(authReq).pipe(
    tap(event => {
      if (event instanceof HttpResponse) {
        const newAuthHeader = event.headers.get('Authorization');
        if (newAuthHeader && newAuthHeader.startsWith('Bearer ')) {
          const newToken = newAuthHeader.substring(7);
          const currentUser = authService.getCurrentUser();
          if (currentUser) {
            // Actualiza el token en sessionStorage y refresca el timer a 1 min entero
            authService.setSession(currentUser, newToken);
          }
        }
      }
    }),
    catchError((error: HttpErrorResponse) => {
      if (error.status === 401) {
        // Token expirado o inválido → cerrar sesión inmediatamente
        authService.expireSession();
      }
      return throwError(() => error);
    })
  );
};
