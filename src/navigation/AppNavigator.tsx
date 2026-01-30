import { NavigationContainer } from "@react-navigation/native"
import { createStackNavigator } from "@react-navigation/stack"

// Screens
import WelcomeScreen from '../screens/WelcomeScreen';
import RegisterScreen from '../screens/Auth/RegisterScreen';
import ClientRegisterScreen from '../screens/Auth/ClientRegisterScreen';
import OperationalRegisterScreen from '../screens/Auth/OperationalRegisterScreen';
import LoginScreen from '../screens/Auth/LoginScreen';
import AdminDashboard from "../screens/Admin/AdminDashboard";
import ClientDashboard from "../screens/Client/ClientDashboard";
import CompleteProfileScreen from "../screens/Client/CompleteProfileScreen";

import DeviceCatalogScreen from "../screens/Client/DeviceCatalogScreen";
import MyApplicationsScreen from "../screens/Client/MyApplicationsScreen";
import ApplicationDetailsScreen from "../screens/Client/ApplicationDetailsScreen";

export type RootStackParamList = {
    Welcome: undefined;
    Register: undefined;
    ClientRegister: undefined;
    OperationalRegister: undefined;
    Login: undefined;
    DOJCDDashboard: undefined;
    AdminDashboard: undefined;
    CompleteProfile: undefined;
    DeviceCatalog: undefined;
    MyApplications: undefined;
    ApplicationDetails: { applicationId: number  };
};


const Stack = createStackNavigator<RootStackParamList>()

export default function AppNavigator() {
    return (
        <NavigationContainer>
            <Stack.Navigator
                initialRouteName="Welcome"
                screenOptions={{
                    headerStyle: {
                        backgroundColor: "#1e3a8a",
                    },
                    headerTintColor: "#fff",
                    headerTitleStyle: {
                        fontWeight: "600",
                    },
                    headerBackTitle: "Back",
                    cardStyle: { backgroundColor: "#ffffff" },
                }}
            >
                <Stack.Screen name="Welcome" component={WelcomeScreen} options={{ headerShown: false }} />
                <Stack.Screen name="Register" component={RegisterScreen} options={{ title: "Choose Registration" }} />
                <Stack.Screen
                    name="ClientRegister"
                    component={ClientRegisterScreen}
                    options={{ title: "Client Registration" }}
                />
                <Stack.Screen
                    name="OperationalRegister"
                    component={OperationalRegisterScreen}
                    options={{ title: "Operational Registration" }}
                />
                <Stack.Screen
                    name="Login"
                    component={LoginScreen}
                    options={{ title: 'Sign In' }}
                />
                <Stack.Screen
                    name="AdminDashboard"
                    component={AdminDashboard}
                    options={{ title: 'Admin Dashboard' }}
                />
                <Stack.Screen
                    name="DOJCDDashboard"
                    component={ClientDashboard}
                    options={{ title: 'Client Dashboard' }}
                />
                 <Stack.Screen 
                    name="CompleteProfile" 
                    component={CompleteProfileScreen} 
                    options={{ title: 'Complete Profile' }}
                />

                <Stack.Screen
                    name="DeviceCatalog"
                    component={DeviceCatalogScreen}
                    options={{ title: 'Device Catalog' }}
                />
                <Stack.Screen
                    name="MyApplications"
                    component={MyApplicationsScreen}
                    options={{ title: 'My Applications' }}
                />

                <Stack.Screen
                    name="ApplicationDetails"
                    component={ApplicationDetailsScreen}
                    options={{ title: 'Application Details' }}
                />

            </Stack.Navigator>
        </NavigationContainer>
    )
}
