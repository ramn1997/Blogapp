import { Component, OnInit, ViewChild, ElementRef } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { BlogService } from '../../services/blog.service';

@Component({
  standalone: false,
  selector: 'app-blog-write',
  templateUrl: './blog-write.component.html',
  styleUrls: ['./blog-write.component.css']
})
export class BlogWriteComponent implements OnInit {
  form!: FormGroup;
  loading = false;
  isEdit = false;
  blogId?: number;
  categories: string[] = [];
  wordCount = 0;
  readTime = 0;

  @ViewChild('contentEditor') contentEditor!: ElementRef;
  initialContent = '';

  constructor(
    private fb: FormBuilder,
    private blogService: BlogService,
    private route: ActivatedRoute,
    private router: Router
  ) { }

  ngOnInit(): void {
    this.initForm();
    this.loadCategories();

    this.route.queryParams.subscribe(params => {
      if (params['id']) {
        this.isEdit = true;
        this.blogId = Number(params['id']);
        this.loadBlog();
      }
    });

    // Listen to form paste on window for the cover image shortcut when no focus
    window.addEventListener('paste', this.handleGlobalPaste.bind(this));
  }

  ngOnDestroy(): void {
    window.removeEventListener('paste', this.handleGlobalPaste.bind(this));
  }

  initForm(): void {
    this.form = this.fb.group({
      title: ['', [Validators.required, Validators.maxLength(100)]],
      content: ['', Validators.required],
      summary: [''],
      coverImageUrl: [''],
      category: [''],
      tags: [''],
      isPublished: [true]
    });
  }

  loadCategories(): void {
    const predefinedCategories = ['Lifestyle', 'Business & Marketing', 'Technology', 'Personal Finance', 'Health & Wellness', 'Travel'];
    this.blogService.getCategories().subscribe({
      next: (cats) => {
        const validCats = cats.filter(c => c && c.trim() !== '');
        this.categories = Array.from(new Set([...predefinedCategories, ...validCats])).sort();
      },
      error: () => this.categories = predefinedCategories.sort()
    });
  }

  loadBlog(): void {
    if (!this.blogId) return;
    this.blogService.getBlog(this.blogId).subscribe(blog => {
      this.form.patchValue(blog);
      this.initialContent = blog.content || '';
      if (this.contentEditor) {
        this.contentEditor.nativeElement.innerHTML = this.initialContent;
      }
      this.calculateWordCount();
    });
  }

  onTitleChange(): void {}

  onContentChange(event: Event): void {
    const element = event.target as HTMLElement;
    this.form.patchValue({ content: element.innerHTML });
    this.calculateWordCount();
  }

  calculateWordCount(): void {
    const content = this.form.get('content')?.value || '';
    // Strip HTML to count words
    const textContent = content.replace(/<[^>]*>/g, ' ');
    this.wordCount = textContent.trim() ? textContent.trim().split(/\s+/).length : 0;
    this.readTime = Math.ceil(this.wordCount / 200);
  }

  // Cover Image Handlers
  onCoverSelected(event: any): void {
    const file = event.target.files[0];
    if (file) this.uploadCover(file);
  }

  onDragOver(event: DragEvent): void {
    event.preventDefault();
  }

  onDropCover(event: DragEvent): void {
    event.preventDefault();
    const file = event.dataTransfer?.files[0];
    if (file && file.type.startsWith('image/')) this.uploadCover(file);
  }

  private uploadCover(file: File): void {
    this.blogService.uploadImage(file).subscribe(res => {
      this.form.patchValue({ coverImageUrl: res.url });
    });
  }

  // Global Paste for Cover (if title/content not focused)
  handleGlobalPaste(event: ClipboardEvent): void {
    const activeEl = document.activeElement;
    if (activeEl?.tagName === 'INPUT' || activeEl?.tagName === 'TEXTAREA' || activeEl?.getAttribute('contenteditable') === 'true') {
      return; 
    }
    const file = this.getFileFromPaste(event);
    if (file) this.uploadCover(file);
  }

  // Content Editor Paste Handler
  onContentPaste(event: ClipboardEvent): void {
    const file = this.getFileFromPaste(event);
    if (file) {
      event.preventDefault();
      // Insert placeholder immediately or use API
      const selection = window.getSelection();
      if (!selection || !selection.rangeCount) return;
      const range = selection.getRangeAt(0);
      
      const placeholderId = 'img-' + Date.now();
      const placeholderNode = document.createElement('div');
      placeholderNode.innerHTML = `<span id="${placeholderId}" style="color:#aaa; font-style:italic;">[Uploading image...]</span>`;
      range.insertNode(placeholderNode);
      range.collapse(false);

      this.blogService.uploadImage(file).subscribe({
        next: (res) => {
          const img = document.createElement('img');
          img.src = res.url;
          img.style.maxWidth = '100%';
          img.style.borderRadius = '8px';
          img.style.margin = '20px 0';
          
          const ph = document.getElementById(placeholderId);
          if (ph && ph.parentNode) {
            ph.parentNode.replaceChild(img, ph);
          } else {
            this.contentEditor.nativeElement.appendChild(img);
          }
          this.form.patchValue({ content: this.contentEditor.nativeElement.innerHTML });
        },
        error: () => {
          const ph = document.getElementById(placeholderId);
          if (ph) ph.innerText = '[Image upload failed]';
        }
      });
    }
  }

  private getFileFromPaste(event: ClipboardEvent): File | null {
    if (!event.clipboardData) return null;
    for (let i = 0; i < event.clipboardData.items.length; i++) {
       const item = event.clipboardData.items[i];
       if (item.type.indexOf('image') !== -1) {
           return item.getAsFile();
       }
    }
    return null;
  }

  onCancel(): void {
    this.router.navigate(['/dashboard']);
  }

  saveAsDraft(): void {
    this.form.patchValue({ isPublished: false });
    this.onSubmit();
  }

  onSubmit(): void {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }

    this.loading = true;
    const request = this.isEdit 
      ? this.blogService.updateBlog(this.blogId!, this.form.value)
      : this.blogService.createBlog(this.form.value);

    request.subscribe({
      next: () => {
        this.loading = false;
        this.router.navigate(['/dashboard']);
      },
      error: () => this.loading = false
    });
  }
}
