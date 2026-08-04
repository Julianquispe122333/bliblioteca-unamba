import { TestBed } from '@angular/core/testing';
import { AdminCategories } from './categories';
import { ApiService } from '../../../service/api.service';
import { MessageService } from 'primeng/api';
import { of, throwError } from 'rxjs';
import { describe, it, expect, beforeEach, vi } from 'vitest';
import { provideHttpClient } from '@angular/common/http';

describe('AdminCategories Component', () => {
  let apiServiceSpy: {
    getCategories: ReturnType<typeof vi.fn>;
    saveCategory: ReturnType<typeof vi.fn>;
    deleteCategory: ReturnType<typeof vi.fn>;
  };

  const mockCategories = [
    { idCategory: 1, name: 'Sistemas' },
    { idCategory: 2, name: 'Matemática' }
  ];

  beforeEach(async () => {
    apiServiceSpy = {
      getCategories: vi.fn().mockReturnValue(of({ data: mockCategories })),
      saveCategory: vi.fn().mockReturnValue(of({ type: 'success' })),
      deleteCategory: vi.fn().mockReturnValue(of({ data: true }))
    };
    localStorage.clear();

    await TestBed.configureTestingModule({
      imports: [AdminCategories],
      providers: [
        provideHttpClient(),
        { provide: ApiService, useValue: apiServiceSpy }
      ]
    }).compileComponents();
  });

  it('should create the component', () => {
    const fixture = TestBed.createComponent(AdminCategories);
    expect(fixture.componentInstance).toBeTruthy();
  });

  it('should initialize form and load categories on ngOnInit', () => {
    const fixture = TestBed.createComponent(AdminCategories);
    fixture.componentInstance.ngOnInit();
    expect(apiServiceSpy.getCategories).toHaveBeenCalled();
  });

  it('should load categories from API', () => {
    const fixture = TestBed.createComponent(AdminCategories);
    fixture.componentInstance.ngOnInit();
    expect(fixture.componentInstance.categories.length).toBe(2);
  });

  it('should load categories from localStorage on API error', () => {
    apiServiceSpy.getCategories.mockReturnValue(throwError(() => new Error('Network')));
    localStorage.setItem('categories', JSON.stringify(mockCategories));
    const fixture = TestBed.createComponent(AdminCategories);
    fixture.componentInstance.ngOnInit();
    expect(fixture.componentInstance.categories.length).toBe(2);
  });

  it('openNew should reset form and open dialog', () => {
    const fixture = TestBed.createComponent(AdminCategories);
    fixture.componentInstance.ngOnInit();
    fixture.componentInstance.openNew();
    expect(fixture.componentInstance.isEditMode).toBe(false);
    expect(fixture.componentInstance.displayDialog).toBe(true);
  });

  it('editCategory should set edit mode and populate form', () => {
    const fixture = TestBed.createComponent(AdminCategories);
    fixture.componentInstance.ngOnInit();
    const cat = mockCategories[0];
    fixture.componentInstance.editCategory(cat);
    expect(fixture.componentInstance.isEditMode).toBe(true);
    expect(fixture.componentInstance.selectedId).toBe(1);
    expect(fixture.componentInstance.form.get('name')?.value).toBe('Sistemas');
    expect(fixture.componentInstance.displayDialog).toBe(true);
  });

  it('save should call saveCategory API for new category', () => {
    const fixture = TestBed.createComponent(AdminCategories);
    fixture.componentInstance.ngOnInit();
    fixture.componentInstance.openNew();
    fixture.componentInstance.form.patchValue({ name: 'Nueva Categoría' });
    fixture.componentInstance.save();
    expect(apiServiceSpy.saveCategory).toHaveBeenCalledWith({ idCategory: undefined, name: 'Nueva Categoría' });
  });

  it('save should call saveCategory API for edit category', () => {
    const fixture = TestBed.createComponent(AdminCategories);
    fixture.componentInstance.ngOnInit();
    fixture.componentInstance.editCategory(mockCategories[0]);
    fixture.componentInstance.form.patchValue({ name: 'Updated Name' });
    fixture.componentInstance.save();
    expect(apiServiceSpy.saveCategory).toHaveBeenCalledWith({ idCategory: 1, name: 'Updated Name' });
  });

  it('save should not call API if form is invalid', () => {
    const fixture = TestBed.createComponent(AdminCategories);
    fixture.componentInstance.ngOnInit();
    fixture.componentInstance.openNew();
    fixture.componentInstance.form.patchValue({ name: '' });
    fixture.componentInstance.save();
    expect(apiServiceSpy.saveCategory).not.toHaveBeenCalled();
  });

  it('save should handle API error by saving locally (new category)', () => {
    apiServiceSpy.saveCategory.mockReturnValue(throwError(() => new Error('Network')));
    const fixture = TestBed.createComponent(AdminCategories);
    fixture.componentInstance.ngOnInit();
    fixture.componentInstance.openNew();
    fixture.componentInstance.form.patchValue({ name: 'Local Cat' });
    fixture.componentInstance.save();
    expect(fixture.componentInstance.displayDialog).toBe(false);
  });

  it('save should handle API error by updating locally (edit)', () => {
    apiServiceSpy.saveCategory.mockReturnValue(throwError(() => new Error('Network')));
    const fixture = TestBed.createComponent(AdminCategories);
    fixture.componentInstance.ngOnInit();
    fixture.componentInstance.editCategory(mockCategories[0]);
    fixture.componentInstance.form.patchValue({ name: 'Updated Local' });
    fixture.componentInstance.save();
    expect(fixture.componentInstance.displayDialog).toBe(false);
  });
});
