import { Component, OnInit } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { Blog, Comment } from '../../models';
import { BlogService } from '../../services/blog.service';
import { AuthService } from '../../services/auth.service';

@Component({
  standalone: false,
  selector: 'app-blog-detail',
  templateUrl: './blog-detail.component.html',
  styleUrls: ['./blog-detail.component.css']
})
export class BlogDetailComponent implements OnInit {
  blog: Blog | null = null;
  comments: Comment[] = [];
  loading = true;
  commentInput = '';
  likeLoading = false;
  commentLoading = false;

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private blogService: BlogService,
    public authService: AuthService
  ) { }

  ngOnInit(): void {
    const id = Number(this.route.snapshot.paramMap.get('id'));
    this.blogService.getBlog(id).subscribe({
      next: (blog) => {
        this.blog = blog;
        this.loading = false;
        this.loadComments(id);
      },
      error: () => { this.loading = false; this.router.navigate(['/']); }
    });
  }

  loadComments(id: number): void {
    this.blogService.getComments(id).subscribe(c => this.comments = c);
  }

  toggleLike(): void {
    if (!this.blog || !this.authService.isLoggedIn) {
      this.router.navigate(['/auth/login']); return;
    }
    this.likeLoading = true;
    this.blogService.toggleLike(this.blog.id).subscribe(res => {
      if (this.blog) {
        this.blog.isLikedByCurrentUser = res.liked;
        this.blog.likeCount += res.liked ? 1 : -1;
      }
      this.likeLoading = false;
    });
  }

  addComment(): void {
    if (!this.commentInput.trim() || !this.blog) return;
    if (!this.authService.isLoggedIn) { this.router.navigate(['/auth/login']); return; }
    this.commentLoading = true;
    this.blogService.addComment(this.blog.id, this.commentInput).subscribe(c => {
      this.comments.push(c);
      this.commentInput = '';
      this.commentLoading = false;
      if (this.blog) this.blog.commentCount++;
    });
  }

  deleteComment(commentId: number): void {
    if (!this.blog) return;
    this.blogService.deleteComment(this.blog.id, commentId).subscribe(() => {
      this.comments = this.comments.filter(c => c.id !== commentId);
      if (this.blog) this.blog.commentCount--;
    });
  }

  getInitials(name: string): string {
    return name.split(' ').map(n => n[0]).join('').substring(0, 2).toUpperCase();
  }

  formatDate(dateStr: string): string {
    return new Date(dateStr).toLocaleDateString('en-US', {
      month: 'long', day: 'numeric', year: 'numeric'
    });
  }

  getTags(): string[] {
    if (!this.blog?.tags) return [];
    return this.blog.tags.split(',').map(t => t.trim()).filter(Boolean);
  }
}
