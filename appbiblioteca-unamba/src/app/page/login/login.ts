import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { CardModule } from 'primeng/card';
import { ButtonModule } from 'primeng/button';
import { SelectModule } from 'primeng/select';
import { ToastModule } from 'primeng/toast';
import { InputTextModule } from 'primeng/inputtext';
import { MessageService } from 'primeng/api';
import { ApiService } from '../../service/api.service';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    CardModule,
    ButtonModule,
    SelectModule,
    ToastModule,
    InputTextModule
  ],
  templateUrl: './login.html',
  styleUrls: ['./login.css'],
  providers: [MessageService]
})
export class Login {
  private router = inject(Router);
  private messageService = inject(MessageService);
  private apiService = inject(ApiService);

  correo: string = '';
  codigo: string = '';
  selectedRole: string = 'student';

  roles = [
    { name: 'Estudiante', value: 'student' },
    { name: 'Administrador', value: 'admin' }
  ];

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

    this.apiService.login(this.correo, this.codigo, this.selectedRole).subscribe({
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

        const userRole = res.role || this.selectedRole;
        const username = res.username || `${userRole === 'admin' ? 'Administrador' : 'Estudiante'} UNAMBA`;

        localStorage.setItem('currentUser', JSON.stringify({
          username,
          role: userRole,
          correo: res.correo || this.correo,
          codigo: res.codigo || this.codigo
        }));

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
