import { NgModule } from '@angular/core';
import { AuthModule } from 'angular-auth-oidc-client';
import { environment } from './../../environments/environment'


@NgModule({
    imports: [AuthModule.forRoot({
        config: {
            authority: environment.authority,
            redirectUrl: window.location.origin,
            postLogoutRedirectUri: window.location.origin,
            clientId: environment.clientId,
            scope: 'openid', // 'openid profile ' + your scopes
            responseType: 'code',
            silentRenew: false,
            renewTimeBeforeTokenExpiresInSeconds: 10,
            autoUserInfo: false
        }
      })],
    exports: [AuthModule],
})
export class AuthConfigModule {}
