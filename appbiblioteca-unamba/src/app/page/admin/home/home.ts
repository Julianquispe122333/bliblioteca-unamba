import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { TableModule } from 'primeng/table';
import { TagModule } from 'primeng/tag';
import { ButtonModule } from 'primeng/button';
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
  status: 'Pendiente' | 'Atendido' | 'Vencido';
  expirationDate: string;
  createdAt: string;
}

@Component({
  selector: 'app-admin-home',
  standalone: true,
  imports: [CommonModule, TableModule, TagModule, ButtonModule],
  templateUrl: './home.html',
  styleUrls: ['./home.css']
})
export class AdminHome implements OnInit {
  private router = inject(Router);
  private apiService = inject(ApiService);

  adminName: string = '';
  totalBooks: number = 0;
  pendingReservationsCount: number = 0;
  activeLoansCount: number = 0;
  overdueLoansCount: number = 0;
  pendingReservations: Reservation[] = [];

  get today(): string {
    return new Date().toLocaleDateString('es-PE', {
      weekday: 'long', year: 'numeric', month: 'long', day: 'numeric'
    });
  }

  ngOnInit(): void {
    const userStr = localStorage.getItem('currentUser');
    if (userStr) {
      const user = JSON.parse(userStr);
      if (user.role !== 'admin') {
        this.router.navigate(['/login']);
        return;
      }
      this.adminName = user.username;
    } else {
      this.router.navigate(['/login']);
      return;
    }
    this.calculateStats();
  }

  calculateStats(): void {
    forkJoin({
      stats: this.apiService.getAdminStats().pipe(catchError(() => of(null))),
      reservations: this.apiService.getReservations().pipe(catchError(() => of(null)))
    }).subscribe(({ stats, reservations }) => {
      if (stats?.data) {
        this.totalBooks = stats.data.totalBooks || 0;
        this.pendingReservationsCount = stats.data.pendingReservationsCount || 0;
        this.activeLoansCount = stats.data.activeLoansCount || 0;
        this.overdueLoansCount = stats.data.overdueLoansCount || 0;
      } else {
        // Fallback local
        const storedBooks = localStorage.getItem('books');
        if (storedBooks) this.totalBooks = JSON.parse(storedBooks).length;
        const storedLoans = localStorage.getItem('loans');
        if (storedLoans) {
          const loans = JSON.parse(storedLoans);
          const today = new Date().toISOString().split('T')[0];
          loans.forEach((l: any) => { if (l.status === 'Prestado' && l.dueDate < today) l.status = 'Vencido'; });
          this.activeLoansCount = loans.filter((l: any) => l.status === 'Prestado').length;
          this.overdueLoansCount = loans.filter((l: any) => l.status === 'Vencido').length;
        }
      }
      if (reservations?.data) {
        this.pendingReservations = reservations.data.filter((r: any) => r.status === 'Pendiente');
        this.pendingReservationsCount = this.pendingReservations.length;
      } else {
        const storedReservations = localStorage.getItem('reservations');
        if (storedReservations) {
          const allRes = JSON.parse(storedReservations);
          this.pendingReservations = allRes.filter((r: any) => r.status === 'Pendiente');
          this.pendingReservationsCount = this.pendingReservations.length;
        }
      }
    });
  }

  goToLoans(): void { this.router.navigate(['/admin/loans']); }
  goToBooks(): void  { this.router.navigate(['/admin/books']); }
}
