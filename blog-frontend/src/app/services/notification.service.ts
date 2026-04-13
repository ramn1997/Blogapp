import { Injectable, Injector } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { BehaviorSubject, Observable, EMPTY } from 'rxjs';
import { tap, catchError } from 'rxjs/operators';
import { environment } from '../../environments/environment';
import { AuthService } from './auth.service';

export interface AppNotification {
    id: number;
    type: string;
    message: string;
    relatedBlogId?: number;
    isRead: boolean;
    createdAt: Date;
    actorName: string;
    actorAvatar?: string;
}

@Injectable({ providedIn: 'root' })
export class NotificationService {
    private readonly API = `${environment.apiUrl}/api/notifications`;
    private unreadCountSubject = new BehaviorSubject<number>(0);
    
    unreadCount$ = this.unreadCountSubject.asObservable();

    constructor(private http: HttpClient, private injector: Injector) {
        // Delay fetching until AuthService is ready (circular dep mitigation)
        setTimeout(() => {
            const auth = this.injector.get(AuthService);
            auth.currentUser$.subscribe(user => {
                if (user) {
                    this.refreshUnreadCount();
                } else {
                    this.unreadCountSubject.next(0);
                }
            });
        }, 0);
    }

    getNotifications(): Observable<AppNotification[]> {
        return this.http.get<AppNotification[]>(this.API).pipe(
            tap(() => this.refreshUnreadCount()),
            catchError(err => {
                console.error('Failed to fetch notifications:', err);
                return new Observable<AppNotification[]>(sub => { sub.next([]); sub.complete(); });
            })
        );
    }

    markAsRead(id: number): Observable<any> {
        return this.http.post(`${this.API}/${id}/read`, {}).pipe(
            tap(() => this.refreshUnreadCount()),
            catchError(err => {
                console.error('Failed to mark notification as read:', err);
                return EMPTY;
            })
        );
    }

    markAllAsRead(): Observable<any> {
        return this.http.post(`${this.API}/read-all`, {}).pipe(
            tap(() => this.unreadCountSubject.next(0)),
            catchError(err => {
                console.error('Failed to mark all as read:', err);
                return EMPTY;
            })
        );
    }

    refreshUnreadCount(): void {
        this.http.get<number>(`${this.API}/unread-count`).pipe(
            catchError(err => {
                console.error('Failed to fetch unread count:', err);
                return new Observable<number>(sub => { sub.next(0); sub.complete(); });
            })
        ).subscribe(count => {
            this.unreadCountSubject.next(count);
        });
    }
}
