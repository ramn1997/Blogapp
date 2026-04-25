import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { BehaviorSubject, Observable, tap } from 'rxjs';
import { AuthResponse, LoginRequest, OAuthLoginRequest, RegisterRequest, User } from '../models';
import { environment } from '../../environments/environment';

@Injectable({ providedIn: 'root' })
export class AuthService {

    private readonly API = `${environment.apiUrl}/api/auth`;
    private currentUserSubject = new BehaviorSubject<User | null>(null);

    currentUser$ = this.currentUserSubject.asObservable();

    get currentUser(): User | null {
        return this.currentUserSubject.value;
    }

    get isLoggedIn(): boolean {
        return !!this.currentUserSubject.value && !!localStorage.getItem('token');
    }

    constructor(private http: HttpClient) {
        this.loadUserFromStorage();
    }

    // ─────────────────────────────────────────────────────────────────────────────
    // Standard auth methods
    // ─────────────────────────────────────────────────────────────────────────────

    register(data: RegisterRequest) {
        return this.http.post<AuthResponse>(`${this.API}/register`, data).pipe(
            tap(res => this.storeAuth(res))
        );
    }

    login(data: LoginRequest) {
        return this.http.post<AuthResponse>(`${this.API}/login`, data).pipe(
            tap(res => this.storeAuth(res))
        );
    }

    oauthLogin(data: OAuthLoginRequest) {
        return this.http.post<AuthResponse>(`${this.API}/oauth`, data).pipe(
            tap(res => this.storeAuth(res))
        );
    }

    // ─────────────────────────────────────────────────────────────────────────────
    // Profile methods
    // ─────────────────────────────────────────────────────────────────────────────

    getProfile() {
        return this.http.get<User>(`${this.API}/profile`).pipe(
            tap(user => {
                this.currentUserSubject.next(user);
                localStorage.setItem('user', JSON.stringify(user));
            })
        );
    }

    getUserProfile(id: number) {
        return this.http.get<User>(`${this.API}/users/${id}`);
    }

    updateProfile(data: Partial<User>) {
        return this.http.put<User>(`${this.API}/profile`, data).pipe(
            tap(user => {
                this.currentUserSubject.next(user);
                localStorage.setItem('user', JSON.stringify(user));
            })
        );
    }

    // ─────────────────────────────────────────────────────────────────────────────
    // Session management
    // ─────────────────────────────────────────────────────────────────────────────

    logout(): void {
        localStorage.removeItem('token');
        localStorage.removeItem('refreshToken');
        localStorage.removeItem('user');
        this.currentUserSubject.next(null);
    }

    private loadUserFromStorage(): void {
        try {
            const token = localStorage.getItem('token');
            const userStr = localStorage.getItem('user');
            if (token && userStr) {
                const user = JSON.parse(userStr);
                this.currentUserSubject.next(user);
                console.log('[Auth] Session restored for:', user.email);
            }
        } catch (e) {
            console.error('[Auth] Failed to restore session:', e);
            this.logout();
        }
    }

    private storeAuth(res: AuthResponse): void {
        localStorage.setItem('token', res.token);
        localStorage.setItem('refreshToken', res.refreshToken);
        localStorage.setItem('user', JSON.stringify(res.user));
        this.currentUserSubject.next(res.user);
    }
}
