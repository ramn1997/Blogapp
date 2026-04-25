import { Component, OnInit } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { Blog, BlogListResponse, User } from '../../models';
import { BlogService } from '../../services/blog.service';
import { AuthService } from '../../services/auth.service';
import { forkJoin, of } from 'rxjs';
import { catchError } from 'rxjs/operators';

@Component({
  standalone: false,
  selector: 'app-home',
  templateUrl: './home.component.html',
  styleUrls: ['./home.component.css']
})
export class HomeComponent implements OnInit {
  latestBlogs: Blog[] = [];
  trendingBlogs: Blog[] = [];
  authors: User[] = [];
  savedBlogs: Blog[] = [];
  categories: string[] = [];
  
  loading = true;
  totalPages = 1;
  currentPage = 1;
  searchQuery = '';
  selectedCategory = '';
  pageSize = 12;

  constructor(
    private blogService: BlogService,
    private authService: AuthService,
    private route: ActivatedRoute
  ) { }

  ngOnInit(): void {
    this.route.queryParams.subscribe(params => {
      this.searchQuery = params['q'] || '';
      this.fetchAllData();
    });
  }

  fetchAllData(): void {
    this.loading = true;

    const requests = {
      latest: this.blogService.getBlogs(1, this.pageSize, this.selectedCategory || undefined, this.searchQuery || undefined, undefined, 'latest').pipe(catchError(() => of({ items: [], totalPages: 1 }))),
      trending: this.blogService.getBlogs(1, 5, undefined, undefined, undefined, 'trending').pipe(catchError(() => of({ items: [], totalPages: 1 }))),
      authors: this.authService.getAuthors(8).pipe(catchError(() => of([]))),
      categories: this.blogService.getCategories().pipe(catchError(() => of([]))),
      saved: this.authService.isLoggedIn ? this.blogService.getSavedBlogs(1, 5).pipe(catchError(() => of({ items: [], totalPages: 1 }))) : of({ items: [], totalPages: 1 })
    };

    forkJoin(requests).subscribe({
      next: (res: any) => {
        this.latestBlogs = res.latest.items;
        this.totalPages = res.latest.totalPages;
        this.trendingBlogs = res.trending.items;
        this.authors = res.authors;
        this.categories = res.categories;
        this.savedBlogs = res.saved.items;
        this.loading = false;
      },
      error: () => { this.loading = false; }
    });
  }

  loadLatest(page = 1): void {
    this.currentPage = page;
    this.blogService.getBlogs(page, this.pageSize, this.selectedCategory || undefined, this.searchQuery || undefined, undefined, 'latest')
      .subscribe({
        next: (res: BlogListResponse) => {
          this.latestBlogs = res.items;
          this.totalPages = res.totalPages;
        }
      });
  }

  selectCategory(cat: string): void {
    this.selectedCategory = this.selectedCategory === cat ? '' : cat;
    this.loadLatest(1);
  }

  getPages(): number[] {
    return Array.from({ length: this.totalPages }, (_, i) => i + 1);
  }
}
