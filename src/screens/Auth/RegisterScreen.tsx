import React, { useState } from 'react';
import { View, Text, StyleSheet, Pressable, ScrollView, Alert } from 'react-native';
import { StackNavigationProp } from '@react-navigation/stack';
import { RootStackParamList } from '../../navigation/AppNavigator';
import { authAPI } from '../../services/api';

type RegisterScreenNavigationProp = StackNavigationProp<
    RootStackParamList,
    'Register'
>;

type Props = {
    navigation: RegisterScreenNavigationProp;
};

export default function RegisterScreen({ navigation }: Props) {
    const [selectedRole, setSelectedRole] = useState<'client' | 'operational' | null>(null);

    const handleRoleSelect = (role: 'client' | 'operational') => {
        setSelectedRole(role);
        // Auto-navigate after selection
        setTimeout(() => {
            if (role === 'client') {
                navigation.navigate('ClientRegister');
            } else {
                navigation.navigate('OperationalRegister');
            }
        }, 300);
    };

    return (
        <ScrollView contentContainerStyle={styles.container}>
            <View style={styles.header}>
                <View style={styles.logoContainer}>
                    <Text style={styles.logo}>⚖️</Text>
                </View>
                <Text style={styles.title}>Join DOJCD Connect</Text>
                <Text style={styles.subtitle}>Select your role to get started</Text>
            </View>

            <View style={styles.cardsContainer}>
                {/* Client User Card */}
                <Pressable
                    style={[
                        styles.card,
                        selectedRole === 'client' && styles.cardSelected,
                        { borderColor: '#3b82f6' }
                    ]}
                    onPress={() => handleRoleSelect('client')}
                >
                    <View style={[styles.cardHeader, { backgroundColor: 'rgba(59, 130, 246, 0.1)' }]}>
                        <View style={[styles.cardIcon, { backgroundColor: '#3b82f6' }]}>
                            <Text style={styles.cardIconText}>👨‍⚖️</Text>
                        </View>
                        <Text style={styles.cardTitle}>Client User</Text>
                    </View>
                    
                    <View style={styles.cardBody}>
                        <Text style={styles.cardDescription}>
                            For magistrates, teachers, and DOJCD staff who need to request devices
                        </Text>
                        <View style={styles.features}>
                            <View style={styles.featureItem}>
                                <Text style={styles.featureDot}>•</Text>
                                <Text style={styles.featureText}>Request new devices</Text>
                            </View>
                            <View style={styles.featureItem}>
                                <Text style={styles.featureDot}>•</Text>
                                <Text style={styles.featureText}>Track application status</Text>
                            </View>
                            <View style={styles.featureItem}>
                                <Text style={styles.featureDot}>•</Text>
                                <Text style={styles.featureText}>Upload required documents</Text>
                            </View>
                        </View>
                    </View>
                    
                    <View style={[styles.cardFooter, { backgroundColor: 'rgba(59, 130, 246, 0.05)' }]}>
                        <Text style={[styles.cardCta, { color: '#3b82f6' }]}>
                            Get Started →
                        </Text>
                    </View>
                </Pressable>

                {/* Operational User Card */}
                <Pressable
                    style={[
                        styles.card,
                        selectedRole === 'operational' && styles.cardSelected,
                        { borderColor: '#10b981' }
                    ]}
                    onPress={() => handleRoleSelect('operational')}
                >
                    <View style={[styles.cardHeader, { backgroundColor: 'rgba(16, 185, 129, 0.1)' }]}>
                        <View style={[styles.cardIcon, { backgroundColor: '#10b981' }]}>
                            <Text style={styles.cardIconText}>👨‍💼</Text>
                        </View>
                        <Text style={styles.cardTitle}>Operational User</Text>
                    </View>
                    
                    <View style={styles.cardBody}>
                        <Text style={styles.cardDescription}>
                            For MTN staff, administrators, and support teams
                        </Text>
                        <View style={styles.features}>
                            <View style={styles.featureItem}>
                                <Text style={styles.featureDot}>•</Text>
                                <Text style={styles.featureText}>Process applications</Text>
                            </View>
                            <View style={styles.featureItem}>
                                <Text style={styles.featureDot}>•</Text>
                                <Text style={styles.featureText}>Manage device orders</Text>
                            </View>
                            <View style={styles.featureItem}>
                                <Text style={styles.featureDot}>•</Text>
                                <Text style={styles.featureText}>Generate reports</Text>
                            </View>
                        </View>
                    </View>
                    
                    <View style={[styles.cardFooter, { backgroundColor: 'rgba(16, 185, 129, 0.05)' }]}>
                        <Text style={[styles.cardCta, { color: '#10b981' }]}>
                            Get Started →
                        </Text>
                    </View>
                </Pressable>
            </View>

            <View style={styles.divider}>
                <View style={styles.dividerLine} />
                <Text style={styles.dividerText}>Already registered?</Text>
                <View style={styles.dividerLine} />
            </View>

            <Pressable 
                style={styles.loginButton}
                onPress={() => navigation.navigate('Login')}
            >
                <Text style={styles.loginButtonText}>Sign In to Existing Account</Text>
            </Pressable>

            <View style={styles.footer}>
                <Text style={styles.footerText}>
                    Need help? Contact support@dojcd.gov.za
                </Text>
            </View>
        </ScrollView>
    );
}

const styles = StyleSheet.create({
    container: {
        flexGrow: 1,
        backgroundColor: '#ffffff',
        paddingHorizontal: 20,
    },
    header: {
        alignItems: 'center',
        marginTop: 40,
        marginBottom: 30,
    },
    logoContainer: {
        marginBottom: 20,
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
    cardsContainer: {
        gap: 20,
    },
    card: {
        backgroundColor: '#f8fafc',
        borderWidth: 2,
        borderRadius: 16,
        overflow: 'hidden',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.08,
        shadowRadius: 8,
        elevation: 4,
    },
    cardSelected: {
        transform: [{ scale: 0.98 }],
        shadowOpacity: 0.15,
    },
    cardHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        padding: 20,
        paddingBottom: 16,
    },
    cardIcon: {
        width: 50,
        height: 50,
        borderRadius: 25,
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: 16,
    },
    cardIconText: {
        fontSize: 22,
    },
    cardTitle: {
        fontSize: 20,
        fontWeight: 'bold',
        color: '#1e293b',
        flex: 1,
    },
    cardBody: {
        padding: 20,
        paddingTop: 0,
    },
    cardDescription: {
        fontSize: 15,
        color: '#64748b',
        lineHeight: 22,
        marginBottom: 20,
    },
    features: {
        gap: 10,
    },
    featureItem: {
        flexDirection: 'row',
        alignItems: 'flex-start',
    },
    featureDot: {
        fontSize: 16,
        color: '#475569',
        marginRight: 8,
        marginTop: 2,
    },
    featureText: {
        fontSize: 14,
        color: '#475569',
        lineHeight: 20,
        flex: 1,
    },
    cardFooter: {
        padding: 16,
        alignItems: 'center',
        borderTopWidth: 1,
        borderTopColor: 'rgba(0,0,0,0.05)',
    },
    cardCta: {
        fontSize: 16,
        fontWeight: '600',
    },
    divider: {
        flexDirection: 'row',
        alignItems: 'center',
        marginVertical: 30,
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
    loginButton: {
        backgroundColor: '#1e3a8a',
        padding: 18,
        borderRadius: 12,
        alignItems: 'center',
        marginBottom: 20,
        shadowColor: '#1e3a8a',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.2,
        shadowRadius: 4,
        elevation: 3,
    },
    loginButtonText: {
        color: 'white',
        fontSize: 16,
        fontWeight: '600',
    },
    footer: {
        alignItems: 'center',
        marginTop: 10,
        marginBottom: 40,
        paddingTop: 20,
        borderTopWidth: 1,
        borderTopColor: '#e2e8f0',
    },
    footerText: {
        fontSize: 13,
        color: '#94a3b8',
        textAlign: 'center',
    },
});