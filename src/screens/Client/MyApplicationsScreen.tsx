// screens/Client/MyApplicationsScreen.tsx
// Updated to match web version:
//   - ConfirmDialog replaces Alert.alert for cancel confirmation
//   - All original API logic, filters, styles preserved exactly

import React, { useState, useEffect } from 'react';
import {
    View, Text, StyleSheet, FlatList, TouchableOpacity,
    ActivityIndicator, RefreshControl,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { deviceAPI } from '../../services/api';
import { StackNavigationProp } from '@react-navigation/stack';
import { RootStackParamList } from '../../navigation/AppNavigator';
import { useNavigation } from '@react-navigation/native';
import { useToast } from '../../components/ToastProvider';
import ConfirmDialog, { DialogConfig } from '../../components/ConfirmDialog';
import DrawerLayout from '../../components/DrawerLayout';

type NavigationProp = StackNavigationProp<RootStackParamList, 'MyApplications'>;
type Filter = 'All' | 'Pending' | 'Approved' | 'Rejected' | 'Cancelled';

const C = {
    navy: '#0F1F3D', accent: '#1E4FD8', accentSoft: '#EBF0FF',
    surface: '#FFFFFF', bg: '#F4F6FA', border: '#E2E8F2',
    text: '#0F1F3D', muted: '#64748B', mutedLight: '#94A3B8',
    green: '#059669', greenSoft: '#D1FAE5',
    amber: '#D97706', amberSoft: '#FEF3C7',
    rose: '#DC2626', roseSoft: '#FEE2E2',
    slate: '#64748B', slateSoft: '#F1F5F9',
};

const STATUS_META = {
    Approved:  { bg: C.greenSoft, fg: C.green, dot: C.green, icon: 'checkmark-circle' as const },
    Pending:   { bg: C.amberSoft, fg: C.amber, dot: C.amber, icon: 'time' as const },
    Rejected:  { bg: C.roseSoft,  fg: C.rose,  dot: C.rose,  icon: 'close-circle' as const },
    Cancelled: { bg: C.slateSoft, fg: C.slate, dot: C.slate, icon: 'close-circle' as const },
};

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
    plan_details: string;
    monthly_cost: number;
    contract_duration_months: number;
}

function StatusChip({ status }: { status: string }) {
    const m = STATUS_META[status as keyof typeof STATUS_META] || { bg: C.slateSoft, fg: C.slate, dot: C.slate };
    return (
        <View style={[cs.wrap, { backgroundColor: m.bg }]}>
            <View style={[cs.dot, { backgroundColor: m.dot }]} />
            <Text style={[cs.text, { color: m.fg }]}>{status}</Text>
        </View>
    );
}

const cs = StyleSheet.create({
    wrap: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 10, paddingVertical: 5, borderRadius: 20 },
    dot:  { width: 5, height: 5, borderRadius: 3, marginRight: 5 },
    text: { fontSize: 11, fontWeight: '700' },
});

const FILTERS: { key: Filter; icon: string }[] = [
    { key: 'All',       icon: 'apps-outline' },
    { key: 'Pending',   icon: 'time-outline' },
    { key: 'Approved',  icon: 'checkmark-circle-outline' },
    { key: 'Rejected',  icon: 'close-circle-outline' },
    { key: 'Cancelled', icon: 'ban-outline' },
];

export default function MyApplicationsScreen() {
    const toast      = useToast();
    const navigation = useNavigation<NavigationProp>();

    const [applications, setApplications] = useState<Application[]>([]);
    const [loading,      setLoading]      = useState(true);
    const [refreshing,   setRefreshing]   = useState(false);
    const [user,         setUser]         = useState<any>(null);
    const [filter,       setFilter]       = useState<Filter>('All');
    const [dialog,       setDialog]       = useState<DialogConfig | null>(null);

    useEffect(() => { loadApplications(); }, []);

    const loadApplications = async () => {
        try {
            const ud = await AsyncStorage.getItem('user');
            if (!ud) { navigation.reset({ index: 0, routes: [{ name: 'Login' }] }); return; }
            const u = JSON.parse(ud);
            setUser(u);
            const r = await deviceAPI.getUserApplications(u.client_user_id);
            // Mirror web version exactly — handle all possible API response shapes
            const raw = r?.data?.data;
            let list: Application[] = [];
            if (Array.isArray(raw)) {
                list = raw;
            } else if (raw && Array.isArray((raw as any).applications)) {
                list = (raw as any).applications;
            } else if (Array.isArray(r?.data)) {
                list = r.data as any;
            }
            setApplications(list);
        } catch {
            toast.error('Failed to Load', 'Could not load your applications.');
        } finally {
            setLoading(false);
        }
    };

    const onRefresh = async () => {
        setRefreshing(true);
        await loadApplications();
        setRefreshing(false);
    };

    // Mirror web version: pass full app object, include device name and details in dialog
    const handleCancel = (app: Application) => {
        if (!user?.client_user_id) {
            toast.error('Error', 'User not found.');
            return;
        }
        setDialog({
            title:       'Cancel Application',
            message:     `Cancel your application for the ${app.device_name}?`,
            details:     'This action cannot be undone. Your application will be permanently cancelled.',
            confirmText: 'Yes, Cancel It',
            cancelText:  'Keep Application',
            variant:     'danger',
            onConfirm:   () => submitCancel(app.application_id),
        });
    };

    const submitCancel = async (applicationId: number) => {
        if (!user?.client_user_id) { toast.error('Error', 'User not found.'); return; }
        try {
            const r = await deviceAPI.cancelApplication(user.client_user_id, applicationId);
            if (r.data.success) {
                toast.success('Cancelled', r.data.message || 'Application cancelled.');
                await loadApplications();
            } else {
                toast.error('Failed', r.data.message);
            }
        } catch (error: any) {
            const s = error.response?.status;
            const m = error.response?.data?.message;
            if (s === 409) toast.warning('Already Finalised', m || 'Cannot cancel this application.');
            else toast.error('Failed', m || error.message);
        }
    };

    // Guard: ensure applications is always an array before calling .filter
    const safeApps = Array.isArray(applications) ? applications : [];
    const filtered  = filter === 'All' ? safeApps : safeApps.filter(a => a.application_status === filter);
    const countOf   = (f: Filter) => f === 'All' ? safeApps.length : safeApps.filter(a => a.application_status === f).length;

    const renderApp = ({ item }: { item: Application }) => {
        const meta = STATUS_META[item.application_status as keyof typeof STATUS_META];
        return (
            <TouchableOpacity
                style={s.appCard}
                onPress={() => navigation.navigate('ApplicationDetails', { applicationId: item.application_id })}
                activeOpacity={0.85}
            >
                {/* Left accent bar */}
                <View style={[s.accentBar, { backgroundColor: meta?.dot || C.muted }]} />

                <View style={s.appInner}>
                    {/* Top row */}
                    <View style={s.appTop}>
                        <View style={{ flex: 1, marginRight: 10 }}>
                            <Text style={s.appDevice} numberOfLines={1}>{item.device_name}</Text>
                            <Text style={s.appModel}>{item.model} · {item.manufacturer}</Text>
                        </View>
                        <StatusChip status={item.application_status} />
                    </View>

                    {/* Detail pills */}
                    <View style={s.pillRow}>
                        <View style={s.pill}>
                            <Ionicons name="document-text-outline" size={12} color={C.muted} />
                            <Text style={s.pillText}>{item.plan_name}</Text>
                        </View>
                        <View style={[s.pill, { backgroundColor: C.greenSoft }]}>
                            <Ionicons name="cash-outline" size={12} color={C.green} />
                            <Text style={[s.pillText, { color: C.green, fontWeight: '700' }]}>R{item.monthly_cost}/mo</Text>
                        </View>
                        <View style={s.pill}>
                            <Ionicons name="calendar-outline" size={12} color={C.muted} />
                            <Text style={s.pillText}>{item.contract_duration_months}mo</Text>
                        </View>
                    </View>

                    {/* Footer */}
                    <View style={s.appFooter}>
                        <Text style={s.appDate}>
                            Applied {new Date(item.submission_date).toLocaleDateString('en-ZA', { day: 'numeric', month: 'short', year: 'numeric' })}
                        </Text>
                        <View style={s.appFooterRight}>
                            {item.application_status === 'Pending' && (
                                <TouchableOpacity
                                    style={s.cancelBtn}
                                    onPress={() => handleCancel(item)}
                                >
                                    <Ionicons name="close-circle-outline" size={14} color={C.rose} />
                                    <Text style={s.cancelBtnText}>Cancel</Text>
                                </TouchableOpacity>
                            )}
                            <View style={s.viewHint}>
                                <Text style={s.viewHintText}>Details</Text>
                                <Ionicons name="chevron-forward" size={13} color={C.mutedLight} />
                            </View>
                        </View>
                    </View>

                    {/* Rejection reason */}
                    {item.rejection_reason && (
                        <View style={s.rejectionBanner}>
                            <Ionicons name="alert-circle-outline" size={14} color={C.rose} />
                            <Text style={s.rejectionText} numberOfLines={2}>{item.rejection_reason}</Text>
                        </View>
                    )}
                </View>
            </TouchableOpacity>
        );
    };

    if (loading) {
        return (
            <DrawerLayout>
                <View style={s.loadingScreen}>
                    <ActivityIndicator size="large" color={C.accent} />
                    <Text style={s.loadingText}>Loading applications…</Text>
                </View>
            </DrawerLayout>
        );
    }

    return (
        <DrawerLayout>
            <View style={s.root}>
                {/* Sticky header with filters */}
                <View style={s.topBar}>
                    <View style={s.topBarHeader}>
                        <View>
                            <Text style={s.pageTitle}>My Applications</Text>
                            <Text style={s.pageSub}>{applications.length} total application{applications.length !== 1 ? 's' : ''}</Text>
                        </View>
                        <TouchableOpacity style={s.browseBtn} onPress={() => navigation.navigate('DeviceCatalog')}>
                            <Ionicons name="add" size={16} color={C.accent} />
                            <Text style={s.browseBtnText}>Browse</Text>
                        </TouchableOpacity>
                    </View>

                    {/* Filter chips */}
                    <View style={s.filterRow}>
                        {FILTERS.map(f => {
                            const active = filter === f.key;
                            const cnt    = countOf(f.key);
                            return (
                                <TouchableOpacity
                                    key={f.key}
                                    style={[s.filterChip, active && s.filterChipActive]}
                                    onPress={() => setFilter(f.key)}
                                >
                                    <Ionicons name={f.icon as any} size={13} color={active ? '#fff' : C.muted} />
                                    <Text style={[s.filterChipText, active && s.filterChipTextActive]}>{f.key}</Text>
                                    {cnt > 0 && (
                                        <View style={[s.filterCount, active && s.filterCountActive]}>
                                            <Text style={[s.filterCountText, active && s.filterCountTextActive]}>{cnt}</Text>
                                        </View>
                                    )}
                                </TouchableOpacity>
                            );
                        })}
                    </View>
                </View>

                <FlatList
                    data={filtered}
                    renderItem={renderApp}
                    keyExtractor={i => i.application_id.toString()}
                    refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={C.accent} colors={[C.accent]} />}
                    contentContainerStyle={s.list}
                    showsVerticalScrollIndicator={false}
                    ListEmptyComponent={
                        <View style={s.empty}>
                            <View style={s.emptyIcon}>
                                <Ionicons name="document-text-outline" size={36} color={C.mutedLight} />
                            </View>
                            <Text style={s.emptyTitle}>{filter === 'All' ? 'No applications yet' : `No ${filter.toLowerCase()} applications`}</Text>
                            <Text style={s.emptySub}>{filter === 'All' ? 'Browse available devices to get started' : `You have no ${filter.toLowerCase()} applications`}</Text>
                            {filter === 'All' && (
                                <TouchableOpacity style={s.emptyBtn} onPress={() => navigation.navigate('DeviceCatalog')}>
                                    <Text style={s.emptyBtnText}>Browse Devices</Text>
                                </TouchableOpacity>
                            )}
                        </View>
                    }
                />

                {/* ConfirmDialog replaces Alert.alert */}
                <ConfirmDialog config={dialog} onClose={() => setDialog(null)} />
            </View>
        </DrawerLayout>
    );
}

const s = StyleSheet.create({
    root:        { flex: 1, backgroundColor: C.bg },
    loadingScreen: { flex: 1, backgroundColor: C.bg, justifyContent: 'center', alignItems: 'center' },
    loadingText: { marginTop: 14, fontSize: 15, color: C.muted, fontWeight: '500' },

    topBar:       { backgroundColor: C.surface, borderBottomWidth: 1, borderBottomColor: C.border, paddingTop: 20, paddingBottom: 0 },
    topBarHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', paddingHorizontal: 20, marginBottom: 16 },
    pageTitle:    { fontSize: 22, fontWeight: '800', color: C.text },
    pageSub:      { fontSize: 13, color: C.muted, marginTop: 2 },
    browseBtn:    { flexDirection: 'row', alignItems: 'center', gap: 5, backgroundColor: C.accentSoft, paddingHorizontal: 14, paddingVertical: 8, borderRadius: 20 },
    browseBtnText:{ fontSize: 13, color: C.accent, fontWeight: '700' },

    filterRow:          { flexDirection: 'row', flexWrap: 'wrap', paddingHorizontal: 16, paddingBottom: 12, gap: 8 },
    filterChip:         { flexDirection: 'row', alignItems: 'center', gap: 5, paddingHorizontal: 12, paddingVertical: 8, borderRadius: 20, backgroundColor: C.bg, borderWidth: 1, borderColor: C.border },
    filterChipActive:   { backgroundColor: C.navy, borderColor: C.navy },
    filterChipText:     { fontSize: 13, color: C.muted, fontWeight: '600' },
    filterChipTextActive:{ color: '#fff' },
    filterCount:        { backgroundColor: C.border, paddingHorizontal: 6, paddingVertical: 1, borderRadius: 10 },
    filterCountActive:  { backgroundColor: 'rgba(255,255,255,0.2)' },
    filterCountText:    { fontSize: 10, fontWeight: '700', color: C.muted },
    filterCountTextActive:{ color: '#fff' },

    list: { padding: 16 },

    appCard: { backgroundColor: C.surface, borderRadius: 18, marginBottom: 12, borderWidth: 1, borderColor: C.border, flexDirection: 'row', overflow: 'hidden', shadowColor: C.navy, shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.05, shadowRadius: 8, elevation: 3 },
    accentBar: { width: 4 },
    appInner:  { flex: 1, padding: 16 },
    appTop:    { flexDirection: 'row', alignItems: 'flex-start', marginBottom: 12 },
    appDevice: { fontSize: 16, fontWeight: '800', color: C.text, marginBottom: 3 },
    appModel:  { fontSize: 12, color: C.muted },

    pillRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 7, marginBottom: 12 },
    pill:    { flexDirection: 'row', alignItems: 'center', gap: 5, backgroundColor: C.bg, paddingHorizontal: 10, paddingVertical: 5, borderRadius: 10, borderWidth: 1, borderColor: C.border },
    pillText:{ fontSize: 11, color: C.muted, fontWeight: '500' },

    appFooter:      { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
    appDate:        { fontSize: 11, color: C.mutedLight },
    appFooterRight: { flexDirection: 'row', alignItems: 'center', gap: 8 },
    cancelBtn:      { flexDirection: 'row', alignItems: 'center', gap: 4, backgroundColor: C.roseSoft, paddingHorizontal: 10, paddingVertical: 5, borderRadius: 10, borderWidth: 1, borderColor: '#FECACA' },
    cancelBtnText:  { fontSize: 11, color: C.rose, fontWeight: '700' },
    viewHint:       { flexDirection: 'row', alignItems: 'center' },
    viewHintText:   { fontSize: 11, color: C.mutedLight },

    rejectionBanner: { flexDirection: 'row', alignItems: 'flex-start', gap: 8, marginTop: 10, padding: 10, backgroundColor: C.roseSoft, borderRadius: 10, borderWidth: 1, borderColor: '#FECACA' },
    rejectionText:   { fontSize: 11, color: '#7F1D1D', flex: 1, lineHeight: 16 },

    empty:      { alignItems: 'center', paddingVertical: 60, paddingHorizontal: 40 },
    emptyIcon:  { width: 72, height: 72, borderRadius: 20, backgroundColor: C.surface, borderWidth: 1, borderColor: C.border, justifyContent: 'center', alignItems: 'center', marginBottom: 20 },
    emptyTitle: { fontSize: 18, fontWeight: '800', color: C.text, marginBottom: 6 },
    emptySub:   { fontSize: 14, color: C.muted, textAlign: 'center', lineHeight: 20, marginBottom: 24 },
    emptyBtn:   { backgroundColor: C.navy, paddingHorizontal: 24, paddingVertical: 13, borderRadius: 14 },
    emptyBtnText:{ color: '#fff', fontWeight: '700', fontSize: 14 },
});