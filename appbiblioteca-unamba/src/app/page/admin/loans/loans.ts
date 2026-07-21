import { Component, inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { ButtonModule } from 'primeng/button';
import { TableModule } from 'primeng/table';
import { DialogModule } from 'primeng/dialog';
import { InputTextModule } from 'primeng/inputtext';
import { TagModule } from 'primeng/tag';
import { ToastModule } from 'primeng/toast';
import { MessageService } from 'primeng/api';
import { CheckboxModule } from 'primeng/checkbox';

interface Book {
  idBook: number;
  title: string;
  availableCopies: number;
  authorName?: string;
  categoryName?: string;
}

interface Reservation {
  idReservation: number;
  code: string;
  studentName: string;
  universityCode: string;
  email: string;
  bookTitle: string;
  status: 'Pendiente' | 'Atendido' | 'Vencido';
  expirationDate: string;
  createdAt: string;
}

interface LoanBookStatus {
  title: string;
  returned: boolean;
}

interface Loan {
  idLoan: number;
  reservationCode: string;
  bookTitle: string;
  loanBooks: LoanBookStatus[];
  studentName: string;
  loanDate: string;
  dueDate: string;
  returnDate: string | null;
  status: 'Prestado' | 'Devuelto' | 'Vencido';
}

@Component({
  selector: 'app-loan-management',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    ButtonModule,
    TableModule,
    DialogModule,
    InputTextModule,
    TagModule,
    ToastModule,
    CheckboxModule
  ],
  templateUrl: './loans.html',
  styleUrls: ['./loans.css'],
  providers: [MessageService]
})
export class LoanManagement implements OnInit {
  private router = inject(Router);
  private messageService = inject(MessageService);

  books: Book[] = [];
  reservations: Reservation[] = [];
  loans: Loan[] = [];

  // Search Reservation by Code
  searchReservationCode: string = '';
  foundReservation: Reservation | null = null;
  displayLoanDialog: boolean = false;

  // Search Loan by Code for Return
  searchReturnCode: string = '';
  foundLoan: Loan | null = null;
  displayReturnDialog: boolean = false;
  
  booksReturningNow: string[] = [];

  // Tab state
  activeTab: 'pending' | 'active' | 'history' = 'pending';

  // Computed sub-lists for tabs
  get pendingReservations(): Reservation[] {
    return this.reservations.filter(r => r.status === 'Pendiente');
  }

  get activeLoans(): Loan[] {
    return this.loans.filter(l => l.status === 'Prestado' || l.status === 'Vencido');
  }

  ngOnInit(): void {
    const userStr = localStorage.getItem('currentUser');
    if (!userStr || JSON.parse(userStr).role !== 'admin') {
      this.router.navigate(['/login']);
      return;
    }

    this.loadData();
  }

  loadData(): void {
    const storedBooks = localStorage.getItem('books');
    if (storedBooks) {
      this.books = JSON.parse(storedBooks);
    }

    const storedReservations = localStorage.getItem('reservations');
    if (storedReservations) {
      this.reservations = JSON.parse(storedReservations);
      // Expire reservations if dates have passed
      const today = new Date().toISOString().split('T')[0];
      let resModified = false;
      this.reservations.forEach(r => {
        if (r.status === 'Pendiente' && r.expirationDate < today) {
          r.status = 'Vencido';
          resModified = true;

          // Devolver copia al stock
          const titles = r.bookTitle.split(',');
          titles.forEach(t => {
            const book = this.books.find(b => b.title.trim().toLowerCase() === t.trim().toLowerCase());
            if (book) {
              book.availableCopies++;
            }
          });
        }
      });
      if (resModified) {
        localStorage.setItem('reservations', JSON.stringify(this.reservations));
        localStorage.setItem('books', JSON.stringify(this.books));
      }
    }

    const storedLoans = localStorage.getItem('loans');
    if (storedLoans) {
      this.loans = JSON.parse(storedLoans);
      const today = new Date().toISOString().split('T')[0];
      let modified = false;
      this.loans.forEach(loan => {
        if (!loan.loanBooks) {
          loan.loanBooks = loan.bookTitle.split(',').map(t => ({
            title: t.trim(),
            returned: loan.status === 'Devuelto'
          }));
          modified = true;
        }
        // Check loan expiration
        if (loan.status === 'Prestado' && loan.dueDate < today) {
          loan.status = 'Vencido';
          modified = true;
        }
      });
      if (modified) {
        localStorage.setItem('loans', JSON.stringify(this.loans));
      }
    }
  }

  searchReservation(): void {
    if (!this.searchReservationCode.trim()) {
      this.messageService.add({ severity: 'warn', summary: 'Campo vacío', detail: 'Por favor ingrese un código de reserva.' });
      return;
    }

    const code = this.searchReservationCode.trim().toUpperCase();
    const match = this.reservations.find(r => r.code === code);

    if (match) {
      if (match.status === 'Atendido') {
        this.messageService.add({ 
          severity: 'error', 
          summary: 'Código Ya Usado', 
          detail: 'Esta reserva ya fue atendida y los libros fueron entregados.' 
        });
        return;
      }
      if (match.status === 'Vencido') {
        this.messageService.add({ 
          severity: 'error', 
          summary: 'Reserva Vencida', 
          detail: 'Esta reserva ya expiró y no se puede atender.' 
        });
        return;
      }
      this.foundReservation = match;
      this.displayLoanDialog = true;
    } else {
      this.messageService.add({ severity: 'error', summary: 'No encontrado', detail: 'No existe ninguna reserva con ese código.' });
    }
  }

  registerLoanFromReservation(): void {
    if (!this.foundReservation) return;

    if (this.foundReservation.status !== 'Pendiente') {
      this.messageService.add({ 
        severity: 'warn', 
        summary: 'Reserva no disponible', 
        detail: `Esta reserva ya fue ${this.foundReservation.status.toLowerCase()}.` 
      });
      return;
    }

    // Update reservation status to Atendido
    this.foundReservation.status = 'Atendido';
    localStorage.setItem('reservations', JSON.stringify(this.reservations));

    // Create loan
    const newLoan: Loan = {
      idLoan: this.loans.length + 1,
      reservationCode: this.foundReservation.code,
      bookTitle: this.foundReservation.bookTitle,
      studentName: this.foundReservation.studentName,
      loanDate: new Date().toISOString().split('T')[0],
      dueDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
      returnDate: null,
      status: 'Prestado',
      loanBooks: this.foundReservation.bookTitle.split(',').map(t => ({
        title: t.trim(),
        returned: false
      }))
    };

    this.loans.push(newLoan);
    localStorage.setItem('loans', JSON.stringify(this.loans));

    this.messageService.add({ 
      severity: 'success', 
      summary: 'Préstamo Registrado', 
      detail: `Préstamo del libro "${this.foundReservation.bookTitle}" fue registrado con éxito.` 
    });

    this.displayLoanDialog = false;
    this.searchReservationCode = '';
    this.foundReservation = null;
  }

  searchReturn(): void {
    if (!this.searchReturnCode.trim()) {
      this.messageService.add({ severity: 'warn', summary: 'Campo vacío', detail: 'Por favor ingrese un código de préstamo.' });
      return;
    }

    const code = this.searchReturnCode.trim().toUpperCase();
    const match = this.loans.find(l => l.reservationCode === code && (l.status === 'Prestado' || l.status === 'Vencido'));

    if (match) {
      this.foundLoan = match;
      this.booksReturningNow = match.loanBooks.filter(lb => !lb.returned).map(lb => lb.title);
      this.displayReturnDialog = true;
    } else {
      this.messageService.add({ severity: 'error', summary: 'No encontrado', detail: 'No se encontró ningún préstamo activo o vencido con ese código.' });
    }
  }

  getPendingBooks(): {title: string, returned: boolean}[] {
    if (!this.foundLoan) return [];
    return this.foundLoan.loanBooks.filter(lb => !lb.returned);
  }

  confirmReturnBook(): void {
    if (!this.foundLoan || this.booksReturningNow.length === 0) return;
    
    let returnedCount = 0;
    this.booksReturningNow.forEach(title => {
      const lb = this.foundLoan!.loanBooks.find(b => b.title === title);
      if (lb && !lb.returned) {
        lb.returned = true;
        returnedCount++;
        // Increment stock
        if (this.books.length > 0) {
          const book = this.books.find(b => b.title === title);
          if (book) book.availableCopies++;
        }
      }
    });

    const allReturned = this.foundLoan.loanBooks.every(lb => lb.returned);
    if (allReturned) {
      this.foundLoan.status = 'Devuelto';
      this.foundLoan.returnDate = new Date().toISOString().split('T')[0];
    }

    localStorage.setItem('books', JSON.stringify(this.books));
    localStorage.setItem('loans', JSON.stringify(this.loans));
    
    this.messageService.add({ severity: 'success', summary: 'Devuelto', detail: `Se devolvieron ${returnedCount} libro(s) correctamente.` });
    
    this.displayReturnDialog = false;
    this.searchReturnCode = '';
    this.foundLoan = null;
  }

  returnBook(loan: Loan): void {
    this.foundLoan = loan;
    this.booksReturningNow = loan.loanBooks.filter(lb => !lb.returned).map(lb => lb.title);
    this.displayReturnDialog = true;
  }

  getBookAuthor(title: string): string {
    const book = this.books.find(b => b.title.trim().toLowerCase() === title.trim().toLowerCase());
    return (book && book.authorName) ? book.authorName : 'Autor no registrado';
  }

  getBookCategory(title: string): string {
    const book = this.books.find(b => b.title.trim().toLowerCase() === title.trim().toLowerCase());
    return (book && book.categoryName) ? book.categoryName : 'Sin Categoría';
  }
}
