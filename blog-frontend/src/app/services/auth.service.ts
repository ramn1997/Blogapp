import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { BehaviorSubject, from, Observable, switchMap, tap } from 'rxjs';
import { AuthResponse, LoginRequest, OAuthLoginRequest, RegisterRequest, User } from '../models';
import { environment } from '../../environments/environment';
import { MsalService } from '@azure/msal-angular';

@Injectable({ providedIn: 'root' })
export class AuthService {
    private readonly API = `${environment.apiUrl}/api/auth`;
    private currentUserSubject = new BehaviorSubject<User | null>(null);
    private msalInitialized = false;
    private msalInitPromise: Promise<void> | null = null;

    currentUser$ = this.currentUserSubject.asObservable();

    get currentUser(): User | null {
        return this.currentUserSubject.value;
    }

    get isLoggedIn(): boolean {
        return !!this.currentUserSubject.value && !!localStorage.getItem('token');
    }

    constructor(private http: HttpClient, private msalService: MsalService) {
        this.loadUserFromStorage();
        // Start MSAL initialization eagerly but don't block
        this.msalInitPromise = this.initMsal();
    }

    private async initMsal(): Promise<void> {
        if (this.msalInitialized) return;
        try {
            await this.msalService.instance.initialize();
            await this.msalService.instance.handleRedirectPromise();
            this.msalInitialized = true;
            console.log('MSAL initialized successfully');
        } catch (e) {
            console.error('MSAL init error:', e);
            if (e instanceof Error && e.message.includes('already been initialized')) {
                this.msalInitialized = true;
            }
        }
    }

    private async ensureMsalReady(): Promise<void> {
        // Wait for the init promise that was started in constructor
        if (this.msalInitPromise) {
            await this.msalInitPromise;
        }
        // If it still failed, try once more
        if (!this.msalInitialized) {
            await this.initMsal();
        }
    }

    private loadUserFromStorage(): void {
        try {
            const token = localStorage.getItem('token');
            const userStr = localStorage.getItem('user');
            
            if (token && userStr) {
                const user = JSON.parse(userStr);
                this.currentUserSubject.next(user);
                console.log('Session restored from storage for:', user.email);
            }
        } catch (e) {
            console.error('Failed to restore session from storage', e);
            this.logout();
        }
    }

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

    microsoftLogin(): Observable<AuthResponse> {
        // Wait for MSAL to be fully ready, then use instance.loginPopup directly
        return from(this.ensureMsalReady()).pipe(
            switchMap(() => from(this.msalService.instance.loginPopup({
                scopes: ['user.read', 'openid', 'profile', 'email'],
                prompt: 'select_account'
            }))),
            switchMap(res => {
                const oauthReq: OAuthLoginRequest = {
                    provider: 'microsoft',
                    idToken: res.idToken,
                    email: res.account.username,
                    fullName: res.account.name || 'Microsoft User',
                    providerId: res.account.localAccountId,
                    avatarUrl: ''
                };
                return this.oauthLogin(oauthReq);
            })
        );
    }

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

    logout(): void {
        localStorage.removeItem('token');
        localStorage.removeItem('refreshToken');
        localStorage.removeItem('user');
        this.currentUserSubject.next(null);
    }

    private storeAuth(res: AuthResponse): void {
        localStorage.setItem('token', res.token);
        localStorage.setItem('refreshToken', res.refreshToken);
        localStorage.setItem('user', JSON.stringify(res.user));
        this.currentUserSubject.next(res.user);
    }
}
