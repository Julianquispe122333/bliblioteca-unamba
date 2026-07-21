import { Component, inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { ButtonModule } from 'primeng/button';
import { TableModule } from 'primeng/table';
import { DialogModule } from 'primeng/dialog';
import { InputTextModule } from 'primeng/inputtext';
import { InputNumberModule } from 'primeng/inputnumber';
import { CheckboxModule } from 'primeng/checkbox';
import { TagModule } from 'primeng/tag';
import { ToastModule } from 'primeng/toast';
import { MessageService, ConfirmationService } from 'primeng/api';
import { ConfirmDialogModule } from 'primeng/confirmdialog';
import { SelectModule } from 'primeng/select';
import { AdminAuthors } from '../authors/authors';
import { AdminCategories } from '../categories/categories';
import { ApiService } from '../../../service/api.service';

interface Category {
  idCategory: number;
  name: string;
}

interface Author {
  idAuthor: number;
  firstName: string;
  surName: string;
  fullName?: string;
}

interface Book {
  idBook: number;
  idCategory: number;
  idAuthor: number;
  title: string;
  authorName?: string; // derived
  categoryName?: string; // derived
  totalCopies: number;
  availableCopies: number;
  description: string;
  hasPdf: boolean;
  image: string;
}

import { AutoCompleteModule } from 'primeng/autocomplete';

@Component({
  selector: 'app-book-crud',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    ReactiveFormsModule,
    ButtonModule,
    TableModule,
    DialogModule,
    InputTextModule,
    InputNumberModule,
    CheckboxModule,
    TagModule,
    ToastModule,
    ConfirmDialogModule,
    SelectModule,
    AdminAuthors,
    AdminCategories,
    AutoCompleteModule
  ],
  templateUrl: './books.html',
  styleUrls: ['./books.css'],
  providers: [MessageService, ConfirmationService]
})
export class BookCrud implements OnInit {
  private router = inject(Router);
  private messageService = inject(MessageService);
  private confirmationService = inject(ConfirmationService);
  private fb = inject(FormBuilder);
  private apiService = inject(ApiService);

  books: Book[] = [];
  dbCategories: Category[] = [];
  dbAuthors: Author[] = [];
  searchQuery: string = '';

  suggestionsAuthors: string[] = [];
  suggestionsCategories: string[] = [];

  filterAuthors(event: any): void {
    const query = event.query.toLowerCase();
    this.suggestionsAuthors = this.dbAuthors
      .map(a => a.fullName || `${a.firstName} ${a.surName}`)
      .filter(name => name.toLowerCase().includes(query));
  }

  filterCategories(event: any): void {
    const query = event.query.toLowerCase();
    this.suggestionsCategories = this.dbCategories
      .map(c => c.name)
      .filter(name => name.toLowerCase().includes(query));
  }

  get filteredBooks(): Book[] {
    const q = this.searchQuery.toLowerCase().trim();
    if (!q) return this.books;
    return this.books.filter(b =>
      (b.title || '').toLowerCase().includes(q) ||
      (b.authorName || '').toLowerCase().includes(q) ||
      (b.categoryName || '').toLowerCase().includes(q)
    );
  }

  get imagePreview(): string {
    return this.bookForm?.get('image')?.value || '';
  }

  // Dialog & Form controls for Book CRUD
  bookDialog: boolean = false;
  bookForm!: FormGroup;
  isEditMode: boolean = false;
  selectedBookId?: number;

  // Unified Autores/Categorías Dialog state
  displayManageDialog: boolean = false;
  activeManageTab: 'authors' | 'categories' = 'authors';

  // Confirmation state
  displayConfirmBook: boolean = false;
  bookDataToSave: any = null;
  bookSummary: any = null;

  openManageDialog(tab: 'authors' | 'categories' = 'authors'): void {
    this.activeManageTab = tab;
    this.displayManageDialog = true;
  }

  ngOnInit(): void {
    const userStr = localStorage.getItem('currentUser');
    if (!userStr || JSON.parse(userStr).role !== 'admin') {
      this.router.navigate(['/login']);
      return;
    }

    this.initForm();
    this.loadData();
  }

  initForm(): void {
    this.bookForm = this.fb.group({
      title: ['', Validators.required],
      idAuthor: [null, Validators.required],
      idCategory: [null, Validators.required],
      totalCopies: [null, [Validators.required, Validators.min(1)]],
      availableCopies: [null, [Validators.required, Validators.min(0)]],
      description: ['', Validators.required],
      hasPdf: [false],
      image: ['https://images.unsplash.com/photo-1543002588-bfa74002ed7e?w=400&q=80']
    }, { validators: this.copiesValidator });
  }

  copiesValidator(group: import('@angular/forms').AbstractControl): import('@angular/forms').ValidationErrors | null {
    const total = group.get('totalCopies')?.value;
    const available = group.get('availableCopies')?.value;
    if (total !== null && available !== null && available > total) {
      return { invalidCopies: true };
    }
    return null;
  }

  loadData(): void {
    this.loadCategoriesAndAuthorsLocal();

    this.apiService.getBooks().subscribe({
      next: (res) => {
        if (res && res.data && res.data.length > 0) {
          this.books = res.data;
          this.processBooks();
        } else {
          this.loadBooksLocal();
        }
      },
      error: () => this.loadBooksLocal()
    });
  }

  private loadCategoriesAndAuthorsLocal(): void {
    const storedCategories = localStorage.getItem('categories');
    if (storedCategories) {
      this.dbCategories = JSON.parse(storedCategories);
    } else {
      this.dbCategories = [
        { idCategory: 1, name: 'Sistemas' },
        { idCategory: 2, name: 'Matemática' },
        { idCategory: 3, name: 'Física' },
        { idCategory: 4, name: 'Literatura' }
      ];
      localStorage.setItem('categories', JSON.stringify(this.dbCategories));
    }

    const storedAuthors = localStorage.getItem('authors');
    if (storedAuthors) {
      this.dbAuthors = JSON.parse(storedAuthors);
    } else {
      this.dbAuthors = [
        { idAuthor: 1, firstName: 'John', surName: 'Smith' },
        { idAuthor: 2, firstName: 'James', surName: 'Stewart' },
        { idAuthor: 3, firstName: 'Sears &', surName: 'Zemansky' },
        { idAuthor: 4, firstName: 'Roger', surName: 'Pressman' },
        { idAuthor: 5, firstName: 'Gilbert', surName: 'Strang' }
      ];
      localStorage.setItem('authors', JSON.stringify(this.dbAuthors));
    }
    this.dbAuthors.forEach(a => a.fullName = `${a.firstName} ${a.surName}`);
  }

  private processBooks(): void {
    this.books.forEach(book => {
      if (!book.categoryName && book.idCategory) {
        const cat = this.dbCategories.find(c => c.idCategory === book.idCategory);
        book.categoryName = cat ? cat.name : 'Sin Categoría';
      }
      if (!book.authorName && book.idAuthor) {
        const auth = this.dbAuthors.find(a => a.idAuthor === book.idAuthor);
        book.authorName = auth ? `${auth.firstName} ${auth.surName}` : 'Desconocido';
      }
    });
    localStorage.setItem('books', JSON.stringify(this.books));
  }

  private loadBooksLocal(): void {
    const storedBooks = localStorage.getItem('books');
    let list: Book[] = storedBooks ? JSON.parse(storedBooks) : [];
    if (!list || list.length === 0) {
      list = [
        { idBook: 1, idCategory: 1, idAuthor: 1, title: 'Introducción a la Programación con Python', authorName: 'John Smith', totalCopies: 5, availableCopies: 5, description: 'Guía introductoria para aprender Python paso a paso.', hasPdf: true, image: 'https://images.unsplash.com/photo-1515879218367-8466d910aaa4?w=400&q=80' },
        { idBook: 2, idCategory: 2, idAuthor: 2, title: 'Cálculo de una Variable', authorName: 'James Stewart', totalCopies: 3, availableCopies: 2, description: 'Libro de texto clásico de cálculo riguroso.', hasPdf: false, image: 'https://images.unsplash.com/photo-1635070041078-e363dbe005cb?w=400&q=80' },
        { idBook: 3, idCategory: 3, idAuthor: 3, title: 'Física Universitaria', authorName: 'Sears & Zemansky', totalCopies: 2, availableCopies: 2, description: 'Referencia para estudiantes de ciencias para dominar la física.', hasPdf: true, image: 'https://images.unsplash.com/photo-1507668077129-56e32842fceb?w=400&q=80' },
        { idBook: 5, idCategory: 2, idAuthor: 5, title: 'Álgebra Lineal y sus Aplicaciones', authorName: 'Gilbert Strang', totalCopies: 1, availableCopies: 0, description: 'Conceptos fundamentales de matrices y espacios vectoriales.', hasPdf: false, image: 'https://images.unsplash.com/photo-1456513080510-7bf3a84b82f8?w=400&q=80' }
      ];
    }
    this.books = list;
    this.processBooks();
  }

  // Author & Category Inline Creation removed

  // Book CRUD
  openNewBook(): void {
    this.isEditMode = false;
    this.bookForm.reset({
      title: '',
      idAuthor: null,
      idCategory: null,
      totalCopies: null,
      availableCopies: null,
      description: '',
      hasPdf: false,
      image: 'https://images.unsplash.com/photo-1543002588-bfa74002ed7e?w=400&q=80'
    });
    this.bookDialog = true;
  }

  editBook(book: Book): void {
    this.isEditMode = true;
    this.selectedBookId = book.idBook;
    this.bookForm.patchValue({
      title: book.title,
      idAuthor: book.authorName,
      idCategory: book.categoryName,
      totalCopies: book.totalCopies,
      availableCopies: book.availableCopies,
      description: book.description,
      hasPdf: book.hasPdf,
      image: book.image
    });
    this.bookDialog = true;
  }

  deleteBook(book: Book): void {
    this.confirmationService.confirm({
      message: `¿Estás seguro de eliminar el libro "${book.title}"?`,
      header: 'Confirmar eliminación',
      icon: 'pi pi-exclamation-triangle',
      acceptLabel: 'Eliminar',
      rejectLabel: 'Cancelar',
      accept: () => {
        this.apiService.deleteBook(book.idBook).subscribe({
          next: () => {
            this.loadData();
            this.messageService.add({
              severity: 'success',
              summary: 'Eliminado',
              detail: 'El libro fue eliminado correctamente de la BD.',
              life: 3000
            });
          },
          error: () => {
            this.books = this.books.filter(b => b.idBook !== book.idBook);
            localStorage.setItem('books', JSON.stringify(this.books));
            this.messageService.add({
              severity: 'success',
              summary: 'Eliminado',
              detail: 'El libro fue eliminado correctamente.',
              life: 3000
            });
          }
        });
      }
    });
  }

  saveBook(): void {
    if (this.bookForm.invalid) return;

    const bookData = this.bookForm.value;
    
    if (bookData.availableCopies > bookData.totalCopies) {
      this.messageService.add({ severity: 'error', summary: 'Error de Stock', detail: 'Las copias disponibles no pueden superar a las copias totales.' });
      return;
    }

    let categoryId: number | undefined = undefined;
    let categoryName: string | undefined = undefined;
    if (typeof bookData.idCategory === 'number') {
      categoryId = bookData.idCategory;
    } else if (typeof bookData.idCategory === 'string' && bookData.idCategory.trim()) {
      categoryName = bookData.idCategory.trim();
    }

    let authorId: number | undefined = undefined;
    let authorName: string | undefined = undefined;
    if (typeof bookData.idAuthor === 'number') {
      authorId = bookData.idAuthor;
    } else if (typeof bookData.idAuthor === 'string' && bookData.idAuthor.trim()) {
      authorName = bookData.idAuthor.trim();
    }

    const payload = {
      idBook: this.isEditMode ? this.selectedBookId : undefined,
      idCategory: categoryId,
      categoryName: categoryName,
      idAuthor: authorId,
      authorName: authorName,
      title: bookData.title,
      totalCopies: bookData.totalCopies,
      availableCopies: bookData.availableCopies,
      description: bookData.description,
      hasPdf: bookData.hasPdf,
      image: bookData.image
    };

    this.apiService.saveBook(payload).subscribe({
      next: () => {
        this.loadData();
        this.messageService.add({
          severity: 'success',
          summary: this.isEditMode ? 'Actualizado' : 'Guardado',
          detail: this.isEditMode ? 'Libro actualizado exitosamente en la BD.' : 'Nuevo libro guardado en la BD.'
        });
        this.bookDialog = false;
        this.displayConfirmBook = false;
      },
      error: () => {
        this.confirmSaveBookLocal(bookData);
      }
    });
  }

  confirmSaveBook(): void {
    this.saveBook();
  }

  private confirmSaveBookLocal(bookData: any): void {
      if (typeof bookData.idCategory === 'string') {
        const newCat: Category = {
          idCategory: this.dbCategories.length > 0 ? Math.max(...this.dbCategories.map(c => c.idCategory)) + 1 : 1,
          name: bookData.idCategory.trim()
        };
        this.dbCategories.push(newCat);
        localStorage.setItem('categories', JSON.stringify(this.dbCategories));
        bookData.idCategory = newCat.idCategory;
      }
      const cat = this.dbCategories.find(c => c.idCategory === bookData.idCategory);
      const categoryName = cat ? cat.name : 'Sin Categoría';
      
      if (typeof bookData.idAuthor === 'string') {
        const parts = bookData.idAuthor.trim().split(' ');
        const firstName = parts[0];
        const surName = parts.slice(1).join(' ') || '';
        const newAuth: Author = {
          idAuthor: this.dbAuthors.length > 0 ? Math.max(...this.dbAuthors.map(a => a.idAuthor)) + 1 : 1,
          firstName,
          surName,
          fullName: bookData.idAuthor.trim()
        };
        this.dbAuthors.push(newAuth);
        this.dbAuthors = [...this.dbAuthors];
        localStorage.setItem('authors', JSON.stringify(this.dbAuthors));
        bookData.idAuthor = newAuth.idAuthor;
      }
      const auth = this.dbAuthors.find(a => a.idAuthor === bookData.idAuthor);
      const authorName = auth ? auth.fullName || `${auth.firstName} ${auth.surName}` : 'Desconocido';

      if (this.isEditMode && this.selectedBookId !== undefined) {
        const index = this.books.findIndex(b => b.idBook === this.selectedBookId);
        if (index !== -1) {
          this.books[index] = { ...this.books[index], ...bookData, categoryName, authorName };
          this.books = [...this.books];
        }
        this.messageService.add({ severity: 'success', summary: 'Actualizado', detail: 'Libro actualizado exitosamente.' });
      } else {
        const newBook: Book = {
          idBook: this.books.length > 0 ? Math.max(...this.books.map(b => b.idBook)) + 1 : 1,
          ...bookData,
          categoryName,
          authorName
        };
        this.books = [...this.books, newBook];
        this.messageService.add({ severity: 'success', summary: 'Creado', detail: 'Libro agregado al catálogo.' });
      }

      localStorage.setItem('books', JSON.stringify(this.books));
      this.displayConfirmBook = false;
      this.bookDialog = false;
  }

  simulatePdfUpload(): void {
    this.bookForm.patchValue({ hasPdf: true });
    this.messageService.add({ severity: 'info', summary: 'PDF Agregado', detail: 'Archivo PDF adjuntado correctamente (simulado).', life: 2000 });
  }

  removePdf(): void {
    this.bookForm.patchValue({ hasPdf: false });
    this.messageService.add({ severity: 'warn', summary: 'PDF Eliminado', detail: 'Se quitó el archivo PDF.', life: 2000 });
  }
}
