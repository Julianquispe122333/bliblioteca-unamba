import { TestBed } from '@angular/core/testing';
import { HttpClient } from '@angular/common/http';
import { ApiService } from './api.service';
import { describe, it, expect, beforeEach, vi } from 'vitest';

describe('ApiService', () => {
  let service: ApiService;
  let httpSpy: {
    get: ReturnType<typeof vi.fn>;
    post: ReturnType<typeof vi.fn>;
    delete: ReturnType<typeof vi.fn>;
  };

  const fakeObservable = { subscribe: vi.fn() };

  beforeEach(() => {
    httpSpy = {
      get: vi.fn().mockReturnValue(fakeObservable),
      post: vi.fn().mockReturnValue(fakeObservable),
      delete: vi.fn().mockReturnValue(fakeObservable)
    };

    TestBed.configureTestingModule({
      providers: [
        ApiService,
        { provide: HttpClient, useValue: httpSpy }
      ]
    });
    service = TestBed.inject(ApiService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  // Auth
  it('login() should POST to /auth/login', () => {
    service.login('test@unamba.edu.pe', '2024001', 'student');
    expect(httpSpy.post).toHaveBeenCalledWith(
      expect.stringContaining('/auth/login'),
      { email: 'test@unamba.edu.pe', code: '2024001', role: 'student' }
    );
  });

  // Categorías
  it('getCategories() should GET /category', () => {
    service.getCategories();
    expect(httpSpy.get).toHaveBeenCalledWith(expect.stringContaining('/category'));
  });

  it('saveCategory() should POST to /category', () => {
    service.saveCategory({ name: 'Ciencias' });
    expect(httpSpy.post).toHaveBeenCalledWith(
      expect.stringContaining('/category'),
      { name: 'Ciencias' }
    );
  });

  it('deleteCategory() should DELETE /category/:id', () => {
    service.deleteCategory(5);
    expect(httpSpy.delete).toHaveBeenCalledWith(expect.stringContaining('/category/5'));
  });

  // Autores
  it('getAuthors() should GET /author', () => {
    service.getAuthors();
    expect(httpSpy.get).toHaveBeenCalledWith(expect.stringContaining('/author'));
  });

  it('saveAuthor() should POST to /author', () => {
    service.saveAuthor({ firstName: 'Juan', surName: 'Quispe' });
    expect(httpSpy.post).toHaveBeenCalledWith(
      expect.stringContaining('/author'),
      { firstName: 'Juan', surName: 'Quispe' }
    );
  });

  it('deleteAuthor() should DELETE /author/:id', () => {
    service.deleteAuthor(3);
    expect(httpSpy.delete).toHaveBeenCalledWith(expect.stringContaining('/author/3'));
  });

  // Libros
  it('getBooks() should GET /book', () => {
    service.getBooks();
    expect(httpSpy.get).toHaveBeenCalledWith(expect.stringContaining('/book'));
  });

  it('saveBook() should POST to /book', () => {
    const book = { title: 'Test Book', idCategory: 1 };
    service.saveBook(book);
    expect(httpSpy.post).toHaveBeenCalledWith(expect.stringContaining('/book'), book);
  });

  it('deleteBook() should DELETE /book/:id', () => {
    service.deleteBook(7);
    expect(httpSpy.delete).toHaveBeenCalledWith(expect.stringContaining('/book/7'));
  });

  // Reservas
  it('getReservations() should GET /reservation', () => {
    service.getReservations();
    expect(httpSpy.get).toHaveBeenCalledWith(expect.stringContaining('/reservation'));
  });

  it('getStudentReservations() should GET /reservation/student/:name', () => {
    service.getStudentReservations('Juan Quispe');
    expect(httpSpy.get).toHaveBeenCalledWith(expect.stringContaining('/reservation/student/Juan Quispe'));
  });

  it('createReservation() should POST to /reservation', () => {
    const reservation = { studentName: 'Juan', bookTitles: ['Python Book'] };
    service.createReservation(reservation);
    expect(httpSpy.post).toHaveBeenCalledWith(
      expect.stringContaining('/reservation'),
      reservation
    );
  });

  // Préstamos
  it('getLoans() should GET /loan', () => {
    service.getLoans();
    expect(httpSpy.get).toHaveBeenCalledWith(expect.stringContaining('/loan'));
  });

  it('createLoanFromReservation() should POST to /loan', () => {
    service.createLoanFromReservation('RES-001');
    expect(httpSpy.post).toHaveBeenCalledWith(
      expect.stringContaining('/loan'),
      { reservationCode: 'RES-001' }
    );
  });

  it('returnLoanBooks() should POST to /loan/return', () => {
    service.returnLoanBooks('RES-001', ['Python Book']);
    expect(httpSpy.post).toHaveBeenCalledWith(
      expect.stringContaining('/loan/return'),
      { reservationCode: 'RES-001', booksReturningNow: ['Python Book'] }
    );
  });

  // Estadísticas
  it('getAdminStats() should GET /stats/admin', () => {
    service.getAdminStats();
    expect(httpSpy.get).toHaveBeenCalledWith(expect.stringContaining('/stats/admin'));
  });
});
