/**
 * Auth0 login via expo-auth-session (PKCE).
 *
 * Used in Expo Go (iOS Simulator / Android) where the native `react-native-auth0`
 * module cannot be loaded. Swap to react-native-auth0 in a dev-client / production
 * build for the native ASWebAuthenticationSession experience.
 */
import * as AuthSession from "expo-auth-session";
import * as WebBrowser from "expo-web-browser";

WebBrowser.maybeCompleteAuthSession();

function envOrUndefined(v: string | undefined): string | undefined {
  if (!v) return undefined;
  const trimmed = v.trim();
  return trimmed.length > 0 ? trimmed : undefined;
}

const AUTH0_DOMAIN = envOrUndefined(process.env.EXPO_PUBLIC_AUTH0_DOMAIN);
const AUTH0_CLIENT_ID = envOrUndefined(process.env.EXPO_PUBLIC_AUTH0_CLIENT_ID);
const AUTH0_AUDIENCE = envOrUndefined(process.env.EXPO_PUBLIC_AUTH0_AUDIENCE);

export type Auth0Tokens = {
  accessToken: string;
  idToken: string;
  refreshToken?: string;
  expiresIn?: number;
  tokenType?: string;
};

export type Auth0UserInfo = {
  sub: string;
  email?: string;
  email_verified?: boolean;
  name?: string;
  picture?: string;
  [key: string]: unknown;
};

export function getRedirectUri(): string {
  // In Expo Go this yields exp://<host>:8081 (simulator) or exp://<LAN>:8081 (device).
  // In a dev client / standalone build it yields mavmarket://redirect.
  return AuthSession.makeRedirectUri({
    scheme: "mavmarket",
    path: "redirect",
  });
}

export function assertAuth0Configured() {
  if (!AUTH0_DOMAIN || !AUTH0_CLIENT_ID) {
    throw new Error(
      "Auth0 not configured: set EXPO_PUBLIC_AUTH0_DOMAIN and EXPO_PUBLIC_AUTH0_CLIENT_ID"
    );
  }
}

export const discovery = {
  authorizationEndpoint: `https://${AUTH0_DOMAIN}/authorize`,
  tokenEndpoint: `https://${AUTH0_DOMAIN}/oauth/token`,
  revocationEndpoint: `https://${AUTH0_DOMAIN}/oauth/revoke`,
  endSessionEndpoint: `https://${AUTH0_DOMAIN}/v2/logout`,
};

export async function exchangeCodeForTokens(
  code: string,
  codeVerifier: string,
  redirectUri: string
): Promise<Auth0Tokens> {
  assertAuth0Configured();
  const body = new URLSearchParams({
    grant_type: "authorization_code",
    client_id: AUTH0_CLIENT_ID!,
    code_verifier: codeVerifier,
    code,
    redirect_uri: redirectUri,
  });
  const res = await fetch(`https://${AUTH0_DOMAIN}/oauth/token`, {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: body.toString(),
  });
  const data = await res.json();
  if (!res.ok) {
    throw new Error(data.error_description || data.error || "Token exchange failed");
  }
  return {
    accessToken: data.access_token,
    idToken: data.id_token,
    refreshToken: data.refresh_token,
    expiresIn: data.expires_in,
    tokenType: data.token_type,
  };
}

export async function fetchUserInfo(accessToken: string): Promise<Auth0UserInfo> {
  assertAuth0Configured();
  const res = await fetch(`https://${AUTH0_DOMAIN}/userinfo`, {
    headers: { Authorization: `Bearer ${accessToken}` },
  });
  if (!res.ok) throw new Error("userinfo fetch failed");
  return res.json();
}

export function buildAuthRequestConfig(): AuthSession.AuthRequestConfig {
  assertAuth0Configured();
  const extraParams: Record<string, string> = {};
  if (AUTH0_AUDIENCE) extraParams.audience = AUTH0_AUDIENCE;

  return {
    clientId: AUTH0_CLIENT_ID!,
    redirectUri: getRedirectUri(),
    responseType: AuthSession.ResponseType.Code,
    scopes: ["openid", "profile", "email", "offline_access"],
    usePKCE: true,
    extraParams,
  };
}

export function buildLogoutUrl(returnTo: string): string {
  assertAuth0Configured();
  const params = new URLSearchParams({
    client_id: AUTH0_CLIENT_ID!,
    returnTo,
  });
  return `https://${AUTH0_DOMAIN}/v2/logout?${params.toString()}`;
}
