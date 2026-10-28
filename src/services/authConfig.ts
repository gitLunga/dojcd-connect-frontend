import { authAPI } from './api';

// How people sign in is a server setting (AUTH_PROVIDER): "local" email + password, "ldap" domain credentials,
// or "entra" Microsoft sign-in. This is what we assume until the server says otherwise, and what an older
// server (without /auth/config) is treated as.
export interface AuthConfig {
    provider: 'local' | 'ldap' | 'entra';
    directory: boolean;
    loginMethod: 'password' | 'microsoft';
    selfRegistration: boolean;
    passwordManagedLocally: boolean;
    // Sent by newer servers: may CLIENTS register with their own password next to the organisation sign-in?
    clientRegistration?: boolean;
    usernameLabel: string;
}

export const LOCAL_AUTH: AuthConfig = Object.freeze({
    provider: 'local',
    directory: false,
    loginMethod: 'password',
    selfRegistration: true,
    passwordManagedLocally: true,
    usernameLabel: 'Email',
}) as AuthConfig;

let cached: AuthConfig | null = null;

export async function fetchAuthConfig(force = false): Promise<AuthConfig> {
    if (cached && !force) return cached;
    try {
        const body = (await authAPI.getConfig()).data;
        if (body?.data && typeof body.data.provider === 'string') {
            // This app is the client app, so what matters is whether clients may register (clientRegistration).
            // When the server allows it, registration and "forgot password" are offered as in local mode.
            const clients = body.data.clientRegistration;
            cached = {
                ...LOCAL_AUTH, ...body.data,
                ...(typeof clients === 'boolean'
                    ? { selfRegistration: clients, passwordManagedLocally: clients || body.data.passwordManagedLocally === true }
                    : {}),
            };
            return cached as AuthConfig;
        }
    } catch (_) { /* unreachable, or an older server: fall through */ }
    return LOCAL_AUTH;        // not cached, so the next screen asks again
}

export function resetAuthConfigCache(): void { cached = null; }
