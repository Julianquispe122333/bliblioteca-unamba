import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../environments/environments';

export interface ApiResponse<T> {
  type: string;
  listMessage: string[];
  data: T;
}

@Injectable({
  providedIn: 'root'
})
export class ApiService {
  private http = inject(HttpClient);
  private baseUrl = environment.urlBase;

  // Login
  login(email: string, code: string, role: string): Observable<any> {
    return this.http.post<any>(`${this.baseUrl}/auth/login`, { email, code, role });
  }

  // Categorías
  getCategories(): Observable<ApiResponse<any[]>> {
    return this.http.get<ApiResponse<any[]>>(`${this.baseUrl}/category`);
  }

  saveCategory(category: { idCategory?: number, name: string }): Observable<ApiResponse<any>> {
    return this.http.post<ApiResponse<any>>(`${this.baseUrl}/category`, category);
  }

  deleteCategory(id: number): Observable<ApiResponse<boolean>> {
    return this.http.delete<ApiResponse<boolean>>(`${this.baseUrl}/category/${id}`);
  }

  // Autores
  getAuthors(): Observable<ApiResponse<any[]>> {
    return this.http.get<ApiResponse<any[]>>(`${this.baseUrl}/author`);
  }

  saveAuthor(author: { idAuthor?: number, firstName: string, surName: string }): Observable<ApiResponse<any>> {
    return this.http.post<ApiResponse<any>>(`${this.baseUrl}/author`, author);
  }

  deleteAuthor(id: number): Observable<ApiResponse<boolean>> {
    return this.http.delete<ApiResponse<boolean>>(`${this.baseUrl}/author/${id}`);
  }

  // Libros
  getBooks(): Observable<ApiResponse<any[]>> {
    return this.http.get<ApiResponse<any[]>>(`${this.baseUrl}/book`);
  }

  saveBook(book: any): Observable<ApiResponse<any>> {
    return this.http.post<ApiResponse<any>>(`${this.baseUrl}/book`, book);
  }

  deleteBook(id: number): Observable<ApiResponse<boolean>> {
    return this.http.delete<ApiResponse<boolean>>(`${this.baseUrl}/book/${id}`);
  }

  // Reservas
  getReservations(): Observable<ApiResponse<any[]>> {
    return this.http.get<ApiResponse<any[]>>(`${this.baseUrl}/reservation`);
  }

  getStudentReservations(studentName: string): Observable<ApiResponse<any[]>> {
    return this.http.get<ApiResponse<any[]>>(`${this.baseUrl}/reservation/student/${studentName}`);
  }

  createReservation(reservation: { studentName: string, universityCode?: string, email?: string, bookTitles: string[] }): Observable<ApiResponse<any>> {
    return this.http.post<ApiResponse<any>>(`${this.baseUrl}/reservation`, reservation);
  }

  // Préstamos
  getLoans(): Observable<ApiResponse<any[]>> {
    return this.http.get<ApiResponse<any[]>>(`${this.baseUrl}/loan`);
  }

  createLoanFromReservation(reservationCode: string): Observable<ApiResponse<any>> {
    return this.http.post<ApiResponse<any>>(`${this.baseUrl}/loan`, { reservationCode });
  }

  returnLoanBooks(reservationCode: string, booksReturningNow: string[]): Observable<ApiResponse<any>> {
    return this.http.post<ApiResponse<any>>(`${this.baseUrl}/loan/return`, { reservationCode, booksReturningNow });
  }

  // Estadísticas
  getAdminStats(): Observable<ApiResponse<any>> {
    return this.http.get<ApiResponse<any>>(`${this.baseUrl}/stats/admin`);
  }
}
