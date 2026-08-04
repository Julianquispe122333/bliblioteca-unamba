import { TestBed } from '@angular/core/testing';
import { StudentReservations } from './reservations';
import { Router } from '@angular/router';
import { MessageService } from 'primeng/api';
import { ApiService } from '../../../service/api.service';
import { of, throwError } from 'rxjs';
import { describe, it, expect, beforeEach, vi } from 'vitest';
import { provideHttpClient } from '@angular/common/http';

describe('StudentReservations Component', () => {
  let routerSpy: { navigate: ReturnType<typeof vi.fn> };
  let messageServiceSpy: { add: ReturnType<typeof vi.fn> };
  let apiServiceSpy: {
    getStudentReservations: ReturnType<typeof vi.fn>;
    getReservations: ReturnType<typeof vi.fn>;
    getLoans: ReturnType<typeof vi.fn>;
  };

  beforeEach(async () => {
    routerSpy = { navigate: vi.fn().mockResolvedValue(true) };
    messageServiceSpy = { add: vi.fn() };
    apiServiceSpy = {
      getStudentReservations: vi.fn().mockReturnValue(of({ data: [] })),
      getReservations: vi.fn().mockReturnValue(of({ data: [] })),
      getLoans: vi.fn().mockReturnValue(of({ data: [] }))
    };
    localStorage.clear();

    await TestBed.configureTestingModule({
      imports: [StudentReservations],
      providers: [
        provideHttpClient(),
        { provide: Router, useValue: routerSpy },
        { provide: MessageService, useValue: messageServiceSpy },
        { provide: ApiService, useValue: apiServiceSpy }
      ]
    }).compileComponents();
  });

  it('should create the component', () => {
    const fixture = TestBed.createComponent(StudentReservations);
    expect(fixture.componentInstance).toBeTruthy();
  });

  it('should redirect to /login if no user in localStorage', () => {
    const fixture = TestBed.createComponent(StudentReservations);
    fixture.componentInstance.ngOnInit();
    expect(routerSpy.navigate).toHaveBeenCalledWith(['/login']);
  });

  it('should redirect to /login if user role is not student', () => {
    localStorage.setItem('currentUser', JSON.stringify({ username: 'Admin', role: 'admin' }));
    const fixture = TestBed.createComponent(StudentReservations);
    fixture.componentInstance.ngOnInit();
    expect(routerSpy.navigate).toHaveBeenCalledWith(['/login']);
  });

  it('should set studentName when user is student', () => {
    localStorage.setItem('currentUser', JSON.stringify({ username: 'Maria Lopez', role: 'student' }));
    const fixture = TestBed.createComponent(StudentReservations);
    fixture.componentInstance.ngOnInit();
    expect(fixture.componentInstance.studentName).toBe('Maria Lopez');
  });

  it('should call ngOnDestroy and clear interval', () => {
    const fixture = TestBed.createComponent(StudentReservations);
    const comp = fixture.componentInstance;
    (comp as any).expirationInterval = setInterval(() => {}, 1000);
    expect(() => comp.ngOnDestroy()).not.toThrow();
  });

  it('ngOnDestroy should handle null interval gracefully', () => {
    const fixture = TestBed.createComponent(StudentReservations);
    const comp = fixture.componentInstance;
    (comp as any).expirationInterval = null;
    expect(() => comp.ngOnDestroy()).not.toThrow();
  });

  it('loadReservationsLocal should load and filter by student name', () => {
    localStorage.setItem('currentUser', JSON.stringify({ username: 'Juan', role: 'student' }));
    localStorage.setItem('reservations', JSON.stringify([
      { code: 'RES001', studentName: 'Juan', status: 'Pendiente', expirationDate: '2099-01-01' },
      { code: 'RES002', studentName: 'Maria', status: 'Pendiente', expirationDate: '2099-01-01' }
    ]));
    const fixture = TestBed.createComponent(StudentReservations);
    const comp = fixture.componentInstance;
    comp.studentName = 'Juan';
    comp.loadReservationsLocal();
    expect(comp.reservations.every(r => r.studentName === 'Juan')).toBe(true);
  });

  it('loadReservationsLocal should mark expired reservations as Vencido', () => {
    localStorage.setItem('currentUser', JSON.stringify({ username: 'Juan', role: 'student' }));
    const pastDate = new Date(Date.now() - 1000).toISOString();
    localStorage.setItem('reservations', JSON.stringify([
      { code: 'RES001', studentName: 'Juan', status: 'Pendiente', expirationDate: pastDate }
    ]));
    const fixture = TestBed.createComponent(StudentReservations);
    const comp = fixture.componentInstance;
    comp.studentName = 'Juan';
    comp.loadReservationsLocal();
    expect(comp.reservations.some(r => r.status === 'Vencido')).toBe(true);
  });

  it('loadReservationsLocal should clean RES-VENCIDO entries', () => {
    localStorage.setItem('reservations', JSON.stringify([
      { code: 'RES-VENCIDO', studentName: 'Juan', status: 'Vencido', expirationDate: '2020-01-01' }
    ]));
    localStorage.setItem('loans', JSON.stringify([
      { reservationCode: 'RES-VENCIDO', status: 'Vencido' }
    ]));
    const fixture = TestBed.createComponent(StudentReservations);
    const comp = fixture.componentInstance;
    comp.studentName = 'Juan';
    comp.loadReservationsLocal();
    // After cleanup, RES-VENCIDO should be removed
    const stored = localStorage.getItem('reservations');
    const parsed = stored ? JSON.parse(stored) : [];
    expect(parsed.some((r: any) => r.code === 'RES-VENCIDO')).toBe(false);
  });

  it('goToCatalog should navigate to /student/catalog', () => {
    const fixture = TestBed.createComponent(StudentReservations);
    fixture.componentInstance.goToCatalog();
    expect(routerSpy.navigate).toHaveBeenCalledWith(['/student/catalog']);
  });

  it('isReservationFullyReturned should return false if no loan found', () => {
    const fixture = TestBed.createComponent(StudentReservations);
    const comp = fixture.componentInstance;
    comp.activeLoans = [];
    expect(comp.isReservationFullyReturned('RES999')).toBe(false);
  });

  it('isReservationFullyReturned should return true if loan status is Devuelto', () => {
    const fixture = TestBed.createComponent(StudentReservations);
    const comp = fixture.componentInstance;
    comp.activeLoans = [{ reservationCode: 'RES001', status: 'Devuelto', loanBooks: [] }];
    expect(comp.isReservationFullyReturned('RES001')).toBe(true);
  });

  it('isReservationFullyReturned should check loanBooks for all returned', () => {
    const fixture = TestBed.createComponent(StudentReservations);
    const comp = fixture.componentInstance;
    comp.activeLoans = [{ reservationCode: 'RES001', status: 'Prestado', loanBooks: [{ returned: true }, { returned: true }] }];
    expect(comp.isReservationFullyReturned('RES001')).toBe(true);
  });

  it('isReservationOverdue should return false if no loan found', () => {
    const fixture = TestBed.createComponent(StudentReservations);
    const comp = fixture.componentInstance;
    comp.activeLoans = [];
    expect(comp.isReservationOverdue('RES999')).toBe(false);
  });

  it('isReservationOverdue should return true if loan is Vencido', () => {
    const fixture = TestBed.createComponent(StudentReservations);
    const comp = fixture.componentInstance;
    comp.activeLoans = [{ reservationCode: 'RES001', status: 'Vencido' }];
    expect(comp.isReservationOverdue('RES001')).toBe(true);
  });

  it('getTargetDate should return expirationDate for Pendiente status', () => {
    const fixture = TestBed.createComponent(StudentReservations);
    const comp = fixture.componentInstance;
    const res = { code: 'RES001', status: 'Pendiente', expirationDate: '2099-01-01' } as any;
    expect(comp.getTargetDate(res)).toBe('2099-01-01');
  });

  it('getTargetDate should return dueDate from loan for Atendido status', () => {
    const fixture = TestBed.createComponent(StudentReservations);
    const comp = fixture.componentInstance;
    comp.activeLoans = [{ reservationCode: 'RES001', status: 'Prestado', dueDate: '2099-02-01' }];
    const res = { code: 'RES001', status: 'Atendido', expirationDate: '2099-01-01' } as any;
    expect(comp.getTargetDate(res)).toBe('2099-02-01');
  });

  it('getTargetDate should return returnDate when loan is Devuelto', () => {
    const fixture = TestBed.createComponent(StudentReservations);
    const comp = fixture.componentInstance;
    comp.activeLoans = [{ reservationCode: 'RES001', status: 'Devuelto', returnDate: '2099-01-15', dueDate: '2099-01-20' }];
    const res = { code: 'RES001', status: 'Atendido', expirationDate: '2099-01-01' } as any;
    expect(comp.getTargetDate(res)).toBe('2099-01-15');
  });
});
