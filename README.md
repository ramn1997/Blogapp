#  ThoughtStream — Full-Stack Blog Platform

A modern blogging platform built with **Angular 19** + **ASP.NET Core 10** + **SQL Server**, featuring Google and Microsoft OAuth authentication.

##  Live URLs

*   **Frontend**: [https://ramn1997.github.io/Blogapp/](https://ramn1997.github.io/Blogapp/)
*   **Backend (API)**: [http://localhost:5000](http://localhost:5000) (Local)
*   **API Public Image**: `ghcr.io/ramn1997/blogapp-api:latest`

---

## Architecture

```
BlogApp/
├── BlogApp.API/          # ASP.NET Core 10 Web API
│   ├── Controllers/      # Auth + Blogs endpoints
│   ├── Data/             # EF Core DbContext
│   ├── DTOs/             # Request/response models
│   ├── Models/           # Domain entities
│   ├── Services/         # Business logic
│   ├── Dockerfile        # Multi-stage Docker build
│   └── appsettings.json  # Configuration
├── blog-frontend/        # Angular 19 SPA
│   ├── src/app/
│   │   ├── components/   # Shared components (navbar, blog-card)
│   │   ├── pages/        # Route pages (home, login, register, write…)
│   │   ├── services/     # API services
│   │   ├── guards/       # Auth route guard
│   │   ├── interceptors/ # JWT HTTP interceptor
│   │   └── models/       # TypeScript interfaces
│   └── src/environments/ # Dev/prod config
├── .github/workflows/    # GitHub Actions CI/CD
└── docker-compose.yml    # API + SQL Server stack
```

##  Features

- **Authentication**
  -  Register with email + password + preferred email
  -  Login with email + password
  -  **Google OAuth** (via Google Identity Services SDK)
  -  **Microsoft OAuth** (via MSAL Browser)
  -  JWT tokens with 7-day expiry
- **Blog Posts**
  -  Create/edit/delete posts
  -  Draft vs. published status
  -  Categories and tags
  -  Cover image
  -  Auto-calculated read time
  -  Full-text search + category filter
  -  Pagination
- **Engagement**
  -  Like/unlike posts
  -  Comments with delete
  -  View count tracking
- **Profile**
  -  Edit display name, bio, preferred email, avatar
- **Deployment**
  -  API → Docker image → GitHub Container Registry (GHCR)
  -  Frontend → GitHub Pages via GitHub Actions

---

##  Quick Start

### Prerequisites
- .NET 10 SDK
- Node.js 20+ / Angular CLI 19
- SQL Server (or Docker)

---

### 1. Configure the API

Edit `BlogApp.API/appsettings.json`:

```json
{
  "ConnectionStrings": {
    "DefaultConnection": "Server=localhost;Database=BlogAppDb;Trusted_Connection=True;TrustServerCertificate=True;"
  },
  "Jwt": {
    "Key": "CHANGE_THIS_TO_STRONG_SECRET_KEY_32+_CHARS",
    "Issuer": "BlogApp.API",
    "Audience": "BlogApp.Frontend"
  }
}
```

### 2. Run the API

```powershell
cd BlogApp.API
dotnet ef database update   # Creates DB and runs migrations
dotnet run                  # Starts on http://localhost:5000
# Swagger: http://localhost:5000/swagger
```

### 3. Configure Angular

Edit `blog-frontend/src/environments/environment.ts`:

```typescript
export const environment = {
  production: false,
  apiUrl: 'http://localhost:5000',
  googleClientId: 'YOUR_GOOGLE_CLIENT_ID.apps.googleusercontent.com',
  microsoftClientId: 'YOUR_MICROSOFT_APP_CLIENT_ID',
  microsoftTenantId: 'common'
};
```

### 4. Run the Frontend

```powershell
cd blog-frontend
npm install
ng serve                    # Opens http://localhost:4200
```

---

##  OAuth Setup

### Google OAuth
1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Create or select a project
3. Navigate to **APIs & Services → OAuth 2.0 Client IDs**
4. Create a **Web application** credential
5. Add authorized origins: `http://localhost:4200`
6. Copy the **Client ID** → `googleClientId` in environment.ts

### Microsoft OAuth (Azure AD)
1. Go to [Azure Portal → App Registrations](https://portal.azure.com/#view/Microsoft_AAD_RegisteredApps)
2. Register a new app (Supported account types: **Multitenant + personal**)
3. Add a **SPA** redirect URI: `http://localhost:4200`
4. Copy the **Application (client) ID** → `microsoftClientId` in environment.ts

---

##  Docker Deployment

###  Public vs. Local
*   **Local Build**: By default, the `docker-compose.yml` is configured to build the image locally from source.
*   **Public Image**: The GitHub Actions push the container to **GitHub Container Registry (GHCR)**. To make this image public:
    1. Go to your GitHub profile → **Packages**.
    2. Select `blogapp-api`.
    3. Go to **Package Settings**.
    4. Scroll to "Danger Zone" and click **Change visibility** → **Public**.

### Build and push API to GHCR manually

```bash
docker build -t ghcr.io/ramn1997/blogapp-api:latest ./BlogApp.API
docker push ghcr.io/ramn1997/blogapp-api:latest
```

### Run full stack with Docker Compose

```bash
docker compose up -d
```

This starts:
- **API** on port `5000` (mapped to internal 8080)
- **SQL Server 2022 Express** on port `1433`

---

##  GitHub Actions CI/CD

The workflow (`.github/workflows/ci-cd.yml`) runs on push to `main`:

1. **Build API** → Creates Docker image → Pushes to `ghcr.io/ramn1997/blogapp-api`
2. **Build Frontend** → `ng build` → Deploys to **GitHub Pages**

### Setup
1. Push this repo to GitHub.
2. Go to **Settings → Pages → Source**: `gh-pages` branch.
3. Ensure your GitHub Action has `write` permissions to deploy.

---

## 📋 API Reference

| Method | Path | Auth | Description |
|--------|------|------|-------------|
| `POST` | `/api/auth/register` | ❌ | Register |
| `POST` | `/api/auth/login` | ❌ | Login |
| `POST` | `/api/auth/oauth` | ❌ | Google/Microsoft SSO |
| `GET` | `/api/auth/profile` | ✅ | Get profile |
| `PUT` | `/api/auth/profile` | ✅ | Update profile |
| `GET` | `/api/blogs` | ❌ | List blogs |
| `GET` | `/api/blogs/{id}` | ❌ | Get blog |
| `POST` | `/api/blogs` | ✅ | Create blog |
| `PUT` | `/api/blogs/{id}` | ✅ | Update blog |
| `DELETE` | `/api/blogs/{id}` | ✅ | Delete blog |
| `GET` | `/api/blogs/my` | ✅ | My blogs |
| `POST` | `/api/blogs/{id}/like` | ✅ | Toggle like |
| `GET` | `/api/blogs/{id}/comments` | ❌ | Get comments |
| `POST` | `/api/blogs/{id}/comments` | ✅ | Add comment |
| `DELETE` | `/api/blogs/{id}/comments/{cid}` | ✅ | Delete comment |

Full Swagger docs at: `http://localhost:5000/swagger`

---

##  Design System

- **Dark theme** by default
- **Inter** font from Google Fonts
- CSS custom properties for consistent tokens
- Responsive grid layout
- Subtle hover effects (not overly animated)
