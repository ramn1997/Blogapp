import { Component, OnInit } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { Blog, BlogListResponse } from '../../models';
import { BlogService } from '../../services/blog.service';

@Component({
  standalone: false,
  selector: 'app-home',
  templateUrl: './home.component.html',
  styleUrls: ['./home.component.css']
})
export class HomeComponent implements OnInit {
  blogs: Blog[] = [];
  categories: string[] = [];
  loading = true;
  totalPages = 1;
  currentPage = 1;
  searchQuery = '';
  selectedCategory = '';
  pageSize = 9;

  constructor(
    private blogService: BlogService,
    private route: ActivatedRoute
  ) { }

  ngOnInit(): void {
    this.loadCategories();
    this.route.queryParams.subscribe(params => {
      this.searchQuery = params['q'] || '';
      this.loadBlogs(1);
    });
  }

  loadCategories(): void {
    this.blogService.getCategories().subscribe(cats => this.categories = cats);
  }

  loadBlogs(page = 1): void {
    this.loading = true;
    this.currentPage = page;
    this.blogService.getBlogs(page, this.pageSize, this.selectedCategory || undefined, this.searchQuery || undefined)
      .subscribe({
        next: (res: BlogListResponse) => {
          this.blogs = res.items;
          this.totalPages = res.totalPages;
          this.loading = false;
        },
        error: () => { this.loading = false; }
      });
  }

  onSearch(): void { this.loadBlogs(1); }

  selectCategory(cat: string): void {
    this.selectedCategory = this.selectedCategory === cat ? '' : cat;
    this.loadBlogs(1);
  }

  getPages(): number[] {
    return Array.from({ length: this.totalPages }, (_, i) => i + 1);
  }
}
