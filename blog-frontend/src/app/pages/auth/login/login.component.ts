import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { Router, ActivatedRoute } from '@angular/router';
import { AuthService } from '../../../services/auth.service';
import { environment } from '../../../../environments/environment';
import { AuthenticationResult, PublicClientApplication } from '@azure/msal-browser';

declare const google: any;

@Component({
  standalone: false,
  selector: 'app-login',
  templateUrl: './login.component.html',
  styleUrls: ['./login.component.css']
})
export class LoginComponent implements OnInit {
  form!: FormGroup;
  loading = false;
  error = '';
  showPassword = false;
  private msalClient?: PublicClientApplication;

  constructor(
    private fb: FormBuilder,
    private authService: AuthService,
    private router: Router,
    private route: ActivatedRoute
  ) { }

  ngOnInit(): void {
    if (this.authService.isLoggedIn) { this.router.navigate(['/']); return; }

    this.form = this.fb.group({
      email: ['', [Validators.required, Validators.email]],
      password: ['', Validators.required]
    });

    this.initGoogleSignIn();
    this.initMicrosoftSignIn();
  }



  // ── Google ────────────────────────────────────────────────────────────────────

  private initGoogleSignIn(): void {
    setTimeout(() => {
      if (typeof google !== 'undefined') {
        google.accounts.id.initialize({
          client_id: environment.googleClientId,
          callback: (response: any) => this.handleGoogleCallback(response)
        });
      }
    }, 500);
  }

  triggerGoogleLogin(): void {
    if (typeof google !== 'undefined') {
      google.accounts.id.prompt();
    }
  }

  private handleGoogleCallback(response: any): void {
    const payload = JSON.parse(atob(response.credential.split('.')[1]));
    this.loading = true;
    this.error = '';
    this.authService.oauthLogin({
      provider: 'google',
      idToken: response.credential,
      email: payload.email,
      fullName: payload.name,
      avatarUrl: payload.picture,
      providerId: payload.sub
    }).subscribe({
      next: () => this.router.navigate(['/']),
      error: (err: any) => {
        this.error = err?.error?.message || 'Google sign-in failed.';
        this.loading = false;
      }
    });
  }

  // ── Email / Password ──────────────────────────────────────────────────────────

  private async initMicrosoftSignIn(): Promise<void> {
    if (!environment.microsoftClientId || environment.microsoftClientId.includes('YOUR_')) {
      return;
    }

    this.msalClient = new PublicClientApplication({
      auth: {
        clientId: environment.microsoftClientId,
        authority: `https://login.microsoftonline.com/${environment.microsoftTenantId || 'common'}`,
        redirectUri: window.location.origin + window.location.pathname
      },
      cache: {
        cacheLocation: 'sessionStorage'
      }
    });

    await this.msalClient.initialize();

    try {
      const result = await this.msalClient.handleRedirectPromise();
      if (result) {
        this.loading = true;
        this.handleMicrosoftCallback(result);
      }
    } catch (err) {
      console.error('[Auth] Microsoft redirect error:', err);
      this.error = 'Microsoft sign-in failed.';
    }
  }

  async triggerMicrosoftLogin(): Promise<void> {
    if (!this.msalClient) {
      this.error = 'Microsoft sign-in is not configured yet.';
      return;
    }

    this.loading = true;
    this.error = '';

    try {
      await this.msalClient.loginRedirect({
        scopes: ['openid', 'profile', 'email', 'User.Read'],
        prompt: 'select_account'
      });
    } catch (err) {
      console.error('[Auth] Microsoft sign-in failed:', err);
      this.error = 'Microsoft sign-in failed.';
      this.loading = false;
    }
  }

  private handleMicrosoftCallback(result: AuthenticationResult): void {
    if (!result.idToken || !result.account) {
      this.error = 'Microsoft sign-in did not return an identity token.';
      this.loading = false;
      return;
    }

    this.authService.oauthLogin({
      provider: 'microsoft',
      idToken: result.idToken,
      email: result.account.username,
      fullName: result.account.name || result.account.username,
      providerId: result.account.localAccountId
    }).subscribe({
      next: () => this.router.navigate(['/']),
      error: (err: any) => {
        this.error = err?.error?.message || 'Microsoft sign-in failed.';
        this.loading = false;
      }
    });
  }

  onSubmit(): void {
    if (this.form.invalid) { this.form.markAllAsTouched(); return; }
    this.loading = true;
    this.error = '';

    this.authService.login(this.form.value).subscribe({
      next: () => this.router.navigate(['/']),
      error: (err: any) => {
        this.error = err?.error?.message || 'Invalid email or password.';
        this.loading = false;
      }
    });
  }

  get f() { return this.form.controls; }
}
