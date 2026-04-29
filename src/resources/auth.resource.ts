export class AuthResource {
  static tokenResponse(accessToken: string) {
    return { accessToken, tokenType: 'Bearer' };
  }
}
