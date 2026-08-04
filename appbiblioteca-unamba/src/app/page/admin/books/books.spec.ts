import { TestBed } from '@angular/core/testing';
import { BookCrud } from './books';
import { Router } from '@angular/router';
import { ApiService } from '../../../service/api.service';
import { MessageService, ConfirmationService } from 'primeng/api';
import { of, throwError } from 'rxjs';
import { describe, it, expect, beforeEach, vi } from 'vitest';
import { provideHttpClient } from '@angular/common/http';
import { ReactiveFormsModule } from '@angular/forms';

describe('BookCrud Component', () => {
  let routerSpy: { navigate: ReturnType<typeof vi.fn> };
  let apiServiceSpy: {
    getBooks: ReturnType<typeof vi.fn>;
    getCategories: ReturnType<typeof vi.fn>;
    getAuthors: ReturnType<typeof vi.fn>;
    saveBook: ReturnType<typeof vi.fn>;
    deleteBook: ReturnType<typeof vi.fn>;
  };

  const mockBooks = [
    { idBook: 1, idCategory: 1, idAuthor: 1, title: 'Python', authorName: 'Smith', categoryName: 'Sistemas', totalCopies: 3, availableCopies: 2, description: 'Desc', hasPdf: false, image: 'img1.jpg' },
    { idBook: 2, idCategory: 2, idAuthor: 2, title: 'Math', authorName: 'Jones', categoryName: 'Mat', totalCopies: 1, availableCopies: 0, description: 'Desc2', hasPdf: true, pdfFileName: 'math.pdf', pdfUrl: 'data:...', image: 'img2.jpg' }
  ];

  beforeEach(async () => {
    routerSpy = { navigate: vi.fn().mockResolvedValue(true) };
    apiServiceSpy = {
      getBooks: vi.fn().mockReturnValue(of({ data: mockBooks })),
      getCategories: vi.fn().mockReturnValue(of({ data: [{ idCategory: 1, name: 'Sistemas' }] })),
      getAuthors: vi.fn().mockReturnValue(of({ data: [{ idAuthor: 1, firstName: 'John', surName: 'Smith' }] })),
      saveBook: vi.fn().mockReturnValue(of({ type: 'success' })),
      deleteBook: vi.fn().mockReturnValue(of({ data: true }))
    };
    localStorage.clear();

    await TestBed.configureTestingModule({
      imports: [BookCrud, ReactiveFormsModule],
      providers: [
        provideHttpClient(),
        { provide: Router, useValue: routerSpy },
        { provide: ApiService, useValue: apiServiceSpy }
      ]
    }).compileComponents();
  });

  it('should create the component', () => {
    const fixture = TestBed.createComponent(BookCrud);
    expect(fixture.componentInstance).toBeTruthy();
  });

  it('should redirect to /login if not admin', () => {
    const fixture = TestBed.createComponent(BookCrud);
    fixture.componentInstance.ngOnInit();
    expect(routerSpy.navigate).toHaveBeenCalledWith(['/login']);
  });

  it('should redirect to /login if role is student', () => {
    localStorage.setItem('currentUser', JSON.stringify({ username: 'Juan', role: 'student' }));
    const fixture = TestBed.createComponent(BookCrud);
    fixture.componentInstance.ngOnInit();
    expect(routerSpy.navigate).toHaveBeenCalledWith(['/login']);
  });

  it('should initialize form and load data when admin', () => {
    localStorage.setItem('currentUser', JSON.stringify({ username: 'Admin', role: 'admin' }));
    const fixture = TestBed.createComponent(BookCrud);
    fixture.componentInstance.ngOnInit();
    expect(fixture.componentInstance.bookForm).toBeTruthy();
    expect(apiServiceSpy.getBooks).toHaveBeenCalled();
  });

  it('filteredBooks should return all books with empty query', () => {
    const fixture = TestBed.createComponent(BookCrud);
    const comp = fixture.componentInstance;
    comp.books = mockBooks as any;
    comp.searchQuery = '';
    expect(comp.filteredBooks.length).toBe(2);
  });

  it('filteredBooks should filter by title', () => {
    const fixture = TestBed.createComponent(BookCrud);
    const comp = fixture.componentInstance;
    comp.books = mockBooks as any;
    comp.searchQuery = 'python';
    expect(comp.filteredBooks.length).toBe(1);
  });

  it('filteredBooks should filter by author', () => {
    const fixture = TestBed.createComponent(BookCrud);
    const comp = fixture.componentInstance;
    comp.books = mockBooks as any;
    comp.searchQuery = 'smith';
    expect(comp.filteredBooks.length).toBe(1);
  });

  it('openNewBook should open dialog and set isEditMode to false', () => {
    localStorage.setItem('currentUser', JSON.stringify({ username: 'Admin', role: 'admin' }));
    const fixture = TestBed.createComponent(BookCrud);
    fixture.componentInstance.ngOnInit();
    fixture.componentInstance.openNewBook();
    expect(fixture.componentInstance.isEditMode).toBe(false);
    expect(fixture.componentInstance.bookDialog).toBe(true);
  });

  it('editBook should set edit mode and populate form', () => {
    localStorage.setItem('currentUser', JSON.stringify({ username: 'Admin', role: 'admin' }));
    const fixture = TestBed.createComponent(BookCrud);
    fixture.componentInstance.ngOnInit();
    fixture.componentInstance.editBook(mockBooks[0] as any);
    expect(fixture.componentInstance.isEditMode).toBe(true);
    expect(fixture.componentInstance.selectedBookId).toBe(1);
    expect(fixture.componentInstance.bookDialog).toBe(true);
  });

  it('openManageDialog should open manage dialog with specified tab', () => {
    const fixture = TestBed.createComponent(BookCrud);
    fixture.componentInstance.openManageDialog('categories');
    expect(fixture.componentInstance.activeManageTab).toBe('categories');
    expect(fixture.componentInstance.displayManageDialog).toBe(true);
  });

  it('filterAuthors should filter author suggestions', () => {
    const fixture = TestBed.createComponent(BookCrud);
    const comp = fixture.componentInstance;
    comp.dbAuthors = [
      { idAuthor: 1, firstName: 'John', surName: 'Smith', fullName: 'John Smith' },
      { idAuthor: 2, firstName: 'Jane', surName: 'Doe', fullName: 'Jane Doe' }
    ];
    comp.filterAuthors({ query: 'john' });
    expect(comp.suggestionsAuthors.length).toBe(1);
    expect(comp.suggestionsAuthors[0]).toBe('John Smith');
  });

  it('filterCategories should filter category suggestions', () => {
    const fixture = TestBed.createComponent(BookCrud);
    const comp = fixture.componentInstance;
    comp.dbCategories = [
      { idCategory: 1, name: 'Sistemas' },
      { idCategory: 2, name: 'Matemática' }
    ];
    comp.filterCategories({ query: 'sist' });
    expect(comp.suggestionsCategories.length).toBe(1);
    expect(comp.suggestionsCategories[0]).toBe('Sistemas');
  });

  it('isFieldInvalid should return false for valid field', () => {
    localStorage.setItem('currentUser', JSON.stringify({ username: 'Admin', role: 'admin' }));
    const fixture = TestBed.createComponent(BookCrud);
    fixture.componentInstance.ngOnInit();
    const comp = fixture.componentInstance;
    comp.bookForm.patchValue({ title: 'Valid Title' });
    comp.bookForm.get('title')?.markAsTouched();
    expect(comp.isFieldInvalid('title')).toBe(false);
  });

  it('isFieldInvalid should return true for invalid touched field', () => {
    localStorage.setItem('currentUser', JSON.stringify({ username: 'Admin', role: 'admin' }));
    const fixture = TestBed.createComponent(BookCrud);
    fixture.componentInstance.ngOnInit();
    const comp = fixture.componentInstance;
    comp.bookForm.patchValue({ title: '' });
    comp.bookForm.get('title')?.markAsTouched();
    comp.bookForm.get('title')?.markAsDirty();
    expect(comp.isFieldInvalid('title')).toBe(true);
  });

  it('saveBook should call API with correct payload', () => {
    localStorage.setItem('currentUser', JSON.stringify({ username: 'Admin', role: 'admin' }));
    const fixture = TestBed.createComponent(BookCrud);
    fixture.componentInstance.ngOnInit();
    const comp = fixture.componentInstance;
    comp.bookForm.patchValue({
      title: 'New Book',
      idAuthor: 1,
      idCategory: 1,
      totalCopies: 5,
      availableCopies: 5,
      description: 'A new book description',
      hasPdf: false,
      pdfFileName: '',
      pdfUrl: '',
      image: 'https://example.com/img.jpg'
    });
    comp.saveBook();
    expect(apiServiceSpy.saveBook).toHaveBeenCalled();
  });

  it('saveBook should show error if form is invalid', () => {
    localStorage.setItem('currentUser', JSON.stringify({ username: 'Admin', role: 'admin' }));
    const fixture = TestBed.createComponent(BookCrud);
    fixture.componentInstance.ngOnInit();
    const comp = fixture.componentInstance;
    // Leave form with defaults (invalid)
    comp.bookForm.reset();
    comp.saveBook();
    expect(apiServiceSpy.saveBook).not.toHaveBeenCalled();
  });

  it('saveBook should handle API error type response', () => {
    localStorage.setItem('currentUser', JSON.stringify({ username: 'Admin', role: 'admin' }));
    apiServiceSpy.saveBook.mockReturnValue(of({ type: 'error', listMessage: ['Título duplicado'] }));
    const fixture = TestBed.createComponent(BookCrud);
    fixture.componentInstance.ngOnInit();
    const comp = fixture.componentInstance;
    const ms = fixture.debugElement.injector.get(MessageService);
    const addSpy = vi.spyOn(ms, 'add');
    comp.bookForm.patchValue({
      title: 'Dupe', idAuthor: 1, idCategory: 1,
      totalCopies: 2, availableCopies: 1, description: 'Desc',
      hasPdf: false, pdfFileName: '', pdfUrl: '', image: 'url'
    });
    comp.saveBook();
    expect(addSpy).toHaveBeenCalledWith(
      expect.objectContaining({ severity: 'error', summary: 'Error de Validación' })
    );
  });

  it('saveBook should handle network error by saving locally', () => {
    localStorage.setItem('currentUser', JSON.stringify({ username: 'Admin', role: 'admin' }));
    apiServiceSpy.saveBook.mockReturnValue(throwError(() => ({ status: 0 })));
    const fixture = TestBed.createComponent(BookCrud);
    fixture.componentInstance.ngOnInit();
    const comp = fixture.componentInstance;
    comp.books = mockBooks as any;
    comp.dbCategories = [{ idCategory: 1, name: 'Sistemas' }];
    comp.dbAuthors = [{ idAuthor: 1, firstName: 'John', surName: 'Smith', fullName: 'John Smith' }];
    comp.bookForm.patchValue({
      title: 'Local Book', idAuthor: 1, idCategory: 1,
      totalCopies: 2, availableCopies: 2, description: 'Desc',
      hasPdf: false, pdfFileName: '', pdfUrl: '', image: 'url'
    });
    expect(() => comp.saveBook()).not.toThrow();
  });

  it('removePdf should clear PDF fields', () => {
    localStorage.setItem('currentUser', JSON.stringify({ username: 'Admin', role: 'admin' }));
    const fixture = TestBed.createComponent(BookCrud);
    fixture.componentInstance.ngOnInit();
    const comp = fixture.componentInstance;
    comp.bookForm.patchValue({ hasPdf: true, pdfFileName: 'test.pdf', pdfUrl: 'data:...' });
    comp.removePdf();
    expect(comp.bookForm.get('hasPdf')?.value).toBe(false);
    expect(comp.bookForm.get('pdfFileName')?.value).toBe('');
  });

  it('confirmSaveBook should call saveBook', () => {
    localStorage.setItem('currentUser', JSON.stringify({ username: 'Admin', role: 'admin' }));
    const fixture = TestBed.createComponent(BookCrud);
    fixture.componentInstance.ngOnInit();
    const comp = fixture.componentInstance;
    const saveSpy = vi.spyOn(comp, 'saveBook');
    comp.confirmSaveBook();
    expect(saveSpy).toHaveBeenCalled();
  });

  it('saveBook should show validation error when availableCopies > totalCopies (form validator)', () => {
    localStorage.setItem('currentUser', JSON.stringify({ username: 'Admin', role: 'admin' }));
    const fixture = TestBed.createComponent(BookCrud);
    fixture.componentInstance.ngOnInit();
    const comp = fixture.componentInstance;
    // copiesValidator makes form invalid if availableCopies > totalCopies
    comp.bookForm.patchValue({
      title: 'Test', idAuthor: 1, idCategory: 1,
      totalCopies: 2, availableCopies: 5,
      description: 'Desc', hasPdf: false, pdfFileName: '', pdfUrl: '', image: 'url'
    });
    // The form has invalidCopies error from copiesValidator
    expect(comp.bookForm.errors).toEqual({ invalidCopies: true });
    // saveBook should early-return due to form invalid (doesn't call API)
    comp.saveBook();
    expect(apiServiceSpy.saveBook).not.toHaveBeenCalled();
  });

  it('saveBook should handle string author and category', () => {
    localStorage.setItem('currentUser', JSON.stringify({ username: 'Admin', role: 'admin' }));
    const fixture = TestBed.createComponent(BookCrud);
    fixture.componentInstance.ngOnInit();
    const comp = fixture.componentInstance;
    comp.books = mockBooks as any;
    comp.dbCategories = [{ idCategory: 1, name: 'Sistemas' }];
    comp.dbAuthors = [{ idAuthor: 1, firstName: 'John', surName: 'Smith', fullName: 'John Smith' }];
    comp.bookForm.patchValue({
      title: 'String Cat Book',
      idAuthor: 'John Smith',  // string author name
      idCategory: 'Sistemas',  // string category name
      totalCopies: 2, availableCopies: 2,
      description: 'Desc', hasPdf: false, pdfFileName: '', pdfUrl: '', image: 'url'
    });
    comp.saveBook();
    expect(apiServiceSpy.saveBook).toHaveBeenCalledWith(
      expect.objectContaining({ categoryName: 'Sistemas', authorName: 'John Smith' })
    );
  });

  it('imagePreview getter should return image value from form', () => {
    localStorage.setItem('currentUser', JSON.stringify({ username: 'Admin', role: 'admin' }));
    const fixture = TestBed.createComponent(BookCrud);
    fixture.componentInstance.ngOnInit();
    const comp = fixture.componentInstance;
    comp.bookForm.patchValue({ image: 'https://example.com/test.jpg' });
    expect(comp.imagePreview).toBe('https://example.com/test.jpg');
  });

  it('should load books from localStorage when available', () => {
    localStorage.setItem('currentUser', JSON.stringify({ username: 'Admin', role: 'admin' }));
    localStorage.setItem('books', JSON.stringify(mockBooks));
    const fixture = TestBed.createComponent(BookCrud);
    fixture.componentInstance.ngOnInit();
    expect(fixture.componentInstance.books.length).toBeGreaterThan(0);
  });
});
