import React, { useState } from 'react';
import {
    View,
    Text,
    StyleSheet,
    Pressable,
    ScrollView,
    TextInput,
    Alert,
    ActivityIndicator
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { StackNavigationProp } from '@react-navigation/stack';
import { RootStackParamList } from '../navigation/AppNavigator';
import { authAPI } from '../services/api'; // Import your API

type LoginScreenNavigationProp = StackNavigationProp<
    RootStackParamList,
    'Login'
>;

type Props = {
    navigation: LoginScreenNavigationProp;
};

export default function LoginScreen({ navigation }: Props) {
    const [formData, setFormData] = useState({
        email: '',
        password: '',
        rememberMe: false,
    });
    const [loading, setLoading] = useState(false);

    const handleLogin = async () => {
        // Basic validation
        if (!formData.email || !formData.password) {
            Alert.alert('Error', 'Please enter both email and password');
            return;
        }

        setLoading(true);

        try {
            console.log('🔄 Attempting login...');

            // ACTUAL API CALL
            const response = await authAPI.login({
                email: formData.email,
                password: formData.password
            });

            console.log('✅ Login API Response:', response.data);

            // This comes from your actual backend
            Alert.alert('Success', response.data.message || 'Login successful!');

            if (!response.data.success) {
                Alert.alert("Login Failed", response.data.message);
                return;
            }

            const user = response.data.data.user;     // user object
            const userType = user.user_type || null;  // "client" or "operational"

            // Save user securely
            await AsyncStorage.setItem("user", JSON.stringify(user));

            Alert.alert("Success", response.data.message);

            // ------------------------------------------------------
            // ROLE-BASED ROUTING
            // ------------------------------------------------------

            if (userType === "client") {
                navigation.reset({
                    index: 0,
                    routes: [{ name: "DOJCDDashboard" }],
                });
                return;
            }

            if (userType === "operational") {
                switch (user.user_role) {
                    case "Admin":
                        navigation.reset({
                            index: 0,
                            routes: [{ name: "AdminDashboard" }],
                        });
                        break;

                    // case "MTN_Staff":
                    //     navigation.reset({
                    //         index: 0,
                    //         routes: [{ name: "MTNDashboard" }],
                    //     });
                    //     break;
                    //
                    // case "Warehouse":
                    //     navigation.reset({
                    //         index: 0,
                    //         routes: [{ name: "WarehouseDashboard" }],
                    //     });
                    //     break;
                    //
                    // case "Support":
                    //     navigation.reset({
                    //         index: 0,
                    //         routes: [{ name: "SupportDashboard" }],
                    //     });
                    //     break;

                    default:
                        Alert.alert("Error", "Unknown user role");
                        break;
                }
                return;
            }

            Alert.alert("Error", "Unknown user type returned from server");

        } catch (error: any) {
            console.log('❌ Login API Error:', error.message);
            Alert.alert('Login Failed', error.message || 'Invalid email or password');
        } finally {
            setLoading(false);
        }
    };

    const handleForgotPassword = () => {
        Alert.alert('Forgot Password', 'Password reset feature coming soon!');
    };

    return (
        <ScrollView style={styles.container}>
            <View style={styles.header}>
                <Text style={styles.title}>Welcome Back</Text>
                <Text style={styles.subtitle}>Sign in to your account</Text>
            </View>

            <View style={styles.form}>
                <View style={styles.inputGroup}>
                    <Text style={styles.label}>Email Address</Text>
                    <TextInput
                        style={styles.input}
                        placeholder="Enter your email address"
                        keyboardType="email-address"
                        autoCapitalize="none"
                        value={formData.email}
                        onChangeText={(text) => setFormData({...formData, email: text})}
                        editable={!loading}
                    />
                </View>

                <View style={styles.inputGroup}>
                    <Text style={styles.label}>Password</Text>
                    <TextInput
                        style={styles.input}
                        placeholder="Enter your password"
                        secureTextEntry
                        value={formData.password}
                        onChangeText={(text) => setFormData({...formData, password: text})}
                        editable={!loading}
                    />
                    <Pressable
                        style={styles.forgotPassword}
                        onPress={handleForgotPassword}
                        disabled={loading}
                    >
                        <Text style={styles.forgotPasswordText}>Forgot Password?</Text>
                    </Pressable>
                </View>

                <View style={styles.rememberMe}>
                    <Pressable
                        style={styles.checkbox}
                        onPress={() => setFormData({...formData, rememberMe: !formData.rememberMe})}
                        disabled={loading}
                    >
                        <View style={[
                            styles.checkboxBox,
                            formData.rememberMe && styles.checkboxBoxChecked
                        ]}>
                            {formData.rememberMe && (
                                <Text style={styles.checkboxCheck}>✓</Text>
                            )}
                        </View>
                        <Text style={styles.checkboxLabel}>Remember me</Text>
                    </Pressable>
                </View>

                <Pressable
                    style={[styles.loginButton, loading && styles.loginButtonDisabled]}
                    onPress={handleLogin}
                    disabled={loading}
                >
                    {loading ? (
                        <ActivityIndicator color="white" />
                    ) : (
                        <Text style={styles.loginButtonText}>Sign In</Text>
                    )}
                </Pressable>

                <View style={styles.divider}>
                    <View style={styles.dividerLine} />
                    <Text style={styles.dividerText}>or</Text>
                    <View style={styles.dividerLine} />
                </View>

                <View style={styles.registerOptions}>
                    <Text style={styles.registerPrompt}>Don't have an account?</Text>

                    <Pressable
                        style={styles.registerOption}
                        onPress={() => navigation.navigate('ClientRegister')}
                        disabled={loading}
                    >
                        <View style={[styles.optionIcon, { backgroundColor: '#3b82f6' }]}>
                            <Text style={styles.optionIconText}>👨‍⚖️</Text>
                        </View>
                        <View style={styles.optionText}>
                            <Text style={styles.optionTitle}>Client User</Text>
                            <Text style={styles.optionDesc}>Request devices and track applications</Text>
                        </View>
                        <Text style={styles.optionArrow}>→</Text>
                    </Pressable>

                    <Pressable
                        style={styles.registerOption}
                        onPress={() => navigation.navigate('OperationalRegister')}
                        disabled={loading}
                    >
                        <View style={[styles.optionIcon, { backgroundColor: '#10b981' }]}>
                            <Text style={styles.optionIconText}>👨‍💼</Text>
                        </View>
                        <View style={styles.optionText}>
                            <Text style={styles.optionTitle}>Operational User</Text>
                            <Text style={styles.optionDesc}>Staff and administrator access</Text>
                        </View>
                        <Text style={styles.optionArrow}>→</Text>
                    </Pressable>
                </View>
            </View>
        </ScrollView>
    );
}

const styles = StyleSheet.create({

    container: {
        flex: 1,
        backgroundColor: '#ffffff',
    },
    header: {
        padding: 24,
        borderBottomWidth: 1,
        borderBottomColor: '#e2e8f0',
    },
    title: {
        fontSize: 28,
        fontWeight: 'bold',
        color: '#1e293b',
        marginBottom: 8,
    },
    subtitle: {
        fontSize: 16,
        color: '#64748b',
    },
    form: {
        padding: 24,
    },
    inputGroup: {
        marginBottom: 20,
    },
    label: {
        fontSize: 16,
        fontWeight: '600',
        color: '#374151',
        marginBottom: 8,
    },
    input: {
        borderWidth: 1,
        borderColor: '#d1d5db',
        borderRadius: 8,
        padding: 12,
        fontSize: 16,
        backgroundColor: '#f9fafb',
    },
    forgotPassword: {
        alignSelf: 'flex-end',
        marginTop: 8,
    },
    forgotPasswordText: {
        fontSize: 14,
        color: '#1e3a8a',
        fontWeight: '500',
    },
    rememberMe: {
        marginBottom: 24,
    },
    checkbox: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    checkboxBox: {
        width: 20,
        height: 20,
        borderWidth: 2,
        borderColor: '#d1d5db',
        borderRadius: 4,
        marginRight: 12,
        justifyContent: 'center',
        alignItems: 'center',
    },
    checkboxBoxChecked: {
        backgroundColor: '#1e3a8a',
        borderColor: '#1e3a8a',
    },
    checkboxCheck: {
        color: 'white',
        fontSize: 12,
        fontWeight: 'bold',
    },
    checkboxLabel: {
        fontSize: 14,
        color: '#374151',
    },
    loginButtonDisabled: {
        backgroundColor: '#9ca3af',
    },
    loginButton: {
        backgroundColor: '#1e3a8a',
        padding: 16,
        borderRadius: 8,
        alignItems: 'center',
        marginBottom: 24,
    },
    loginButtonText: {
        color: 'white',
        fontSize: 16,
        fontWeight: '600',
    },
    divider: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 24,
    },
    dividerLine: {
        flex: 1,
        height: 1,
        backgroundColor: '#e5e7eb',
    },
    dividerText: {
        paddingHorizontal: 16,
        fontSize: 14,
        color: '#6b7280',
        fontWeight: '500',
    },
    registerOptions: {
        gap: 16,
    },
    registerPrompt: {
        fontSize: 16,
        color: '#374151',
        textAlign: 'center',
        marginBottom: 16,
        fontWeight: '500',
    },
    registerOption: {
        flexDirection: 'row',
        alignItems: 'center',
        borderWidth: 1,
        borderColor: '#e5e7eb',
        borderRadius: 12,
        padding: 16,
        backgroundColor: '#f9fafb',
    },
    optionIcon: {
        width: 40,
        height: 40,
        borderRadius: 20,
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: 12,
    },
    optionIconText: {
        fontSize: 16,
    },
    optionText: {
        flex: 1,
    },
    optionTitle: {
        fontSize: 16,
        fontWeight: '600',
        color: '#374151',
        marginBottom: 2,
    },
    optionDesc: {
        fontSize: 12,
        color: '#6b7280',
    },
    optionArrow: {
        fontSize: 16,
        color: '#9ca3af',
        fontWeight: 'bold',
    },
});