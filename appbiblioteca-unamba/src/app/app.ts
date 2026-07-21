import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterOutlet, Router, NavigationEnd, RouterModule } from '@angular/router';
import { ButtonModule } from 'primeng/button';
import { TooltipModule } from 'primeng/tooltip';
import { filter } from 'rxjs/operators';

interface MenuOption {
  route: string;
  icon: string;
  text: string;
  active: boolean;
}

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [
    CommonModule,
    RouterOutlet,
    RouterModule,
    ButtonModule,
    TooltipModule
  ],
  templateUrl: './app.html',
  styleUrls: ['./app.css']
})
export class App implements OnInit {
  private router = inject(Router);

  isLoginPage: boolean = true;
  userRole: 'student' | 'admin' | null = null;
  username: string = '';
  menuOptions: MenuOption[] = [];

  ngOnInit(): void {
    this.checkRoute(this.router.url);

    this.router.events.pipe(
      filter(event => event instanceof NavigationEnd)
    ).subscribe((event: any) => {
      this.checkRoute(event.urlAfterRedirects);
    });
  }

  checkRoute(url: string): void {
    this.isLoginPage = url.includes('/login') || url === '/';
    
    if (!this.isLoginPage) {
      const userStr = localStorage.getItem('currentUser');
      if (userStr) {
        const user = JSON.parse(userStr);
        this.userRole = user.role;
        this.username = user.username;
        this.buildMenu();
      } else {
        this.router.navigate(['/login']);
      }
    }
  }

  buildMenu(): void {
    const current = this.router.url;
    if (this.userRole === 'student') {
      this.menuOptions = [
        { route: '/student/catalog', icon: 'images', text: 'Catálogo', active: current.includes('/student/catalog') },
        { route: '/student/reservations', icon: 'bookmark', text: 'Mis Reservas', active: current.includes('/student/reservations') }
      ];
    } else if (this.userRole === 'admin') {
      this.menuOptions = [
        { route: '/admin/home', icon: 'home', text: 'Inicio', active: current.includes('/admin/home') },
        { route: '/admin/catalog', icon: 'images', text: 'Catálogo', active: current.includes('/admin/catalog') },
        { route: '/admin/books', icon: 'book', text: 'Libros', active: current.includes('/admin/books') },
        { route: '/admin/loans', icon: 'calendar', text: 'Préstamos', active: current.includes('/admin/loans') }
      ];
    }
  }

  logout(): void {
    localStorage.removeItem('currentUser');
    this.router.navigate(['/login']);
  }
}