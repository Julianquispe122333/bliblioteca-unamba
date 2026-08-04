import { TestBed } from '@angular/core/testing';
import { App } from './app';
import { Router, NavigationEnd } from '@angular/router';
import { MessageService } from 'primeng/api';
import { Subject } from 'rxjs';
import { describe, it, expect, beforeEach, vi } from 'vitest';
import { provideHttpClient } from '@angular/common/http';

describe('App', () => {
  let routerEventSubject: Subject<NavigationEnd>;
  let routerSpy: {
    url: string;
    navigate: ReturnType<typeof vi.fn>;
    events: Subject<NavigationEnd>;
  };

  beforeEach(async () => {
    routerEventSubject = new Subject<NavigationEnd>();
    routerSpy = {
      url: '/login',
      navigate: vi.fn().mockResolvedValue(true),
      events: routerEventSubject
    };
    localStorage.clear();

    await TestBed.configureTestingModule({
      imports: [App],
      providers: [
        provideHttpClient(),
        { provide: Router, useValue: routerSpy },
        MessageService
      ]
    }).compileComponents();
  });

  it('should create the app', () => {
    const fixture = TestBed.createComponent(App);
    const app = fixture.componentInstance;
    expect(app).toBeTruthy();
  });

  it('should initialize isLoginPage as true on /login', () => {
    const fixture = TestBed.createComponent(App);
    const app = fixture.componentInstance;
    fixture.detectChanges();
    expect(app.isLoginPage).toBe(true);
  });

  it('checkRoute() should set isLoginPage=true for /login URL', () => {
    const fixture = TestBed.createComponent(App);
    const app = fixture.componentInstance;
    app.checkRoute('/login');
    expect(app.isLoginPage).toBe(true);
  });

  it('checkRoute() should set isLoginPage=true for root URL', () => {
    const fixture = TestBed.createComponent(App);
    const app = fixture.componentInstance;
    app.checkRoute('/');
    expect(app.isLoginPage).toBe(true);
  });

  it('checkRoute() should set isLoginPage=true for empty URL', () => {
    const fixture = TestBed.createComponent(App);
    const app = fixture.componentInstance;
    app.checkRoute('');
    expect(app.isLoginPage).toBe(true);
  });

  it('checkRoute() should redirect to login if no user in localStorage', () => {
    const fixture = TestBed.createComponent(App);
    const app = fixture.componentInstance;
    localStorage.clear();
    app.checkRoute('/admin/home');
    expect(routerSpy.navigate).toHaveBeenCalledWith(['/login']);
  });

  it('checkRoute() should build student menu when role is student', () => {
    const fixture = TestBed.createComponent(App);
    const app = fixture.componentInstance;
    localStorage.setItem('currentUser', JSON.stringify({
      idUser: 1, username: 'Juan', role: 'student', correo: 'j@u.pe', codigo: '2024'
    }));
    routerSpy.url = '/student/catalog';
    app.checkRoute('/student/catalog');
    expect(app.userRole).toBe('student');
    expect(app.menuOptions.length).toBeGreaterThan(0);
  });

  it('checkRoute() should build admin menu when role is admin', () => {
    const fixture = TestBed.createComponent(App);
    const app = fixture.componentInstance;
    localStorage.setItem('currentUser', JSON.stringify({
      idUser: 2, username: 'Admin', role: 'admin', correo: 'a@u.pe', codigo: '0001'
    }));
    routerSpy.url = '/admin/home';
    app.checkRoute('/admin/home');
    expect(app.userRole).toBe('admin');
    expect(app.menuOptions.length).toBeGreaterThan(0);
  });

  it('logout() should clear localStorage and navigate to /login', () => {
    const fixture = TestBed.createComponent(App);
    const app = fixture.componentInstance;
    localStorage.setItem('currentUser', JSON.stringify({ username: 'U' }));
    app.logout();
    expect(localStorage.getItem('currentUser')).toBeNull();
    expect(routerSpy.navigate).toHaveBeenCalledWith(['/login']);
  });

  it('buildMenu() with student role should have Catálogo and Mis Reservas', () => {
    const fixture = TestBed.createComponent(App);
    const app = fixture.componentInstance;
    app.userRole = 'student';
    routerSpy.url = '/student/catalog';
    app.buildMenu();
    const texts = app.menuOptions.map(m => m.text);
    expect(texts).toContain('Catálogo');
    expect(texts).toContain('Mis Reservas');
  });

  it('buildMenu() with admin role should have Inicio, Catálogo, Libros, Préstamos', () => {
    const fixture = TestBed.createComponent(App);
    const app = fixture.componentInstance;
    app.userRole = 'admin';
    routerSpy.url = '/admin/home';
    app.buildMenu();
    const texts = app.menuOptions.map(m => m.text);
    expect(texts).toContain('Inicio');
    expect(texts).toContain('Libros');
    expect(texts).toContain('Préstamos');
  });
});
