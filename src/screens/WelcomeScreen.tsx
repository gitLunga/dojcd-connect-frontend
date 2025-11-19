import React, { useEffect } from 'react';
import { View, Text, StyleSheet, Platform, Pressable } from 'react-native';
import { StackNavigationProp } from '@react-navigation/stack';
import { RootStackParamList } from '../navigation/AppNavigator';
import { authAPI } from '../services/api'; // Import your API service
import axios from 'axios';

type WelcomeScreenNavigationProp = StackNavigationProp<
    RootStackParamList,
    'Welcome'
>;

type Props = {
    navigation: WelcomeScreenNavigationProp;
};

export default function WelcomeScreen({ navigation }: Props) {

    useEffect(() => {
        testBackendConnection();
    }, []);

    const testBackendConnection = async () => {
        try {
            console.log('🔄 Testing backend connection...');
            // Use your API service instead of direct axios
            const response = await authAPI.testConnection();
            console.log('✅ BACKEND CONNECTION SUCCESSFUL!');
            console.log('📦 Response:', response.data);
        } catch (error: any) {
            console.log('❌ BACKEND CONNECTION FAILED:', error.message);
        }
    };

    return (
        <View style={styles.container}>
            {/* Header */}
            <View style={styles.header}>
                <Text style={styles.logo}>⚖️</Text>
                <Text style={styles.title}>Mobile Connect</Text>
                <Text style={styles.subtitle}>Device Procurement Platform</Text>
            </View>

            {/* Main Content */}
            <View style={styles.content}>
                <Text style={styles.welcome}>
                    Welcome to DOJCD's Mobile Procurement System
                </Text>

                <Text style={styles.description}>
                    Streamlining device requests and approvals for magistrates nationwide.
                </Text>

                <View style={styles.featureList}>
                    <Text style={styles.feature}>📱 Request Devices</Text>
                    <Text style={styles.feature}>✅ Multi-level Approval</Text>
                    <Text style={styles.feature}>🚚 MTN Integration</Text>
                    <Text style={styles.feature}>📊 Real-time Tracking</Text>
                </View>

                <Pressable
                    style={styles.primaryButton}
                    onPress={() => navigation.navigate('Register')}
                >
                    <Text style={styles.primaryButtonText}>Get Started</Text>
                </Pressable>

                <Pressable
                    style={styles.secondaryButton}
                    onPress={() => navigation.navigate('Login')}
                >
                    <Text style={styles.secondaryButtonText}>Sign In</Text>
                </Pressable>
            </View>

            {/* Footer */}
            <View style={styles.footer}>
                <Text style={styles.footerText}>
                    Department of Justice & Constitutional Development
                </Text>
                <Text style={styles.platform}>
                    {Platform.OS.toUpperCase()} • v1.0
                </Text>
            </View>
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#ffffff',
    },
    header: {
        backgroundColor: '#1e3a8a',
        paddingTop: 100,
        paddingBottom: 60,
        paddingHorizontal: 20,
        alignItems: 'center',
        borderBottomLeftRadius: 20,
        borderBottomRightRadius: 20,
    },
    logo: {
        fontSize: 52,
        marginBottom: 16,
    },
    title: {
        fontSize: 32,
        fontWeight: 'bold',
        color: 'white',
        marginBottom: 8,
    },
    subtitle: {
        fontSize: 16,
        color: 'rgba(255,255,255,0.9)',
        fontWeight: '500',
    },
    content: {
        flex: 1,
        padding: 30,
        justifyContent: 'center',
        alignItems: 'center',
    },
    welcome: {
        fontSize: 24,
        fontWeight: 'bold',
        color: '#1e293b',
        textAlign: 'center',
        marginBottom: 16,
        lineHeight: 32,
    },
    description: {
        fontSize: 16,
        color: '#64748b',
        textAlign: 'center',
        marginBottom: 40,
        lineHeight: 24,
    },
    featureList: {
        marginBottom: 50,
        alignItems: 'center',
    },
    feature: {
        fontSize: 16,
        color: '#475569',
        marginBottom: 12,
        fontWeight: '500',
    },
    primaryButton: {
        backgroundColor: '#1e3a8a',
        paddingHorizontal: 40,
        paddingVertical: 16,
        borderRadius: 12,
        marginBottom: 16,
        width: '100%',
        alignItems: 'center',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
        elevation: 3,
    },
    primaryButtonText: {
        color: 'white',
        fontSize: 16,
        fontWeight: '600',
    },
    secondaryButton: {
        paddingHorizontal: 40,
        paddingVertical: 16,
        borderRadius: 12,
        borderWidth: 2,
        borderColor: '#1e3a8a',
        width: '100%',
        alignItems: 'center',
    },
    secondaryButtonText: {
        color: '#1e3a8a',
        fontSize: 16,
        fontWeight: '600',
    },
    footer: {
        padding: 24,
        alignItems: 'center',
        backgroundColor: '#f8fafc',
        borderTopWidth: 1,
        borderTopColor: '#e2e8f0',
    },
    footerText: {
        fontSize: 12,
        color: '#64748b',
        textAlign: 'center',
        marginBottom: 8,
        fontWeight: '500',
    },
    platform: {
        fontSize: 11,
        color: '#94a3b8',
    },
});