import { Component, OnInit, HostListener } from '@angular/core';
import { Router } from '@angular/router';
import { Subject } from 'rxjs';
import { debounceTime, distinctUntilChanged } from 'rxjs/operators';
import { User } from '../../models';
import { NotificationService, AppNotification } from '../../services/notification.service';
import { AuthService } from '../../services/auth.service';

@Component({
  standalone: false,
  selector: 'app-navbar',
  templateUrl: './navbar.component.html',
  styleUrls: ['./navbar.component.css']
})
export class NavbarComponent implements OnInit {
  currentUser: User | null = null;
  menuOpen = false;
  userMenuOpen = false;
  notifMenuOpen = false;
  searchQuery = '';
  private searchSubject = new Subject<string>();
  
  notifications: AppNotification[] = [];
  unreadCount = 0;
  
  isDarkMode = false;

  constructor(
    private authService: AuthService, 
    private notificationService: NotificationService,
    private router: Router
  ) { }

  // Close dropdowns when clicking anywhere outside
  @HostListener('document:click', ['$event'])
  onDocumentClick(event: Event): void {
    const target = event.target as HTMLElement;
    if (!target.closest('.user-menu-wrapper') && !target.closest('.notif-wrapper')) {
      this.userMenuOpen = false;
      this.notifMenuOpen = false;
    }
  }

  ngOnInit(): void {
    this.authService.currentUser$.subscribe((user: User | null) => {
      this.currentUser = user;
      if (user) {
        this.notificationService.refreshUnreadCount();
      }
    });

    const savedTheme = localStorage.getItem('theme');
    if (savedTheme === 'dark') {
      this.isDarkMode = true;
      document.body.classList.add('dark-theme');
    }

    this.notificationService.unreadCount$.subscribe(count => {
      this.unreadCount = count;
    });

    this.searchSubject.pipe(
      debounceTime(400),
      distinctUntilChanged()
    ).subscribe(query => {
      this.router.navigate(['/'], { queryParams: query ? { q: query } : {} });
    });
  }

  logout(): void {
    this.authService.logout();
    this.router.navigate(['/']);
    this.userMenuOpen = false;
    this.notifMenuOpen = false;
  }

  onSearch(): void {
    if (!this.searchQuery.trim()) return;
    this.router.navigate(['/'], { queryParams: { q: this.searchQuery } });
    this.closeMenus();
  }

  onSearchChange(val: string): void {
    this.searchQuery = val;
    this.searchSubject.next(val);
  }

  getInitials(name: string): string {
    return name.split(' ').map(n => n[0]).join('').substring(0, 2).toUpperCase();
  }

  toggleTheme(): void {
    this.isDarkMode = !this.isDarkMode;
    if (this.isDarkMode) {
      document.body.classList.add('dark-theme');
      localStorage.setItem('theme', 'dark');
    } else {
      document.body.classList.remove('dark-theme');
      localStorage.setItem('theme', 'light');
    }
  }

  toggleMenu(): void { this.menuOpen = !this.menuOpen; }
  
  toggleUserMenu(event: Event): void { 
    event.stopPropagation();
    this.userMenuOpen = !this.userMenuOpen; 
    this.notifMenuOpen = false; 
  }
  
  toggleNotifMenu(event: Event): void { 
    event.stopPropagation();
    this.notifMenuOpen = !this.notifMenuOpen; 
    this.userMenuOpen = false;
    if (this.notifMenuOpen) {
      this.loadNotifications();
    }
  }

  loadNotifications(): void {
    this.notificationService.getNotifications().subscribe({
      next: notifs => {
        this.notifications = notifs;
      },
      error: err => {
        console.error('Failed to load notifications:', err);
        this.notifications = [];
      }
    });
  }

  markAsRead(notif: AppNotification): void {
    if (!notif.isRead) {
      this.notificationService.markAsRead(notif.id).subscribe();
      notif.isRead = true;
    }
    if (notif.relatedBlogId) {
      this.router.navigate(['/blog', notif.relatedBlogId]);
      this.closeMenus();
    }
  }

  markAllRead(): void {
    this.notificationService.markAllAsRead().subscribe(() => {
      this.notifications.forEach(n => n.isRead = true);
    });
  }

  closeMenus(): void { 
    this.menuOpen = false; 
    this.userMenuOpen = false; 
    this.notifMenuOpen = false; 
  }
}
