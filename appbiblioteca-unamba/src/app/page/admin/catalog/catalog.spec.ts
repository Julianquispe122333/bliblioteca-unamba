import { TestBed } from '@angular/core/testing';
import { AdminCatalog } from './catalog';
import { Router } from '@angular/router';
import { ApiService } from '../../../service/api.service';
import { of } from 'rxjs';
import { describe, it, expect, beforeEach, vi } from 'vitest';
import { provideHttpClient } from '@angular/common/http';

describe('AdminCatalog Component', () => {
  let routerSpy: { navigate: ReturnType<typeof vi.fn> };
  let apiServiceSpy: {
    getCategories: ReturnType<typeof vi.fn>;
    getAuthors: ReturnType<typeof vi.fn>;
    getBooks: ReturnType<typeof vi.fn>;
  };

  const mockBooks = [
    { idBook: 1, idCategory: 1, title: 'Python', authorName: 'Smith', categoryName: 'Sistemas', totalCopies: 3, availableCopies: 2, description: 'Desc', hasPdf: false, image: '' },
    { idBook: 2, idCategory: 2, title: 'Math', authorName: 'Jones', categoryName: 'Matemática', totalCopies: 1, availableCopies: 0, description: 'Desc', hasPdf: true, image: '' }
  ];

  beforeEach(async () => {
    routerSpy = { navigate: vi.fn().mockResolvedValue(true) };
    apiServiceSpy = {
      getCategories: vi.fn().mockReturnValue(of({ data: [{ idCategory: 1, name: 'Sistemas' }] })),
      getAuthors: vi.fn().mockReturnValue(of({ data: [] })),
      getBooks: vi.fn().mockReturnValue(of({ data: mockBooks }))
    };
    localStorage.clear();

    await TestBed.configureTestingModule({
      imports: [AdminCatalog],
      providers: [
        provideHttpClient(),
        { provide: Router, useValue: routerSpy },
        { provide: ApiService, useValue: apiServiceSpy }
      ]
    }).compileComponents();
  });

  it('should create the component', () => {
    const fixture = TestBed.createComponent(AdminCatalog);
    expect(fixture.componentInstance).toBeTruthy();
  });

  it('should redirect to /login if not admin', () => {
    const fixture = TestBed.createComponent(AdminCatalog);
    fixture.componentInstance.ngOnInit();
    expect(routerSpy.navigate).toHaveBeenCalledWith(['/login']);
  });

  it('should redirect to /login if role is student', () => {
    localStorage.setItem('currentUser', JSON.stringify({ username: 'Juan', role: 'student' }));
    const fixture = TestBed.createComponent(AdminCatalog);
    fixture.componentInstance.ngOnInit();
    expect(routerSpy.navigate).toHaveBeenCalledWith(['/login']);
  });

  it('should load books when admin', () => {
    localStorage.setItem('currentUser', JSON.stringify({ username: 'Admin', role: 'admin' }));
    const fixture = TestBed.createComponent(AdminCatalog);
    fixture.componentInstance.ngOnInit();
    expect(apiServiceSpy.getBooks).toHaveBeenCalled();
  });

  it('filteredBooks should filter by search query', () => {
    const fixture = TestBed.createComponent(AdminCatalog);
    const comp = fixture.componentInstance;
    comp.books = mockBooks as any;
    comp.searchQuery = 'python';
    comp.selectedCategoryId = 0;
    expect(comp.filteredBooks.length).toBe(1);
  });

  it('filteredBooks should return all books with empty search', () => {
    const fixture = TestBed.createComponent(AdminCatalog);
    const comp = fixture.componentInstance;
    comp.books = mockBooks as any;
    comp.searchQuery = '';
    comp.selectedCategoryId = 0;
    expect(comp.filteredBooks.length).toBe(2);
  });

  it('filteredBooks should filter by category', () => {
    const fixture = TestBed.createComponent(AdminCatalog);
    const comp = fixture.componentInstance;
    comp.books = mockBooks as any;
    comp.searchQuery = '';
    comp.selectedCategoryId = 1;
    expect(comp.filteredBooks.length).toBe(1);
  });

  it('viewBookDetail should set selectedBook and open dialog', () => {
    const fixture = TestBed.createComponent(AdminCatalog);
    const comp = fixture.componentInstance;
    comp.viewBookDetail(mockBooks[0] as any);
    expect(comp.selectedBook).toBe(mockBooks[0] as any);
    expect(comp.displayDetailDialog).toBe(true);
  });

  it('openPdfView should open PDF dialog', () => {
    const fixture = TestBed.createComponent(AdminCatalog);
    const comp = fixture.componentInstance;
    comp.openPdfView();
    expect(comp.displayPdfDialog).toBe(true);
  });

  it('should load books from localStorage', () => {
    localStorage.setItem('currentUser', JSON.stringify({ username: 'Admin', role: 'admin' }));
    localStorage.setItem('books', JSON.stringify(mockBooks));
    const fixture = TestBed.createComponent(AdminCatalog);
    fixture.componentInstance.ngOnInit();
    expect(fixture.componentInstance.books.length).toBeGreaterThan(0);
  });
});
