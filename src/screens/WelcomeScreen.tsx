import React, { useEffect } from 'react';
import { View, Text, StyleSheet, Platform, Pressable, Dimensions } from 'react-native';
import { StackNavigationProp } from '@react-navigation/stack';
import { RootStackParamList } from '../navigation/AppNavigator';
import { authAPI } from '../services/api'; // Import your API service
import axios from 'axios';

const { width } = Dimensions.get('window');

type WelcomeScreenNavigationProp = StackNavigationProp<
    RootStackParamList,
    'Welcome'
>;

type Props = {
    navigation: WelcomeScreenNavigationProp;
};

// --- MODERN DESIGN SYSTEM CONSTANTS ---
const COLORS = {
    primary: '#1e3a8a', // Indigo-800
    primaryLight: '#3b82f6', // Blue-500
    textPrimary: '#1f2937', // Gray-800
    textSecondary: '#6b7280', // Gray-500
    surface: '#ffffff', // White
    background: '#f9fafb', // Gray-50
    border: '#e5e7eb', // Gray-200
};

// --- REUSABLE COMPONENTS (Simplified for single file) ---
const PrimaryButton: React.FC<{ onPress: () => void, title: string }> = ({ onPress, title }) => (
    <Pressable style={styles.primaryButton} onPress={onPress}>
        <Text style={styles.primaryButtonText}>{title}</Text>
    </Pressable>
);

const SecondaryButton: React.FC<{ onPress: () => void, title: string }> = ({ onPress, title }) => (
    <Pressable style={styles.secondaryButton} onPress={onPress}>
        <Text style={styles.secondaryButtonText}>{title}</Text>
    </Pressable>
);

export default function WelcomeScreen({ navigation }: Props) {

    useEffect(() => {
        testBackendConnection();
    }, []);

    const testBackendConnection = async () => {
        try {
            // console.log('🔄 Testing backend connection...');
            // Use your API service instead of direct axios
            const response = await authAPI.testConnection();
            console.log('📦 Response:', response.data);
        } catch (error: any) {
            console.log('❌ BACKEND CONNECTION FAILED:', error.message);
        }
    };

    return (
        <View style={styles.container}>
            {/* Header - Cleaner, centered layout */}
            <View style={styles.header}>
                <Text style={styles.logo}>⚖️</Text>
                <Text style={styles.title}>DOJCD Connect</Text>
                <Text style={styles.subtitle}>Device Procurement Platform</Text>
            </View>

            {/* Main Content */}
            <View style={styles.content}>
                <Text style={styles.welcome}>
                    Welcome to the Mobile Procurement System
                </Text>

                <Text style={styles.description}>
                    Streamlining device requests and approvals for magistrates nationwide.
                </Text>

                <View style={styles.featureList}>
                    <Text style={styles.feature}>📱 Request Devices</Text>
                    <Text style={styles.feature}>✅ Multi-level Approval</Text>
                    <Text style={styles.feature}>📊 Real-time Tracking</Text>
                </View>
            </View>

            {/* Footer with Buttons */}
            <View style={styles.footerButtons}>
                <PrimaryButton
                    title="Get Started"
                    onPress={() => navigation.navigate('Register')}
                />
                <SecondaryButton
                    title="Sign In"
                    onPress={() => navigation.navigate('Login')}
                />
            </View>

            {/* Footer Info */}
            <View style={styles.footerInfo}>
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
        backgroundColor: COLORS.surface,
    },
    header: {
        paddingTop: 80,
        paddingBottom: 40,
        paddingHorizontal: 20,
        alignItems: 'center',
        backgroundColor: COLORS.primary,
        // Modern touch: subtle curve or shadow, but keeping it simple for cross-platform
    },
    logo: {
        fontSize: 64,
        marginBottom: 16,
    },
    title: {
        fontSize: 36,
        fontWeight: '700',
        color: COLORS.surface,
        marginBottom: 4,
    },
    subtitle: {
        fontSize: 16,
        color: 'rgba(255,255,255,0.8)',
        fontWeight: '500',
    },
    content: {
        flex: 1,
        padding: 30,
        alignItems: 'center',
    },
    welcome: {
        fontSize: 24,
        fontWeight: '700',
        color: COLORS.textPrimary,
        textAlign: 'center',
        marginBottom: 16,
        lineHeight: 32,
    },
    description: {
        fontSize: 16,
        color: COLORS.textSecondary,
        textAlign: 'center',
        marginBottom: 40,
        lineHeight: 24,
    },
    featureList: {
        marginBottom: 50,
        alignItems: 'flex-start',
        width: '100%',
        maxWidth: 300,
    },
    feature: {
        fontSize: 16,
        color: COLORS.textPrimary,
        marginBottom: 12,
        fontWeight: '500',
    },
    footerButtons: {
        paddingHorizontal: 30,
        paddingBottom: 20,
        width: '100%',
    },
    primaryButton: {
        backgroundColor: COLORS.primary,
        paddingVertical: 16,
        borderRadius: 10,
        marginBottom: 12,
        width: '100%',
        alignItems: 'center',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.1,
        shadowRadius: 6,
        elevation: 5,
    },
    primaryButtonText: {
        color: COLORS.surface,
        fontSize: 16,
        fontWeight: '600',
    },
    secondaryButton: {
        paddingVertical: 16,
        borderRadius: 10,
        borderWidth: 2,
        borderColor: COLORS.primary,
        width: '100%',
        alignItems: 'center',
        backgroundColor: COLORS.surface,
    },
    secondaryButtonText: {
        color: COLORS.primary,
        fontSize: 16,
        fontWeight: '600',
    },
    footerInfo: {
        padding: 16,
        alignItems: 'center',
        backgroundColor: COLORS.background,
        borderTopWidth: 1,
        borderTopColor: COLORS.border,
    },
    footerText: {
        fontSize: 12,
        color: COLORS.textSecondary,
        textAlign: 'center',
        marginBottom: 4,
        fontWeight: '500',
    },
    platform: {
        fontSize: 11,
        color: COLORS.textSecondary,
    },
});