import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { Blog } from '../../models';
import { BlogService } from '../../services/blog.service';

@Component({
  standalone: false,
  selector: 'app-dashboard',
  templateUrl: './dashboard.component.html',
  styleUrls: ['./dashboard.component.css']
})
export class DashboardComponent implements OnInit {
  blogs: Blog[] = [];
  loading = true;
  totalPages = 1;
  currentPage = 1;

  constructor(private blogService: BlogService, private router: Router) { }

  ngOnInit(): void { this.loadBlogs(); }

  loadBlogs(page = 1): void {
    this.loading = true;
    this.currentPage = page;
    this.blogService.getMyBlogs(page).subscribe({
      next: (res) => {
        this.blogs = res.items;
        this.totalPages = res.totalPages;
        this.loading = false;
      },
      error: () => { this.loading = false; }
    });
  }

  editBlog(id: number): void { this.router.navigate(['/write', id]); }

  deleteBlog(id: number): void {
    if (!confirm('Delete this post? This cannot be undone.')) return;
    this.blogService.deleteBlog(id).subscribe(() => {
      this.blogs = this.blogs.filter(b => b.id !== id);
    });
  }

  getPages(): number[] {
    return Array.from({ length: this.totalPages }, (_, i) => i + 1);
  }

  get publishedCount(): number { return this.blogs.filter(b => b.isPublished).length; }
  get draftCount(): number { return this.blogs.filter(b => !b.isPublished).length; }
  get totalViews(): number { return this.blogs.reduce((s, b) => s + b.viewCount, 0); }
  get totalLikes(): number { return this.blogs.reduce((s, b) => s + b.likeCount, 0); }
}
