import React, { useState } from 'react';
import { View, Text, StyleSheet, Platform, Pressable, ScrollView } from 'react-native';

export default function App() {
    const [activeTab, setActiveTab] = useState('home');

    const FeatureCard = ({ title, description, emoji }: { title: string; description: string; emoji: string }) => (
        <View style={styles.card}>
            <Text style={styles.emoji}>{emoji}</Text>
            <Text style={styles.cardTitle}>{title}</Text>
            <Text style={styles.cardDescription}>{description}</Text>
        </View>
    );

    return (
        <View style={styles.container}>
            {/* Header */}
            <View style={styles.header}>
                <Text style={styles.title}>DOJCD Connect</Text>
                <Text style={styles.subtitle}>
                    Universal App - Running on: {Platform.OS.toUpperCase()}
                </Text>
            </View>

            {/* Navigation Tabs */}
            <View style={styles.tabContainer}>
                <Pressable
                    style={[styles.tab, activeTab === 'home' && styles.activeTab]}
                    onPress={() => setActiveTab('home')}
                >
                    <Text style={[styles.tabText, activeTab === 'home' && styles.activeTabText]}>
                        🏠 Home
                    </Text>
                </Pressable>
                <Pressable
                    style={[styles.tab, activeTab === 'features' && styles.activeTab]}
                    onPress={() => setActiveTab('features')}
                >
                    <Text style={[styles.tabText, activeTab === 'features' && styles.activeTabText]}>
                        ⭐ Features
                    </Text>
                </Pressable>
                <Pressable
                    style={[styles.tab, activeTab === 'about' && styles.activeTab]}
                    onPress={() => setActiveTab('about')}
                >
                    <Text style={[styles.tabText, activeTab === 'about' && styles.activeTabText]}>
                        ℹ️ About
                    </Text>
                </Pressable>
            </View>

            {/* Content */}
            <ScrollView style={styles.content}>
                {activeTab === 'home' && (
                    <View style={styles.tabContent}>
                        <Text style={styles.welcomeText}>Welcome to DOJCD Connect! 🚀</Text>
                        <Text style={styles.description}>
                            This is a React Native universal app built with Expo and TypeScript.
                        </Text>

                        <View style={styles.platformInfo}>
                            <Text style={styles.infoTitle}>Supported Platforms:</Text>
                            <Text>• 📱 iOS (Simulator)</Text>
                            <Text>• 🤖 Android (Emulator/Device)</Text>
                            <Text>• 🌐 Web Browser</Text>
                        </View>
                    </View>
                )}

                {activeTab === 'features' && (
                    <View style={styles.tabContent}>
                        <Text style={styles.sectionTitle}>App Features</Text>

                        <FeatureCard
                            emoji="🎯"
                            title="Cross-Platform"
                            description="Runs on iOS, Android, and Web with single codebase"
                        />

                        <FeatureCard
                            emoji="⚡"
                            title="Expo Powered"
                            description="Fast development with Expo ecosystem"
                        />

                        <FeatureCard
                            emoji="🔧"
                            title="TypeScript"
                            description="Type-safe development with excellent autocomplete"
                        />

                        <FeatureCard
                            emoji="🎨"
                            title="Modern UI"
                            description="Beautiful, responsive design that works everywhere"
                        />
                    </View>
                )}

                {activeTab === 'about' && (
                    <View style={styles.tabContent}>
                        <Text style={styles.sectionTitle}>About This Project</Text>
                        <Text style={styles.aboutText}>
                            This project demonstrates a modern React Native setup with:
                            {'\n\n'}
                            ✅ Expo for rapid development
                            {'\n'}
                            ✅ TypeScript for type safety
                            {'\n'}
                            ✅ Web support out-of-the-box
                            {'\n'}
                            ✅ Cross-platform compatibility
                            {'\n'}
                            ✅ WebStorm IDE integration
                        </Text>

                        <View style={styles.statusCard}>
                            <Text style={styles.statusTitle}>Current Status</Text>
                            <Text>🟢 Web: Working</Text>
                            <Text>🟡 Android: Setup required</Text>
                            <Text>🟡 iOS: Mac required</Text>
                            <Text>🔵 Backend: Ready to add</Text>
                        </View>
                    </View>
                )}
            </ScrollView>
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#ffffff',
    },
    header: {
        backgroundColor: '#6366f1',
        paddingTop: 60,
        paddingBottom: 20,
        paddingHorizontal: 20,
    },
    title: {
        fontSize: 32,
        fontWeight: 'bold',
        color: 'white',
        textAlign: 'center',
        marginBottom: 8,
    },
    subtitle: {
        fontSize: 16,
        color: 'rgba(255,255,255,0.8)',
        textAlign: 'center',
    },
    tabContainer: {
        flexDirection: 'row',
        backgroundColor: '#f8fafc',
        borderBottomWidth: 1,
        borderBottomColor: '#e2e8f0',
    },
    tab: {
        flex: 1,
        paddingVertical: 16,
        alignItems: 'center',
    },
    activeTab: {
        borderBottomWidth: 3,
        borderBottomColor: '#6366f1',
    },
    tabText: {
        fontSize: 14,
        fontWeight: '600',
        color: '#64748b',
    },
    activeTabText: {
        color: '#6366f1',
    },
    content: {
        flex: 1,
    },
    tabContent: {
        padding: 20,
    },
    welcomeText: {
        fontSize: 24,
        fontWeight: 'bold',
        color: '#1e293b',
        marginBottom: 16,
        textAlign: 'center',
    },
    description: {
        fontSize: 16,
        color: '#64748b',
        textAlign: 'center',
        marginBottom: 24,
        lineHeight: 24,
    },
    platformInfo: {
        backgroundColor: '#f1f5f9',
        padding: 16,
        borderRadius: 12,
        marginTop: 16,
    },
    infoTitle: {
        fontSize: 18,
        fontWeight: 'bold',
        marginBottom: 12,
        color: '#334155',
    },
    sectionTitle: {
        fontSize: 24,
        fontWeight: 'bold',
        color: '#1e293b',
        marginBottom: 20,
        textAlign: 'center',
    },
    card: {
        backgroundColor: 'white',
        padding: 20,
        borderRadius: 12,
        marginBottom: 16,
        borderWidth: 1,
        borderColor: '#e2e8f0',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 6,
        elevation: 3,
    },
    emoji: {
        fontSize: 24,
        marginBottom: 8,
    },
    cardTitle: {
        fontSize: 18,
        fontWeight: 'bold',
        color: '#1e293b',
        marginBottom: 8,
    },
    cardDescription: {
        fontSize: 14,
        color: '#64748b',
        lineHeight: 20,
    },
    aboutText: {
        fontSize: 16,
        color: '#475569',
        lineHeight: 24,
        marginBottom: 24,
    },
    statusCard: {
        backgroundColor: '#f0f9ff',
        padding: 20,
        borderRadius: 12,
        borderLeftWidth: 4,
        borderLeftColor: '#0ea5e9',
    },
    statusTitle: {
        fontSize: 18,
        fontWeight: 'bold',
        color: '#0369a1',
        marginBottom: 12,
    },
});