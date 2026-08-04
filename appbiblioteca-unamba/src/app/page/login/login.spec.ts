import { TestBed } from '@angular/core/testing';
import { Login } from './login';
import { Router } from '@angular/router';
import { ApiService } from '../../service/api.service';
import { AuthService } from '../../service/auth.service';
import { MessageService } from 'primeng/api';
import { of, throwError } from 'rxjs';
import { describe, it, expect, beforeEach, vi } from 'vitest';
import { provideHttpClient } from '@angular/common/http';

describe('Login Component', () => {
  let routerSpy: { navigate: ReturnType<typeof vi.fn> };
  let apiServiceSpy: { login: ReturnType<typeof vi.fn> };
  let authServiceSpy: { setSession: ReturnType<typeof vi.fn> };

  beforeEach(async () => {
    routerSpy = { navigate: vi.fn().mockResolvedValue(true) };
    apiServiceSpy = { login: vi.fn() };
    authServiceSpy = { setSession: vi.fn() };

    await TestBed.configureTestingModule({
      imports: [Login],
      providers: [
        provideHttpClient(),
        { provide: Router, useValue: routerSpy },
        { provide: ApiService, useValue: apiServiceSpy },
        { provide: AuthService, useValue: authServiceSpy }
      ]
    }).compileComponents();
  });

  it('should create the component', () => {
    const fixture = TestBed.createComponent(Login);
    expect(fixture.componentInstance).toBeTruthy();
  });

  it('should show warning when correo is empty', () => {
    const fixture = TestBed.createComponent(Login);
    const comp = fixture.componentInstance;
    const messageService = fixture.debugElement.injector.get(MessageService);
    const addSpy = vi.spyOn(messageService, 'add');
    comp.correo = '';
    comp.codigo = '';
    comp.ingresar();
    expect(addSpy).toHaveBeenCalledWith(
      expect.objectContaining({ severity: 'warn', summary: 'Campos requeridos' })
    );
  });

  it('should show warning when only correo is provided but codigo is empty', () => {
    const fixture = TestBed.createComponent(Login);
    const comp = fixture.componentInstance;
    const messageService = fixture.debugElement.injector.get(MessageService);
    const addSpy = vi.spyOn(messageService, 'add');
    comp.correo = 'test@unamba.edu.pe';
    comp.codigo = '   ';
    comp.ingresar();
    expect(addSpy).toHaveBeenCalledWith(
      expect.objectContaining({ severity: 'warn' })
    );
  });

  it('should call apiService.login with correct params', () => {
    apiServiceSpy.login.mockReturnValue(of({ type: 'success', role: 'student', username: 'Juan', token: 'tok' }));
    const fixture = TestBed.createComponent(Login);
    const comp = fixture.componentInstance;
    comp.correo = 'juan@unamba.edu.pe';
    comp.codigo = '2024001';
    comp.ingresar();
    expect(apiServiceSpy.login).toHaveBeenCalledWith('juan@unamba.edu.pe', '2024001', '');
  });

  it('should navigate to /student/catalog on successful student login', () => {
    apiServiceSpy.login.mockReturnValue(of({
      type: 'success', role: 'student', username: 'Juan',
      token: 'tok_123', idUser: 1, correo: 'juan@unamba.edu.pe', codigo: '2024001'
    }));
    const fixture = TestBed.createComponent(Login);
    const comp = fixture.componentInstance;
    comp.correo = 'juan@unamba.edu.pe';
    comp.codigo = '2024001';
    comp.ingresar();
    expect(authServiceSpy.setSession).toHaveBeenCalled();
    expect(routerSpy.navigate).toHaveBeenCalledWith(['/student/catalog']);
  });

  it('should navigate to /admin/home on successful admin login', () => {
    apiServiceSpy.login.mockReturnValue(of({
      type: 'success', role: 'admin', username: 'Admin UNAMBA',
      token: 'tok_adm', idUser: 2, correo: 'admin@unamba.edu.pe', codigo: '0001'
    }));
    const fixture = TestBed.createComponent(Login);
    const comp = fixture.componentInstance;
    comp.correo = 'admin@unamba.edu.pe';
    comp.codigo = '0001';
    comp.ingresar();
    expect(routerSpy.navigate).toHaveBeenCalledWith(['/admin/home']);
  });

  it('should show error message when response type is "error"', () => {
    apiServiceSpy.login.mockReturnValue(of({
      type: 'error', listMessage: ['Credenciales incorrectas']
    }));
    const fixture = TestBed.createComponent(Login);
    const comp = fixture.componentInstance;
    const messageService = fixture.debugElement.injector.get(MessageService);
    const addSpy = vi.spyOn(messageService, 'add');
    comp.correo = 'x@x.com';
    comp.codigo = '0000';
    comp.ingresar();
    expect(addSpy).toHaveBeenCalledWith(
      expect.objectContaining({ severity: 'error', summary: 'Acceso Denegado' })
    );
  });

  it('should show default error message when listMessage is empty', () => {
    apiServiceSpy.login.mockReturnValue(of({ type: 'error', listMessage: [] }));
    const fixture = TestBed.createComponent(Login);
    const comp = fixture.componentInstance;
    const messageService = fixture.debugElement.injector.get(MessageService);
    const addSpy = vi.spyOn(messageService, 'add');
    comp.correo = 'x@x.com';
    comp.codigo = '0000';
    comp.ingresar();
    expect(addSpy).toHaveBeenCalledWith(
      expect.objectContaining({ detail: 'Credenciales incorrectas' })
    );
  });

  it('should show error message when response type is "exception"', () => {
    apiServiceSpy.login.mockReturnValue(of({
      type: 'exception', listMessage: ['Error interno']
    }));
    const fixture = TestBed.createComponent(Login);
    const comp = fixture.componentInstance;
    const messageService = fixture.debugElement.injector.get(MessageService);
    const addSpy = vi.spyOn(messageService, 'add');
    comp.correo = 'x@x.com';
    comp.codigo = '0000';
    comp.ingresar();
    expect(addSpy).toHaveBeenCalledWith(
      expect.objectContaining({ severity: 'error' })
    );
  });

  it('should show error message on HTTP error with message', () => {
    apiServiceSpy.login.mockReturnValue(
      throwError(() => ({ error: { listMessage: ['Error de red'] } }))
    );
    const fixture = TestBed.createComponent(Login);
    const comp = fixture.componentInstance;
    const messageService = fixture.debugElement.injector.get(MessageService);
    const addSpy = vi.spyOn(messageService, 'add');
    comp.correo = 'x@x.com';
    comp.codigo = '0000';
    comp.ingresar();
    expect(addSpy).toHaveBeenCalledWith(
      expect.objectContaining({ severity: 'error', summary: 'Error de Autenticación' })
    );
  });

  it('should show default error message on HTTP error without message', () => {
    apiServiceSpy.login.mockReturnValue(throwError(() => ({})));
    const fixture = TestBed.createComponent(Login);
    const comp = fixture.componentInstance;
    const messageService = fixture.debugElement.injector.get(MessageService);
    const addSpy = vi.spyOn(messageService, 'add');
    comp.correo = 'x@x.com';
    comp.codigo = '0000';
    comp.ingresar();
    expect(addSpy).toHaveBeenCalledWith(
      expect.objectContaining({ severity: 'error' })
    );
  });
});
