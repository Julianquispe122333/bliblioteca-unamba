import { TestBed } from '@angular/core/testing';
import { LoanManagement } from './loans';
import { Router } from '@angular/router';
import { MessageService } from 'primeng/api';
import { ApiService } from '../../../service/api.service';
import { of, throwError } from 'rxjs';
import { describe, it, expect, beforeEach, vi } from 'vitest';
import { provideHttpClient } from '@angular/common/http';

describe('LoanManagement Component', () => {
  let routerSpy: { navigate: ReturnType<typeof vi.fn> };
  let messageServiceSpy: { add: ReturnType<typeof vi.fn> };
  let apiServiceSpy: {
    getBooks: ReturnType<typeof vi.fn>;
    getReservations: ReturnType<typeof vi.fn>;
    getLoans: ReturnType<typeof vi.fn>;
    createLoanFromReservation: ReturnType<typeof vi.fn>;
    returnLoanBooks: ReturnType<typeof vi.fn>;
  };

  const mockReservations = [
    { idReservation: 1, code: 'RES001', studentName: 'Juan', universityCode: '001', email: 'j@u.pe', bookTitle: 'Python', status: 'Pendiente', expirationDate: '2099-01-01', createdAt: '2026-01-01' },
    { idReservation: 2, code: 'RES002', studentName: 'Maria', universityCode: '002', email: 'm@u.pe', bookTitle: 'Math', status: 'Atendido', expirationDate: '2099-01-01', createdAt: '2026-01-01' }
  ];
  const mockLoan = {
    idLoan: 1, reservationCode: 'RES001', bookTitle: 'Python', studentName: 'Juan',
    loanDate: '2026-01-01', dueDate: '2099-01-10', returnDate: null, status: 'Prestado',
    loanBooks: [{ title: 'Python', returned: false }]
  };

  beforeEach(async () => {
    routerSpy = { navigate: vi.fn().mockResolvedValue(true) };
    messageServiceSpy = { add: vi.fn() };
    apiServiceSpy = {
      getBooks: vi.fn().mockReturnValue(of({ data: [] })),
      getReservations: vi.fn().mockReturnValue(of({ data: mockReservations })),
      getLoans: vi.fn().mockReturnValue(of({ data: [mockLoan] })),
      createLoanFromReservation: vi.fn().mockReturnValue(of({ type: 'success' })),
      returnLoanBooks: vi.fn().mockReturnValue(of({ type: 'success' }))
    };
    localStorage.clear();

    await TestBed.configureTestingModule({
      imports: [LoanManagement],
      providers: [
        provideHttpClient(),
        { provide: Router, useValue: routerSpy },
        { provide: MessageService, useValue: messageServiceSpy },
        { provide: ApiService, useValue: apiServiceSpy }
      ]
    }).compileComponents();
  });

  it('should create the component', () => {
    const fixture = TestBed.createComponent(LoanManagement);
    expect(fixture.componentInstance).toBeTruthy();
  });

  it('should redirect to /login if not admin', () => {
    localStorage.setItem('currentUser', JSON.stringify({ username: 'Juan', role: 'student' }));
    const fixture = TestBed.createComponent(LoanManagement);
    fixture.componentInstance.ngOnInit();
    expect(routerSpy.navigate).toHaveBeenCalledWith(['/login']);
  });

  it('should redirect to /login if no user', () => {
    const fixture = TestBed.createComponent(LoanManagement);
    fixture.componentInstance.ngOnInit();
    expect(routerSpy.navigate).toHaveBeenCalledWith(['/login']);
  });

  it('should load data if admin', () => {
    localStorage.setItem('currentUser', JSON.stringify({ username: 'Admin', role: 'admin' }));
    const fixture = TestBed.createComponent(LoanManagement);
    fixture.componentInstance.ngOnInit();
    expect(apiServiceSpy.getReservations).toHaveBeenCalled();
  });

  it('pendingReservations getter should return only Pendiente reservations', () => {
    const fixture = TestBed.createComponent(LoanManagement);
    const comp = fixture.componentInstance;
    comp.reservations = mockReservations as any;
    expect(comp.pendingReservations.length).toBe(1);
    expect(comp.pendingReservations[0].code).toBe('RES001');
  });

  it('activeLoans getter should return Prestado and Vencido loans', () => {
    const fixture = TestBed.createComponent(LoanManagement);
    const comp = fixture.componentInstance;
    comp.loans = [mockLoan as any, { ...mockLoan, status: 'Devuelto', idLoan: 2, reservationCode: 'RES002' } as any];
    expect(comp.activeLoans.length).toBe(1);
  });

  it('searchReservation should warn if code is empty', () => {
    const fixture = TestBed.createComponent(LoanManagement);
    const comp = fixture.componentInstance;
    const ms = fixture.debugElement.injector.get(MessageService);
    const addSpy = vi.spyOn(ms, 'add');
    comp.searchReservationCode = '';
    comp.searchReservation();
    expect(addSpy).toHaveBeenCalledWith(
      expect.objectContaining({ severity: 'warn', summary: 'Campo vacío' })
    );
  });

  it('searchReservation should find and open dialog for Pendiente reservation', () => {
    const fixture = TestBed.createComponent(LoanManagement);
    const comp = fixture.componentInstance;
    comp.reservations = mockReservations as any;
    comp.searchReservationCode = 'RES001';
    comp.searchReservation();
    expect(comp.foundReservation).not.toBeNull();
    expect(comp.displayLoanDialog).toBe(true);
  });

  it('searchReservation should show error for Atendido reservation', () => {
    const fixture = TestBed.createComponent(LoanManagement);
    const comp = fixture.componentInstance;
    const ms = fixture.debugElement.injector.get(MessageService);
    const addSpy = vi.spyOn(ms, 'add');
    comp.reservations = mockReservations as any;
    comp.searchReservationCode = 'RES002';
    comp.searchReservation();
    expect(addSpy).toHaveBeenCalledWith(
      expect.objectContaining({ summary: 'Código Ya Usado' })
    );
  });

  it('searchReservation should show error for Vencido reservation', () => {
    const fixture = TestBed.createComponent(LoanManagement);
    const comp = fixture.componentInstance;
    const ms = fixture.debugElement.injector.get(MessageService);
    const addSpy = vi.spyOn(ms, 'add');
    comp.reservations = [{ ...mockReservations[0], status: 'Vencido', code: 'RES-VEN' }] as any;
    comp.searchReservationCode = 'RES-VEN';
    comp.searchReservation();
    expect(addSpy).toHaveBeenCalledWith(
      expect.objectContaining({ summary: 'Reserva Vencida' })
    );
  });

  it('searchReservation should show error when not found', () => {
    const fixture = TestBed.createComponent(LoanManagement);
    const comp = fixture.componentInstance;
    const ms = fixture.debugElement.injector.get(MessageService);
    const addSpy = vi.spyOn(ms, 'add');
    comp.reservations = [];
    comp.searchReservationCode = 'NOTFOUND';
    comp.searchReservation();
    expect(addSpy).toHaveBeenCalledWith(
      expect.objectContaining({ severity: 'error', summary: 'No encontrado' })
    );
  });

  it('registerLoanFromReservation should do nothing if no foundReservation', () => {
    const fixture = TestBed.createComponent(LoanManagement);
    const comp = fixture.componentInstance;
    comp.foundReservation = null;
    expect(() => comp.registerLoanFromReservation()).not.toThrow();
  });

  it('registerLoanFromReservation should call API for Pendiente reservation', () => {
    localStorage.setItem('currentUser', JSON.stringify({ username: 'Admin', role: 'admin' }));
    const fixture = TestBed.createComponent(LoanManagement);
    const comp = fixture.componentInstance;
    comp.foundReservation = mockReservations[0] as any;
    comp.reservations = mockReservations as any;
    comp.loans = [];
    comp.registerLoanFromReservation();
    expect(apiServiceSpy.createLoanFromReservation).toHaveBeenCalledWith('RES001');
  });

  it('registerLoanFromReservation should warn if reservation is not Pendiente', () => {
    const fixture = TestBed.createComponent(LoanManagement);
    const comp = fixture.componentInstance;
    const ms = fixture.debugElement.injector.get(MessageService);
    const addSpy = vi.spyOn(ms, 'add');
    comp.foundReservation = mockReservations[1] as any; // Atendido
    comp.registerLoanFromReservation();
    expect(addSpy).toHaveBeenCalledWith(
      expect.objectContaining({ severity: 'warn', summary: 'Reserva no disponible' })
    );
  });

  it('registerLoanFromReservation should handle network error (status 0)', () => {
    localStorage.setItem('currentUser', JSON.stringify({ username: 'Admin', role: 'admin' }));
    apiServiceSpy.createLoanFromReservation.mockReturnValue(throwError(() => ({ status: 0 })));
    const fixture = TestBed.createComponent(LoanManagement);
    const comp = fixture.componentInstance;
    const ms = fixture.debugElement.injector.get(MessageService);
    const addSpy = vi.spyOn(ms, 'add');
    comp.foundReservation = mockReservations[0] as any;
    comp.reservations = mockReservations as any;
    comp.loans = [];
    comp.registerLoanFromReservation();
    expect(addSpy).toHaveBeenCalledWith(
      expect.objectContaining({ severity: 'success' })
    );
  });

  it('searchReturn should warn if code is empty', () => {
    const fixture = TestBed.createComponent(LoanManagement);
    const comp = fixture.componentInstance;
    const ms = fixture.debugElement.injector.get(MessageService);
    const addSpy = vi.spyOn(ms, 'add');
    comp.searchReturnCode = '';
    comp.searchReturn();
    expect(addSpy).toHaveBeenCalledWith(
      expect.objectContaining({ severity: 'warn', summary: 'Campo vacío' })
    );
  });

  it('searchReturn should find loan and open dialog', () => {
    const fixture = TestBed.createComponent(LoanManagement);
    const comp = fixture.componentInstance;
    comp.loans = [mockLoan as any];
    comp.searchReturnCode = 'RES001';
    comp.searchReturn();
    expect(comp.foundLoan).not.toBeNull();
    expect(comp.displayReturnDialog).toBe(true);
  });

  it('searchReturn should show error if loan not found', () => {
    const fixture = TestBed.createComponent(LoanManagement);
    const comp = fixture.componentInstance;
    const ms = fixture.debugElement.injector.get(MessageService);
    const addSpy = vi.spyOn(ms, 'add');
    comp.loans = [];
    comp.searchReturnCode = 'NOTFOUND';
    comp.searchReturn();
    expect(addSpy).toHaveBeenCalledWith(
      expect.objectContaining({ severity: 'error', summary: 'No encontrado' })
    );
  });

  it('getPendingBooks should return empty if no foundLoan', () => {
    const fixture = TestBed.createComponent(LoanManagement);
    const comp = fixture.componentInstance;
    comp.foundLoan = null;
    expect(comp.getPendingBooks()).toEqual([]);
  });

  it('getPendingBooks should return non-returned books', () => {
    const fixture = TestBed.createComponent(LoanManagement);
    const comp = fixture.componentInstance;
    comp.foundLoan = {
      ...mockLoan, loanBooks: [{ title: 'A', returned: false }, { title: 'B', returned: true }]
    } as any;
    expect(comp.getPendingBooks().length).toBe(1);
    expect(comp.getPendingBooks()[0].title).toBe('A');
  });

  it('confirmReturnBook should do nothing if booksReturningNow is empty', () => {
    const fixture = TestBed.createComponent(LoanManagement);
    const comp = fixture.componentInstance;
    comp.foundLoan = mockLoan as any;
    comp.booksReturningNow = [];
    expect(() => comp.confirmReturnBook()).not.toThrow();
  });

  it('confirmReturnBook should call returnLoanBooks API', () => {
    localStorage.setItem('currentUser', JSON.stringify({ username: 'Admin', role: 'admin' }));
    const fixture = TestBed.createComponent(LoanManagement);
    const comp = fixture.componentInstance;
    comp.foundLoan = { ...mockLoan } as any;
    comp.booksReturningNow = ['Python'];
    comp.loans = [{ ...mockLoan } as any];
    comp.reservations = mockReservations as any;
    comp.confirmReturnBook();
    expect(apiServiceSpy.returnLoanBooks).toHaveBeenCalledWith('RES001', ['Python']);
  });

  it('returnBook should set foundLoan and open dialog', () => {
    const fixture = TestBed.createComponent(LoanManagement);
    const comp = fixture.componentInstance;
    comp.returnBook(mockLoan as any);
    expect(comp.foundLoan).toBe(mockLoan as any);
    expect(comp.displayReturnDialog).toBe(true);
  });

  it('getBookAuthor should return author name if book found', () => {
    const fixture = TestBed.createComponent(LoanManagement);
    const comp = fixture.componentInstance;
    comp.books = [{ idBook: 1, title: 'Python', availableCopies: 3, authorName: 'Smith' }];
    expect(comp.getBookAuthor('python')).toBe('Smith');
  });

  it('getBookAuthor should return default if book not found', () => {
    const fixture = TestBed.createComponent(LoanManagement);
    const comp = fixture.componentInstance;
    comp.books = [];
    expect(comp.getBookAuthor('Unknown')).toBe('Autor no registrado');
  });

  it('getBookCategory should return category if book found', () => {
    const fixture = TestBed.createComponent(LoanManagement);
    const comp = fixture.componentInstance;
    comp.books = [{ idBook: 1, title: 'Python', availableCopies: 3, categoryName: 'Sistemas' }];
    expect(comp.getBookCategory('python')).toBe('Sistemas');
  });

  it('getBookCategory should return default if book not found', () => {
    const fixture = TestBed.createComponent(LoanManagement);
    const comp = fixture.componentInstance;
    comp.books = [];
    expect(comp.getBookCategory('Unknown')).toBe('Sin Categoría');
  });
});
