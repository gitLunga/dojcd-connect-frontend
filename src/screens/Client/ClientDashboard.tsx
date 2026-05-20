// screens/Client/ClientDashboard.tsx
// Updated to match web ClientDashboard:
//  - Browse Devices → navigates to DeviceCatalog screen
//  - My Applications / See All → navigates to MyApplications screen
//  - Notifications bell → navigates to Notifications screen
//  - Profile completion reminder stays until profile done
//  - ConfirmDialog used instead of Alert.alert
//  - Removed inline modal sheets (Devices / Applications / Notifications)
//    — those are now full dedicated screens

import React, { useEffect, useState } from 'react';
import {
    View, Text, StyleSheet, TouchableOpacity, ScrollView,
    RefreshControl, ActivityIndicator,
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { StackNavigationProp } from '@react-navigation/stack';
import { RootStackParamList } from '../../navigation/AppNavigator';
import { useNavigation, useFocusEffect } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import { deviceAPI } from '../../services/api';
import { useToast } from '../../components/ToastProvider';
import ConfirmDialog, { DialogConfig } from '../../components/ConfirmDialog';
import DrawerLayout from '../../components/DrawerLayout';

type NavigationProp = StackNavigationProp<RootStackParamList, 'DOJCDDashboard'>;

// ─── Design tokens ─────────────────────────────────────────────────────────
const C = {
    navy: '#0F1F3D', navyLight: '#162C4A', navyMid: '#1E3A5F',
    accent: '#1E4FD8', accentSoft: '#EBF0FF',
    surface: '#FFFFFF', bg: '#F4F6FA', border: '#E2E8F2',
    text: '#0F1F3D', muted: '#64748B', mutedLight: '#94A3B8',
    green: '#059669', greenSoft: '#D1FAE5',
    amber: '#D97706', amberSoft: '#FEF3C7',
    rose: '#DC2626', roseSoft: '#FEE2E2',
    slate: '#64748B', slateSoft: '#F1F5F9',
};

// ─── Status chip ───────────────────────────────────────────────────────────
const STATUS = {
    Approved:  { bg: C.greenSoft, text: C.green, dot: C.green },
    Pending:   { bg: C.amberSoft, text: C.amber, dot: C.amber },
    Rejected:  { bg: C.roseSoft,  text: C.rose,  dot: C.rose  },
    Cancelled: { bg: C.slateSoft, text: C.slate, dot: C.slate },
} as const;

function StatusChip({ status }: { status: string }) {
    const m = STATUS[status as keyof typeof STATUS] || { bg: C.slateSoft, text: C.slate, dot: C.slate };
    return (
        <View style={[chip.wrap, { backgroundColor: m.bg }]}>
            <View style={[chip.dot, { backgroundColor: m.dot }]} />
            <Text style={[chip.text, { color: m.text }]}>{status}</Text>
        </View>
    );
}

const chip = StyleSheet.create({
    wrap: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 10, paddingVertical: 5, borderRadius: 20 },
    dot:  { width: 5, height: 5, borderRadius: 3, marginRight: 5 },
    text: { fontSize: 11, fontWeight: '700' },
});

interface Application {
    application_id: number;
    application_status: string;
    submission_date: string;
    last_updated: string;
    rejection_reason?: string;
    device_name: string;
    model: string;
    manufacturer: string;
    plan_name: string;
    monthly_cost: number;
    contract_duration_months: number;
}

interface Summary {
    total_applications: number;
    pending: number;
    approved: number;
    rejected: number;
    cancelled: number;
}



export default function ClientDashboard() {
    const toast      = useToast();
    const navigation = useNavigation<NavigationProp>();

    const [user,               setUser]               = useState<any>(null);
    const [hasProfile,         setHasProfile]         = useState(false);
    const [refreshing,         setRefreshing]         = useState(false);
    const [loading,            setLoading]            = useState(true);
    const [applications,       setApplications]       = useState<Application[]>([]);
    const [summary,            setSummary]            = useState<Summary | null>(null);
    const [isEligible,         setIsEligible]         = useState(false);
    const [eligibilityLoading, setEligibilityLoading] = useState(false);
    const [dialog,             setDialog]             = useState<DialogConfig | null>(null);

    // Reload data each time screen comes into focus
    useFocusEffect(
        React.useCallback(() => {
            if (user?.client_user_id) {
                loadApplications(user.client_user_id);
                loadSummary(user.client_user_id);
            }
        }, [user])
    );

    useEffect(() => { loadData(); }, []);

    const loadData = async () => {
        try {
            const ud = await AsyncStorage.getItem('user');
            if (!ud) { navigation.reset({ index: 0, routes: [{ name: 'Login' }] }); return; }
            const u = JSON.parse(ud);
            setUser(u);
            checkProfile(u);
            if (u.registration_status === 'Verified') {
                await Promise.all([
                    checkEligibility(u.client_user_id),
                    loadApplications(u.client_user_id),
                    loadSummary(u.client_user_id),
                ]);
            }
        } catch (e) { console.error(e); }
        finally { setLoading(false); }
    };

    const checkProfile = (u: any) => {
        const s = u.registration_status || '';
        setHasProfile(s === 'Verified' || s === 'Profile_Completed' || !!(u.network_provider && u.contract_duration_months));
    };

    const checkEligibility = async (id: number) => {
        try {
            setEligibilityLoading(true);
            const r = await deviceAPI.checkEligibility(id);
            const raw = r?.data;
            const eligible =
                raw?.data?.eligibility?.eligible ??
                raw?.data?.eligible ??
                raw?.eligible ??
                false;
            setIsEligible(eligible);
        } catch { setIsEligible(false); }
        finally { setEligibilityLoading(false); }
    };

    const loadApplications = async (id: number) => {
        try {
            const r = await deviceAPI.getUserApplications(id);
            const raw = r?.data?.data;
            let list: Application[] = [];
            if (Array.isArray(raw))                        list = raw;
            else if (raw && Array.isArray(raw.applications)) list = raw.applications;
            else if (Array.isArray(r?.data))               list = r.data;
            setApplications(list);
        } catch { setApplications([]); }
    };

    const loadSummary = async (id: number) => {
        try {
            const r = await deviceAPI.getApplicationSummary(id);
            const summary =
                r?.data?.data?.summary ??
                r?.data?.summary       ??
                r?.data?.data          ??
                null;
            setSummary(summary);
        } catch { setSummary(null); }
    };

    const onRefresh = async () => {
        setRefreshing(true);
        await loadData();
        setRefreshing(false);
    };

    const greeting = () => {
        const h = new Date().getHours();
        if (h < 12) return 'Good morning';
        if (h < 17) return 'Good afternoon';
        return 'Good evening';
    };

    const stats = [
        { label: 'Total',    value: summary?.total_applications || 0, icon: 'document-text-outline',    color: C.accent, bg: C.accentSoft },
        { label: 'Pending',  value: summary?.pending            || 0, icon: 'time-outline',             color: C.amber,  bg: C.amberSoft  },
        { label: 'Approved', value: summary?.approved           || 0, icon: 'checkmark-circle-outline', color: C.green,  bg: C.greenSoft  },
        { label: 'Rejected', value: summary?.rejected           || 0, icon: 'close-circle-outline',     color: C.rose,   bg: C.roseSoft   },
    ] as const;

    // ── Loading ─────────────────────────────────────────────────────────────
    if (loading) {
        return (
            <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: C.bg }}>
                <ActivityIndicator size="large" color={C.accent} />
                <Text style={{ marginTop: 12, fontSize: 14, color: C.muted, fontWeight: '500' }}>
                    Loading dashboard…
                </Text>
            </View>
        );
    }

    // ── Render ──────────────────────────────────────────────────────────────
    return (
        <DrawerLayout>
            <View style={s.root}>

                {/* ── Page header (greeting + eligibility badge) ─────────── */}
                <View style={s.header}>
                    <View style={s.headerLeft}>
                        <View style={s.headerIcon}>
                            <Ionicons name="grid-outline" size={20} color={C.accent} />
                        </View>
                        <View style={{ flex: 1 }}>
                            <Text style={s.headerTitle} numberOfLines={1}>
                                {greeting()}, {user?.first_name || 'User'} 👋
                            </Text>
                            <Text style={s.headerSub} numberOfLines={1}>
                                {user?.registration_status === 'Verified'
                                    ? 'Here\'s an overview of your account'
                                    : 'Complete your profile to unlock device applications'}
                            </Text>
                        </View>
                    </View>

                    <View style={s.headerRight}>
                        {/* Eligibility badge */}
                        {hasProfile && user?.registration_status === 'Verified' && (
                            <View style={[
                                s.eligBadge,
                                {
                                    backgroundColor: isEligible ? C.greenSoft : C.amberSoft,
                                    borderColor: isEligible ? `${C.green}60` : `${C.amber}60`,
                                },
                            ]}>
                                <Ionicons
                                    name={isEligible ? 'shield-checkmark-outline' : 'time-outline'}
                                    size={13}
                                    color={isEligible ? C.green : C.amber}
                                />
                                <Text style={[s.eligText, { color: isEligible ? C.green : C.amber }]}>
                                    {isEligible ? 'Eligible' : eligibilityLoading ? 'Checking…' : 'Pending'}
                                </Text>
                            </View>
                        )}

                        {/* Refresh */}
                        <TouchableOpacity style={s.iconBtn} onPress={onRefresh} disabled={refreshing}>
                            <Ionicons name="refresh-outline" size={18} color={C.muted} />
                        </TouchableOpacity>
                    </View>
                </View>

                {/* ── Scrollable body ──────────────────────────────────────── */}
                <ScrollView
                    style={{ flex: 1 }}
                    contentContainerStyle={s.body}
                    showsVerticalScrollIndicator={false}
                    refreshControl={
                        <RefreshControl
                            refreshing={refreshing}
                            onRefresh={onRefresh}
                            tintColor={C.accent}
                            colors={[C.accent]}
                        />
                    }
                >
                    {/* ── Profile completion reminder ── */}
                    {!hasProfile && (
                        <TouchableOpacity
                            style={s.profileBanner}
                            onPress={() => navigation.navigate('CompleteProfile')}
                            activeOpacity={0.88}
                        >
                            <View style={s.profileBannerLeft}>
                                <View style={s.profileBannerIco}>
                                    <Ionicons name="person-add-outline" size={20} color={C.amber} />
                                </View>
                                <View style={{ flex: 1 }}>
                                    <Text style={s.profileBannerTitle}>Complete your profile to get started</Text>
                                    <Text style={s.profileBannerSub}>
                                        Upload your documents and preferences to unlock device applications.
                                    </Text>
                                </View>
                            </View>
                            <Ionicons name="chevron-forward" size={18} color={C.amber} />
                        </TouchableOpacity>
                    )}

                    {/* ── Application Summary ── */}
                    <View style={s.sectionHeader}>
                        <Text style={s.sectionTitle}>Application Summary</Text>
                    </View>
                    <View style={s.statsGrid}>
                        {stats.map((st, i) => (
                            <View key={i} style={s.statCard}>
                                <View style={[s.statIco, { backgroundColor: st.bg }]}>
                                    <Ionicons name={st.icon as any} size={18} color={st.color} />
                                </View>
                                <Text style={s.statVal}>{st.value}</Text>
                                <Text style={s.statLabel}>{st.label}</Text>
                            </View>
                        ))}
                    </View>

                    {/* ── Quick Actions ── */}
                    <View style={[s.sectionHeader, { marginTop: 20 }]}>
                        <Text style={s.sectionTitle}>Quick Actions</Text>
                    </View>
                    <View style={s.actionsRow}>
                        {/* Browse Devices → navigates to DeviceCatalog */}
                        <TouchableOpacity
                            style={[
                                s.actionCard, s.actionNavy,
                                (!hasProfile || !isEligible) && s.actionDisabled,
                            ]}
                            onPress={() => {
                                if (!hasProfile) {
                                    navigation.navigate('CompleteProfile');
                                } else if (!isEligible) {
                                    toast.warning('Not Eligible', 'Your account is not yet eligible for device applications.');
                                } else {
                                    navigation.navigate('DeviceCatalog');
                                }
                            }}
                            activeOpacity={0.88}
                        >
                            <View style={[s.actionIco, { backgroundColor: 'rgba(255,255,255,0.14)' }]}>
                                <Ionicons name="phone-portrait-outline" size={24} color="#fff" />
                            </View>
                            <Text style={s.actionTitle}>Browse Devices</Text>
                            <Text style={s.actionHint}>
                                {!hasProfile ? 'Complete profile first' : !isEligible ? 'Pending eligibility' : 'View available devices'}
                            </Text>
                            <Ionicons name="arrow-forward" size={16} color="rgba(255,255,255,0.5)" style={{ marginTop: 12 }} />
                            {!hasProfile && (
                                <View style={s.actionLockBadge}>
                                    <Text style={s.actionLockText}>Profile needed</Text>
                                </View>
                            )}
                        </TouchableOpacity>

                        {/* My Applications → navigates to MyApplications */}
                        <TouchableOpacity
                            style={[
                                s.actionCard, s.actionGreen,
                                !hasProfile && s.actionDisabled,
                            ]}
                            onPress={() => {
                                if (!hasProfile) navigation.navigate('CompleteProfile');
                                else navigation.navigate('MyApplications');
                            }}
                            activeOpacity={0.88}
                        >
                            <View style={[s.actionIco, { backgroundColor: 'rgba(255,255,255,0.14)' }]}>
                                <Ionicons name="list-outline" size={24} color="#fff" />
                            </View>
                            <Text style={s.actionTitle}>My Applications</Text>
                            <Text style={s.actionHint}>
                                {applications.length > 0
                                    ? `${applications.length} application${applications.length !== 1 ? 's' : ''}`
                                    : 'No applications yet'}
                            </Text>
                            <Ionicons name="arrow-forward" size={16} color="rgba(255,255,255,0.5)" style={{ marginTop: 12 }} />
                            {applications.length > 0 && (
                                <View style={s.actionCountBadge}>
                                    <Text style={s.actionBadgeText}>{applications.length}</Text>
                                </View>
                            )}
                        </TouchableOpacity>
                    </View>

                    {/* ── Recent Applications ── */}
                    {applications.length > 0 && (
                        <View style={{ marginTop: 20 }}>
                            <View style={s.sectionHeader}>
                                <Text style={s.sectionTitle}>Recent Applications</Text>
                                <TouchableOpacity
                                    style={s.seeAll}
                                    onPress={() => navigation.navigate('MyApplications')}
                                >
                                    <Text style={s.seeAllText}>See all</Text>
                                    <Ionicons name="chevron-forward" size={13} color={C.accent} />
                                </TouchableOpacity>
                            </View>

                            {applications.slice(0, 4).map(app => (
                                <TouchableOpacity
                                    key={app.application_id}
                                    style={s.recentCard}
                                    onPress={() => navigation.navigate('ApplicationDetails', { applicationId: app.application_id })}
                                    activeOpacity={0.88}
                                >
                                    <View style={s.recentLeft}>
                                        <View style={s.recentIco}>
                                            <Ionicons name="phone-portrait-outline" size={16} color={C.accent} />
                                        </View>
                                        <View style={{ flex: 1 }}>
                                            <Text style={s.recentDevice} numberOfLines={1}>{app.device_name}</Text>
                                            <Text style={s.recentDate}>
                                                {app.model} · {new Date(app.submission_date).toLocaleDateString('en-ZA', { day: 'numeric', month: 'short', year: 'numeric' })}
                                            </Text>
                                        </View>
                                    </View>
                                    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                                        <StatusChip status={app.application_status} />
                                        <Ionicons name="chevron-forward" size={14} color={C.mutedLight} />
                                    </View>
                                </TouchableOpacity>
                            ))}
                        </View>
                    )}

                    {/* ── Empty state when no applications yet ── */}
                    {applications.length === 0 && hasProfile && isEligible && (
                        <View style={s.emptyBox}>
                            <View style={s.emptyIco}>
                                <Ionicons name="document-text-outline" size={28} color={C.mutedLight} />
                            </View>
                            <Text style={s.emptyTitle}>No applications yet</Text>
                            <Text style={s.emptySub}>
                                Browse available devices and submit your first application.
                            </Text>
                            <TouchableOpacity
                                style={s.emptyBtn}
                                onPress={() => navigation.navigate('DeviceCatalog')}
                            >
                                <Text style={s.emptyBtnText}>Browse Devices</Text>
                            </TouchableOpacity>
                        </View>
                    )}

                </ScrollView>

                {/* Confirmation dialog */}
                <ConfirmDialog config={dialog} onClose={() => setDialog(null)} />
            </View>
        </DrawerLayout>
    );
}

// ─── Styles ─────────────────────────────────────────────────────────────────
const s = StyleSheet.create({
    root: { flex: 1, backgroundColor: C.bg },

    header: {
        backgroundColor: C.surface, borderBottomWidth: 1, borderBottomColor: C.border,
        paddingHorizontal: 16, paddingVertical: 14,
        flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    },
    headerLeft:  { flexDirection: 'row', alignItems: 'center', gap: 12, flex: 1, marginRight: 8 },
    headerIcon:  { width: 40, height: 40, borderRadius: 12, backgroundColor: C.accentSoft, justifyContent: 'center', alignItems: 'center', flexShrink: 0 },
    headerTitle: { fontSize: 16, fontWeight: '800', color: C.text },
    headerSub:   { fontSize: 11, color: C.muted, marginTop: 1 },
    headerRight: { flexDirection: 'row', alignItems: 'center', gap: 8 },

    eligBadge:  { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 8, paddingVertical: 4, borderRadius: 20, borderWidth: 1, gap: 4 },
    eligText:   { fontSize: 11, fontWeight: '700' },

    iconBtn:        { width: 38, height: 38, borderRadius: 10, backgroundColor: C.bg, borderWidth: 1, borderColor: C.border, justifyContent: 'center', alignItems: 'center', position: 'relative' },
    iconBtnBadge:   { position: 'absolute', top: -4, right: -4, minWidth: 16, height: 16, borderRadius: 8, backgroundColor: '#EF4444', justifyContent: 'center', alignItems: 'center', paddingHorizontal: 3, borderWidth: 2, borderColor: C.surface },
    iconBtnBadgeText:{ fontSize: 9, fontWeight: '800', color: '#fff' },

    body: { padding: 16, paddingBottom: 40 },

    profileBanner:      { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', backgroundColor: '#FFFBEB', borderWidth: 1, borderColor: '#FDE68A', borderRadius: 14, padding: 14, marginBottom: 20, gap: 12 },
    profileBannerLeft:  { flexDirection: 'row', alignItems: 'center', gap: 12, flex: 1 },
    profileBannerIco:   { width: 42, height: 42, borderRadius: 11, backgroundColor: '#FEF3C7', justifyContent: 'center', alignItems: 'center', flexShrink: 0 },
    profileBannerTitle: { fontSize: 14, fontWeight: '700', color: '#92400E', marginBottom: 3 },
    profileBannerSub:   { fontSize: 12, color: '#B45309', lineHeight: 18 },

    sectionHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 },
    sectionTitle:  { fontSize: 15, fontWeight: '800', color: C.text },
    seeAll:        { flexDirection: 'row', alignItems: 'center', gap: 2 },
    seeAllText:    { fontSize: 13, color: C.accent, fontWeight: '600' },

    statsGrid: { flexDirection: 'row', gap: 10 },
    statCard:  { flex: 1, backgroundColor: C.surface, borderRadius: 14, padding: 14, alignItems: 'flex-start', borderWidth: 1, borderColor: C.border },
    statIco:   { width: 34, height: 34, borderRadius: 10, justifyContent: 'center', alignItems: 'center', marginBottom: 10 },
    statVal:   { fontSize: 22, fontWeight: '900', color: C.text, lineHeight: 26 },
    statLabel: { fontSize: 10, color: C.muted, fontWeight: '600', marginTop: 3 },

    actionsRow:     { flexDirection: 'row', gap: 12 },
    actionCard:     { flex: 1, borderRadius: 18, padding: 18, position: 'relative' },
    actionNavy:     { backgroundColor: C.navy },
    actionGreen:    { backgroundColor: C.green },
    actionDisabled: { opacity: 0.5 },
    actionIco:      { width: 44, height: 44, borderRadius: 12, justifyContent: 'center', alignItems: 'center', marginBottom: 12 },
    actionTitle:    { fontSize: 15, fontWeight: '800', color: '#fff', lineHeight: 20 },
    actionHint:     { fontSize: 11, color: 'rgba(255,255,255,0.55)', marginTop: 4 },
    actionLockBadge:{ position: 'absolute', top: 12, right: 12, backgroundColor: 'rgba(0,0,0,0.25)', paddingHorizontal: 8, paddingVertical: 3, borderRadius: 10 },
    actionLockText: { fontSize: 10, fontWeight: '700', color: '#fff' },
    actionCountBadge:{ position: 'absolute', top: 12, right: 12, minWidth: 22, height: 22, borderRadius: 11, backgroundColor: '#EF4444', justifyContent: 'center', alignItems: 'center', paddingHorizontal: 5 },
    actionBadgeText:{ fontSize: 10, fontWeight: '800', color: '#fff' },

    recentCard:   { backgroundColor: C.surface, borderRadius: 12, padding: 14, marginBottom: 8, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', borderWidth: 1, borderColor: C.border },
    recentLeft:   { flexDirection: 'row', alignItems: 'center', gap: 12, flex: 1, marginRight: 12 },
    recentIco:    { width: 34, height: 34, borderRadius: 9, backgroundColor: C.accentSoft, justifyContent: 'center', alignItems: 'center', flexShrink: 0 },
    recentDevice: { fontSize: 14, fontWeight: '700', color: C.text, marginBottom: 2 },
    recentDate:   { fontSize: 11, color: C.muted },

    emptyBox:  { backgroundColor: C.surface, borderRadius: 16, padding: 40, alignItems: 'center', borderWidth: 1, borderColor: C.border, marginTop: 20 },
    emptyIco:  { width: 60, height: 60, borderRadius: 16, backgroundColor: C.bg, borderWidth: 1, borderColor: C.border, justifyContent: 'center', alignItems: 'center', marginBottom: 16 },
    emptyTitle:{ fontSize: 16, fontWeight: '800', color: C.text, marginBottom: 6 },
    emptySub:  { fontSize: 13, color: C.muted, textAlign: 'center', lineHeight: 20, marginBottom: 18 },
    emptyBtn:  { backgroundColor: C.navy, paddingHorizontal: 22, paddingVertical: 11, borderRadius: 11 },
    emptyBtnText: { color: '#fff', fontWeight: '700', fontSize: 13 },
});