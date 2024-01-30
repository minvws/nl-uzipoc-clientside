import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { OAuthService } from 'angular-oauth2-oidc';
import { authCodeFlowConfig } from '../app.component';
import { compactDecrypt } from 'jose/jwe/compact/decrypt'
import { importPKCS8, importX509 } from 'jose/key/import'
import { compactVerify } from 'jose/jws/compact/verify'
import { interval, Subscription } from 'rxjs';

interface IUserInfo {vUZI:string,pubkey_URA:string};

@Component({
  selector: 'app-protected',
  templateUrl: './protected.component.html',
  styleUrls: ['./protected.component.css']
})
export class ProtectedComponent implements OnInit {

public cert: string = `-----BEGIN CERTIFICATE-----
XXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX
XXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX
XXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX
XXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX
XXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX
XXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX
XXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX
XXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX
XXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX
XXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX
XXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX
XXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX
XXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX
XXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX
XXXXXXXXXXXXXXXXXXXX
-----END CERTIFICATE-----
`;
  public cert_uzi: string = `-----BEGIN CERTIFICATE-----
XXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX
XXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX
XXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX
XXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX
XXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX
XXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX
XXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX
XXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX
XXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX
XXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX
XXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX
XXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX
XXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX
XXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX
XXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX
XXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX
XXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX
XXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX
XXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX
-----END CERTIFICATE-----
`;


  public userInfo: IUserInfo = {vUZI:"",pubkey_URA:""};
  public interval: Subscription | undefined= undefined;
  public publicKey: string = "";
  public decrypted: string = "";
  public userDataDecrypted: any = undefined;

  constructor(private oauthService: OAuthService, private router: Router, private httpClient: HttpClient) { }

  async ngOnInit(): Promise<void> {
    this.interval = interval(1000).subscribe(async x => this.getUserInfo());
  }

  async getUserInfo(): Promise<void>{
    if(this.oauthService.getAccessToken() == null){
      return;
    }
    try{
      const headers = new HttpHeaders()
        .set('Authorization', 'Bearer ' + this.oauthService.getAccessToken());
      this.userInfo = await this.httpClient.get<IUserInfo>(authCodeFlowConfig.issuer + "/userinfo", {headers}).toPromise();
      this.publicKey = atob(this.userInfo.pubkey_URA);
      this.interval?.unsubscribe();
    } catch(error){
      this.oauthService.logOut();
      this.router.navigate(["/home"]);
    }
  }

  async onFileSelected(event: any): Promise<void>{
    const file: File = event.target.files[0];
    const fileReader = new FileReader();
    let content = "";
    fileReader.onload = async (_) => {
      content = fileReader.result as string;
      if(!content.startsWith("-----BEGIN PRIVATE KEY-----")){
        this.userDataDecrypted = "Please load a private key";
        return;
      }
      await this.decryptJwe(this.userInfo.vUZI, content);
    }
    fileReader.readAsText(file);
  }

  async decryptJwe(jwe: string, fileText: string): Promise<void>{
    try{
      const algorithm = 'RSA-OAEP'
      const ecPrivateKey = await importPKCS8(fileText, algorithm)
      const { plaintext, protectedHeader } = await compactDecrypt(jwe, ecPrivateKey);

      const jws = new TextDecoder().decode(plaintext);

      let result;
      try{
        const importedCert = await importX509(this.cert, "RS256");
        result = await compactVerify(jws, importedCert);
      } catch(e){
        const importedCert = await importX509(this.cert_uzi, "RS256");
        result = await compactVerify(jws, importedCert);
      }
      console.log(result);

      this.userDataDecrypted = new TextDecoder().decode(result.payload);
    } catch(exception){
      console.log(exception);
      this.userDataDecrypted = "Error while decrypting: " + exception;
    }
  }
}
