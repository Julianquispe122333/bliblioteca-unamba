import { Component, inject, OnInit, OnDestroy, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { CardModule } from 'primeng/card';
import { TagModule } from 'primeng/tag';
import { ButtonModule } from 'primeng/button';
import { ToastModule } from 'primeng/toast';
import { TooltipModule } from 'primeng/tooltip';
import { MessageService } from 'primeng/api';
import { forkJoin, of } from 'rxjs';
import { catchError } from 'rxjs/operators';
import { ApiService } from '../../../service/api.service';

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
export class StudentReservations implements OnInit, OnDestroy {
  private router = inject(Router);
  private messageService = inject(MessageService);
  private apiService = inject(ApiService);

  studentName: string = '';
  reservations: Reservation[] = [];
  activeLoans: any[] = [];
  private expirationInterval: any;

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

    // Check expiration every 5 seconds in real-time
    this.expirationInterval = setInterval(() => {
      this.loadReservationsLocal();
    }, 5000);
  }

  ngOnDestroy(): void {
    if (this.expirationInterval) {
      clearInterval(this.expirationInterval);
    }
  }

  private cdr = inject(ChangeDetectorRef);

  loadReservations(): void {
    const studentToFind = this.studentName || 'Estudiante UNAMBA';

    // PASO 1: Mostrar datos de localStorage al instante
    this.loadReservationsLocal();
    const storedLoans = localStorage.getItem('loans');
    if (storedLoans) this.activeLoans = JSON.parse(storedLoans);
    this.cdr.markForCheck();
    this.cdr.detectChanges();

    // PASO 2: Refrescar desde la API
    forkJoin({
      studentRes: this.apiService.getStudentReservations(studentToFind).pipe(catchError(() => of(null))),
      allRes: this.apiService.getReservations().pipe(catchError(() => of(null))),
      loans: this.apiService.getLoans().pipe(catchError(() => of(null)))
    }).subscribe(({ studentRes, allRes, loans }) => {
      if (loans?.data) {
        this.activeLoans = loans.data;
      }
      
      let list: Reservation[] = [];
      if (studentRes?.data && studentRes.data.length > 0) {
        list = studentRes.data;
      } else if (allRes?.data && allRes.data.length > 0) {
        list = allRes.data.filter(
          (r: any) => !r.studentName || r.studentName.toLowerCase() === studentToFind.toLowerCase() || studentToFind === 'Estudiante UNAMBA'
        );
        if (list.length === 0) {
          list = allRes.data;
        }
      }

      this.reservations = list;
      localStorage.setItem('reservations', JSON.stringify(this.reservations));

      this.cdr.markForCheck();
      this.cdr.detectChanges();
    });
  }

  private syncLoans(): void {
    this.apiService.getLoans().subscribe({
      next: (res) => {
        if (res && res.data) {
          this.activeLoans = res.data;
        }
      },
      error: () => {}
    });
  }

  loadReservationsLocal(): void {
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

    if (storedReservations) {
      const allReservations: Reservation[] = JSON.parse(storedReservations);
      const nowTime = new Date().getTime();
      let modified = false;
      const storedBooks = localStorage.getItem('books');
      let booksList: any[] = storedBooks ? JSON.parse(storedBooks) : [];

      allReservations.forEach(r => {
        const expTime = r.expirationDate ? new Date(r.expirationDate).getTime() : 0;
        if (r.status === 'Pendiente' && expTime > 0 && expTime < nowTime) {
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
        // Disparar evento para actualizar catálogo en el frontend si es necesario
        window.dispatchEvent(new Event('storage'));
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
