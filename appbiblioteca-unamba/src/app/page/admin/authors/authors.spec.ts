import { TestBed } from '@angular/core/testing';
import { AdminAuthors } from './authors';
import { ApiService } from '../../../service/api.service';
import { of, throwError } from 'rxjs';
import { describe, it, expect, beforeEach, vi } from 'vitest';
import { provideHttpClient } from '@angular/common/http';

describe('AdminAuthors Component', () => {
  let apiServiceSpy: {
    getAuthors: ReturnType<typeof vi.fn>;
    saveAuthor: ReturnType<typeof vi.fn>;
    deleteAuthor: ReturnType<typeof vi.fn>;
  };

  const mockAuthors = [
    { idAuthor: 1, firstName: 'John', surName: 'Smith' },
    { idAuthor: 2, firstName: 'James', surName: 'Stewart' }
  ];

  beforeEach(async () => {
    apiServiceSpy = {
      getAuthors: vi.fn().mockReturnValue(of({ data: mockAuthors })),
      saveAuthor: vi.fn().mockReturnValue(of({ type: 'success' })),
      deleteAuthor: vi.fn().mockReturnValue(of({ data: true }))
    };
    localStorage.clear();

    await TestBed.configureTestingModule({
      imports: [AdminAuthors],
      providers: [
        provideHttpClient(),
        { provide: ApiService, useValue: apiServiceSpy }
      ]
    }).compileComponents();
  });

  it('should create the component', () => {
    const fixture = TestBed.createComponent(AdminAuthors);
    expect(fixture.componentInstance).toBeTruthy();
  });

  it('should load authors on ngOnInit', () => {
    const fixture = TestBed.createComponent(AdminAuthors);
    fixture.componentInstance.ngOnInit();
    expect(apiServiceSpy.getAuthors).toHaveBeenCalled();
    expect(fixture.componentInstance.authors.length).toBe(2);
  });

  it('should load authors from localStorage on API error', () => {
    apiServiceSpy.getAuthors.mockReturnValue(throwError(() => new Error('Network')));
    localStorage.setItem('authors', JSON.stringify(mockAuthors));
    const fixture = TestBed.createComponent(AdminAuthors);
    fixture.componentInstance.ngOnInit();
    expect(fixture.componentInstance.authors.length).toBe(2);
  });

  it('openNew should set isEditMode to false and open dialog', () => {
    const fixture = TestBed.createComponent(AdminAuthors);
    fixture.componentInstance.ngOnInit();
    fixture.componentInstance.openNew();
    expect(fixture.componentInstance.isEditMode).toBe(false);
    expect(fixture.componentInstance.displayDialog).toBe(true);
  });

  it('editAuthor should set edit mode and populate form', () => {
    const fixture = TestBed.createComponent(AdminAuthors);
    fixture.componentInstance.ngOnInit();
    fixture.componentInstance.editAuthor(mockAuthors[0]);
    expect(fixture.componentInstance.isEditMode).toBe(true);
    expect(fixture.componentInstance.selectedId).toBe(1);
    expect(fixture.componentInstance.form.get('firstName')?.value).toBe('John');
    expect(fixture.componentInstance.form.get('surName')?.value).toBe('Smith');
    expect(fixture.componentInstance.displayDialog).toBe(true);
  });

  it('save should call saveAuthor API for new author', () => {
    const fixture = TestBed.createComponent(AdminAuthors);
    fixture.componentInstance.ngOnInit();
    fixture.componentInstance.openNew();
    fixture.componentInstance.form.patchValue({ firstName: 'New', surName: 'Author' });
    fixture.componentInstance.save();
    expect(apiServiceSpy.saveAuthor).toHaveBeenCalledWith(
      expect.objectContaining({ firstName: 'New', surName: 'Author', idAuthor: undefined })
    );
  });

  it('save should call saveAuthor API for edit author', () => {
    const fixture = TestBed.createComponent(AdminAuthors);
    fixture.componentInstance.ngOnInit();
    fixture.componentInstance.editAuthor(mockAuthors[0]);
    fixture.componentInstance.form.patchValue({ firstName: 'Updated', surName: 'Name' });
    fixture.componentInstance.save();
    expect(apiServiceSpy.saveAuthor).toHaveBeenCalledWith(
      expect.objectContaining({ idAuthor: 1, firstName: 'Updated', surName: 'Name' })
    );
  });

  it('save should not call API if form is invalid', () => {
    const fixture = TestBed.createComponent(AdminAuthors);
    fixture.componentInstance.ngOnInit();
    fixture.componentInstance.openNew();
    fixture.componentInstance.form.patchValue({ firstName: '', surName: '' });
    fixture.componentInstance.save();
    expect(apiServiceSpy.saveAuthor).not.toHaveBeenCalled();
  });

  it('save should handle API error by saving locally (new author)', () => {
    apiServiceSpy.saveAuthor.mockReturnValue(throwError(() => new Error('Network')));
    const fixture = TestBed.createComponent(AdminAuthors);
    fixture.componentInstance.ngOnInit();
    fixture.componentInstance.openNew();
    fixture.componentInstance.form.patchValue({ firstName: 'Local', surName: 'Author' });
    fixture.componentInstance.save();
    expect(fixture.componentInstance.displayDialog).toBe(false);
  });

  it('save should handle API error by updating locally (edit)', () => {
    apiServiceSpy.saveAuthor.mockReturnValue(throwError(() => new Error('Network')));
    const fixture = TestBed.createComponent(AdminAuthors);
    fixture.componentInstance.ngOnInit();
    fixture.componentInstance.editAuthor(mockAuthors[0]);
    fixture.componentInstance.form.patchValue({ firstName: 'Updated', surName: 'Local' });
    fixture.componentInstance.save();
    expect(fixture.componentInstance.displayDialog).toBe(false);
  });

  it('loadAuthors should call getAuthors API', () => {
    const fixture = TestBed.createComponent(AdminAuthors);
    fixture.componentInstance.ngOnInit();
    // ngOnInit calls loadAuthors which calls the API
    expect(apiServiceSpy.getAuthors).toHaveBeenCalled();
  });
});
