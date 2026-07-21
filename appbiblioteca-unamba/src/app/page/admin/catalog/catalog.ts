import { Component, inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { ButtonModule } from 'primeng/button';
import { InputTextModule } from 'primeng/inputtext';
import { TagModule } from 'primeng/tag';
import { DialogModule } from 'primeng/dialog';

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
    // Cargar Categorías
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

    // Cargar Autores
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

    // Cargar Libros
    const storedBooks = localStorage.getItem('books');
    if (storedBooks) {
      this.books = JSON.parse(storedBooks);
    }

    // Mapear nombres de categorías a los libros para mostrar en UI y migrar datos
    this.books.forEach(book => {
      // Migración
      if (!book.idCategory && book.categoryName) {
        const matchedCat = this.dbCategories.find(c => c.name === book.categoryName);
        if (matchedCat) book.idCategory = matchedCat.idCategory;
      }

      const cat = this.dbCategories.find(c => c.idCategory === book.idCategory);
      book.categoryName = cat ? cat.name : 'Sin Categoría';
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
