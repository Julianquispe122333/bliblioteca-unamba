import { Routes } from '@angular/router';
import { Login } from './page/login/login';
import { StudentCatalog } from './page/student/catalog/catalog';
import { StudentReservations } from './page/student/reservations/reservations';
import { AdminHome } from './page/admin/home/home';
import { AdminCatalog } from './page/admin/catalog/catalog';
import { BookCrud } from './page/admin/books/books';
import { LoanManagement } from './page/admin/loans/loans';

export const routes: Routes = [
  { path: '', redirectTo: 'login', pathMatch: 'full' },
  { path: 'login', component: Login },
  { path: 'student/catalog', component: StudentCatalog },
  { path: 'student/reservations', component: StudentReservations },
  { path: 'admin/home', component: AdminHome },
  { path: 'admin/catalog', component: AdminCatalog },
  { path: 'admin/books', component: BookCrud },
  { path: 'admin/loans', component: LoanManagement },
  { path: '**', redirectTo: 'login' }
];