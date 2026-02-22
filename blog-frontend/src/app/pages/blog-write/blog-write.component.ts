import { Component, OnInit } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { BlogService } from '../../services/blog.service';

const CATEGORIES = ['Technology', 'Design', 'Science', 'Health', 'Business', 'Arts', 'Travel', 'Food', 'Politics', 'Other'];

@Component({
  standalone: false,
  selector: 'app-blog-write',
  templateUrl: './blog-write.component.html',
  styleUrls: ['./blog-write.component.css']
})
export class BlogWriteComponent implements OnInit {
  form!: FormGroup;
  loading = false;
  error = '';
  success = '';
  editId: number | null = null;
  categories = CATEGORIES;
  isEditMode = false;

  constructor(
    private fb: FormBuilder,
    private blogService: BlogService,
    private router: Router,
    private route: ActivatedRoute
  ) { }

  ngOnInit(): void {
    this.form = this.fb.group({
      title: ['', [Validators.required, Validators.minLength(5)]],
      content: ['', [Validators.required, Validators.minLength(20)]],
      summary: [''],
      coverImageUrl: [''],
      category: [''],
      tags: [''],
      isPublished: [false]
    });

    const id = this.route.snapshot.paramMap.get('id');
    if (id) {
      this.editId = Number(id);
      this.isEditMode = true;
      this.blogService.getBlog(this.editId).subscribe(blog => {
        this.form.patchValue({
          title: blog.title,
          content: blog.content,
          summary: blog.summary,
          coverImageUrl: blog.coverImageUrl,
          category: blog.category,
          tags: blog.tags,
          isPublished: blog.isPublished
        });
      });
    }
  }

  onSubmit(publish = false): void {
    if (this.form.invalid) { this.form.markAllAsTouched(); return; }
    this.loading = true;
    this.error = '';

    const data = { ...this.form.value, isPublished: publish || this.form.value.isPublished };

    const req = this.editId
      ? this.blogService.updateBlog(this.editId, data)
      : this.blogService.createBlog(data);

    req.subscribe({
      next: (blog) => {
        this.success = publish ? 'Published!' : 'Saved as draft!';
        setTimeout(() => this.router.navigate(['/blog', blog.id]), 1000);
      },
      error: (err) => {
        this.error = err?.error?.message || 'Failed to save. Please try again.';
        this.loading = false;
      }
    });
  }

  get f() { return this.form.controls; }

  wordCount(): number {
    const content = this.form.value.content || '';
    return content.split(/\s+/).filter(Boolean).length;
  }
}
