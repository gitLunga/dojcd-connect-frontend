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

type ClientRegisterScreenNavigationProp = StackNavigationProp<
    RootStackParamList,
    'ClientRegister'
>;

type Props = {
    navigation: ClientRegisterScreenNavigationProp;
};

export default function ClientRegisterScreen({ navigation }: Props) {
    const [formData, setFormData] = useState({
        firstName: '',
        lastName: '',
        email: '',
        phoneNumber: '',
        persalId: '',
        departmentId: '',
        userType: 'Teacher' as 'Teacher' | 'DOJCD_User', // ← ADD THIS TYPE
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

        setLoading(true);

        try {
            console.log('🔄 Registering client user...');

            // ACTUAL API CALL - not just console.log
            const response = await authAPI.registerClient({
                first_name: formData.firstName,
                last_name: formData.lastName,
                email: formData.email,
                phone_number: formData.phoneNumber,
                persal_id: formData.persalId,
                department_id: formData.departmentId,
                user_type: formData.userType,
                password: formData.password,
            });

            console.log('✅ Registration API Response:', response.data);

            // This comes from your actual backend
            Alert.alert('Success', response.data.message || 'Registration successful!');

            // Navigate to login
            navigation.navigate('Login');

        } catch (error: any) {
            console.log('❌ Registration API Error:', error.message);
            Alert.alert('Registration Failed', error.message);
        } finally {
            setLoading(false);
        }
    };

    return (
        <ScrollView style={styles.container}>
            <View style={styles.header}>
                <Text style={styles.title}>Client Registration</Text>
                <Text style={styles.subtitle}>Create your account to request devices</Text>
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
                        placeholder="Enter your email"
                        keyboardType="email-address"
                        autoCapitalize="none"
                        value={formData.email}
                        onChangeText={(text) => setFormData({...formData, email: text})}
                        editable={!loading}
                    />
                </View>

                <View style={styles.inputGroup}>
                    <Text style={styles.label}>Phone Number</Text>
                    <TextInput
                        style={styles.input}
                        placeholder="Enter your phone number"
                        keyboardType="phone-pad"
                        value={formData.phoneNumber}
                        onChangeText={(text) => setFormData({...formData, phoneNumber: text})}
                        editable={!loading}
                    />
                </View>

                <View style={styles.inputGroup}>
                    <Text style={styles.label}>Persal ID *</Text>
                    <TextInput
                        style={styles.input}
                        placeholder="Enter your Persal ID"
                        value={formData.persalId}
                        onChangeText={(text) => setFormData({...formData, persalId: text})}
                        editable={!loading}
                    />
                </View>

                <View style={styles.inputGroup}>
                    <Text style={styles.label}>Department ID *</Text>
                    <TextInput
                        style={styles.input}
                        placeholder="Enter your department ID"
                        value={formData.departmentId}
                        onChangeText={(text) => setFormData({...formData, departmentId: text})}
                        editable={!loading}
                    />
                </View>

                <View style={styles.inputGroup}>
                    <Text style={styles.label}>User Type *</Text>
                    <View style={styles.radioGroup}>
                        <Pressable
                            style={[
                                styles.radioButton,
                                formData.userType === 'Teacher' && styles.radioButtonSelected
                            ]}
                            onPress={() => setFormData({...formData, userType: 'Teacher'})}
                            disabled={loading}
                        >
                            <Text style={[
                                styles.radioText,
                                formData.userType === 'Teacher' && styles.radioTextSelected
                            ]}>Teacher</Text>
                        </Pressable>
                        <Pressable
                            style={[
                                styles.radioButton,
                                formData.userType === 'DOJCD_User' && styles.radioButtonSelected
                            ]}
                            onPress={() => setFormData({...formData, userType: 'DOJCD_User'})}
                            disabled={loading}
                        >
                            <Text style={[
                                styles.radioText,
                                formData.userType === 'DOJCD_User' && styles.radioTextSelected
                            ]}>DOJCD User</Text>
                        </Pressable>
                    </View>
                </View>

                <View style={styles.inputGroup}>
                    <Text style={styles.label}>Password *</Text>
                    <TextInput
                        style={styles.input}
                        placeholder="Create a password"
                        secureTextEntry
                        value={formData.password}
                        onChangeText={(text) => setFormData({...formData, password: text})}
                        editable={!loading}
                    />
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
                        <Text style={styles.registerButtonText}>Create Account</Text>
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
    radioGroup: {
        flexDirection: 'row',
        gap: 12,
    },
    radioButton: {
        flex: 1,
        padding: 12,
        borderWidth: 1,
        borderColor: '#d1d5db',
        borderRadius: 8,
        alignItems: 'center',
        backgroundColor: '#f9fafb',
    },
    radioButtonSelected: {
        backgroundColor: '#1e3a8a',
        borderColor: '#1e3a8a',
    },
    radioText: {
        fontSize: 14,
        fontWeight: '500',
        color: '#374151',
    },
    radioTextSelected: {
        color: 'white',
    },
    registerButton: {
        backgroundColor: '#1e3a8a',
        padding: 16,
        borderRadius: 8,
        alignItems: 'center',
        marginTop: 20,
    },
    registerButtonDisabled: {
        backgroundColor: '#9ca3af',
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