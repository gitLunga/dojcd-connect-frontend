import React, { useState } from 'react';
import { View, Text, StyleSheet, Pressable, ScrollView, Alert } from 'react-native';
import { StackNavigationProp } from '@react-navigation/stack';
import { RootStackParamList } from '../../navigation/AppNavigator';
import { authAPI } from '../../services/api';
import { Ionicons } from '@expo/vector-icons';

type RegisterScreenNavigationProp = StackNavigationProp<RootStackParamList, 'Register'>;
type Props = { navigation: RegisterScreenNavigationProp };

// ─── Shared design tokens ─────────────────────────────────────────────────────
const C = {
    navy:       '#0F1F3D',
    accent:     '#1E4FD8',
    accentSoft: '#EBF0FF',
    surface:    '#FFFFFF',
    bg:         '#F4F6FA',
    border:     '#E2E8F2',
    text:       '#0F1F3D',
    muted:      '#64748B',
    mutedLight: '#94A3B8',
    green:      '#059669',
    greenSoft:  '#D1FAE5',
};

const ROLES = [
    {
        key: 'client' as const,
        title: 'Client User',
        subtitle: 'Magistrates & DOJCD Staff',
        desc: 'For department staff who need to request and manage devices through the platform.',
        icon: 'person-outline' as const,
        color: C.accent,
        bg: C.accentSoft,
        features: [
            { icon: 'phone-portrait-outline' as const, text: 'Request new devices' },
            { icon: 'document-text-outline' as const,  text: 'Track application status' },
            { icon: 'cloud-upload-outline' as const,   text: 'Upload required documents' },
        ],
        navigate: 'ClientRegister' as const,
    },
    // {
    //     key: 'operational' as const,
    //     title: 'Operational User',
    //     subtitle: 'MTN Staff & Administrators',
    //     desc: 'For MTN staff and administrators who process applications and manage device orders.',
    //     icon: 'briefcase-outline' as const,
    //     color: C.green,
    //     bg: C.greenSoft,
    //     features: [
    //         { icon: 'checkmark-circle-outline' as const, text: 'Process applications' },
    //         { icon: 'cube-outline' as const,             text: 'Manage device orders' },
    //         { icon: 'bar-chart-outline' as const,        text: 'Generate reports' },
    //     ],
    //     navigate: 'OperationalRegister' as const,
    // },
];

export default function RegisterScreen({ navigation }: Props) {
    const [selectedRole, setSelectedRole] = useState<'client' | 'operational' | null>(null);

    const handleRoleSelect = (role: typeof ROLES[0]) => {
        setSelectedRole(role.key);
        setTimeout(() => navigation.navigate(role.navigate), 280);
    };

    return (
        <View style={s.root}>

            {/* ── Navy header ────────────────────────────────────────── */}
            <View style={s.header}>
                <View style={s.headerRing} />

                <Pressable style={s.backBtn} onPress={() => navigation.goBack()}>
                    <Ionicons name="arrow-back" size={22} color="rgba(255,255,255,0.9)" />
                </Pressable>

                <View style={s.headerContent}>
                    <View style={s.emblem}>
                        <Text style={{ fontSize: 32 }}>⚖️</Text>
                    </View>
                    <Text style={s.headerTitle}>Create Account</Text>
                    <Text style={s.headerSub}>Select your role to get started</Text>
                </View>

                {/* Step breadcrumb */}
                <View style={s.stepRow}>
                    {['Role', 'Details', 'Security', 'Confirm'].map((label, i) => (
                        <React.Fragment key={label}>
                            <View style={s.stepItem}>
                                <View style={[s.stepCircle, i === 0 && s.stepCircleActive]}>
                                    <Text style={[s.stepNum, i === 0 && s.stepNumActive]}>{i + 1}</Text>
                                </View>
                                <Text style={[s.stepLabel, i === 0 && s.stepLabelActive]}>{label}</Text>
                            </View>
                            {i < 3 && <View style={s.stepConnector} />}
                        </React.Fragment>
                    ))}
                </View>
            </View>

            {/* ── Scrollable body ─────────────────────────────────────── */}
            <ScrollView
                style={s.scroll}
                contentContainerStyle={s.scrollContent}
                showsVerticalScrollIndicator={false}
            >
                <Text style={s.chooseSub}>Who are you registering as?</Text>

                {ROLES.map(role => {
                    const isActive = selectedRole === role.key;
                    return (
                        <Pressable
                            key={role.key}
                            style={({ pressed }) => [
                                s.roleCard,
                                isActive && { borderColor: role.color, shadowOpacity: 0.13 },
                                pressed && { transform: [{ scale: 0.988 }], opacity: 0.95 },
                            ]}
                            onPress={() => handleRoleSelect(role)}
                        >
                            {/* Header row */}
                            <View style={s.roleTop}>
                                <View style={[s.roleIcon, { backgroundColor: role.bg }]}>
                                    <Ionicons name={role.icon} size={26} color={role.color} />
                                </View>
                                <View style={s.roleTopText}>
                                    <Text style={s.roleTitle}>{role.title}</Text>
                                    <Text style={s.roleSub}>{role.subtitle}</Text>
                                </View>
                                <View style={[s.arrowCircle, isActive && { backgroundColor: role.color, borderColor: role.color }]}>
                                    <Ionicons name="arrow-forward" size={16} color={isActive ? '#fff' : C.mutedLight} />
                                </View>
                            </View>

                            {/* Description */}
                            <Text style={s.roleDesc}>{role.desc}</Text>

                            {/* Features */}
                            <View style={s.roleFeatures}>
                                {role.features.map((f, i) => (
                                    <View key={i} style={s.featureRow}>
                                        <View style={[s.featureIconWrap, { backgroundColor: role.bg }]}>
                                            <Ionicons name={f.icon} size={13} color={role.color} />
                                        </View>
                                        <Text style={s.featureText}>{f.text}</Text>
                                    </View>
                                ))}
                            </View>

                            {/* CTA footer strip */}
                            <View style={[s.roleCta, { backgroundColor: role.bg }]}>
                                <Text style={[s.roleCtaText, { color: role.color }]}>
                                    Register as {role.title}
                                </Text>
                                <Ionicons name="chevron-forward" size={14} color={role.color} />
                            </View>
                        </Pressable>
                    );
                })}

                {/* Divider */}
                <View style={s.divider}>
                    <View style={s.divLine} />
                    <Text style={s.divText}>ALREADY REGISTERED?</Text>
                    <View style={s.divLine} />
                </View>

                <Pressable
                    style={({ pressed }) => [s.loginBtn, pressed && { opacity: 0.8 }]}
                    onPress={() => navigation.navigate('Login')}
                >
                    <Ionicons name="log-in-outline" size={18} color={C.navy} style={{ marginRight: 8 }} />
                    <Text style={s.loginBtnText}>Sign In to Existing Account</Text>
                </Pressable>

                <Text style={s.footerNote}>Need help? Contact support@dojcd.gov.za</Text>
            </ScrollView>
        </View>
    );
}

const s = StyleSheet.create({
    root: { flex: 1, backgroundColor: C.bg },

    // Header
    header: { backgroundColor: C.navy, paddingTop: 56, paddingBottom: 28, paddingHorizontal: 20, overflow: 'hidden' },
    headerRing: { position: 'absolute', width: 260, height: 260, borderRadius: 130, borderWidth: 1, borderColor: 'rgba(255,255,255,0.05)', top: -80, right: -60 },
    backBtn: { width: 40, height: 40, borderRadius: 12, backgroundColor: 'rgba(255,255,255,0.1)', justifyContent: 'center', alignItems: 'center', marginBottom: 20 },
    headerContent: { alignItems: 'center', marginBottom: 28 },
    emblem: { width: 64, height: 64, borderRadius: 18, backgroundColor: 'rgba(255,255,255,0.1)', borderWidth: 1, borderColor: 'rgba(255,255,255,0.15)', justifyContent: 'center', alignItems: 'center', marginBottom: 14 },
    headerTitle: { fontSize: 24, fontWeight: '800', color: '#fff', marginBottom: 5 },
    headerSub: { fontSize: 13, color: 'rgba(255,255,255,0.55)', textAlign: 'center' },

    // Step indicator
    stepRow: { flexDirection: 'row', alignItems: 'flex-start', justifyContent: 'center' },
    stepItem: { alignItems: 'center', width: 56 },
    stepCircle: { width: 28, height: 28, borderRadius: 14, backgroundColor: 'rgba(255,255,255,0.1)', borderWidth: 1, borderColor: 'rgba(255,255,255,0.2)', justifyContent: 'center', alignItems: 'center', marginBottom: 5 },
    stepCircleActive: { backgroundColor: C.accent, borderColor: C.accent },
    stepNum: { fontSize: 11, color: 'rgba(255,255,255,0.4)', fontWeight: '700' },
    stepNumActive: { color: '#fff' },
    stepLabel: { fontSize: 9, color: 'rgba(255,255,255,0.35)', fontWeight: '600', letterSpacing: 0.3 },
    stepLabelActive: { color: 'rgba(255,255,255,0.85)' },
    stepConnector: { flex: 1, height: 1, backgroundColor: 'rgba(255,255,255,0.12)', marginTop: 14, maxWidth: 20 },

    // Body
    scroll: { flex: 1 },
    scrollContent: { padding: 20, paddingBottom: 40 },
    chooseSub: { fontSize: 14, color: C.muted, textAlign: 'center', marginBottom: 20 },

    // Role cards
    roleCard: {
        backgroundColor: C.surface, borderRadius: 20, borderWidth: 1.5, borderColor: C.border,
        marginBottom: 16, overflow: 'hidden',
        shadowColor: C.navy, shadowOffset: { width: 0, height: 3 },
        shadowOpacity: 0.07, shadowRadius: 10, elevation: 4,
    },
    roleTop: { flexDirection: 'row', alignItems: 'center', padding: 18, paddingBottom: 14 },
    roleIcon: { width: 52, height: 52, borderRadius: 15, justifyContent: 'center', alignItems: 'center', marginRight: 14 },
    roleTopText: { flex: 1 },
    roleTitle: { fontSize: 18, fontWeight: '800', color: C.text, marginBottom: 3 },
    roleSub: { fontSize: 12, color: C.muted },
    arrowCircle: { width: 32, height: 32, borderRadius: 16, backgroundColor: C.bg, borderWidth: 1, borderColor: C.border, justifyContent: 'center', alignItems: 'center' },
    roleDesc: { fontSize: 13, color: C.muted, lineHeight: 19, paddingHorizontal: 18, marginBottom: 16 },
    roleFeatures: { paddingHorizontal: 18, marginBottom: 16, gap: 10 },
    featureRow: { flexDirection: 'row', alignItems: 'center', gap: 10 },
    featureIconWrap: { width: 28, height: 28, borderRadius: 8, justifyContent: 'center', alignItems: 'center' },
    featureText: { fontSize: 13, color: C.text, fontWeight: '500' },
    roleCta: { flexDirection: 'row', justifyContent: 'center', alignItems: 'center', paddingVertical: 13, gap: 6 },
    roleCtaText: { fontSize: 14, fontWeight: '700' },

    // Divider
    divider: { flexDirection: 'row', alignItems: 'center', marginVertical: 24 },
    divLine: { flex: 1, height: 1, backgroundColor: C.border },
    divText: { paddingHorizontal: 14, fontSize: 10, color: C.muted, fontWeight: '700', letterSpacing: 1.2 },

    // Login button
    loginBtn: { flexDirection: 'row', justifyContent: 'center', alignItems: 'center', borderRadius: 16, paddingVertical: 16, borderWidth: 1.5, borderColor: C.navy, backgroundColor: C.surface, marginBottom: 20 },
    loginBtnText: { color: C.navy, fontSize: 15, fontWeight: '700' },
    footerNote: { textAlign: 'center', fontSize: 12, color: C.mutedLight, marginBottom: 8 },
});