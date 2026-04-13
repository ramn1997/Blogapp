import { Component, OnInit, OnDestroy } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { combineLatest, Subscription } from 'rxjs';
import { AuthService } from '../../services/auth.service';
import { BlogService } from '../../services/blog.service';
import { Blog, User } from '../../models';

@Component({
  standalone: false,
  selector: 'app-profile',
  templateUrl: './profile.component.html',
  styleUrls: ['./profile.component.css']
})
export class ProfileComponent implements OnInit, OnDestroy {
  form!: FormGroup;
  user: User | null = null;
  currentUser: User | null = null;
  isOwnProfile = false;
  isEditing = false;
  loading = true;
  successMessage = '';
  error = '';
  activeTab = 'stories';
  blogToDeleteId: number | null = null;
  
  blogs: Blog[] = [];
  stats = { stories: 0, following: 0 };

  private sub!: Subscription;
  private lastLoadedUserId: number | null = null;

  constructor(
    private fb: FormBuilder,
    private authService: AuthService,
    private blogService: BlogService,
    private route: ActivatedRoute,
    private router: Router
  ) { }

  ngOnInit(): void {
    this.sub = combineLatest([
      this.route.queryParams,
      this.authService.currentUser$
    ]).subscribe(([params, user]) => {
      this.currentUser = user;
      const userIdParam = params['userId'];
      
      if (userIdParam) {
        const targetId = Number(userIdParam);
        // Only reload if viewing a different user
        if (this.lastLoadedUserId !== targetId) {
          this.loadPublicProfile(targetId);
        }
      } else if (this.currentUser) {
        // Own profile — only reload if we weren't already showing it
        if (this.lastLoadedUserId !== this.currentUser.id) {
          this.user = this.currentUser;
          this.isOwnProfile = true;
          this.lastLoadedUserId = this.currentUser.id;
          this.initForm();
          this.loadUserBlogs();
          this.loading = false;
        }
      } else if (this.authService.isLoggedIn) {
        // Token exists but user not yet loaded from storage — wait
      } else {
        this.router.navigate(['/auth/login']);
      }
      
      this.checkProfileOwnership();
    });
  }

  ngOnDestroy(): void {
    if (this.sub) {
      this.sub.unsubscribe();
    }
  }

  private checkProfileOwnership(): void {
    if (this.user && this.currentUser) {
      this.isOwnProfile = this.user.id === this.currentUser.id;
    }
  }

  loadPublicProfile(userId: number): void {
    this.loading = true;
    this.lastLoadedUserId = userId;
    this.authService.getUserProfile(userId).subscribe({
      next: (user) => {
        this.user = user;
        this.checkProfileOwnership();
        this.loadUserBlogs(userId);
        this.loading = false;
      },
      error: () => {
        this.error = 'User not found';
        this.loading = false;
      }
    });
  }

  loadUserBlogs(userId?: number): void {
    const id = userId || this.user?.id;
    if (!id) return;

    if (this.isOwnProfile) {
      // Use the authenticated /my endpoint for own profile — guaranteed correct
      this.blogService.getMyBlogs(1, 20, true).subscribe(res => {
        this.blogs = res.items;
        this.stats.stories = res.totalCount;
      });
    } else {
      // Public profile — filter by userId
      this.blogService.getBlogs(1, 20, undefined, undefined, id).subscribe(res => {
        this.blogs = res.items;
        this.stats.stories = res.totalCount;
      });
    }
  }

  setTab(tab: string): void {
    this.activeTab = tab;
    if (tab === 'stories') {
      this.loadUserBlogs();
    } else if (tab === 'activity') {
      this.blogService.getSavedBlogs().subscribe(res => this.blogs = res.items);
    } else if (tab === 'drafts') {
      this.blogService.getMyBlogs(1, 20, false).subscribe(res => this.blogs = res.items);
    }
  }

  initForm(): void {
    if (!this.user) return;
    this.form = this.fb.group({
      fullName: [this.user.fullName, [Validators.required]],
      email: [this.user.email, [Validators.required, Validators.email]],
      bio: [this.user.bio || '']
    });
  }

  onAvatarChange(event: any): void {
    const file = event.target.files[0];
    if (file) {
      this.blogService.uploadImage(file).subscribe(res => {
        this.authService.updateProfile({ avatarUrl: res.url }).subscribe(user => {
          this.user = user;
          this.successMessage = 'Avatar updated successfully';
          setTimeout(() => this.successMessage = '', 3000);
        });
      });
    }
  }

  onSubmit(): void {
    if (this.form.invalid) return;
    this.loading = true;
    this.successMessage = '';
    this.error = '';

    this.authService.updateProfile(this.form.value).subscribe({
      next: (updatedUser) => {
        this.user = updatedUser;
        this.loading = false;
        this.isEditing = false;
        this.successMessage = 'Profile updated successfully';
        setTimeout(() => this.successMessage = '', 3000);
      },
      error: (err) => {
        this.error = err?.error?.message || 'Failed to update profile';
        this.loading = false;
      }
    });
  }

  editBlog(id: number): void {
    this.router.navigate(['/write'], { queryParams: { id } });
  }

  confirmDelete(id: number): void {
    this.blogToDeleteId = id;
  }

  deleteBlog(): void {
    if (!this.blogToDeleteId) return;
    this.blogService.deleteBlog(this.blogToDeleteId).subscribe(() => {
      this.blogToDeleteId = null;
      this.loadUserBlogs();
    });
  }
}
