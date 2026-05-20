// navigation/AppNavigator.tsx
// Fix: ToastProvider is now inside NavigationContainer so useToast() works
// in every screen without any changes to App.tsx.
// App.tsx stays exactly as: export default function App() { return <AppNavigator />; }

import React, { useEffect, useState } from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createStackNavigator, StackNavigationOptions } from '@react-navigation/stack';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { ToastProvider } from '../components/ToastProvider';

// Public
import LoginScreen          from '../screens/Auth/LoginScreen';
import RegisterScreen       from '../screens/Auth/RegisterScreen';
import ClientRegisterScreen from '../screens/Auth/ClientRegisterScreen';
import WelcomeScreen        from '../screens/WelcomeScreen';

// Client (authenticated)
import ClientDashboard          from '../screens/Client/ClientDashboard';
import ProfileScreen            from '../screens/Client/ProfileScreen';
import DeviceCatalogScreen      from '../screens/Client/DeviceCatalogScreen';
import MyApplicationsScreen     from '../screens/Client/MyApplicationsScreen';
import NotificationsScreen      from '../screens/Client/NotificationsScreen';
import ApplicationDetailsScreen from '../screens/Client/ApplicationDetailsScreen';

// ── Route param list ──────────────────────────────────────────────────────────
// All existing names kept so no other file needs to change its navigate() calls.
export type RootStackParamList = {
    // Public
    Welcome:             undefined;   // added for compatibility
    Login:               undefined;
    Register:            undefined;
    ClientRegister:      undefined;
    OperationalRegister: undefined;   // kept for compatibility

    // Client authenticated
    DOJCDDashboard:     undefined;
    CompleteProfile:    undefined;    // kept — maps to ProfileScreen
    Profile:            undefined;    // new alias
    DeviceCatalog:      undefined;
    MyApplications:     undefined;
    Notifications:      undefined;
    ApplicationDetails: { applicationId: number };

    // Admin (kept for compatibility)
    AdminDashboard: undefined;
};

const Stack = createStackNavigator<RootStackParamList>();

const screenOptions: StackNavigationOptions = {
    headerShown: false,
    cardStyle: { backgroundColor: '#F4F6FA' },
    gestureEnabled: true,
};

// ── Inner navigator (rendered inside NavigationContainer + ToastProvider) ─────
function AppStack() {
    const [initialRoute, setInitialRoute] = useState<keyof RootStackParamList>('Welcome');
    const [ready,        setReady]        = useState(false);

    // Restore session on cold start — mirrors web AppShell logic
    useEffect(() => {
        (async () => {
            try {
                const ud = await AsyncStorage.getItem('user');
                if (ud) {
                    const u = JSON.parse(ud);
                    if (u?.user_type === 'client') {
                        setInitialRoute('DOJCDDashboard');
                    } else if (u?.user_type === 'operational' && u?.user_role === 'Admin') {
                        setInitialRoute('AdminDashboard');
                    }
                }
            } catch { /* ignore */ }
            setReady(true);
        })();
    }, []);

    if (!ready) return null;

    return (
        <Stack.Navigator
            initialRouteName={initialRoute}
            screenOptions={screenOptions}
        >
            {/* Public */}
            <Stack.Screen name="Welcome"        component={WelcomeScreen} />
            <Stack.Screen name="Login"          component={LoginScreen} />
            <Stack.Screen name="Register"       component={RegisterScreen} />
            <Stack.Screen name="ClientRegister" component={ClientRegisterScreen} />

            {/* Client authenticated */}
            <Stack.Screen name="DOJCDDashboard"     component={ClientDashboard} />
            <Stack.Screen name="DeviceCatalog"      component={DeviceCatalogScreen} />
            <Stack.Screen name="MyApplications"     component={MyApplicationsScreen} />
            <Stack.Screen name="Notifications"      component={NotificationsScreen} />
            <Stack.Screen name="ApplicationDetails" component={ApplicationDetailsScreen} />

            {/*
             * Both route names render ProfileScreen.
             * "CompleteProfile" keeps existing navigation.navigate('CompleteProfile') working.
             * "Profile" is the new name used by the web version.
             */}
            <Stack.Screen name="CompleteProfile" component={ProfileScreen} />
            <Stack.Screen name="Profile"         component={ProfileScreen} />
        </Stack.Navigator>
    );
}

// ── Root export: NavigationContainer → ToastProvider → Stack ─────────────────
// ToastProvider MUST be inside NavigationContainer so useToast() works in
// every screen. Your App.tsx does not need to change at all.
export default function AppNavigator() {
    return (
        <NavigationContainer>
            <ToastProvider>
                <AppStack />
            </ToastProvider>
        </NavigationContainer>
    );
}