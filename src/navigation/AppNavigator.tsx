import { NavigationContainer } from "@react-navigation/native"
import { createStackNavigator } from "@react-navigation/stack"

// Screens
import WelcomeScreen from '../screens/WelcomeScreen';
import RegisterScreen from '../screens/RegisterScreen';
import ClientRegisterScreen from '../screens/ClientRegisterScreen';
import OperationalRegisterScreen from '../screens/OperationalRegisterScreen';
import LoginScreen from '../screens/LoginScreen';
import AdminDashboard from "../screens/AdminDashboard";
import ClientDashboard from "../screens/ClientDashboard";

export type RootStackParamList = {
    Welcome: undefined;
    Register: undefined;
    ClientRegister: undefined;
    OperationalRegister: undefined;
    Login: undefined;
    DOJCDDashboard: undefined;
    AdminDashboard: undefined;
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
                <Stack.Screen name="Login" component={LoginScreen} options={{ title: "Sign In" }} />
            </Stack.Navigator>
        </NavigationContainer>
    )
}
