import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup } from '@angular/forms';
import { AuthService } from '../../services/auth.service';
import { User } from '../../models';

@Component({
  standalone: false,
  selector: 'app-profile',
  templateUrl: './profile.component.html',
  styleUrls: ['./profile.component.css']
})
export class ProfileComponent implements OnInit {
  form!: FormGroup;
  user: User | null = null;
  loading = false;
  success = '';
  error = '';

  constructor(private fb: FormBuilder, private authService: AuthService) { }

  ngOnInit(): void {
    this.user = this.authService.currentUser;
    this.form = this.fb.group({
      fullName: [this.user?.fullName || ''],
      bio: [this.user?.bio || ''],
      preferredEmail: [this.user?.preferredEmail || ''],
      avatarUrl: [this.user?.avatarUrl || '']
    });
  }

  onSubmit(): void {
    this.loading = true;
    this.success = '';
    this.error = '';

    this.authService.updateProfile(this.form.value).subscribe({
      next: (updatedUser) => {
        this.user = updatedUser;
        this.success = 'Profile updated successfully!';
        this.loading = false;
        setTimeout(() => this.success = '', 3000);
      },
      error: (err) => {
        this.error = err?.error?.message || 'Failed to update profile.';
        this.loading = false;
      }
    });
  }

  getInitials(name: string): string {
    return name.split(' ').map(n => n[0]).join('').substring(0, 2).toUpperCase();
  }

  getProviderLabel(provider?: string): string {
    const map: Record<string, string> = { local: 'Email/Password', google: 'Google', microsoft: 'Microsoft' };
    return map[provider || 'local'] || provider || '';
  }
}
