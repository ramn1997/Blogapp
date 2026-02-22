export interface User {
    id: number;
    fullName: string;
    email: string;
    avatarUrl?: string;
    bio?: string;
    preferredEmail?: string;
    provider?: string;
    createdAt: string;
}

export interface AuthResponse {
    token: string;
    refreshToken: string;
    user: User;
}

export interface RegisterRequest {
    fullName: string;
    email: string;
    password: string;
}

export interface LoginRequest {
    email: string;
    password: string;
}

export interface OAuthLoginRequest {
    provider: string;
    idToken: string;
    email: string;
    fullName: string;
    avatarUrl?: string;
    providerId: string;
}

export interface Blog {
    id: number;
    title: string;
    content: string;
    summary?: string;
    coverImageUrl?: string;
    category?: string;
    tags?: string;
    isPublished: boolean;
    viewCount: number;
    readTimeMinutes: number;
    likeCount: number;
    commentCount: number;
    isLikedByCurrentUser: boolean;
    createdAt: string;
    publishedAt?: string;
    author: Author;
}

export interface Author {
    id: number;
    fullName: string;
    avatarUrl?: string;
}

export interface BlogListResponse {
    items: Blog[];
    totalCount: number;
    page: number;
    pageSize: number;
    totalPages: number;
}

export interface CreateBlogRequest {
    title: string;
    content: string;
    summary?: string;
    coverImageUrl?: string;
    category?: string;
    tags?: string;
    isPublished: boolean;
}

export interface Comment {
    id: number;
    content: string;
    createdAt: string;
    author: Author;
}
