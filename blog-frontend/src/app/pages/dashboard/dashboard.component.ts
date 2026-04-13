import { Component, OnInit } from '@angular/core';
import { BlogService } from '../../services/blog.service';
import { Blog } from '../../models';
import { Router } from '@angular/router';

@Component({
  standalone: false,
  selector: 'app-dashboard',
  templateUrl: './dashboard.component.html',
  styleUrls: ['./dashboard.component.css']
})
export class DashboardComponent implements OnInit {
  blogs: Blog[] = [];
  loading = false;
  currentPage = 1;
  totalPages = 1;
  blogToDeleteId: number | null = null;
  
  stats = {
    totalPosts: 0,
    publishedCount: 0,
    draftCount: 0,
    totalViews: 0,
    totalLikes: 0
  };

  constructor(private blogService: BlogService, private router: Router) { }

  ngOnInit(): void {
    this.loadBlogs();
    this.loadStats();
  }

  loadBlogs(page = 1): void {
    this.loading = true;
    this.currentPage = page;
    this.blogService.getMyBlogs(page, 9).subscribe({
      next: (res) => {
        this.blogs = res.items;
        this.totalPages = res.totalPages;
        this.loading = false;
      },
      error: () => this.loading = false
    });
  }

  loadStats(): void {
    // In a real app, this would be a single API call
    this.blogService.getMyBlogs(1, 1).subscribe(res => {
      this.stats.totalPosts = res.totalCount;
      // Mocking other stats for demo purposes since API might not have them yet
      this.stats.publishedCount = res.totalCount; 
      this.stats.totalViews = res.items.reduce((acc, b) => acc + (b.viewCount || 0), 0);
      this.stats.totalLikes = res.items.reduce((acc, b) => acc + (b.likeCount || 0), 0);
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
      this.loadBlogs(this.currentPage);
      this.loadStats();
    });
  }
}
