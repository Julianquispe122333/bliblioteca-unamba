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
  authorName: string; // derived
  categoryName: string; // derived
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
      b.title.toLowerCase().includes(q) ||
      b.authorName.toLowerCase().includes(q) ||
      b.categoryName.toLowerCase().includes(q)
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
    // Load Categories
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

    // Load Authors
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

    // Load Books
    const storedBooks = localStorage.getItem('books');
    if (storedBooks) {
      this.books = JSON.parse(storedBooks);
    }

    // Asegurar que el libro 'Ingeniería de Software' sea eliminado si existía en localStorage
    this.books = this.books.filter(book => !book.title.toLowerCase().includes('ingeniería de software') && !book.title.toLowerCase().includes('inginiereia de sofware'));

    // Migration and mapping
    this.books.forEach(book => {
      // Fix old categories
      if (!book.idCategory && book.categoryName) {
        const matchedCat = this.dbCategories.find(c => c.name === book.categoryName);
        book.idCategory = matchedCat ? matchedCat.idCategory : this.dbCategories[0].idCategory;
      } else if (!book.idCategory) {
        book.idCategory = this.dbCategories[0].idCategory; // Default if missing
      }
      
      // Fix old authors
      if (!book.idAuthor && book.authorName) {
        // Simple heuristic for migration
        const matchedAuth = this.dbAuthors.find(a => book.authorName.includes(a.surName));
        book.idAuthor = matchedAuth ? matchedAuth.idAuthor : this.dbAuthors[0].idAuthor;
      } else if (!book.idAuthor) {
        book.idAuthor = this.dbAuthors[0].idAuthor;
      }

      // Fix empty stock
      if (book.totalCopies === undefined || book.totalCopies === null || book.totalCopies === 0) {
        book.totalCopies = 3;
        book.availableCopies = 3;
      }

      // Map names for UI
      const cat = this.dbCategories.find(c => c.idCategory === book.idCategory);
      book.categoryName = cat ? cat.name : 'Sin Categoría';
      
      const auth = this.dbAuthors.find(a => a.idAuthor === book.idAuthor);
      book.authorName = auth ? `${auth.firstName} ${auth.surName}` : 'Desconocido';
    });
    
    // Save migrated books
    localStorage.setItem('books', JSON.stringify(this.books));
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

  saveBook(): void {
    if (this.bookForm.valid) {
      const bookData = this.bookForm.value;
      
      if (bookData.availableCopies > bookData.totalCopies) {
        this.messageService.add({ severity: 'error', summary: 'Error de Stock', detail: 'Las copias disponibles no pueden superar a las copias totales.' });
        return;
      }

      let catName = 'Sin Categoría';
      if (typeof bookData.idCategory === 'string') {
         catName = bookData.idCategory;
      } else {
         const cat = this.dbCategories.find(c => c.idCategory === bookData.idCategory);
         if (cat) catName = cat.name;
      }

      let authName = 'Desconocido';
      if (typeof bookData.idAuthor === 'string') {
         authName = bookData.idAuthor;
      } else {
         const auth = this.dbAuthors.find(a => a.idAuthor === bookData.idAuthor);
         if (auth) authName = auth.fullName || `${auth.firstName} ${auth.surName}`;
      }

      this.bookSummary = {
        title: bookData.title,
        category: catName,
        author: authName,
        totalCopies: bookData.totalCopies,
        availableCopies: bookData.availableCopies
      };
      
      this.bookDataToSave = bookData;
      this.displayConfirmBook = true;
    }
  }

  confirmSaveBook(): void {
      const bookData = this.bookDataToSave;
      
      // Auto-generate Category
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
      
      // Auto-generate Author
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
          this.books = [...this.books]; // trigger change detection for p-table
        }
        this.messageService.add({ severity: 'success', summary: 'Actualizado', detail: 'Libro actualizado exitosamente.' });
      } else {
        const newBook: Book = {
          idBook: this.books.length > 0 ? Math.max(...this.books.map(b => b.idBook)) + 1 : 1,
          ...bookData,
          categoryName,
          authorName
        };
        this.books = [...this.books, newBook]; // trigger change detection
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
