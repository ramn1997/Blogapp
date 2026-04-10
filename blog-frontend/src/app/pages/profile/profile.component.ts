import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { AuthService } from '../../services/auth.service';
import { BlogService } from '../../services/blog.service';
import { User, Blog } from '../../models';

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
  
  isEditing = false;
  activeTab = 'posts';
  myBlogs: Blog[] = [];
  savedBlogs: Blog[] = [];
  drafts: Blog[] = [];
  stats = { stories: 0, following: 0 };

  constructor(
    private fb: FormBuilder, 
    private authService: AuthService,
    private blogService: BlogService
  ) { }

  ngOnInit(): void {
    this.user = this.authService.currentUser;
    this.initForm();
    this.loadMyBlogs();
    this.loadSavedBlogs();
    this.loadDrafts();
  }

  private initForm(): void {
    this.form = this.fb.group({
      fullName: [this.user?.fullName || '', Validators.required],
      bio: [this.user?.bio || ''],
      preferredEmail: [this.user?.preferredEmail || '', Validators.email],
      avatarUrl: [this.user?.avatarUrl || '']
    });
  }

  loadMyBlogs(): void {
    this.blogService.getMyBlogs(1, 100, true).subscribe({
      next: (res) => {
        this.myBlogs = res.items;
        this.stats.stories = res.totalCount;
      }
    });
  }

  loadSavedBlogs(): void {
    this.blogService.getSavedBlogs(1, 100).subscribe({
      next: (res) => {
        this.savedBlogs = res.items;
        this.stats.following = res.totalCount;
      }
    });
  }

  loadDrafts(): void {
    this.blogService.getMyBlogs(1, 100, false).subscribe({
      next: (res) => {
        this.drafts = res.items;
      }
    });
  }

  switchTab(tab: string): void {
    this.activeTab = tab;
    if (tab === 'posts') this.loadMyBlogs();
    else if (tab === 'saved') this.loadSavedBlogs();
    else this.loadDrafts();
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
