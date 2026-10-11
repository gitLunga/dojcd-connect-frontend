import { useEffect, useState } from 'react';
import { AuthConfig, LOCAL_AUTH, fetchAuthConfig } from '../services/authConfig';

// Returns the server's sign-in settings; `loaded` is false until the first answer (or the fallback) arrives.
export function useAuthConfig(): { config: AuthConfig; loaded: boolean } {
    const [state, setState] = useState<{ config: AuthConfig; loaded: boolean }>({ config: LOCAL_AUTH, loaded: false });

    useEffect(() => {
        let active = true;
        fetchAuthConfig().then((config) => { if (active) setState({ config, loaded: true }); });
        return () => { active = false; };
    }, []);

    return state;
}
