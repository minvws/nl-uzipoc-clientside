import { NgModule } from '@angular/core';
import { BrowserModule } from '@angular/platform-browser';

import { AppRoutingModule } from './app-routing.module';
import { AppComponent } from './app.component';
import { BrowserAnimationsModule } from '@angular/platform-browser/animations';
import { MatToolbarModule } from '@angular/material/toolbar';
import { MatButtonToggleModule } from '@angular/material/button-toggle';
import { MatButtonModule } from '@angular/material/button';
import { HomeComponent } from './home/home.component';
import { ProtectedComponent } from './protected/protected.component';
import { OAuthModule, OAuthStorage } from 'angular-oauth2-oidc';
import { HttpClientModule } from '@angular/common/http';
import { FormsModule } from '@angular/forms';

export function storageFactory() : OAuthStorage {
  return sessionStorage
}

@NgModule({
  declarations: [
    AppComponent,
    HomeComponent,
    ProtectedComponent
  ],
  imports: [
    BrowserModule,
    AppRoutingModule,
    BrowserAnimationsModule,
    MatToolbarModule,
    MatButtonModule,
    MatButtonToggleModule,
    HttpClientModule,
    OAuthModule.forRoot(),
  ],
  providers: [
    { provide: OAuthStorage, useFactory: storageFactory }
  ],
  bootstrap: [AppComponent]
})
export class AppModule { }
