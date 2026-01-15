import React from 'react';
import { View, Text, StyleSheet, Pressable, ScrollView } from 'react-native';
import { StackNavigationProp } from '@react-navigation/stack';
import { RootStackParamList } from '../../navigation/AppNavigator';

type RegisterScreenNavigationProp = StackNavigationProp<
    RootStackParamList,
    'Register'
>;

type Props = {
    navigation: RegisterScreenNavigationProp;
};

export default function RegisterScreen({ navigation }: Props) {
    return (
        <ScrollView contentContainerStyle={styles.container}>
            <View style={styles.header}>
                <Text style={styles.title}>Join DOJCD Connect</Text>
                <Text style={styles.subtitle}>Select your role to get started</Text>
            </View>

            <View style={styles.cardsContainer}>
                {/* Client User Card */}
                <Pressable
                    style={styles.card}
                    onPress={() => navigation.navigate('ClientRegister')}
                >
                    <View style={[styles.cardIcon, { backgroundColor: '#3b82f6' }]}>
                        <Text style={styles.cardIconText}>👨‍⚖️</Text>
                    </View>
                    <Text style={styles.cardTitle}>Client User</Text>
                    <Text style={styles.cardDescription}>
                        For magistrates, teachers, and DOJCD staff who need to request devices
                    </Text>
                    <View style={styles.features}>
                        <Text style={styles.feature}>• Request new devices</Text>
                        <Text style={styles.feature}>• Track application status</Text>
                        <Text style={styles.feature}>• Upload required documents</Text>
                    </View>
                    <Text style={styles.cardCta}>Get Started →</Text>
                </Pressable>

                {/* Operational User Card */}
                <Pressable
                    style={styles.card}
                    onPress={() => navigation.navigate('OperationalRegister')}
                >
                    <View style={[styles.cardIcon, { backgroundColor: '#10b981' }]}>
                        <Text style={styles.cardIconText}>👨‍💼</Text>
                    </View>
                    <Text style={styles.cardTitle}>Operational User</Text>
                    <Text style={styles.cardDescription}>
                        For MTN staff, administrators, and support teams
                    </Text>
                    <View style={styles.features}>
                        <Text style={styles.feature}>• Process applications</Text>
                        <Text style={styles.feature}>• Manage device orders</Text>
                        <Text style={styles.feature}>• Generate reports</Text>
                    </View>
                    <Text style={styles.cardCta}>Get Started →</Text>
                </Pressable>
            </View>

            <View style={styles.footer}>
                <Text style={styles.loginText}>
                    Already have an account?
                </Text>
                <Pressable onPress={() => navigation.navigate('Login')}>
                    <Text style={styles.loginLink}>Sign In</Text>
                </Pressable>
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
        flex: 1,
    },
    card: {
        backgroundColor: '#f8fafc',
        borderWidth: 1,
        borderColor: '#e2e8f0',
        borderRadius: 16,
        padding: 24,
        marginBottom: 20,
        alignItems: 'center',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.05,
        shadowRadius: 8,
        elevation: 2,
    },
    cardIcon: {
        width: 70,
        height: 70,
        borderRadius: 35,
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: 16,
    },
    cardIconText: {
        fontSize: 28,
    },
    cardTitle: {
        fontSize: 22,
        fontWeight: 'bold',
        color: '#1e293b',
        marginBottom: 12,
        textAlign: 'center',
    },
    cardDescription: {
        fontSize: 15,
        color: '#64748b',
        textAlign: 'center',
        marginBottom: 20,
        lineHeight: 22,
    },
    features: {
        alignSelf: 'stretch',
        marginBottom: 20,
    },
    feature: {
        fontSize: 14,
        color: '#475569',
        marginBottom: 6,
        lineHeight: 20,
    },
    cardCta: {
        fontSize: 16,
        color: '#1e3a8a',
        fontWeight: '600',
    },
    footer: {
        alignItems: 'center',
        marginTop: 20,
        marginBottom: 40,
        paddingTop: 20,
        borderTopWidth: 1,
        borderTopColor: '#e2e8f0',
    },
    loginText: {
        fontSize: 15,
        color: '#64748b',
        marginBottom: 8,
    },
    loginLink: {
        fontSize: 15,
        color: '#1e3a8a',
        fontWeight: '600',
    },
});