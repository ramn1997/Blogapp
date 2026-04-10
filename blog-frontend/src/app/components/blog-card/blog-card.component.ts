import { Component, Input, Output, EventEmitter } from '@angular/core';
import { Blog } from '../../models';
import { BlogService } from '../../services/blog.service';
import { AuthService } from '../../services/auth.service';

@Component({
  standalone: false,
  selector: 'app-blog-card',
  templateUrl: './blog-card.component.html',
  styleUrls: ['./blog-card.component.css']
})
export class BlogCardComponent {
  @Input() blog!: Blog;
  @Input() showActions = false;
  @Input() featured = false;
  @Output() onEdit = new EventEmitter<number>();
  @Output() onDelete = new EventEmitter<number>();
  @Output() savedChange = new EventEmitter<void>();

  constructor(
    private blogService: BlogService,
    private authService: AuthService
  ) { }

  toggleSave(event: Event): void {
    event.stopPropagation();
    event.preventDefault();
    
    if (!this.authService.isLoggedIn) {
      alert('Please sign in to save blogs to your collection.');
      return;
    }

    this.blogService.toggleSave(this.blog.id).subscribe({
      next: (res) => {
        this.blog.isSavedByCurrentUser = res.saved;
        this.savedChange.emit();
      }
    });
  }

  getTags(): string[] {
    if (!this.blog.tags) return [];
    return this.blog.tags.split(',').map(t => t.trim()).filter(Boolean).slice(0, 3);
  }

  getInitials(name: string): string {
    return name.split(' ').map(n => n[0]).join('').substring(0, 2).toUpperCase();
  }

  formatDate(dateStr: string): string {
    return new Date(dateStr).toLocaleDateString('en-US', {
      month: 'short', day: 'numeric', year: 'numeric'
    });
  }
}
