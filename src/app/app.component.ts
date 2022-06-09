import {Component, OnInit} from '@angular/core';
import {OidcSecurityService} from "angular-auth-oidc-client";
import {HttpClient} from "@angular/common/http";
import * as jose from 'jose'
import { of } from 'rxjs';
import { filter, map } from 'rxjs/operators';

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.css']
})
export class AppComponent implements OnInit{
  title = 'nl-uzipoc-clientside';
  userinfo :string = '';
  decrypted :string = '';
  jwks :{"keys":[{"kid":string}]}|undefined = undefined;

  constructor(public oidcSecurityService: OidcSecurityService, public httpClient: HttpClient){}

  async ngOnInit() {
    let jwks;
    const oidcConfiguration = await this.oidcSecurityService.getConfiguration().toPromise();
    if(oidcConfiguration === undefined){
      console.log("oidcConfiguration should be defined");
      return;
    }

    const loginResponse = await this.oidcSecurityService.checkAuth().toPromise();
    if(loginResponse === undefined){
      console.log("loginResponse should be defined");
      return;
    }
    const accessToken = loginResponse.accessToken;

    const userinfoEndpointUrl: string|undefined = oidcConfiguration.authWellknownEndpoints?.userInfoEndpoint;
    if(userinfoEndpointUrl === undefined){
      console.log("userinfoEndpointUrl should be defined");
      return;
    }

    const jwksEndpointUrl :string|undefined = oidcConfiguration.authWellknownEndpoints?.jwksUri;
    if(jwksEndpointUrl === undefined){
      console.log("userinfoEndpointUrl should be defined");
      return;
    }

    const userinfoResponse = await this.httpClient.get(userinfoEndpointUrl,
      {
        headers: {"Authorization": "Bearer " + accessToken},
        responseType: "text"
      }).toPromise();
    if(userinfoResponse === undefined || typeof userinfoResponse !== "string"){
      console.log("userinfoResponse should be defined and should be a string: " + JSON.stringify(userinfoResponse));
      return;
    }
    this.userinfo = userinfoResponse;
    const jwksResponse = await this.httpClient.get(jwksEndpointUrl).toPromise();
    if(jwksResponse === undefined){
      console.log("jwksResponse should be defined");
      return;
    }
    // @ts-ignore
    this.jwks = jwksResponse;
  }

  login() {
    this.oidcSecurityService.authorize();
  }

  logout() {
    this.oidcSecurityService.logoff();
  }

  async onFileSelected(event: any): Promise<void>{
    const file:File = event.target.files[0];
    const fileReader = new FileReader();
    let content = "";
    fileReader.onload = async (_) => {
      content = fileReader.result as string;
      if(!content.startsWith("-----BEGIN PRIVATE KEY-----")){
        this.decrypted = "Please load a private key";
        return;
      }
      await this.decryptJwe(this.userinfo, content);
    }
    fileReader.readAsText(file);
  }

  async decryptJwe(jwe: string, fileText: string): Promise<void>{
    try{
      const algorithm = 'RSA-OAEP'
      const ecPrivateKey = await jose.importPKCS8(fileText, algorithm)
      const { plaintext, protectedHeader } = await jose.compactDecrypt(jwe, ecPrivateKey);

      const jws = new TextDecoder().decode(plaintext);
      const kid = jose.decodeProtectedHeader(jws).kid;
      if(this.jwks === undefined){
        console.log("this.jwks should be defined when decrypting");
        return;
      }
      const certs = this.jwks["keys"].filter(k => kid === k["kid"]);
      if(certs.length === 0){
        this.decrypted = "No Cert found in jwks with matching kid";
      }

      const jwkKey = await jose.importJWK(certs[0], "RS256");

      const result = await jose.compactVerify(jws, jwkKey);
      this.decrypted = new TextDecoder().decode(result.payload);
    } catch(exception){
      console.log(exception);
      this.decrypted = "Error while decrypting: " + exception;
    }
  }
}
