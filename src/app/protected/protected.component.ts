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
  public cert_uzi: string = `-----BEGIN CERTIFICATE-----
MIIDfzCCAmegAwIBAgIUdEcZ1zOWaoRoGRd3cdK8p1BtUF4wDQYJKoZIhvcNAQEL
BQAwTzELMAkGA1UEBhMCbmwxCzAJBgNVBAgMAm92MRAwDgYDVQQHDAdIZW5nZWxv
MSEwHwYDVQQKDBhJbnRlcm5ldCBXaWRnaXRzIFB0eSBMdGQwHhcNMjExMTE2MTQx
NjU1WhcNMjIxMTE2MTQxNjU1WjBPMQswCQYDVQQGEwJubDELMAkGA1UECAwCb3Yx
EDAOBgNVBAcMB0hlbmdlbG8xITAfBgNVBAoMGEludGVybmV0IFdpZGdpdHMgUHR5
IEx0ZDCCASIwDQYJKoZIhvcNAQEBBQADggEPADCCAQoCggEBAL2IyT5UdYF+lMQF
l37pQMegXPJICzNQbe8M8s+VUILl2lySJGnMmw/U/Kc6RJHz0R4VUFn81+RweuxX
A6+lA0Uk6YM9f6yyU2GXVKl50RbfvlC16VCD9cjoMr8vRlWBWiuIiZfSKrf7nRwz
VuM9KwI2uh5WZFAytlI+SSrIkRIhQmOazpNPb0WLZutIdLSekPByB707Zzp3Lxvd
smJjSHoyZ+yvL6DozzlD49IyTki/QO2SRIcVY0A7TnZA82kG6ZfnyxOeOQsU81fH
Db2Gczp848qRwWJD/94a1/ab0M+1Sju3jRrhIZzMwQGJ8bRxETsgZdc23I0LqXFr
QsrazIMCAwEAAaNTMFEwHQYDVR0OBBYEFMhq4vVr7F7BwUTU18pLxS902H+QMB8G
A1UdIwQYMBaAFMhq4vVr7F7BwUTU18pLxS902H+QMA8GA1UdEwEB/wQFMAMBAf8w
DQYJKoZIhvcNAQELBQADggEBABPJLYWtxVNRpCkYLgW7hesdLs0OjDGLhJ+RM8sV
/Cn8qWxyFYoyWDAZsa8Grnr1nDDrHR5HSyPcnsxO9I0XQfaOsV5qkmx0wzkxYfmp
jHEYz+rknQu4Mv0qnbJw2rgtesl6wAUuSAaXCEf+pRHgF389/sK9OqfaDfGUej8f
4ySnMJu9a5D0cYs9BNILOFNpGyhDlLeTrALMxBYqTVmbTPnip7p607RvOCCIi6jo
1kzMd+9IXzPirMmRFTj+ut2z0Dk7cIkkz8gll+nShlzerc5aD8TY5ehp9N7OoGs0
kQoxle0VO/DcjeZ3ONeYWR/5OjuJl0pbqUTPr3eANVJZlTo=
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
