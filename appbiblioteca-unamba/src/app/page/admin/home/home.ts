import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { TableModule } from 'primeng/table';
import { TagModule } from 'primeng/tag';
import { ButtonModule } from 'primeng/button';
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
    this.apiService.getAdminStats().subscribe({
      next: (res) => {
        if (res && res.data) {
          this.totalBooks = res.data.totalBooks || 0;
          this.pendingReservationsCount = res.data.pendingReservationsCount || 0;
          this.activeLoansCount = res.data.activeLoansCount || 0;
          this.overdueLoansCount = res.data.overdueLoansCount || 0;
        }
      },
      error: () => {
        const storedBooks = localStorage.getItem('books');
        if (storedBooks) {
          this.totalBooks = JSON.parse(storedBooks).length;
        }

        const storedReservations = localStorage.getItem('reservations');
        if (storedReservations) {
          const reservations: Reservation[] = JSON.parse(storedReservations);
          this.pendingReservations = reservations.filter(r => r.status === 'Pendiente');
          this.pendingReservationsCount = this.pendingReservations.length;
        }

        const storedLoans = localStorage.getItem('loans');
        if (storedLoans) {
          const loans = JSON.parse(storedLoans);
          const today = new Date().toISOString().split('T')[0];
          
          loans.forEach((l: any) => {
            if (l.status === 'Prestado' && l.dueDate < today) {
              l.status = 'Vencido';
            }
          });

          this.activeLoansCount = loans.filter((l: any) => l.status === 'Prestado').length;
          this.overdueLoansCount = loans.filter((l: any) => l.status === 'Vencido').length;
        }
      }
    });

    this.apiService.getReservations().subscribe({
      next: (res) => {
        if (res && res.data) {
          this.pendingReservations = res.data.filter((r: any) => r.status === 'Pendiente');
        }
      }
    });
  }

  goToLoans(): void { this.router.navigate(['/admin/loans']); }
  goToBooks(): void  { this.router.navigate(['/admin/books']); }
}
