import { NgModule } from '@angular/core';
import { BrowserModule } from '@angular/platform-browser';
import { HttpClientModule, HTTP_INTERCEPTORS } from '@angular/common/http';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';

import { AppRoutingModule } from './app-routing.module';
import { AppComponent } from './app.component';
import { NavbarComponent } from './components/navbar/navbar.component';
import { HomeComponent } from './pages/home/home.component';
import { LoginComponent } from './pages/auth/login/login.component';
import { RegisterComponent } from './pages/auth/register/register.component';
import { BlogDetailComponent } from './pages/blog-detail/blog-detail.component';
import { BlogWriteComponent } from './pages/blog-write/blog-write.component';
import { DashboardComponent } from './pages/dashboard/dashboard.component';
import { ProfileComponent } from './pages/profile/profile.component';
import { BlogCardComponent } from './components/blog-card/blog-card.component';
import { AuthInterceptor } from './interceptors/auth.interceptor';
import { MsalModule, MSAL_INSTANCE, MsalService } from '@azure/msal-angular';
import { IPublicClientApplication, PublicClientApplication, BrowserCacheLocation } from '@azure/msal-browser';
import { environment } from '../environments/environment';

export function MSALInstanceFactory(): IPublicClientApplication {
  return new PublicClientApplication({
    auth: {
      clientId: environment.microsoftClientId,
      authority: 'https://login.microsoftonline.com/common',
      redirectUri: window.location.origin
    },
    cache: {
      cacheLocation: BrowserCacheLocation.SessionStorage
    }
  });
}

@NgModule({
  declarations: [
    AppComponent,
    NavbarComponent,
    HomeComponent,
    LoginComponent,
    RegisterComponent,
    BlogDetailComponent,
    BlogWriteComponent,
    DashboardComponent,
    ProfileComponent,
    BlogCardComponent
  ],
  imports: [
    BrowserModule,
    AppRoutingModule,
    HttpClientModule,
    FormsModule,
    ReactiveFormsModule,
    MsalModule
  ],
  providers: [
    { provide: HTTP_INTERCEPTORS, useClass: AuthInterceptor, multi: true },
    { provide: MSAL_INSTANCE, useFactory: MSALInstanceFactory },
    MsalService
  ],
  bootstrap: [AppComponent]
})
export class AppModule { }
