import React, { useEffect, useState } from 'react';
import {
    View,
    Text,
    StyleSheet,
    Platform,
    Pressable,
    Dimensions,
    ActivityIndicator,
    Alert,
    ScrollView
} from 'react-native';
import { StackNavigationProp } from '@react-navigation/stack';
import { RootStackParamList } from '../navigation/AppNavigator';
import { authAPI } from '../services/api';

const { width } = Dimensions.get('window');

type WelcomeScreenNavigationProp = StackNavigationProp<
    RootStackParamList,
    'Welcome'
>;

type Props = {
    navigation: WelcomeScreenNavigationProp;
};

const COLORS = {
    primary: '#1e3a8a',
    primaryLight: '#3b82f6',
    textPrimary: '#1f2937',
    textSecondary: '#6b7280',
    surface: '#ffffff',
    background: '#f9fafb',
    border: '#e5e7eb',
    success: '#10b981',
    warning: '#f59e0b',
    error: '#ef4444',
};

const PrimaryButton: React.FC<{ onPress: () => void, title: string, disabled?: boolean }> = ({ onPress, title, disabled }) => (
    <Pressable
        style={({ pressed }) => [
            styles.primaryButton,
            disabled && styles.buttonDisabled,
            pressed && styles.buttonPressed
        ]}
        onPress={onPress}
        disabled={disabled}
    >
        <Text style={styles.primaryButtonText}>{title}</Text>
    </Pressable>
);

const SecondaryButton: React.FC<{ onPress: () => void, title: string, disabled?: boolean }> = ({ onPress, title, disabled }) => (
    <Pressable
        style={({ pressed }) => [
            styles.secondaryButton,
            disabled && styles.buttonDisabled,
            pressed && styles.buttonPressed
        ]}
        onPress={onPress}
        disabled={disabled}
    >
        <Text style={styles.secondaryButtonText}>{title}</Text>
    </Pressable>
);

export default function WelcomeScreen({ navigation }: Props) {
    const [backendStatus, setBackendStatus] = useState<'checking' | 'connected' | 'disconnected'>('checking');
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        testBackendConnection();
    }, []);

    const testBackendConnection = async () => {
        setBackendStatus('checking');
        try {
            console.log('🔄 Testing backend connection...');
            const response = await authAPI.testConnection();
            console.log('✅ Backend connection successful:', response.data);
            setBackendStatus('connected');
        } catch (error: any) {
            console.log('❌ Backend connection failed:', error.message);
            setBackendStatus('disconnected');
        }
    };

    const getStatusColor = () => {
        switch (backendStatus) {
            case 'connected': return COLORS.success;
            case 'disconnected': return COLORS.error;
            default: return COLORS.warning;
        }
    };

    const getStatusText = () => {
        switch (backendStatus) {
            case 'connected': return 'Connected';
            case 'disconnected': return 'Connection Failed';
            default: return 'Checking Connection...';
        }
    };

    const handleGetStarted = () => {
        if (backendStatus === 'connected') {
            navigation.navigate('Register');
        } else {
            Alert.alert('Connection Issue', 'Please ensure backend server is running before proceeding.');
        }
    };

    return (
        <View style={styles.container}>
            {/* Header */}
            <View style={styles.header}>
                <View style={styles.logoContainer}>
                    <Text style={styles.logo}>⚖️</Text>
                </View>
                <Text style={styles.title}>DOJCD Connect</Text>
                <Text style={styles.subtitle}>Device Procurement Platform</Text>

                {/* Enhanced Connection Status */}
                <View style={styles.statusContainer}>
                    <View style={[styles.statusDot, { backgroundColor: getStatusColor() }]} />
                    <Text style={[styles.statusText, { color: getStatusColor() }]}>
                        {getStatusText()}
                    </Text>
                    {backendStatus === 'checking' && (
                        <ActivityIndicator size="small" color={COLORS.warning} style={styles.statusSpinner} />
                    )}
                    {backendStatus === 'disconnected' && (
                        <Pressable
                            onPress={testBackendConnection}
                            style={styles.retryButton}
                        >
                            <Text style={styles.retryText}>Retry</Text>
                        </Pressable>
                    )}
                </View>
            </View>

            {/* Scrollable Content */}
            <ScrollView
                style={styles.scrollView}
                showsVerticalScrollIndicator={false}
                contentContainerStyle={styles.scrollContent}
            >
                {/* Main Content */}
                <View style={styles.content}>
                    <Text style={styles.welcome}>
                        Welcome to the Mobile Procurement System
                    </Text>

                    <Text style={styles.description}>
                        Streamlining device requests and approvals for magistrates nationwide.
                    </Text>

                    <View style={styles.featureList}>
                        <View style={styles.featureItem}>
                            <View style={[styles.featureIcon, { backgroundColor: '#3b82f6' }]}>
                                <Text style={styles.featureIconText}>📱</Text>
                            </View>
                            <View style={styles.featureContent}>
                                <Text style={styles.featureTitle}>Request Devices</Text>
                                <Text style={styles.featureDesc}>Submit device procurement requests</Text>
                            </View>
                        </View>

                        <View style={styles.featureItem}>
                            <View style={[styles.featureIcon, { backgroundColor: '#10b981' }]}>
                                <Text style={styles.featureIconText}>✅</Text>
                            </View>
                            <View style={styles.featureContent}>
                                <Text style={styles.featureTitle}>Multi-level Approval</Text>
                                <Text style={styles.featureDesc}>Streamlined approval workflow</Text>
                            </View>
                        </View>

                        <View style={styles.featureItem}>
                            <View style={[styles.featureIcon, { backgroundColor: '#8b5cf6' }]}>
                                <Text style={styles.featureIconText}>📊</Text>
                            </View>
                            <View style={styles.featureContent}>
                                <Text style={styles.featureTitle}>Real-time Tracking</Text>
                                <Text style={styles.featureDesc}>Monitor application status</Text>
                            </View>
                        </View>

                        {/* Additional feature for better spacing */}
                        <View style={styles.featureItem}>
                            <View style={[styles.featureIcon, { backgroundColor: '#f59e0b' }]}>
                                <Text style={styles.featureIconText}>🔒</Text>
                            </View>
                            <View style={styles.featureContent}>
                                <Text style={styles.featureTitle}>Secure Platform</Text>
                                <Text style={styles.featureDesc}>Enterprise-grade security</Text>
                            </View>
                        </View>
                    </View>

                    {/* Additional Info Section */}
                    <View style={styles.additionalInfo}>
                        <Text style={styles.infoTitle}>Why Choose Our Platform?</Text>
                        <Text style={styles.infoText}>
                            • Fast and efficient processing{'\n'}
                            • Real-time updates and notifications{'\n'}
                            • Secure and compliant with regulations{'\n'}
                            • Nationwide coverage and support
                        </Text>
                    </View>
                </View>
            </ScrollView>

            {/* Footer with Buttons - Fixed at bottom */}
            <View style={styles.footer}>
                <View style={styles.footerButtons}>
                    <PrimaryButton
                        title="Get Started"
                        onPress={handleGetStarted}
                        disabled={backendStatus !== 'connected'}
                    />
                    <SecondaryButton
                        title="Sign In"
                        onPress={() => navigation.navigate('Login')}
                        disabled={backendStatus !== 'connected'}
                    />
                </View>

                {/* Footer Info */}
                <View style={styles.footerInfo}>
                    <Text style={styles.footerText}>
                        Department of Justice & Constitutional Development
                    </Text>
                    <View style={styles.platformRow}>
                        <Text style={styles.platform}>
                            {Platform.OS.toUpperCase()} • v1.0
                        </Text>
                        {backendStatus !== 'connected' && (
                            <Text style={styles.warningText}>
                                ⚠️ Ensure backend is running
                            </Text>
                        )}
                    </View>
                </View>
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
        paddingTop: 60,
        paddingBottom: 25,
        paddingHorizontal: 20,
        alignItems: 'center',
        backgroundColor: COLORS.primary,
    },
    logoContainer: {
        marginBottom: 10,
    },
    logo: {
        fontSize: 64,
        marginBottom: 10,
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
        marginBottom: 16,
    },
    statusContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 10,
    },
    statusIndicator: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: 'rgba(255,255,255,0.1)',
        paddingHorizontal: 12,
        paddingVertical: 6,
        borderRadius: 20,
    },
    statusDot: {
        width: 8,
        height: 8,
        borderRadius: 4,
        marginRight: 8,
    },
    statusText: {
        fontSize: 12,
        fontWeight: '500',
    },
    statusSpinner: {
        marginLeft: 8,
    },
    retryButton: {
        paddingHorizontal: 12,
        paddingVertical: 6,
        backgroundColor: 'rgba(255,255,255,0.2)',
        borderRadius: 12,
    },
    retryText: {
        color: 'white',
        fontSize: 10,
        fontWeight: '500',
    },
    scrollView: {
        flex: 1,
    },
    scrollContent: {
        flexGrow: 1,
    },
    content: {
        padding: 25,
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
        width: '100%',
        maxWidth: 400,
        marginBottom: 30,
    },
    featureItem: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#f8fafc',
        borderRadius: 12,
        padding: 16,
        marginBottom: 12,
        borderWidth: 1,
        borderColor: '#e2e8f0',
    },
    featureIcon: {
        width: 48,
        height: 48,
        borderRadius: 24,
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: 16,
    },
    featureIconText: {
        fontSize: 20,
    },
    featureContent: {
        flex: 1,
    },
    featureTitle: {
        fontSize: 16,
        fontWeight: '600',
        color: COLORS.textPrimary,
        marginBottom: 4,
    },
    featureDesc: {
        fontSize: 13,
        color: COLORS.textSecondary,
    },
    additionalInfo: {
        width: '100%',
        maxWidth: 400,
        backgroundColor: '#f8fafc',
        borderRadius: 12,
        padding: 20,
        borderWidth: 1,
        borderColor: '#e2e8f0',
    },
    infoTitle: {
        fontSize: 18,
        fontWeight: '600',
        color: COLORS.textPrimary,
        marginBottom: 12,
        textAlign: 'center',
    },
    infoText: {
        fontSize: 14,
        color: COLORS.textSecondary,
        lineHeight: 22,
    },
    footer: {
        backgroundColor: COLORS.surface,
        borderTopWidth: 1,
        borderTopColor: COLORS.border,
        paddingBottom: Platform.OS === 'ios' ? 30 : 20,
    },
    footerButtons: {
        paddingHorizontal: 25,
        paddingTop: 20,
        paddingBottom: 15,
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
    buttonDisabled: {
        opacity: 0.5,
    },
    buttonPressed: {
        opacity: 0.8,
        transform: [{ scale: 0.98 }],
    },
    footerInfo: {
        padding: 16,
        alignItems: 'center',
        backgroundColor: COLORS.background,
    },
    footerText: {
        fontSize: 12,
        color: COLORS.textSecondary,
        textAlign: 'center',
        marginBottom: 4,
        fontWeight: '500',
    },
    platformRow: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
    },
    platform: {
        fontSize: 11,
        color: COLORS.textSecondary,
    },
    warningText: {
        fontSize: 10,
        color: COLORS.warning,
        fontWeight: '500',
    },
});