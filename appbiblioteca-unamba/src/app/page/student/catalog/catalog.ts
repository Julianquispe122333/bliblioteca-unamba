import { Component, inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { ButtonModule } from 'primeng/button';
import { InputTextModule } from 'primeng/inputtext';
import { CardModule } from 'primeng/card';
import { TagModule } from 'primeng/tag';
import { DialogModule } from 'primeng/dialog';
import { ToastModule } from 'primeng/toast';
import { MessageService } from 'primeng/api';
import { BadgeModule } from 'primeng/badge';
import { TooltipModule } from 'primeng/tooltip';
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
  categoryName?: string; // Para mostrar en la vista
  totalCopies: number;
  availableCopies: number;
  description: string;
  hasPdf: boolean;
  image: string;
}

interface Reservation {
  idReservation: number;
  code: string;
  studentName: string;
  universityCode: string;
  email: string;
  bookTitles: string[];
  bookTitle: string;
  status: 'Pendiente' | 'Atendido' | 'Vencido';
  expirationDate: string;
  createdAt: string;
}

@Component({
  selector: 'app-student-catalog',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    ButtonModule,
    InputTextModule,
    CardModule,
    TagModule,
    DialogModule,
    ToastModule,
    BadgeModule,
    TooltipModule
  ],
  templateUrl: './catalog.html',
  styleUrls: ['./catalog.css'],
  providers: [MessageService]
})
export class StudentCatalog implements OnInit {
  private router = inject(Router);
  private messageService = inject(MessageService);
  private apiService = inject(ApiService);

  studentName: string = '';
  searchQuery: string = '';
  selectedCategoryId: number = 0; // 0 = Todos

  dbCategories: Category[] = [];
  dbAuthors: any[] = [];
  books: Book[] = [];

  // Cart: selected books for a single reservation
  selectedBooks: Book[] = [];
  displayCartDialog: boolean = false;

  // Book Detail Dialog State
  displayDetailDialog: boolean = false;
  selectedBook: Book | null = null;

  // PDF Preview Dialog State
  displayPdfDialog: boolean = false;

  // Success Dialog State
  displaySuccessDialog: boolean = false;
  lastReservationCode: string = '';

  ngOnInit(): void {
    const userStr = localStorage.getItem('currentUser');
    if (userStr) {
      const user = JSON.parse(userStr);
      if (user.role !== 'student') {
        this.router.navigate(['/login']);
        return;
      }
      this.studentName = user.username;
    } else {
      this.router.navigate(['/login']);
      return;
    }

    this.loadBooks();
  }

  loadBooks(): void {
    this.loadCategoriesAndAuthors();

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

  private loadCategoriesAndAuthors(): void {
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
    if (storedBooks) {
      this.books = JSON.parse(storedBooks);
    } else {
      this.books = [
        { idBook: 1, idCategory: 1, idAuthor: 1, title: 'Introducción a la Programación con Python', authorName: 'John Smith', totalCopies: 5, availableCopies: 5, description: 'Guía introductoria para aprender Python paso a paso.', hasPdf: true, image: 'https://images.unsplash.com/photo-1515879218367-8466d910aaa4?w=400&q=80' },
        { idBook: 2, idCategory: 2, idAuthor: 2, title: 'Cálculo de una Variable', authorName: 'James Stewart', totalCopies: 3, availableCopies: 2, description: 'Libro de texto clásico de cálculo riguroso.', hasPdf: false, image: 'https://images.unsplash.com/photo-1635070041078-e363dbe005cb?w=400&q=80' },
        { idBook: 3, idCategory: 3, idAuthor: 3, title: 'Física Universitaria', authorName: 'Sears & Zemansky', totalCopies: 2, availableCopies: 2, description: 'Referencia para estudiantes de ciencias para dominar la física.', hasPdf: true, image: 'https://images.unsplash.com/photo-1507668077129-56e32842fceb?w=400&q=80' },
        { idBook: 5, idCategory: 2, idAuthor: 5, title: 'Álgebra Lineal y sus Aplicaciones', authorName: 'Gilbert Strang', totalCopies: 1, availableCopies: 0, description: 'Conceptos fundamentales de matrices y espacios vectoriales.', hasPdf: false, image: 'https://images.unsplash.com/photo-1456513080510-7bf3a84b82f8?w=400&q=80' }
      ];
    }
    this.processBooks();
  }

  get filteredBooks(): Book[] {
    const query = (this.searchQuery || '').toLowerCase().trim();
    return this.books.filter(book => {
      const title = (book.title || '').toLowerCase();
      const author = (book.authorName || '').toLowerCase();
      const matchesSearch = !query || title.includes(query) || author.includes(query);
      const matchesCategory = this.selectedCategoryId === 0 || book.idCategory === this.selectedCategoryId;
      return matchesSearch && matchesCategory;
    });
  }

  isInCart(book: Book): boolean {
    return this.selectedBooks.some(b => b.idBook === book.idBook);
  }

  toggleBookSelection(book: Book, event?: Event): void {
    if (event) event.stopPropagation();

    if (book.availableCopies <= 0 && !this.isInCart(book)) {
      this.messageService.add({ severity: 'warn', summary: 'Sin stock', detail: 'Este libro no tiene copias disponibles.', life: 2000 });
      return;
    }

    const index = this.selectedBooks.findIndex(b => b.idBook === book.idBook);
    if (index !== -1) {
      this.selectedBooks.splice(index, 1);
    } else {
      this.selectedBooks.push(book);
    }
  }

  openCartDialog(): void {
    if (this.selectedBooks.length === 0) {
      this.messageService.add({ severity: 'warn', summary: 'Selección vacía', detail: 'Selecciona al menos un libro para generar tu reserva.', life: 2500 });
      return;
    }
    this.displayCartDialog = true;
  }

  removeFromCart(book: Book): void {
    this.selectedBooks = this.selectedBooks.filter(b => b.idBook !== book.idBook);
    if (this.selectedBooks.length === 0) {
      this.displayCartDialog = false;
    }
  }

  confirmReservation(): void {
    const titles = this.selectedBooks.map(b => b.title);
    this.apiService.createReservation({
      studentName: this.studentName,
      bookTitles: titles
    }).subscribe({
      next: (res) => {
        const code = (res && res.data && res.data.code) ? res.data.code : ('RES' + Math.floor(1000 + Math.random() * 9000));
        this.confirmReservationSuccess(code);
      },
      error: () => {
        this.confirmReservationLocal();
      }
    });
  }

  private confirmReservationSuccess(code: string): void {
    this.selectedBooks = [];
    this.displayCartDialog = false;
    this.displayDetailDialog = false;
    this.lastReservationCode = code;
    this.displaySuccessDialog = true;
    this.loadBooks();
  }

  private confirmReservationLocal(): void {
    const randomCode = 'RES' + Math.floor(1000 + Math.random() * 9000);
    const titles = this.selectedBooks.map(b => b.title);

    // Reduce stock for each selected book
    for (const selectedBook of this.selectedBooks) {
      const mainIndex = this.books.findIndex(b => b.idBook === selectedBook.idBook);
      if (mainIndex !== -1) {
        this.books[mainIndex].availableCopies--;
      }
    }
    localStorage.setItem('books', JSON.stringify(this.books));

    // Create one reservation for all books
    const allReservationsStr = localStorage.getItem('reservations') || '[]';
    const allReservations: Reservation[] = JSON.parse(allReservationsStr);

    const newReservation: Reservation = {
      idReservation: allReservations.length + 1,
      code: randomCode,
      studentName: this.studentName,
      universityCode: 'EST' + Math.floor(100000 + Math.random() * 900000),
      email: this.studentName.toLowerCase().replace(/\s/g, '.') + '@unamba.edu.pe',
      bookTitles: titles,
      bookTitle: titles.join(', '),
      status: 'Pendiente',
      expirationDate: new Date(Date.now() + 1 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
      createdAt: new Date().toISOString().split('T')[0]
    };

    allReservations.push(newReservation);
    localStorage.setItem('reservations', JSON.stringify(allReservations));

    this.confirmReservationSuccess(randomCode);
  }

  viewBookDetail(book: Book): void {
    this.selectedBook = book;
    this.displayDetailDialog = true;
  }

  openPdfView(): void {
    this.displayPdfDialog = true;
  }

  copyCode(code: string): void {
    navigator.clipboard.writeText(code).then(() => {
      this.messageService.add({ severity: 'success', summary: 'Copiado', detail: 'Código copiado al portapapeles', life: 2000 });
    });
  }
}
