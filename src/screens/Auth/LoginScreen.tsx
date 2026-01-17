import React, { useState } from 'react';
import {
    View,
    Text,
    StyleSheet,
    Pressable,
    ScrollView,
    TextInput,
    Alert,
    ActivityIndicator,
    KeyboardAvoidingView,
    Platform
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { StackNavigationProp } from '@react-navigation/stack';
import { RootStackParamList } from '../../navigation/AppNavigator';
import { authAPI } from '../../services/api';

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
    const [showPassword, setShowPassword] = useState(false);
    const [validationErrors, setValidationErrors] = useState({
        email: '',
        password: '',
    });

    const validateForm = () => {
        const errors = { email: '', password: '' };
        let isValid = true;

        if (!formData.email.trim()) {
            errors.email = 'Email is required';
            isValid = false;
        } else if (!/\S+@\S+\.\S+/.test(formData.email)) {
            errors.email = 'Please enter a valid email';
            isValid = false;
        }

        if (!formData.password) {
            errors.password = 'Password is required';
            isValid = false;
        } else if (formData.password.length < 6) {
            errors.password = 'Password must be at least 6 characters';
            isValid = false;
        }

        setValidationErrors(errors);
        return isValid;
    };

    const handleLogin = async () => {
        if (!validateForm()) return;

        setLoading(true);
        setValidationErrors({ email: '', password: '' });

        try {
            console.log('🔄 Attempting login...');

            const response = await authAPI.login({
                email: formData.email,
                password: formData.password
            });

            console.log('✅ Login API Response:', response.data);

            if (!response.data.success) {
                Alert.alert("Login Failed", response.data.message);
                return;
            }

            const user = response.data.data.user;
            const userType = user.user_type || null;

            // Save user securely
            await AsyncStorage.setItem('user', JSON.stringify(user));

            if (formData.rememberMe) {
                await AsyncStorage.setItem('rememberedEmail', formData.email);
            } else {
                await AsyncStorage.removeItem('rememberedEmail');
            }

            Alert.alert("Success", "Login successful!", [
                {
                    text: "OK",
                    onPress: () => {
                        if (userType === "client") {
                            navigation.reset({
                                index: 0,
                                routes: [{ name: "DOJCDDashboard" }],
                            });
                        } else if (userType === "operational") {
                            if (user.user_role === "Admin") {
                                navigation.reset({
                                    index: 0,
                                    routes: [{ name: "AdminDashboard" }],
                                });
                            } else {
                                Alert.alert("Access Restricted", "Your role doesn't have mobile access yet.");
                            }
                        } else {
                            Alert.alert("Error", "Unknown user type returned from server");
                        }
                    }
                }
            ]);

        } catch (error: any) {
            console.log('❌ Login API Error:', error);
            
            let errorMessage = 'Invalid email or password';
            if (error.message.includes('Network Error')) {
                errorMessage = 'Cannot connect to server. Please check your connection.';
            } else if (error.message.includes('401')) {
                errorMessage = 'Invalid credentials. Please try again.';
            } else if (error.message.includes('404')) {
                errorMessage = 'Server not found. Please contact support.';
            }
            
            Alert.alert('Login Failed', errorMessage);
        } finally {
            setLoading(false);
        }
    };

    const handleForgotPassword = () => {
        Alert.alert(
            'Forgot Password',
            'A password reset link will be sent to your email.',
            [
                { text: 'Cancel', style: 'cancel' },
                {
                    text: 'Send Reset Link',
                    onPress: () => {
                        Alert.alert('Reset Link Sent', 'Check your email for password reset instructions.');
                    }
                }
            ]
        );
    };

    const handleQuickRegister = (role: 'client' | 'operational') => {
        if (role === 'client') {
            navigation.navigate('ClientRegister');
        } else {
            navigation.navigate('OperationalRegister');
        }
    };

    return (
        <KeyboardAvoidingView 
            behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
            style={styles.container}
        >
            <ScrollView 
                contentContainerStyle={styles.scrollContent}
                keyboardShouldPersistTaps="handled"
                showsVerticalScrollIndicator={false}
            >
                <View style={styles.header}>
                    <View style={styles.logoContainer}>
                        <Text style={styles.logo}>⚖️</Text>
                    </View>
                    <Text style={styles.title}>Welcome Back</Text>
                    <Text style={styles.subtitle}>Sign in to your DOJCD Connect account</Text>
                </View>

                <View style={styles.form}>
                    <View style={styles.inputGroup}>
                        <Text style={styles.label}>Email Address</Text>
                        <TextInput
                            style={[styles.input, validationErrors.email && styles.inputError]}
                            placeholder="Enter your email address"
                            placeholderTextColor="#9ca3af"
                            keyboardType="email-address"
                            autoCapitalize="none"
                            autoCorrect={false}
                            value={formData.email}
                            onChangeText={(text) => {
                                setFormData({...formData, email: text});
                                if (validationErrors.email) {
                                    setValidationErrors({...validationErrors, email: ''});
                                }
                            }}
                            editable={!loading}
                        />
                        {validationErrors.email ? (
                            <Text style={styles.errorText}>{validationErrors.email}</Text>
                        ) : null}
                    </View>

                    <View style={styles.inputGroup}>
                        <Text style={styles.label}>Password</Text>
                        <View style={[styles.passwordContainer, validationErrors.password && styles.inputError]}>
                            <TextInput
                                style={styles.passwordInput}
                                placeholder="Enter your password"
                                placeholderTextColor="#9ca3af"
                                secureTextEntry={!showPassword}
                                value={formData.password}
                                onChangeText={(text) => {
                                    setFormData({...formData, password: text});
                                    if (validationErrors.password) {
                                        setValidationErrors({...validationErrors, password: ''});
                                    }
                                }}
                                editable={!loading}
                            />
                            <Pressable
                                style={styles.showPasswordButton}
                                onPress={() => setShowPassword(!showPassword)}
                            >
                                <Text style={styles.showPasswordText}>
                                    {showPassword ? 'Hide' : 'Show'}
                                </Text>
                            </Pressable>
                        </View>
                        {validationErrors.password ? (
                            <Text style={styles.errorText}>{validationErrors.password}</Text>
                        ) : null}
                        
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
                            <Text style={styles.checkboxLabel}>Remember me on this device</Text>
                        </Pressable>
                    </View>

                    <Pressable
                        style={[styles.loginButton, loading && styles.loginButtonDisabled]}
                        onPress={handleLogin}
                        disabled={loading}
                    >
                        {loading ? (
                            <ActivityIndicator color="white" size="small" />
                        ) : (
                            <Text style={styles.loginButtonText}>Sign In</Text>
                        )}
                    </Pressable>

                    <View style={styles.divider}>
                        <View style={styles.dividerLine} />
                        <Text style={styles.dividerText}>or continue with</Text>
                        <View style={styles.dividerLine} />
                    </View>

                    <View style={styles.quickRegister}>
                        <Text style={styles.quickRegisterTitle}>Need an account?</Text>
                        
                        <Pressable
                            style={[styles.registerButton, { backgroundColor: 'rgba(59, 130, 246, 0.1)' }]}
                            onPress={() => handleQuickRegister('client')}
                            disabled={loading}
                        >
                            <View style={[styles.registerIcon, { backgroundColor: '#3b82f6' }]}>
                                <Text style={styles.registerIconText}>👨‍⚖️</Text>
                            </View>
                            <View style={styles.registerText}>
                                <Text style={[styles.registerTitle, { color: '#3b82f6' }]}>Client Registration</Text>
                                <Text style={styles.registerDesc}>For device requests</Text>
                            </View>
                        </Pressable>

                        <Pressable
                            style={[styles.registerButton, { backgroundColor: 'rgba(16, 185, 129, 0.1)' }]}
                            onPress={() => handleQuickRegister('operational')}
                            disabled={loading}
                        >
                            <View style={[styles.registerIcon, { backgroundColor: '#10b981' }]}>
                                <Text style={styles.registerIconText}>👨‍💼</Text>
                            </View>
                            <View style={styles.registerText}>
                                <Text style={[styles.registerTitle, { color: '#10b981' }]}>Operational Registration</Text>
                                <Text style={styles.registerDesc}>For staff/admin access</Text>
                            </View>
                        </Pressable>
                    </View>
                </View>

                <View style={styles.footer}>
                    <Text style={styles.footerText}>
                        For support, contact: support@dojcd.gov.za
                    </Text>
                    <Text style={styles.versionText}>v1.0 • DOJCD Connect</Text>
                </View>
            </ScrollView>
        </KeyboardAvoidingView>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#ffffff',
    },
    scrollContent: {
        flexGrow: 1,
    },
    header: {
        padding: 24,
        paddingTop: 40,
        alignItems: 'center',
        borderBottomWidth: 1,
        borderBottomColor: '#e2e8f0',
    },
    logoContainer: {
        marginBottom: 16,
    },
    logo: {
        fontSize: 48,
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
        textAlign: 'center',
    },
    form: {
        padding: 24,
    },
    inputGroup: {
        marginBottom: 20,
    },
    label: {
        fontSize: 14,
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
        color: '#1f2937',
    },
    inputError: {
        borderColor: '#ef4444',
        backgroundColor: '#fef2f2',
    },
    errorText: {
        fontSize: 12,
        color: '#ef4444',
        marginTop: 4,
    },
    passwordContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        borderWidth: 1,
        borderColor: '#d1d5db',
        borderRadius: 8,
        backgroundColor: '#f9fafb',
        overflow: 'hidden',
    },
    passwordInput: {
        flex: 1,
        padding: 12,
        fontSize: 16,
        color: '#1f2937',
    },
    showPasswordButton: {
        paddingHorizontal: 12,
        paddingVertical: 4,
        marginRight: 8,
        backgroundColor: '#e5e7eb',
        borderRadius: 6,
    },
    showPasswordText: {
        fontSize: 12,
        color: '#4b5563',
        fontWeight: '500',
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
    loginButton: {
        backgroundColor: '#1e3a8a',
        padding: 16,
        borderRadius: 8,
        alignItems: 'center',
        marginBottom: 24,
        shadowColor: '#1e3a8a',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.2,
        shadowRadius: 4,
        elevation: 2,
    },
    loginButtonDisabled: {
        backgroundColor: '#9ca3af',
        shadowOpacity: 0,
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
    quickRegister: {
        gap: 12,
    },
    quickRegisterTitle: {
        fontSize: 16,
        color: '#374151',
        textAlign: 'center',
        marginBottom: 8,
        fontWeight: '500',
    },
    registerButton: {
        flexDirection: 'row',
        alignItems: 'center',
        borderRadius: 12,
        padding: 16,
        borderWidth: 1,
        borderColor: 'rgba(0,0,0,0.05)',
    },
    registerIcon: {
        width: 40,
        height: 40,
        borderRadius: 20,
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: 12,
    },
    registerIconText: {
        fontSize: 16,
    },
    registerText: {
        flex: 1,
    },
    registerTitle: {
        fontSize: 16,
        fontWeight: '600',
        marginBottom: 2,
    },
    registerDesc: {
        fontSize: 12,
        color: '#6b7280',
    },
    footer: {
        padding: 24,
        paddingTop: 16,
        alignItems: 'center',
        borderTopWidth: 1,
        borderTopColor: '#e2e8f0',
    },
    footerText: {
        fontSize: 12,
        color: '#6b7280',
        textAlign: 'center',
        marginBottom: 8,
    },
    versionText: {
        fontSize: 11,
        color: '#9ca3af',
    },
});