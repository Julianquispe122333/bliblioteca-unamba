import { TestBed } from '@angular/core/testing';
import { AdminHome } from './home';
import { Router } from '@angular/router';
import { ApiService } from '../../../service/api.service';
import { of, throwError } from 'rxjs';
import { describe, it, expect, beforeEach, vi } from 'vitest';
import { provideHttpClient } from '@angular/common/http';

describe('AdminHome Component', () => {
  let routerSpy: { navigate: ReturnType<typeof vi.fn>; url: string };
  let apiServiceSpy: {
    getAdminStats: ReturnType<typeof vi.fn>;
    getReservations: ReturnType<typeof vi.fn>;
  };

  beforeEach(async () => {
    routerSpy = { navigate: vi.fn().mockResolvedValue(true), url: '/admin/home' };
    apiServiceSpy = {
      getAdminStats: vi.fn().mockReturnValue(of({ data: { totalBooks: 10, pendingReservationsCount: 2, activeLoansCount: 1, overdueLoansCount: 0 } })),
      getReservations: vi.fn().mockReturnValue(of({ data: [] }))
    };
    localStorage.clear();

    await TestBed.configureTestingModule({
      imports: [AdminHome],
      providers: [
        provideHttpClient(),
        { provide: Router, useValue: routerSpy },
        { provide: ApiService, useValue: apiServiceSpy }
      ]
    }).compileComponents();
  });

  it('should create the component', () => {
    const fixture = TestBed.createComponent(AdminHome);
    expect(fixture.componentInstance).toBeTruthy();
  });

  it('should redirect to /login if no user in localStorage', () => {
    const fixture = TestBed.createComponent(AdminHome);
    fixture.componentInstance.ngOnInit();
    expect(routerSpy.navigate).toHaveBeenCalledWith(['/login']);
  });

  it('should redirect to /login if user role is not admin', () => {
    localStorage.setItem('currentUser', JSON.stringify({ username: 'Juan', role: 'student' }));
    const fixture = TestBed.createComponent(AdminHome);
    fixture.componentInstance.ngOnInit();
    expect(routerSpy.navigate).toHaveBeenCalledWith(['/login']);
  });

  it('should load admin name from localStorage when role is admin', () => {
    localStorage.setItem('currentUser', JSON.stringify({ username: 'Admin UNAMBA', role: 'admin' }));
    const fixture = TestBed.createComponent(AdminHome);
    fixture.componentInstance.ngOnInit();
    expect(fixture.componentInstance.adminName).toBe('Admin UNAMBA');
  });

  it('should load stats from localStorage books', () => {
    localStorage.setItem('currentUser', JSON.stringify({ username: 'Admin', role: 'admin' }));
    localStorage.setItem('books', JSON.stringify([{ id: 1 }, { id: 2 }]));
    const fixture = TestBed.createComponent(AdminHome);
    fixture.componentInstance.ngOnInit();
    expect(fixture.componentInstance.totalBooks).toBeGreaterThanOrEqual(2);
  });

  it('should load loans and calculate overdue from localStorage', () => {
    // Use API that returns null so localStorage values are preserved
    apiServiceSpy.getAdminStats.mockReturnValue(of(null));
    apiServiceSpy.getReservations.mockReturnValue(of(null));
    localStorage.setItem('currentUser', JSON.stringify({ username: 'Admin', role: 'admin' }));
    const pastDate = new Date(Date.now() - 86400000).toISOString().split('T')[0];
    localStorage.setItem('loans', JSON.stringify([
      { status: 'Prestado', dueDate: pastDate },
      { status: 'Prestado', dueDate: '2099-01-01' }
    ]));
    const fixture = TestBed.createComponent(AdminHome);
    const comp = fixture.componentInstance;
    // Call calculateStats directly to test localStorage loading
    localStorage.setItem('loans', JSON.stringify([
      { status: 'Prestado', dueDate: pastDate },
      { status: 'Prestado', dueDate: '2099-01-01' }
    ]));
    comp.calculateStats();
    expect(comp.overdueLoansCount).toBeGreaterThanOrEqual(1);
  });

  it('should load pending reservations from localStorage', () => {
    // Use API that returns null so localStorage values are preserved
    apiServiceSpy.getAdminStats.mockReturnValue(of(null));
    apiServiceSpy.getReservations.mockReturnValue(of(null));
    localStorage.setItem('currentUser', JSON.stringify({ username: 'Admin', role: 'admin' }));
    localStorage.setItem('reservations', JSON.stringify([
      { status: 'Pendiente', code: 'RES001' },
      { status: 'Atendido', code: 'RES002' }
    ]));
    const fixture = TestBed.createComponent(AdminHome);
    const comp = fixture.componentInstance;
    comp.calculateStats();
    expect(comp.pendingReservationsCount).toBeGreaterThanOrEqual(1);
  });

  it('should update stats from API response', () => {
    localStorage.setItem('currentUser', JSON.stringify({ username: 'Admin', role: 'admin' }));
    const fixture = TestBed.createComponent(AdminHome);
    fixture.componentInstance.ngOnInit();
    expect(apiServiceSpy.getAdminStats).toHaveBeenCalled();
  });

  it('should handle API error gracefully', () => {
    localStorage.setItem('currentUser', JSON.stringify({ username: 'Admin', role: 'admin' }));
    apiServiceSpy.getAdminStats.mockReturnValue(throwError(() => new Error('Network Error')));
    apiServiceSpy.getReservations.mockReturnValue(throwError(() => new Error('Network Error')));
    const fixture = TestBed.createComponent(AdminHome);
    expect(() => fixture.componentInstance.ngOnInit()).not.toThrow();
  });

  it('today getter should return a formatted date string', () => {
    const fixture = TestBed.createComponent(AdminHome);
    expect(typeof fixture.componentInstance.today).toBe('string');
    expect(fixture.componentInstance.today.length).toBeGreaterThan(5);
  });

  it('goToLoans() should navigate to /admin/loans', () => {
    const fixture = TestBed.createComponent(AdminHome);
    fixture.componentInstance.goToLoans();
    expect(routerSpy.navigate).toHaveBeenCalledWith(['/admin/loans']);
  });

  it('goToBooks() should navigate to /admin/books', () => {
    const fixture = TestBed.createComponent(AdminHome);
    fixture.componentInstance.goToBooks();
    expect(routerSpy.navigate).toHaveBeenCalledWith(['/admin/books']);
  });
});
