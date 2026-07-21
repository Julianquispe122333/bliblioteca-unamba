import { Component, inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { CardModule } from 'primeng/card';
import { TagModule } from 'primeng/tag';
import { ButtonModule } from 'primeng/button';
import { ToastModule } from 'primeng/toast';
import { TooltipModule } from 'primeng/tooltip';
import { MessageService } from 'primeng/api';

interface Reservation {
  idReservation: number;
  code: string;
  studentName: string;
  universityCode: string;
  email: string;
  bookTitle: string;
  bookTitles?: string[];
  status: 'Pendiente' | 'Atendido' | 'Vencido';
  expirationDate: string;
  createdAt: string;
}

@Component({
  selector: 'app-student-reservations',
  standalone: true,
  imports: [
    CommonModule,
    CardModule,
    TagModule,
    ButtonModule,
    ToastModule,
    TooltipModule
  ],
  templateUrl: './reservations.html',
  styleUrls: ['./reservations.css'],
  providers: [MessageService]
})
export class StudentReservations implements OnInit {
  private router = inject(Router);
  private messageService = inject(MessageService);

  studentName: string = '';
  reservations: Reservation[] = [];
  activeLoans: any[] = [];

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

    this.loadReservations();
  }

  loadReservations(): void {
    // Generar un préstamo vencido de prueba para el Estudiante si no tiene ningún préstamo
    let storedReservations = localStorage.getItem('reservations');
    let storedLoans = localStorage.getItem('loans');
    let reservationsList: Reservation[] = storedReservations ? JSON.parse(storedReservations) : [];
    let loansList: any[] = storedLoans ? JSON.parse(storedLoans) : [];

    // Limpieza de datos obsoletos de RES-VENCIDO
    if (reservationsList.some(r => r.code === 'RES-VENCIDO') || loansList.some(l => l.reservationCode === 'RES-VENCIDO')) {
      reservationsList = reservationsList.filter(r => r.code !== 'RES-VENCIDO');
      loansList = loansList.filter(l => l.reservationCode !== 'RES-VENCIDO');
      localStorage.setItem('reservations', JSON.stringify(reservationsList));
      localStorage.setItem('loans', JSON.stringify(loansList));
    }

    const hasOverdue = loansList.some(l => l.studentName === this.studentName && l.status === 'Vencido');
    if (!hasOverdue && this.studentName === 'Estudiante UNAMBA') {
      const expiredResCode = 'RES9818';
      
      // 1. Agregar reserva de prueba
      if (!reservationsList.some(r => r.code === expiredResCode)) {
        reservationsList.push({
          idReservation: reservationsList.length + 1,
          code: expiredResCode,
          studentName: this.studentName,
          universityCode: 'EST675839',
          email: 'estudiante.unamba@unamba.edu.pe',
          bookTitles: ['Física Universitaria'],
          bookTitle: 'Física Universitaria',
          status: 'Atendido',
          expirationDate: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString().split('T')[0], // ayer
          createdAt: new Date(Date.now() - 9 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]
        });
        localStorage.setItem('reservations', JSON.stringify(reservationsList));
      }

      // 2. Agregar préstamo vencido (hace 8 días, límite de entrega fue ayer)
      if (!loansList.some(l => l.reservationCode === expiredResCode)) {
        loansList.push({
          idLoan: loansList.length + 1,
          reservationCode: expiredResCode,
          bookTitle: 'Física Universitaria',
          studentName: this.studentName,
          loanDate: new Date(Date.now() - 8 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
          dueDate: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString().split('T')[0], // venció ayer
          returnDate: null,
          status: 'Vencido',
          loanBooks: [{ title: 'Física Universitaria', returned: false }]
        });
        localStorage.setItem('loans', JSON.stringify(loansList));
      }
      
      // Recargar variables
      storedReservations = localStorage.getItem('reservations');
      storedLoans = localStorage.getItem('loans');
    }

    if (storedReservations) {
      const allReservations: Reservation[] = JSON.parse(storedReservations);
      const today = new Date().toISOString().split('T')[0];
      let modified = false;

      // Cargar libros actuales para devolver stock
      const storedBooks = localStorage.getItem('books');
      let booksList: any[] = storedBooks ? JSON.parse(storedBooks) : [];

      allReservations.forEach(r => {
        if (r.status === 'Pendiente' && r.expirationDate < today) {
          r.status = 'Vencido';
          modified = true;

          // Devolver libros al stock
          const titles = r.bookTitles || [r.bookTitle];
          titles.forEach(t => {
            const book = booksList.find(b => b.title === t);
            if (book) {
              book.availableCopies++;
            }
          });
        }
      });

      if (modified) {
        localStorage.setItem('reservations', JSON.stringify(allReservations));
        localStorage.setItem('books', JSON.stringify(booksList));
      }

      this.reservations = allReservations
        .filter(r => r.studentName === this.studentName)
        .reverse();
    }

    if (storedLoans) {
      const allLoans: any[] = JSON.parse(storedLoans);
      const today = new Date().toISOString().split('T')[0];
      
      this.activeLoans = allLoans
        .filter(l => l.studentName === this.studentName)
        .map(l => {
          if (l.status === 'Prestado' && l.dueDate < today) {
            l.status = 'Vencido';
          }
          return l;
        })
        .reverse();
    }
  }

  copyCode(code: string): void {
    navigator.clipboard.writeText(code).then(() => {
      this.messageService.add({ severity: 'success', summary: 'Copiado', detail: 'Código copiado al portapapeles', life: 2000 });
    });
  }

  goToCatalog(): void {
    this.router.navigate(['/student/catalog']);
  }

  isReservationFullyReturned(code: string): boolean {
    const loan = this.activeLoans.find(l => l.reservationCode === code);
    if (!loan) return false;
    if (loan.status === 'Devuelto') return true;
    if (loan.loanBooks && loan.loanBooks.length > 0) {
      return loan.loanBooks.every((lb: any) => lb.returned);
    }
    return false;
  }

  isReservationOverdue(code: string): boolean {
    const loan = this.activeLoans.find(l => l.reservationCode === code);
    return loan ? loan.status === 'Vencido' : false;
  }

  getTargetDate(res: Reservation): string {
    // Si está Pendiente o Vencido (sin retirar)
    if (res.status === 'Pendiente' || res.status === 'Vencido') {
      return res.expirationDate; // Vence al día siguiente (creación + 1 día)
    }
    
    // Si ya está Atendido (en préstamo, devuelto o vencido en préstamo)
    const loan = this.activeLoans.find(l => l.reservationCode === res.code);
    if (loan) {
      if (loan.status === 'Devuelto' && loan.returnDate) {
        return loan.returnDate; // Fecha de devolución real
      }
      return loan.dueDate; // Fecha límite de entrega (préstamo + 7 días)
    }
    
    return res.expirationDate;
  }
}
