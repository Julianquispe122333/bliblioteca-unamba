import { TestBed } from '@angular/core/testing';
import { AdminCategories } from './categories';
import { ApiService } from '../../../service/api.service';
import { MessageService, ConfirmationService } from 'primeng/api';
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
    fixture.detectChanges();
    expect(fixture.componentInstance).toBeTruthy();
  });

  it('should initialize form and load categories on ngOnInit', () => {
    const fixture = TestBed.createComponent(AdminCategories);
    fixture.componentInstance.ngOnInit();
    fixture.detectChanges();
    expect(apiServiceSpy.getCategories).toHaveBeenCalled();
  });

  it('should load categories from API', () => {
    const fixture = TestBed.createComponent(AdminCategories);
    fixture.componentInstance.ngOnInit();
    fixture.detectChanges();
    expect(fixture.componentInstance.categories.length).toBe(2);
  });

  it('should load categories from localStorage on API error', () => {
    apiServiceSpy.getCategories.mockReturnValue(throwError(() => new Error('Network')));
    localStorage.setItem('categories', JSON.stringify(mockCategories));
    const fixture = TestBed.createComponent(AdminCategories);
    fixture.componentInstance.ngOnInit();
    fixture.detectChanges();
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
    fixture.detectChanges();
    fixture.componentInstance.openNew();
    fixture.componentInstance.form.patchValue({ name: 'Local Cat' });
    fixture.componentInstance.save();
    fixture.detectChanges();
    expect(fixture.componentInstance.displayDialog).toBe(false);
  });

  it('save should handle API error by updating locally (edit)', () => {
    apiServiceSpy.saveCategory.mockReturnValue(throwError(() => new Error('Network')));
    const fixture = TestBed.createComponent(AdminCategories);
    fixture.componentInstance.ngOnInit();
    fixture.detectChanges();
    fixture.componentInstance.editCategory(mockCategories[0]);
    fixture.componentInstance.form.patchValue({ name: 'Updated Local' });
    fixture.componentInstance.save();
    fixture.detectChanges();
    expect(fixture.componentInstance.displayDialog).toBe(false);
  });

  it('save should handle API error and do nothing if edited category is not in list', () => {
    apiServiceSpy.saveCategory.mockReturnValue(throwError(() => new Error('Network')));
    const fixture = TestBed.createComponent(AdminCategories);
    fixture.componentInstance.ngOnInit();
    fixture.detectChanges();
    fixture.componentInstance.categories = [];
    fixture.componentInstance.editCategory({ idCategory: 999, name: 'Non Existent' });
    fixture.componentInstance.form.patchValue({ name: 'Should Not Update' });
    fixture.componentInstance.save();
    fixture.detectChanges();
    expect(fixture.componentInstance.displayDialog).toBe(false);
  });

  it('save should handle API error by assigning ID 1 when list is empty (new category)', () => {
    apiServiceSpy.saveCategory.mockReturnValue(throwError(() => new Error('Network')));
    const fixture = TestBed.createComponent(AdminCategories);
    fixture.componentInstance.ngOnInit();
    fixture.detectChanges();
    fixture.componentInstance.categories = [];
    fixture.componentInstance.openNew();
    fixture.componentInstance.form.patchValue({ name: 'First Local Cat' });
    fixture.componentInstance.save();
    fixture.detectChanges();
    expect(fixture.componentInstance.categories.length).toBe(1);
    expect(fixture.componentInstance.categories[0].idCategory).toBe(1);
    expect(fixture.componentInstance.displayDialog).toBe(false);
  });

  it('deleteCategory should confirm and call API successfully', () => {
    const fixture = TestBed.createComponent(AdminCategories);
    fixture.componentInstance.ngOnInit();
    fixture.detectChanges();
    const confirmService = fixture.debugElement.injector.get(ConfirmationService);
    const confirmSpy = vi.spyOn(confirmService as any, 'confirm').mockImplementation((config: any) => {
      config.accept();
      return confirmService as any;
    });

    fixture.componentInstance.deleteCategory(mockCategories[0]);
    fixture.detectChanges();
    expect(confirmSpy).toHaveBeenCalled();
    expect(apiServiceSpy.deleteCategory).toHaveBeenCalledWith(1);
  });

  it('deleteCategory should handle API error by deleting locally', () => {
    apiServiceSpy.deleteCategory.mockReturnValue(throwError(() => new Error('Network')));
    const fixture = TestBed.createComponent(AdminCategories);
    fixture.componentInstance.ngOnInit();
    fixture.detectChanges();
    const confirmService = fixture.debugElement.injector.get(ConfirmationService);
    vi.spyOn(confirmService as any, 'confirm').mockImplementation((config: any) => {
      config.accept();
      return confirmService as any;
    });

    const initialLength = fixture.componentInstance.categories.length;
    fixture.componentInstance.deleteCategory(mockCategories[0]);
    fixture.detectChanges();
    expect(fixture.componentInstance.categories.length).toBe(initialLength - 1);
  });
});
