import { Component, inject, OnInit, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { ButtonModule } from 'primeng/button';
import { InputTextModule } from 'primeng/inputtext';
import { TagModule } from 'primeng/tag';
import { DialogModule } from 'primeng/dialog';
import { forkJoin, of } from 'rxjs';
import { catchError } from 'rxjs/operators';
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
  private readonly router = inject(Router);
  private readonly apiService = inject(ApiService);

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

  private readonly cdr = inject(ChangeDetectorRef);

  loadBooks(): void {
    // Cargar datos de manera reactiva desde almacenamiento local primero
    this.retrieveLocalCategories();
    this.retrieveLocalAuthors();
    this.retrieveLocalBooks();
    this.cdr.detectChanges();

    // Actualizar datos del backend en segundo plano
    forkJoin({
      catList: this.apiService.getCategories().pipe(catchError(() => of(null))),
      authList: this.apiService.getAuthors().pipe(catchError(() => of(null))),
      bookList: this.apiService.getBooks().pipe(catchError(() => of(null)))
    }).subscribe(({ catList, authList, bookList }) => {
      if (catList?.data) {
        this.dbCategories = catList.data;
        localStorage.setItem('categories', JSON.stringify(this.dbCategories));
      }
      if (authList?.data) {
        this.dbAuthors = authList.data;
        localStorage.setItem('authors', JSON.stringify(this.dbAuthors));
      }
      if (bookList?.data) {
        this.books = bookList.data;
        this.formatBooksInfo();
      }
      this.cdr.detectChanges();
    });
  }

  private retrieveLocalCategories(): void {
    const rawCategories = localStorage.getItem('categories');
    if (rawCategories) {
      this.dbCategories = JSON.parse(rawCategories);
    } else {
      this.dbCategories = [
        { idCategory: 1, name: 'Sistemas' },
        { idCategory: 2, name: 'Matemática' },
        { idCategory: 3, name: 'Física' },
        { idCategory: 4, name: 'Literatura' }
      ];
    }
  }

  private retrieveLocalAuthors(): void {
    const rawAuthors = localStorage.getItem('authors');
    if (rawAuthors) {
      this.dbAuthors = JSON.parse(rawAuthors);
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

  private retrieveLocalBooks(): void {
    const rawBooks = localStorage.getItem('books');
    if (rawBooks) {
      this.books = JSON.parse(rawBooks);
    }
    this.formatBooksInfo();
  }

  private formatBooksInfo(): void {
    this.books.forEach(b => {
      if (!b.idCategory && b.categoryName) {
        const found = this.dbCategories.find(c => c.name === b.categoryName);
        if (found) b.idCategory = found.idCategory;
      }
      const category = this.dbCategories.find(c => c.idCategory === b.idCategory);
      b.categoryName = category ? category.name : (b.categoryName || 'Sin Categoría');

      if (!b.authorName && b.idAuthor) {
        const author = this.dbAuthors.find(a => a.idAuthor === b.idAuthor);
        b.authorName = author ? `${author.firstName} ${author.surName}` : 'Desconocido';
      }
    });
    localStorage.setItem('books', JSON.stringify(this.books));
  }

  get filteredBooks(): Book[] {
    return this.books.filter(b => {
      const matchText = (b.title || '').toLowerCase().includes(this.searchQuery.toLowerCase()) ||
                        (b.authorName || '').toLowerCase().includes(this.searchQuery.toLowerCase());
      const matchCat = this.selectedCategoryId === 0 || b.idCategory === this.selectedCategoryId;
      return matchText && matchCat;
    });
  }

  viewBookDetail(b: Book): void {
    this.selectedBook = b;
    this.displayDetailDialog = true;
  }

  openPdfView(): void {
    this.displayPdfDialog = true;
  }
}
