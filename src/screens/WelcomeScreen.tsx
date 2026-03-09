import React, {useEffect, useState} from 'react';
import {
    View, Text, StyleSheet, Platform, Pressable,
    ActivityIndicator, ScrollView, Alert
} from 'react-native';
import {StackNavigationProp} from '@react-navigation/stack';
import {RootStackParamList} from '../navigation/AppNavigator';
import {authAPI} from '../services/api';
import {Ionicons} from '@expo/vector-icons';

type WelcomeScreenNavigationProp = StackNavigationProp<RootStackParamList, 'Welcome'>;
type Props = { navigation: WelcomeScreenNavigationProp };

// ─── Shared design tokens ─────────────────────────────────────────────────────
const C = {
    navy: '#0F1F3D',
    accent: '#1E4FD8',
    accentSoft: '#EBF0FF',
    surface: '#FFFFFF',
    bg: '#F4F6FA',
    border: '#E2E8F2',
    text: '#0F1F3D',
    muted: '#64748B',
    mutedLight: '#94A3B8',
    green: '#059669',
    greenSoft: '#D1FAE5',
    amber: '#D97706',
    amberSoft: '#FEF3C7',
    rose: '#DC2626',
};

const FEATURES = [
    {
        icon: 'phone-portrait-outline' as const,
        color: C.accent,
        bg: C.accentSoft,
        title: 'Request Devices',
        desc: 'Submit device procurement requests online'
    },
    {
        icon: 'checkmark-circle-outline' as const,
        color: C.green,
        bg: C.greenSoft,
        title: 'Multi-level Approval',
        desc: 'Streamlined workflow with real-time updates'
    },
    {
        icon: 'analytics-outline' as const,
        color: '#7C3AED',
        bg: '#EDE9FE',
        title: 'Real-time Tracking',
        desc: 'Monitor every stage of your application'
    },
    {
        icon: 'shield-checkmark-outline' as const,
        color: C.amber,
        bg: C.amberSoft,
        title: 'Secure Platform',
        desc: 'Enterprise-grade security & compliance'
    },
];

export default function WelcomeScreen({navigation}: Props) {
    const [status, setStatus] = useState<'checking' | 'connected' | 'disconnected'>('checking');

    useEffect(() => {
        testBackendConnection();
    }, []);

    const testBackendConnection = async () => {
        setStatus('checking');
        try {
            await authAPI.testConnection();
            setStatus('connected');
        } catch (error: any) {
            setStatus('disconnected');
        }
    };

    const handleGetStarted = () => {
        if (status === 'connected') {
            navigation.navigate('Register');
        } else {
            Alert.alert('Connection Issue', 'Please ensure the backend server is running before proceeding.');
        }
    };

    const statusMeta = {
        checking: {color: C.amber, dot: C.amber, text: 'Checking connection…'},
        connected: {color: C.green, dot: '#4ADE80', text: 'System online'},
        disconnected: {color: C.rose, dot: C.rose, text: 'Connection failed'},
    }[status];

    const isReady = status === 'connected';

    return (
        <View style={s.root}>

            {/* ── Hero ──────────────────────────────────────────────── */}
            <View style={s.hero}>
                <View style={s.ring1}/><View style={s.ring2}/><View style={s.ring3}/>

                <View style={s.emblemOuter}>
                    <View style={s.emblem}>
                        <Text style={{fontSize: 42}}>⚖️</Text>
                    </View>
                </View>

                <Text style={s.heroTitle}>DOJCD Connect</Text>
                <Text style={s.heroTagline}>Device Procurement Platform</Text>

                {/* Status pill — tappable when disconnected */}
                <Pressable
                    style={s.statusPill}
                    onPress={status === 'disconnected' ? testBackendConnection : undefined}
                >
                    {status === 'checking'
                        ? <ActivityIndicator size={10} color={C.amber} style={{marginRight: 8}}/>
                        : <View style={[s.statusDot, {backgroundColor: statusMeta.dot}]}/>
                    }
                    <Text style={[s.statusText, {color: statusMeta.color}]}>
                        {statusMeta.text}
                    </Text>
                    {status === 'disconnected' && (
                        <View style={s.retryChip}>
                            <Text style={s.retryText}>Tap to retry</Text>
                        </View>
                    )}
                </Pressable>
            </View>

            {/* ── Scrollable content ────────────────────────────────── */}
            <ScrollView
                style={s.scroll}
                contentContainerStyle={s.scrollContent}
                showsVerticalScrollIndicator={false}
            >
                <Text style={s.introTitle}>Mobile Procurement System</Text>
                <Text style={s.introSub}>
                    Streamlining device requests and approvals for DOJCD staff and magistrates nationwide.
                </Text>

                {/* Feature cards */}
                {FEATURES.map((f, i) => (
                    <View key={i} style={s.featureCard}>
                        <View style={[s.featureIco, {backgroundColor: f.bg}]}>
                            <Ionicons name={f.icon} size={22} color={f.color}/>
                        </View>
                        <View style={s.featureBody}>
                            <Text style={s.featureTitle}>{f.title}</Text>
                            <Text style={s.featureDesc}>{f.desc}</Text>
                        </View>
                        <Ionicons name="chevron-forward" size={16} color={C.mutedLight}/>
                    </View>
                ))}

                {/* Info banner */}
                <View style={s.infoBanner}>
                    <View style={s.infoBannerRow}>
                        <View style={s.infoBannerIcon}>
                            <Ionicons name="information-circle-outline" size={18} color={C.accent}/>
                        </View>
                        <Text style={s.infoBannerTitle}>Why this platform?</Text>
                    </View>
                    <Text style={s.infoBannerText}>
                        Fast processing · Real-time notifications · Regulatory compliance · Nationwide support
                    </Text>
                </View>
            </ScrollView>

            {/* ── Fixed footer ─────────────────────────────────────── */}
            <View style={s.footer}>
                {/* Primary CTA */}
                <Pressable
                    style={({pressed}) => [
                        s.primaryBtn,
                        !isReady && s.primaryBtnDisabled,
                        pressed && isReady && {opacity: 0.88, transform: [{scale: 0.99}]},
                    ]}
                    onPress={handleGetStarted}
                    disabled={status === 'checking'}
                >
                    {status === 'checking'
                        ? <ActivityIndicator color="#fff" size="small"/>
                        : <>
                            <Text style={s.primaryBtnText}>
                                {isReady ? 'Get Started' : 'Retry Connection'}
                            </Text>
                            <Ionicons name="arrow-forward" size={18} color="#fff" style={{marginLeft: 8}}/>
                        </>
                    }
                </Pressable>

                {/* Secondary — Sign In */}
                <Pressable
                    style={({pressed}) => [
                        s.secondaryBtn,
                        !isReady && s.secondaryBtnDisabled,
                        pressed && isReady && {opacity: 0.8},
                    ]}
                    onPress={() => navigation.navigate('Login')}
                    disabled={!isReady}
                >
                    <Text style={[s.secondaryBtnText, !isReady && {color: C.mutedLight}]}>
                        Sign In to Existing Account
                    </Text>
                </Pressable>

                {/* Meta */}
                <View style={s.footerMeta}>
                    <Text style={s.footerOrg}>Department of Justice & Constitutional Development</Text>
                    <Text style={s.footerVersion}>
                        {Platform.OS.toUpperCase()} · v1.0.0 · Republic of South Africa
                    </Text>
                    {status === 'disconnected' && (
                        <Text style={s.warningNote}>⚠️ Ensure the backend server is running</Text>
                    )}
                </View>
            </View>
        </View>
    );
}

const s = StyleSheet.create({
    root: {flex: 1, backgroundColor: C.bg},

    // Hero
    hero: {
        backgroundColor: C.navy, paddingTop: 64, paddingBottom: 36,
        alignItems: 'center', overflow: 'hidden',
    },
    ring1: {
        position: 'absolute',
        width: 320,
        height: 320,
        borderRadius: 160,
        borderWidth: 1,
        borderColor: 'rgba(255,255,255,0.05)',
        top: -100,
        right: -80
    },
    ring2: {
        position: 'absolute',
        width: 200,
        height: 200,
        borderRadius: 100,
        borderWidth: 1,
        borderColor: 'rgba(255,255,255,0.06)',
        bottom: -40,
        left: -60
    },
    ring3: {
        position: 'absolute',
        width: 100,
        height: 100,
        borderRadius: 50,
        borderWidth: 1,
        borderColor: 'rgba(255,255,255,0.08)',
        top: 20,
        left: 30
    },
    emblemOuter: {
        shadowColor: '#C9A84C', shadowOffset: {width: 0, height: 10},
        shadowOpacity: 0.35, shadowRadius: 24, elevation: 20, marginBottom: 20,
    },
    emblem: {
        width: 88, height: 88, borderRadius: 26,
        backgroundColor: 'rgba(255,255,255,0.08)',
        borderWidth: 1, borderColor: 'rgba(255,255,255,0.16)',
        justifyContent: 'center', alignItems: 'center',
    },
    heroTitle: {fontSize: 30, fontWeight: '800', color: '#fff', letterSpacing: 1.2, marginBottom: 5},
    heroTagline: {fontSize: 13, color: 'rgba(255,255,255,0.5)', letterSpacing: 0.5, marginBottom: 22},
    statusPill: {
        flexDirection: 'row', alignItems: 'center', gap: 7,
        backgroundColor: 'rgba(255,255,255,0.08)',
        borderWidth: 1, borderColor: 'rgba(255,255,255,0.12)',
        paddingHorizontal: 14, paddingVertical: 8, borderRadius: 20,
    },
    statusDot: {width: 7, height: 7, borderRadius: 4},
    statusText: {fontSize: 12, fontWeight: '600', letterSpacing: 0.3},
    retryChip: {backgroundColor: 'rgba(255,255,255,0.15)', paddingHorizontal: 10, paddingVertical: 3, borderRadius: 12},
    retryText: {fontSize: 11, color: '#fff', fontWeight: '600'},

    // Scroll body
    scroll: {flex: 1},
    scrollContent: {padding: 20, paddingBottom: 8},
    introTitle: {fontSize: 20, fontWeight: '800', color: C.text, textAlign: 'center', marginBottom: 8, marginTop: 4},
    introSub: {
        fontSize: 14,
        color: C.muted,
        textAlign: 'center',
        lineHeight: 21,
        paddingHorizontal: 16,
        marginBottom: 24
    },

    // Feature cards
    featureCard: {
        flexDirection: 'row', alignItems: 'center',
        backgroundColor: C.surface, borderRadius: 16, padding: 16, marginBottom: 10,
        borderWidth: 1, borderColor: C.border,
        shadowColor: C.navy, shadowOffset: {width: 0, height: 2},
        shadowOpacity: 0.05, shadowRadius: 6, elevation: 2,
    },
    featureIco: {
        width: 44,
        height: 44,
        borderRadius: 13,
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: 14
    },
    featureBody: {flex: 1},
    featureTitle: {fontSize: 15, fontWeight: '700', color: C.text, marginBottom: 3},
    featureDesc: {fontSize: 12, color: C.muted, lineHeight: 17},

    // Info banner
    infoBanner: {
        backgroundColor: C.accentSoft, borderRadius: 16, padding: 16,
        borderWidth: 1, borderColor: C.accent + '30', marginBottom: 12,
    },
    infoBannerRow: {flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 8},
    infoBannerIcon: {
        width: 30,
        height: 30,
        borderRadius: 9,
        backgroundColor: C.surface,
        justifyContent: 'center',
        alignItems: 'center'
    },
    infoBannerTitle: {fontSize: 14, fontWeight: '800', color: C.navy},
    infoBannerText: {fontSize: 12, color: C.accent, lineHeight: 19},

    // Footer
    footer: {
        backgroundColor: C.surface, borderTopWidth: 1, borderTopColor: C.border,
        paddingHorizontal: 20, paddingTop: 20,
        paddingBottom: Platform.OS === 'ios' ? 34 : 24,
    },
    primaryBtn: {
        flexDirection: 'row', justifyContent: 'center', alignItems: 'center',
        backgroundColor: C.navy, borderRadius: 16, paddingVertical: 17, marginBottom: 12,
        shadowColor: C.navy, shadowOffset: {width: 0, height: 6},
        shadowOpacity: 0.28, shadowRadius: 12, elevation: 8,
    },
    primaryBtnDisabled: {backgroundColor: '#94A3B8', shadowOpacity: 0},
    primaryBtnText: {color: '#fff', fontSize: 16, fontWeight: '700', letterSpacing: 0.4},
    secondaryBtn: {
        justifyContent: 'center', alignItems: 'center',
        borderRadius: 16, paddingVertical: 15,
        borderWidth: 1.5, borderColor: C.navy, marginBottom: 16,
    },
    secondaryBtnDisabled: {borderColor: C.border},
    secondaryBtnText: {color: C.navy, fontSize: 16, fontWeight: '700'},
    footerMeta: {alignItems: 'center'},
    footerOrg: {fontSize: 12, color: C.muted, textAlign: 'center', marginBottom: 4},
    footerVersion: {fontSize: 10, color: C.mutedLight, letterSpacing: 0.5},
    warningNote: {fontSize: 11, color: C.amber, marginTop: 6, fontWeight: '500'},
});