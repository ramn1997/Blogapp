import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { AuthService } from '../../../services/auth.service';
import { environment } from '../../../../environments/environment';

declare const google: any;

@Component({
  standalone: false,
  selector: 'app-register',
  templateUrl: './register.component.html',
  styleUrls: ['./register.component.css']
})
export class RegisterComponent implements OnInit {
  form!: FormGroup;
  loading = false;
  error = '';
  showPassword = false;

  constructor(
    private fb: FormBuilder,
    private authService: AuthService,
    private router: Router
  ) { }

  ngOnInit(): void {
    if (this.authService.isLoggedIn) { this.router.navigate(['/']); return; }

    this.form = this.fb.group({
      fullName: ['', [Validators.required, Validators.minLength(2)]],
      email: ['', [Validators.required, Validators.email]],
      preferredEmail: [''],
      password: ['', [Validators.required, Validators.minLength(6)]]
    });

    this.initGoogleSignIn();
  }

  private initGoogleSignIn(): void {
    setTimeout(() => {
      if (typeof google !== 'undefined') {
        google.accounts.id.initialize({
          client_id: environment.googleClientId,
          callback: (response: any) => this.handleGoogleCallback(response)
        });
        google.accounts.id.renderButton(
          document.getElementById('google-register-btn'),
          { theme: 'outline', size: 'large', width: '100%', text: 'signup_with' }
        );
      }
    }, 500);
  }

  private handleGoogleCallback(response: any): void {
    const payload = JSON.parse(atob(response.credential.split('.')[1]));
    this.loading = true;
    this.authService.oauthLogin({
      provider: 'google',
      idToken: response.credential,
      email: payload.email,
      fullName: payload.name,
      avatarUrl: payload.picture,
      providerId: payload.sub
    }).subscribe({
      next: () => this.router.navigate(['/']),
      error: (err) => {
        this.error = err?.error?.message || 'Google sign-up failed.';
        this.loading = false;
      }
    });
  }

  signUpWithMicrosoft(): void {
    import('@azure/msal-browser').then(({ PublicClientApplication }) => {
      const msalApp = new PublicClientApplication({
        auth: {
          clientId: environment.microsoftClientId,
          authority: `https://login.microsoftonline.com/${environment.microsoftTenantId}`,
          redirectUri: window.location.origin
        }
      });

      msalApp.initialize().then(() => {
        return msalApp.loginPopup({ scopes: ['openid', 'profile', 'email'] });
      }).then((result: any) => {
        this.loading = true;
        this.authService.oauthLogin({
          provider: 'microsoft',
          idToken: result.idToken,
          email: result.account.username,
          fullName: result.account.name || result.account.username,
          avatarUrl: undefined,
          providerId: result.account.homeAccountId
        }).subscribe({
          next: () => this.router.navigate(['/']),
          error: (err: any) => {
            this.error = err?.error?.message || 'Microsoft sign-up failed.';
            this.loading = false;
          }
        });
      }).catch(() => {
        this.error = 'Microsoft sign-up was cancelled or failed.';
      });
    });
  }

  onSubmit(): void {
    if (this.form.invalid) { this.form.markAllAsTouched(); return; }
    this.loading = true;
    this.error = '';

    this.authService.register(this.form.value).subscribe({
      next: () => this.router.navigate(['/']),
      error: (err) => {
        this.error = err?.error?.message || 'Registration failed. Please try again.';
        this.loading = false;
      }
    });
  }

  get f() { return this.form.controls; }
}
