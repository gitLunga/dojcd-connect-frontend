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
import { StackNavigationProp } from '@react-navigation/stack';
import { RootStackParamList } from '../navigation/AppNavigator';
import { authAPI } from '../services/api'; // Import your API

type OperationalRegisterScreenNavigationProp = StackNavigationProp<
    RootStackParamList,
    'OperationalRegister'
>;

type Props = {
    navigation: OperationalRegisterScreenNavigationProp;
};

export default function OperationalRegisterScreen({ navigation }: Props) {
    const [formData, setFormData] = useState({
        firstName: '',
        lastName: '',
        email: '',
        userRole: 'Admin' as 'Admin' | 'MTN_Staff' | 'Warehouse' | 'Approver',
        password: '',
        confirmPassword: '',
    });
    const [loading, setLoading] = useState(false);

    const handleRegister = async () => {
        // Basic validation
        if (!formData.firstName || !formData.lastName || !formData.email || !formData.password) {
            Alert.alert('Error', 'Please fill in all required fields');
            return;
        }

        if (formData.password !== formData.confirmPassword) {
            Alert.alert('Error', 'Passwords do not match');
            return;
        }

        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(formData.email)) {
            Alert.alert('Invalid Email', 'Please enter a valid email address');
            return;
        }

        setLoading(true);

        try {
            console.log('🔄 Registering operational user...');

            // ACTUAL API CALL
            const response = await authAPI.registerOperational({

                first_name: formData.firstName,
                last_name: formData.lastName,
                email: formData.email,
                user_role: formData.userRole,
                password: formData.password,
            });

            console.log('✅ Operational Registration API Response:', response.data);

            // This comes from your actual backend
            Alert.alert('Success', response.data.message || 'Registration successful!');

            // Navigate to login
            navigation.navigate('Login');

        } catch (error: any) {
            console.log('❌ Operational Registration API Error:', error.message);
            Alert.alert('Registration Failed', error.message);
        } finally {
            setLoading(false);
        }
    };

    const userRoles = [
        { value: 'Admin', label: 'Administrator', description: 'Full system access' },
        { value: 'MTN_Staff', label: 'MTN Staff', description: 'Device and order management' },
        { value: 'Warehouse', label: 'Warehouse', description: 'Inventory and delivery' },
        { value: 'Approver', label: 'Approver', description: 'Application process approver' },
    ];

    return (
        <ScrollView style={styles.container}>
            <View style={styles.header}>
                <Text style={styles.title}>Operational Registration</Text>
                <Text style={styles.subtitle}>Create your staff account</Text>
            </View>

            <View style={styles.form}>
                <View style={styles.inputGroup}>
                    <Text style={styles.label}>First Name *</Text>
                    <TextInput
                        style={styles.input}
                        placeholder="Enter your first name"
                        value={formData.firstName}
                        onChangeText={(text) => setFormData({...formData, firstName: text})}
                        editable={!loading}
                    />
                </View>

                <View style={styles.inputGroup}>
                    <Text style={styles.label}>Last Name *</Text>
                    <TextInput
                        style={styles.input}
                        placeholder="Enter your last name"
                        value={formData.lastName}
                        onChangeText={(text) => setFormData({...formData, lastName: text})}
                        editable={!loading}
                    />
                </View>

                <View style={styles.inputGroup}>
                    <Text style={styles.label}>Email Address *</Text>
                    <TextInput
                        style={styles.input}
                        placeholder="Enter your work email"
                        keyboardType="email-address"
                        autoCapitalize="none"
                        value={formData.email}
                        onChangeText={(text) => setFormData({...formData, email: text})}
                        editable={!loading}
                    />
                </View>

                <View style={styles.inputGroup}>
                    <Text style={styles.label}>User Role *</Text>
                    <Text style={styles.roleDescription}>
                        Select your role within the system
                    </Text>
                    <View style={styles.rolesContainer}>
                        {userRoles.map((role) => (
                            <Pressable
                                key={role.value}
                                style={[
                                    styles.roleCard,
                                    formData.userRole === role.value && styles.roleCardSelected
                                ]}
                                onPress={() => setFormData({...formData, userRole: role.value as 'Admin' | 'MTN_Staff' | 'Warehouse' | 'Approver'})}
                                disabled={loading}
                            >
                                <View style={styles.roleHeader}>
                                    <View style={[
                                        styles.roleRadio,
                                        formData.userRole === role.value && styles.roleRadioSelected
                                    ]}>
                                        {formData.userRole === role.value && (
                                            <View style={styles.radioInner} />
                                        )}
                                    </View>
                                    <Text style={[
                                        styles.roleTitle,
                                        formData.userRole === role.value && styles.roleTitleSelected
                                    ]}>
                                        {role.label}
                                    </Text>
                                </View>
                                <Text style={[
                                    styles.roleDesc,
                                    formData.userRole === role.value && styles.roleDescSelected
                                ]}>
                                    {role.description}
                                </Text>
                            </Pressable>
                        ))}
                    </View>
                </View>

                <View style={styles.inputGroup}>
                    <Text style={styles.label}>Password *</Text>
                    <TextInput
                        style={styles.input}
                        placeholder="Create a secure password"
                        secureTextEntry
                        value={formData.password}
                        onChangeText={(text) => setFormData({...formData, password: text})}
                        editable={!loading}
                    />
                    <Text style={styles.passwordHint}>
                        Use at least 8 characters with letters and numbers
                    </Text>
                </View>

                <View style={styles.inputGroup}>
                    <Text style={styles.label}>Confirm Password *</Text>
                    <TextInput
                        style={styles.input}
                        placeholder="Confirm your password"
                        secureTextEntry
                        value={formData.confirmPassword}
                        onChangeText={(text) => setFormData({...formData, confirmPassword: text})}
                        editable={!loading}
                    />
                </View>

                <Pressable
                    style={[styles.registerButton, loading && styles.registerButtonDisabled]}
                    onPress={handleRegister}
                    disabled={loading}
                >
                    {loading ? (
                        <ActivityIndicator color="white" />
                    ) : (
                        <Text style={styles.registerButtonText}>Create Staff Account</Text>
                    )}
                </Pressable>

                <View style={styles.footer}>
                    <Text style={styles.loginText}>
                        Already have an account?
                    </Text>
                    <Pressable onPress={() => navigation.navigate('Login')} disabled={loading}>
                        <Text style={styles.loginLink}>Sign In</Text>
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
        fontSize: 24,
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
        marginBottom: 24,
    },
    label: {
        fontSize: 16,
        fontWeight: '600',
        color: '#374151',
        marginBottom: 8,
    },
    roleDescription: {
        fontSize: 14,
        color: '#6b7280',
        marginBottom: 12,
    },
    input: {
        borderWidth: 1,
        borderColor: '#d1d5db',
        borderRadius: 8,
        padding: 12,
        fontSize: 16,
        backgroundColor: '#f9fafb',
    },
    passwordHint: {
        fontSize: 12,
        color: '#6b7280',
        marginTop: 4,
        fontStyle: 'italic',
    },
    rolesContainer: {
        gap: 12,
    },
    roleCard: {
        borderWidth: 1,
        borderColor: '#e5e7eb',
        borderRadius: 12,
        padding: 16,
        backgroundColor: '#f9fafb',
    },
    roleCardSelected: {
        borderColor: '#1e3a8a',
        backgroundColor: '#eff6ff',
    },
    roleHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 8,
    },
    roleRadio: {
        width: 20,
        height: 20,
        borderRadius: 10,
        borderWidth: 2,
        borderColor: '#d1d5db',
        marginRight: 12,
        justifyContent: 'center',
        alignItems: 'center',
    },
    roleRadioSelected: {
        borderColor: '#1e3a8a',
        backgroundColor: '#1e3a8a',
    },
    radioInner: {
        width: 8,
        height: 8,
        borderRadius: 4,
        backgroundColor: 'white',
    },
    roleTitle: {
        fontSize: 16,
        fontWeight: '600',
        color: '#374151',
    },
    roleTitleSelected: {
        color: '#1e3a8a',
    },
    roleDesc: {
        fontSize: 14,
        color: '#6b7280',
        marginLeft: 32,
    },
    roleDescSelected: {
        color: '#4b5563',
    },
    registerButtonDisabled: {
        backgroundColor: '#9ca3af',
    },
    registerButton: {
        backgroundColor: '#103ab9',
        padding: 16,
        borderRadius: 8,
        alignItems: 'center',
        marginTop: 20,
    },
    registerButtonText: {
        color: 'white',
        fontSize: 16,
        fontWeight: '600',
    },
    footer: {
        alignItems: 'center',
        marginTop: 24,
        paddingTop: 20,
        borderTopWidth: 1,
        borderTopColor: '#e2e8f0',
    },
    loginText: {
        fontSize: 14,
        color: '#64748b',
        marginBottom: 8,
    },
    loginLink: {
        fontSize: 14,
        color: '#1e3a8a',
        fontWeight: '600',
    },
});