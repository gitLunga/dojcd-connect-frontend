import * as Linking from 'expo-linking';
import * as WebBrowser from 'expo-web-browser';
import { authAPI, BASE_URL } from './api';

// Lets the web version close the pop-up window when it returns to the app.
WebBrowser.maybeCompleteAuthSession();

export type MicrosoftSignInResult =
    | { status: 'cancelled' }
    | { status: 'signedIn'; user: any; accessToken: string; refreshToken?: string };

// The address Microsoft sign-in returns to. With `"scheme": "dojcdconnect"` in app.json this is
// dojcdconnect://auth/callback, which must be listed in the server's AUTH_ALLOWED_REDIRECTS.
export const microsoftRedirectUrl = () => Linking.createURL('auth/callback');

export function microsoftStartUrl(redirect: string): string {
    return `${BASE_URL}/auth/entra/login?audience=client&redirect=${encodeURIComponent(redirect)}`;
}

// Opens the system browser on Microsoft's sign-in page. The server checks the person with Microsoft and sends
// the browser back to the app with a one-time ticket, which is swapped here for the session.
export async function signInWithMicrosoft(): Promise<MicrosoftSignInResult> {
    const redirect = microsoftRedirectUrl();
    const result = await WebBrowser.openAuthSessionAsync(microsoftStartUrl(redirect), redirect);
    if (result.type !== 'success') return { status: 'cancelled' };

    const params = (Linking.parse(result.url).queryParams ?? {}) as Record<string, string | string[] | undefined>;
    const ticket = typeof params.ticket === 'string' ? params.ticket : undefined;
    if (!ticket) {
        const description = typeof params.error_description === 'string' ? params.error_description : undefined;
        throw new Error(description || 'Microsoft sign-in was not completed.');
    }

    const body = (await authAPI.exchangeTicket(ticket)).data;
    if (!body?.success || !body.data?.user) throw new Error(body?.message || 'Sign-in could not be completed.');
    return { status: 'signedIn', user: body.data.user, accessToken: body.data.accessToken, refreshToken: body.data.refreshToken };
}
