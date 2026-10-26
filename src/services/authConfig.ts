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
            cached = { ...LOCAL_AUTH, ...body.data };
            return cached as AuthConfig;
        }
    } catch (_) { /* unreachable, or an older server: fall through */ }
    return LOCAL_AUTH;        // not cached, so the next screen asks again
}

export function resetAuthConfigCache(): void { cached = null; }
