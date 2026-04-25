import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { Router, ActivatedRoute } from '@angular/router';
import { AuthService } from '../../../services/auth.service';
import { environment } from '../../../../environments/environment';

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
