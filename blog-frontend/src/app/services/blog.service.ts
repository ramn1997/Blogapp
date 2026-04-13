import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Blog, BlogListResponse, Comment, CreateBlogRequest } from '../models';
import { environment } from '../../environments/environment';

@Injectable({ providedIn: 'root' })
export class BlogService {
    private readonly API = `${environment.apiUrl}/api/blogs`;

    constructor(private http: HttpClient) { }

    getBlogs(page = 1, pageSize = 9, category?: string, search?: string, userId?: number) {
        let params = new HttpParams()
            .set('page', page)
            .set('pageSize', pageSize);
        if (category) params = params.set('category', category);
        if (search) params = params.set('search', search);
        if (userId) params = params.set('userId', userId);
        return this.http.get<BlogListResponse>(this.API, { params });
    }

    getBlog(id: number) {
        return this.http.get<Blog>(`${this.API}/${id}`);
    }

    createBlog(data: CreateBlogRequest) {
        return this.http.post<Blog>(this.API, data);
    }

    updateBlog(id: number, data: Partial<CreateBlogRequest>) {
        return this.http.put<Blog>(`${this.API}/${id}`, data);
    }

    deleteBlog(id: number) {
        return this.http.delete(`${this.API}/${id}`);
    }

    getMyBlogs(page = 1, pageSize = 10, publishedOnly?: boolean) {
        let params = new HttpParams().set('page', page).set('pageSize', pageSize);
        if (publishedOnly !== undefined) params = params.set('publishedOnly', publishedOnly);
        return this.http.get<BlogListResponse>(`${this.API}/my`, { params });
    }

    toggleLike(id: number) {
        return this.http.post<{ liked: boolean }>(`${this.API}/${id}/like`, {});
    }

    getComments(id: number) {
        return this.http.get<Comment[]>(`${this.API}/${id}/comments`);
    }

    addComment(id: number, content: string) {
        return this.http.post<Comment>(`${this.API}/${id}/comments`, { content });
    }

    deleteComment(blogId: number, commentId: number) {
        return this.http.delete(`${this.API}/${blogId}/comments/${commentId}`);
    }

    getCategories() {
        return this.http.get<string[]>(`${this.API}/categories`);
    }

    toggleSave(id: number) {
        return this.http.post<{ saved: boolean }>(`${this.API}/${id}/save`, {});
    }

    getSavedBlogs(page = 1, pageSize = 9) {
        return this.http.get<BlogListResponse>(`${this.API}/saved`, {
            params: new HttpParams().set('page', page).set('pageSize', pageSize)
        });
    }

    uploadImage(file: File) {
        const formData = new FormData();
        formData.append('file', file);
        return this.http.post<{ url: string }>(`${environment.apiUrl}/api/upload`, formData);
    }
}
