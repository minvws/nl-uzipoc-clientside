import { THIS_EXPR } from '@angular/compiler/src/output/output_ast';
import { Component } from '@angular/core';
import { Router } from '@angular/router';
import { AuthConfig, OAuthService } from 'angular-oauth2-oidc';
import { environment } from './../environments/environment';


@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.css']
})
export class AppComponent {
  title = 'uzi-poc-clientside';
  clientId = environment.clientId;

  constructor(private oauthService :OAuthService, private router:Router) {
    this.oauthService.configure(authCodeFlowConfig);
    this.oauthService.loadDiscoveryDocumentAndTryLogin();
   }

  ngOnInit(): void {
    this.oauthService.configure(authCodeFlowConfig);
    this.oauthService.loadDiscoveryDocumentAndTryLogin();
    this.clientId = environment.clientId;
  }

  canLogout(): boolean {
    return this.oauthService.getAccessToken() != null;
  }

  login(): void {
    this.oauthService.initCodeFlow();
  }

  logout(): void {
    this.oauthService.logOut();
    this.router.navigate(["/home"]);
  }

  backgroundColor(): any {
    return 'rgb(240, 255, 224)';
  }
}
export const authCodeFlowConfig: AuthConfig = {
  issuer: environment.issuer,
  redirectUri: window.location.origin + environment.redirectPath,
  clientId: environment.clientId,
  responseType: environment.responseType,
  scope: environment.scope,
  oidc: environment.oidc,
  showDebugInformation: environment.showDebugInformation
};