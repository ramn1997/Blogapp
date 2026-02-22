import { Component, Input, Output, EventEmitter } from '@angular/core';
import { Blog } from '../../models';

@Component({
  standalone: false,
  selector: 'app-blog-card',
  templateUrl: './blog-card.component.html',
  styleUrls: ['./blog-card.component.css']
})
export class BlogCardComponent {
  @Input() blog!: Blog;
  @Input() showActions = false;
  @Output() onEdit = new EventEmitter<number>();
  @Output() onDelete = new EventEmitter<number>();

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
