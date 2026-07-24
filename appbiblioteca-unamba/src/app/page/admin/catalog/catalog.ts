import { Component, inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { ButtonModule } from 'primeng/button';
import { InputTextModule } from 'primeng/inputtext';
import { TagModule } from 'primeng/tag';
import { DialogModule } from 'primeng/dialog';
import { ApiService } from '../../../service/api.service';

interface Category {
  idCategory: number;
  name: string;
}

interface Book {
  idBook: number;
  idCategory: number;
  idAuthor?: number;
  title: string;
  authorName: string;
  categoryName?: string;
  totalCopies: number;
  availableCopies: number;
  description: string;
  hasPdf: boolean;
  image: string;
}

@Component({
  selector: 'app-admin-catalog',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    ButtonModule,
    InputTextModule,
    TagModule,
    DialogModule
  ],
  templateUrl: './catalog.html',
  styleUrls: ['./catalog.css']
})
export class AdminCatalog implements OnInit {
  private router = inject(Router);
  private apiService = inject(ApiService);

  dbCategories: Category[] = [];
  dbAuthors: any[] = [];
  books: Book[] = [];

  // Categoría seleccionada para filtro (0 = Todos)
  selectedCategoryId: number = 0;

  // Search query
  searchQuery: string = '';

  // Book Detail Dialog State
  displayDetailDialog: boolean = false;
  selectedBook: Book | null = null;

  // PDF Preview Dialog State
  displayPdfDialog: boolean = false;

  ngOnInit(): void {
    const userStr = localStorage.getItem('currentUser');
    if (!userStr || JSON.parse(userStr).role !== 'admin') {
      this.router.navigate(['/login']);
      return;
    }
    this.loadBooks();
  }

  loadBooks(): void {
    // 1. Cargar Categorías desde API
    this.apiService.getCategories().subscribe({
      next: (res) => {
        if (res && res.data) {
          this.dbCategories = res.data;
          localStorage.setItem('categories', JSON.stringify(this.dbCategories));
        } else {
          this.loadCategoriesLocal();
        }
      },
      error: () => this.loadCategoriesLocal()
    });

    // 2. Cargar Autores desde API
    this.apiService.getAuthors().subscribe({
      next: (res) => {
        if (res && res.data) {
          this.dbAuthors = res.data;
          localStorage.setItem('authors', JSON.stringify(this.dbAuthors));
        } else {
          this.loadAuthorsLocal();
        }
      },
      error: () => this.loadAuthorsLocal()
    });

    // 3. Cargar Libros desde API
    this.apiService.getBooks().subscribe({
      next: (res) => {
        if (res && res.data) {
          this.books = res.data;
          this.processBooks();
        } else {
          this.loadBooksLocal();
        }
      },
      error: () => this.loadBooksLocal()
    });
  }

  private loadCategoriesLocal(): void {
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
    }
  }

  private loadAuthorsLocal(): void {
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
    }
  }

  private loadBooksLocal(): void {
    const storedBooks = localStorage.getItem('books');
    if (storedBooks) {
      this.books = JSON.parse(storedBooks);
    }
    this.processBooks();
  }

  private processBooks(): void {
    this.books.forEach(book => {
      if (!book.idCategory && book.categoryName) {
        const matchedCat = this.dbCategories.find(c => c.name === book.categoryName);
        if (matchedCat) book.idCategory = matchedCat.idCategory;
      }
      const cat = this.dbCategories.find(c => c.idCategory === book.idCategory);
      book.categoryName = cat ? cat.name : (book.categoryName || 'Sin Categoría');

      if (!book.authorName && book.idAuthor) {
        const auth = this.dbAuthors.find(a => a.idAuthor === book.idAuthor);
        book.authorName = auth ? `${auth.firstName} ${auth.surName}` : 'Desconocido';
      }
    });
    localStorage.setItem('books', JSON.stringify(this.books));
  }

  get filteredBooks(): Book[] {
    return this.books.filter(book => {
      const matchesSearch = book.title.toLowerCase().includes(this.searchQuery.toLowerCase()) ||
                            book.authorName.toLowerCase().includes(this.searchQuery.toLowerCase());
      const matchesCategory = this.selectedCategoryId === 0 || book.idCategory === this.selectedCategoryId;
      return matchesSearch && matchesCategory;
    });
  }

  viewBookDetail(book: Book): void {
    this.selectedBook = book;
    this.displayDetailDialog = true;
  }

  openPdfView(): void {
    this.displayPdfDialog = true;
  }
}
