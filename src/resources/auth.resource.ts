export class AuthResource {
  static tokenResponse(accessToken: string, user?: unknown) {
    return {
      accessToken,
      tokenType: 'Bearer',
      ...(user ? { user } : {}),
    };
  }
}
