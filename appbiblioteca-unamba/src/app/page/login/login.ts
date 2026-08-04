import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { CardModule } from 'primeng/card';
import { ButtonModule } from 'primeng/button';
import { ToastModule } from 'primeng/toast';
import { InputTextModule } from 'primeng/inputtext';
import { MessageService } from 'primeng/api';
import { ApiService } from '../../service/api.service';
import { AuthService } from '../../service/auth.service';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    CardModule,
    ButtonModule,
    ToastModule,
    InputTextModule
  ],
  templateUrl: './login.html',
  styleUrls: ['./login.css'],
  providers: [MessageService]
})
export class Login {
  private readonly router = inject(Router);
  private readonly messageService = inject(MessageService);
  private readonly apiService = inject(ApiService);
  private readonly authService = inject(AuthService);

  correo: string = '';
  codigo: string = '';

  ingresar(): void {
    if (!this.correo.trim() || !this.codigo.trim()) {
      this.messageService.add({
        severity: 'warn',
        summary: 'Campos requeridos',
        detail: 'Por favor ingresa tu correo institucional y código universitario.',
        life: 3000
      });
      return;
    }

    this.apiService.login(this.correo, this.codigo, '').subscribe({
      next: (res) => {
        if (res.type === 'error' || res.type === 'exception') {
          const msg = res.listMessage && res.listMessage.length > 0 ? res.listMessage[0] : 'Credenciales incorrectas';
          this.messageService.add({
            severity: 'error',
            summary: 'Acceso Denegado',
            detail: msg,
            life: 3500
          });
          return;
        }

        const userRole = res.role || 'student';
        const username = res.username || `${userRole === 'admin' ? 'Administrador' : 'Estudiante'} UNAMBA`;

        this.authService.setSession({
          idUser: res.idUser || 0,
          username: username,
          role: userRole as 'admin' | 'student',
          correo: res.correo || this.correo,
          codigo: res.codigo || this.codigo
        }, res.token || '');

        if (userRole === 'admin') {
          this.router.navigate(['/admin/home']);
        } else {
          this.router.navigate(['/student/catalog']);
        }
      },
      error: (err) => {
        const errorMsg = err.error?.listMessage?.[0] || 'Credenciales incorrectas o el usuario no existe en el sistema.';
        this.messageService.add({
          severity: 'error',
          summary: 'Error de Autenticación',
          detail: errorMsg,
          life: 4000
        });
      }
    });
  }
}
