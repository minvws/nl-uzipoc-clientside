import { HttpClient, HttpHeaders } from '@angular/common/http';
import { THIS_EXPR } from '@angular/compiler/src/output/output_ast';
import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { OAuthService } from 'angular-oauth2-oidc';
import { authCodeFlowConfig } from '../app.component';
import { compactDecrypt } from 'jose/jwe/compact/decrypt'
import { importPKCS8, importX509 } from 'jose/key/import'
import { compactVerify } from 'jose/jws/compact/verify'

interface IUserInfo {vUZI:string,pubkey_URA:string};

@Component({
  selector: 'app-protected',
  templateUrl: './protected.component.html',
  styleUrls: ['./protected.component.css']
})
export class ProtectedComponent implements OnInit {

public cert:string = `-----BEGIN CERTIFICATE-----
MIIDJzCCAg+gAwIBAgIIMt5jmZsVqKswDQYJKoZIhvcNAQELBQAwGjEYMBYGA1UEAxMPQ0lCRyBT
UyBSb290IENBMCAXDTE1MDYwODA3NDkyNFoYDzIwNTAwMTAxMDg0OTI0WjApMScwJQYDVQQDEx52
d3MtZGNhLXdzZ3QtMDEubXN0Lm1oc3JpamsubmwwggEiMA0GCSqGSIb3DQEBAQUAA4IBDwAwggEK
AoIBAQCVWG99bAvLS1HH2LifG9XrglpxFb1fAPqMokXX0Dq4BrSxvu3fwPpJrCBRnJxYPiRTSQnB
A7pO2hZ99RIWYnB1ApEt9V9JXXywxxSEjDaNEhDhd1PsxMdKqBm4TT4UZK1HSJ8ffbsVJEal6arL
ejEQ3+lIyXwojluAc+sxrYcM68I2I9P151fPFr4k0KwpjGYSDtHJc2XbcKcpJhVglY3VE8vgUN+j
zGfXx3f/a9MHFb1gTKP75ud1/cHjGBFQ8u5UU3oApE6tX1AeJwnLy+LdRMJO4Yt3SK1QZO2POyFf
QO7vXsjOSurgZcahIK1JGL5LmR0Us0pFKCbZRVdulhpfAgMBAAGjYDBeMAwGA1UdEwEB/wQCMAAw
DgYDVR0PAQH/BAQDAgXgMB0GA1UdDgQWBBT7idrI7eEp43KgOvbUhpfgAu+USzAfBgNVHSMEGDAW
gBR0dimgyKyeWLarfxh4j9ywOtr0pzANBgkqhkiG9w0BAQsFAAOCAQEAgEMAFtfftjYhBpx1mfwK
VyKJo2cOHGEFNVz+fETBlvTwqRXLxSYWZN8TBMT3BMi9KBVuPW0k3Ugx3FksvLvVtO89P6csPIus
vZwMOYVBCJHCvuB0QfoOTFnmiKv0jIHA5FAUB5V5ro+1zjmDUoPB1ecHj0Kp2ameGg1gy05JlK3o
1QY6Cq5u9omrOogT9MYvNWDtJfxROoFrBfAsQCKtyjbIpfWLoDX6hgwLxwlS6xD4IBdZAZzg598V
JMl1eeOFMudDMpYORuggKdZlU6YBjrWOsXD6Uy7yZ6Gcap0dYJbyUmQIi5dyeZM6eU++BDd0TQKh
J0/vVhoNZ/EjU847fw==
-----END CERTIFICATE-----
`;

  public userInfo: IUserInfo = {vUZI:"",pubkey_URA:""};
  public publicKey: string = "";
  public decrypted: string = "";
  public userDataDecrypted: any = undefined;

  constructor(private oauthService: OAuthService, private router: Router, private httpClient: HttpClient) { }
  
  async ngOnInit(): Promise<void> {
    try{
      const headers = new HttpHeaders()
      .set('Authorization', 'Bearer ' + this.oauthService.getAccessToken());
      this.userInfo = await this.httpClient.get<IUserInfo>(authCodeFlowConfig.issuer + "/userinfo", {headers}).toPromise();
      this.publicKey = atob(this.userInfo.pubkey_URA);
    } catch(error){
      this.oauthService.logOut();
      this.router.navigate(["/home"]);
    }
  }
  
  async onFileSelected(event: any): Promise<void>{
    const file:File = event.target.files[0];
    const fileReader = new FileReader();
    let content = "";
    fileReader.onload = async (_) => {
      content = fileReader.result as string;
      if(!content.startsWith("-----BEGIN PRIVATE KEY-----")){
        console.log("Please load a private key");
        return;
      }
      await this.decryptJwe(this.userInfo.vUZI, content);
    }
    fileReader.readAsText(file);
  }
  
  async decryptJwe(jwe: string, fileText: string): Promise<void>{
    const algorithm = 'RSA-OAEP'
    const ecPrivateKey = await importPKCS8(fileText, algorithm)
    const { plaintext, protectedHeader } = await compactDecrypt(jwe, ecPrivateKey);
    
    const jws = new TextDecoder().decode(plaintext);

    const importedCert = await importX509(this.cert, "RS256");
    const result = await compactVerify(jws, importedCert);
    this.userDataDecrypted = new TextDecoder().decode(result.payload);
    console.log(this.userDataDecrypted);
  }
}