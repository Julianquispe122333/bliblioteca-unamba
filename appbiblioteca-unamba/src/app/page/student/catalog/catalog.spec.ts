import { TestBed } from '@angular/core/testing';
import { StudentCatalog } from './catalog';
import { Router } from '@angular/router';
import { MessageService } from 'primeng/api';
import { ApiService } from '../../../service/api.service';
import { of, throwError } from 'rxjs';
import { describe, it, expect, beforeEach, vi } from 'vitest';
import { provideHttpClient } from '@angular/common/http';

describe('StudentCatalog Component', () => {
  let routerSpy: { navigate: ReturnType<typeof vi.fn>; url: string };
  let messageServiceSpy: { add: ReturnType<typeof vi.fn> };
  let apiServiceSpy: {
    getCategories: ReturnType<typeof vi.fn>;
    getAuthors: ReturnType<typeof vi.fn>;
    getBooks: ReturnType<typeof vi.fn>;
    createReservation: ReturnType<typeof vi.fn>;
  };

  const mockBooks = [
    { idBook: 1, idCategory: 1, idAuthor: 1, title: 'Python Book', authorName: 'Smith', totalCopies: 5, availableCopies: 3, description: 'Test', hasPdf: false, image: '' },
    { idBook: 2, idCategory: 2, idAuthor: 2, title: 'Math Book', authorName: 'Jones', totalCopies: 2, availableCopies: 0, description: 'Test', hasPdf: true, image: '' }
  ];

  beforeEach(async () => {
    routerSpy = { navigate: vi.fn().mockResolvedValue(true), url: '/student/catalog' };
    messageServiceSpy = { add: vi.fn() };
    apiServiceSpy = {
      getCategories: vi.fn().mockReturnValue(of({ data: [{ idCategory: 1, name: 'Sistemas' }] })),
      getAuthors: vi.fn().mockReturnValue(of({ data: [{ idAuthor: 1, firstName: 'John', surName: 'Smith' }] })),
      getBooks: vi.fn().mockReturnValue(of({ data: mockBooks })),
      createReservation: vi.fn().mockReturnValue(of({ data: { code: 'RES001' } }))
    };
    localStorage.clear();

    await TestBed.configureTestingModule({
      imports: [StudentCatalog],
      providers: [
        provideHttpClient(),
        { provide: Router, useValue: routerSpy },
        { provide: MessageService, useValue: messageServiceSpy },
        { provide: ApiService, useValue: apiServiceSpy }
      ]
    }).compileComponents();
  });

  it('should create the component', () => {
    const fixture = TestBed.createComponent(StudentCatalog);
    expect(fixture.componentInstance).toBeTruthy();
  });

  it('should redirect to /login if no user in localStorage', () => {
    const fixture = TestBed.createComponent(StudentCatalog);
    fixture.componentInstance.ngOnInit();
    expect(routerSpy.navigate).toHaveBeenCalledWith(['/login']);
  });

  it('should redirect to /login if user role is not student', () => {
    localStorage.setItem('currentUser', JSON.stringify({ username: 'Admin', role: 'admin' }));
    const fixture = TestBed.createComponent(StudentCatalog);
    fixture.componentInstance.ngOnInit();
    expect(routerSpy.navigate).toHaveBeenCalledWith(['/login']);
  });

  it('should set studentName from localStorage', () => {
    localStorage.setItem('currentUser', JSON.stringify({ username: 'Juan Quispe', role: 'student' }));
    const fixture = TestBed.createComponent(StudentCatalog);
    fixture.componentInstance.ngOnInit();
    expect(fixture.componentInstance.studentName).toBe('Juan Quispe');
  });

  it('should load books from localStorage if available', () => {
    localStorage.setItem('currentUser', JSON.stringify({ username: 'Juan', role: 'student' }));
    localStorage.setItem('books', JSON.stringify(mockBooks));
    const fixture = TestBed.createComponent(StudentCatalog);
    fixture.componentInstance.ngOnInit();
    expect(fixture.componentInstance.books.length).toBeGreaterThan(0);
  });

  it('should use default books when localStorage is empty', () => {
    localStorage.setItem('currentUser', JSON.stringify({ username: 'Juan', role: 'student' }));
    const fixture = TestBed.createComponent(StudentCatalog);
    fixture.componentInstance.ngOnInit();
    expect(fixture.componentInstance.books.length).toBeGreaterThan(0);
  });

  it('filteredBooks should filter by search query', () => {
    localStorage.setItem('currentUser', JSON.stringify({ username: 'Juan', role: 'student' }));
    const fixture = TestBed.createComponent(StudentCatalog);
    const comp = fixture.componentInstance;
    comp.books = mockBooks as any;
    comp.searchQuery = 'python';
    expect(comp.filteredBooks.length).toBe(1);
    expect(comp.filteredBooks[0].title).toBe('Python Book');
  });

  it('filteredBooks should return all books when no filter', () => {
    localStorage.setItem('currentUser', JSON.stringify({ username: 'Juan', role: 'student' }));
    const fixture = TestBed.createComponent(StudentCatalog);
    const comp = fixture.componentInstance;
    comp.books = mockBooks as any;
    comp.searchQuery = '';
    comp.selectedCategoryId = 0;
    expect(comp.filteredBooks.length).toBe(2);
  });

  it('filteredBooks should filter by category', () => {
    const fixture = TestBed.createComponent(StudentCatalog);
    const comp = fixture.componentInstance;
    comp.books = mockBooks as any;
    comp.searchQuery = '';
    comp.selectedCategoryId = 1;
    expect(comp.filteredBooks.length).toBe(1);
  });

  it('isInCart should return false for book not in cart', () => {
    const fixture = TestBed.createComponent(StudentCatalog);
    const comp = fixture.componentInstance;
    comp.selectedBooks = [];
    expect(comp.isInCart(mockBooks[0] as any)).toBe(false);
  });

  it('isInCart should return true for book in cart', () => {
    const fixture = TestBed.createComponent(StudentCatalog);
    const comp = fixture.componentInstance;
    comp.selectedBooks = [mockBooks[0] as any];
    expect(comp.isInCart(mockBooks[0] as any)).toBe(true);
  });

  it('toggleBookSelection should add book to cart', () => {
    const fixture = TestBed.createComponent(StudentCatalog);
    const comp = fixture.componentInstance;
    comp.selectedBooks = [];
    comp.toggleBookSelection(mockBooks[0] as any);
    expect(comp.selectedBooks.length).toBe(1);
  });

  it('toggleBookSelection should remove book from cart if already selected', () => {
    const fixture = TestBed.createComponent(StudentCatalog);
    const comp = fixture.componentInstance;
    comp.selectedBooks = [mockBooks[0] as any];
    comp.toggleBookSelection(mockBooks[0] as any);
    expect(comp.selectedBooks.length).toBe(0);
  });

  it('toggleBookSelection should warn if no copies available', () => {
    const fixture = TestBed.createComponent(StudentCatalog);
    const comp = fixture.componentInstance;
    const ms = fixture.debugElement.injector.get(MessageService);
    const addSpy = vi.spyOn(ms, 'add');
    comp.selectedBooks = [];
    comp.toggleBookSelection(mockBooks[1] as any); // availableCopies = 0
    expect(addSpy).toHaveBeenCalledWith(
      expect.objectContaining({ severity: 'warn', summary: 'Sin stock' })
    );
  });

  it('toggleBookSelection should stop event propagation', () => {
    const fixture = TestBed.createComponent(StudentCatalog);
    const comp = fixture.componentInstance;
    const event = { stopPropagation: vi.fn() } as any;
    comp.selectedBooks = [];
    comp.toggleBookSelection(mockBooks[0] as any, event);
    expect(event.stopPropagation).toHaveBeenCalled();
  });

  it('openCartDialog should warn if cart is empty', () => {
    const fixture = TestBed.createComponent(StudentCatalog);
    const comp = fixture.componentInstance;
    const ms = fixture.debugElement.injector.get(MessageService);
    const addSpy = vi.spyOn(ms, 'add');
    comp.selectedBooks = [];
    comp.openCartDialog();
    expect(addSpy).toHaveBeenCalledWith(
      expect.objectContaining({ severity: 'warn', summary: 'Selección vacía' })
    );
  });

  it('openCartDialog should open dialog if cart has items', () => {
    const fixture = TestBed.createComponent(StudentCatalog);
    const comp = fixture.componentInstance;
    comp.selectedBooks = [mockBooks[0] as any];
    comp.openCartDialog();
    expect(comp.displayCartDialog).toBe(true);
  });

  it('removeFromCart should remove book from cart', () => {
    const fixture = TestBed.createComponent(StudentCatalog);
    const comp = fixture.componentInstance;
    comp.selectedBooks = [mockBooks[0] as any];
    comp.removeFromCart(mockBooks[0] as any);
    expect(comp.selectedBooks.length).toBe(0);
  });

  it('removeFromCart should close dialog if cart becomes empty', () => {
    const fixture = TestBed.createComponent(StudentCatalog);
    const comp = fixture.componentInstance;
    comp.selectedBooks = [mockBooks[0] as any];
    comp.displayCartDialog = true;
    comp.removeFromCart(mockBooks[0] as any);
    expect(comp.displayCartDialog).toBe(false);
  });

  it('viewBookDetail should set selectedBook and open dialog', () => {
    const fixture = TestBed.createComponent(StudentCatalog);
    const comp = fixture.componentInstance;
    comp.viewBookDetail(mockBooks[0] as any);
    expect(comp.selectedBook).toBe(mockBooks[0] as any);
    expect(comp.displayDetailDialog).toBe(true);
  });

  it('confirmReservation should call apiService.createReservation', () => {
    localStorage.setItem('currentUser', JSON.stringify({ username: 'Juan', role: 'student', correo: 'j@u.pe', codigo: '123' }));
    apiServiceSpy.createReservation.mockReturnValue(of({ data: { code: 'RES-TEST-001' } }));
    const fixture = TestBed.createComponent(StudentCatalog);
    const comp = fixture.componentInstance;
    comp.studentName = 'Juan';
    comp.selectedBooks = [mockBooks[0] as any];
    comp.books = mockBooks as any;
    comp.confirmReservation();
    expect(apiServiceSpy.createReservation).toHaveBeenCalled();
  });

  it('confirmReservation should handle API error type response', () => {
    localStorage.setItem('currentUser', JSON.stringify({ username: 'Juan', role: 'student' }));
    apiServiceSpy.createReservation.mockReturnValue(of({ type: 'error', listMessage: ['Error de reserva'] }));
    const fixture = TestBed.createComponent(StudentCatalog);
    const comp = fixture.componentInstance;
    const ms = fixture.debugElement.injector.get(MessageService);
    const addSpy = vi.spyOn(ms, 'add');
    comp.studentName = 'Juan';
    comp.selectedBooks = [mockBooks[0] as any];
    comp.books = mockBooks as any;
    comp.confirmReservation();
    expect(addSpy).toHaveBeenCalledWith(
      expect.objectContaining({ severity: 'error', summary: 'Error' })
    );
  });

  it('confirmReservation should handle network error (non-401)', () => {
    localStorage.setItem('currentUser', JSON.stringify({ username: 'Juan', role: 'student' }));
    apiServiceSpy.createReservation.mockReturnValue(throwError(() => ({ status: 0, error: {} })));
    const fixture = TestBed.createComponent(StudentCatalog);
    const comp = fixture.componentInstance;
    comp.studentName = 'Juan';
    comp.selectedBooks = [mockBooks[0] as any];
    comp.books = mockBooks as any;
    expect(() => comp.confirmReservation()).not.toThrow();
  });

  it('confirmReservation should ignore 401 errors (handled by interceptor)', () => {
    localStorage.setItem('currentUser', JSON.stringify({ username: 'Juan', role: 'student' }));
    apiServiceSpy.createReservation.mockReturnValue(throwError(() => ({ status: 401 })));
    const fixture = TestBed.createComponent(StudentCatalog);
    const comp = fixture.componentInstance;
    comp.studentName = 'Juan';
    comp.selectedBooks = [mockBooks[0] as any];
    comp.books = mockBooks as any;
    comp.confirmReservation();
    // Should not show error message for 401
    expect(messageServiceSpy.add).not.toHaveBeenCalledWith(
      expect.objectContaining({ summary: 'Error' })
    );
  });
});
