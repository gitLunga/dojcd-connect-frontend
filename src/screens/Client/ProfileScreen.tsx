// screens/Client/ProfileScreen.tsx
// React Native version of the web ProfileScreen.
// Combined screen: shows account info AND the profile completion form.
// Replaces the old CompleteProfileScreen — registered under BOTH
// "CompleteProfile" and "Profile" routes in AppNavigator for backward compat.
// All API logic preserved exactly from web version.

import React, { useState, useEffect } from 'react';
import {
    View, Text, StyleSheet, ScrollView, Pressable,
    ActivityIndicator, Modal, FlatList, TouchableOpacity,
    KeyboardAvoidingView, Platform,
} from 'react-native';
import * as DocumentPicker from 'expo-document-picker';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';
import { RootStackParamList } from '../../navigation/AppNavigator';
import { authAPI } from '../../services/api';
import { useToast } from '../../components/ToastProvider';
import DrawerLayout from '../../components/DrawerLayout';

type NavigationProp = StackNavigationProp<RootStackParamList, 'Profile'>;

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
    amber:      '#D97706',
    amberSoft:  '#FEF3C7',
    rose:       '#DC2626',
    roseSoft:   '#FEE2E2',
};

const PROVIDERS = [
    { value: 'MTN',     label: 'MTN' },
    { value: 'Vodacom', label: 'Vodacom' },
    { value: 'Cell_C',  label: 'Cell C' },
    { value: 'Telkom',  label: 'Telkom' },
    { value: 'Rain',    label: 'Rain' },
];

const DURATIONS = [
    { value: '12', label: '12 Months' },
    { value: '24', label: '24 Months' },
    { value: '36', label: '36 Months' },
];

const DOCS = [
    { id: 'invoice',   key: 'invoice_file',      title: 'Service Invoice',    subtitle: 'Current mobile service invoice', icon: 'receipt-outline',  required: true  },
    { id: 'id',        key: 'id_document',        title: 'ID Document',        subtitle: 'Clear copy of ID or Passport',   icon: 'card-outline',     required: true  },
    { id: 'payslip',   key: 'payslip_document',   title: 'Latest Payslip',     subtitle: 'Most recent payslip',            icon: 'cash-outline',     required: true  },
    { id: 'residence', key: 'residence_document', title: 'Proof of Residence', subtitle: 'Utility bill or bank statement', icon: 'home-outline',     required: false },
] as const;

type DocKey = typeof DOCS[number]['key'];
type IconName = typeof DOCS[number]['icon'];

// ── Picker modal (replaces web <select>) ──────────────────────────────────────
interface PickerModalProps {
    visible:     boolean;
    title:       string;
    options:     { value: string; label: string }[];
    selected:    string;
    onSelect:    (v: string) => void;
    onClose:     () => void;
}

function PickerModal({ visible, title, options, selected, onSelect, onClose }: PickerModalProps) {
    return (
        <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
            <Pressable style={pm.backdrop} onPress={onClose}>
                <View style={pm.sheet}>
                    <View style={pm.handle} />
                    <Text style={pm.title}>{title}</Text>
                    {options.map(opt => (
                        <TouchableOpacity
                            key={opt.value}
                            style={[pm.option, opt.value === selected && pm.optionActive]}
                            onPress={() => { onSelect(opt.value); onClose(); }}
                        >
                            <Text style={[pm.optionText, opt.value === selected && pm.optionTextActive]}>
                                {opt.label}
                            </Text>
                            {opt.value === selected && (
                                <Ionicons name="checkmark" size={18} color={C.accent} />
                            )}
                        </TouchableOpacity>
                    ))}
                    <TouchableOpacity style={pm.cancelBtn} onPress={onClose}>
                        <Text style={pm.cancelText}>Cancel</Text>
                    </TouchableOpacity>
                </View>
            </Pressable>
        </Modal>
    );
}

const pm = StyleSheet.create({
    backdrop:        { flex: 1, backgroundColor: 'rgba(0,0,0,0.4)', justifyContent: 'flex-end' },
    sheet:           { backgroundColor: C.surface, borderTopLeftRadius: 24, borderTopRightRadius: 24, paddingBottom: 32, paddingHorizontal: 20 },
    handle:          { width: 36, height: 4, backgroundColor: C.border, borderRadius: 2, alignSelf: 'center', marginTop: 12, marginBottom: 16 },
    title:           { fontSize: 16, fontWeight: '800', color: C.text, marginBottom: 12 },
    option:          { paddingVertical: 14, paddingHorizontal: 4, borderBottomWidth: 1, borderBottomColor: C.border, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
    optionActive:    { backgroundColor: C.accentSoft, borderRadius: 10, paddingHorizontal: 10 },
    optionText:      { fontSize: 15, color: C.text },
    optionTextActive:{ color: C.accent, fontWeight: '700' },
    cancelBtn:       { marginTop: 12, paddingVertical: 14, alignItems: 'center', backgroundColor: C.bg, borderRadius: 14 },
    cancelText:      { fontSize: 15, fontWeight: '700', color: C.muted },
});

// ── Main screen ───────────────────────────────────────────────────────────────
export default function ProfileScreen() {
    const toast      = useToast();
    const navigation = useNavigation<NavigationProp>();

    const [user,            setUser]            = useState<any>(null);
    const [loading,         setLoading]         = useState(false);
    const [profileDone,     setProfileDone]     = useState(false);
    const [provider,        setProvider]        = useState('');
    const [duration,        setDuration]        = useState('');
    const [files,           setFiles]           = useState<Partial<Record<DocKey, any>>>({});
    const [providerModal,   setProviderModal]   = useState(false);
    const [durationModal,   setDurationModal]   = useState(false);

    useEffect(() => {
        (async () => {
            const ud = await AsyncStorage.getItem('user');
            if (!ud) { navigation.reset({ index: 0, routes: [{ name: 'Login' }] }); return; }
            const u = JSON.parse(ud);
            setUser(u);
            const done = u.registration_status === 'Verified'
                || u.registration_status === 'Profile_Completed'
                || !!(u.network_provider && u.contract_duration_months);
            setProfileDone(done);
            if (u.network_provider)         setProvider(u.network_provider);
            if (u.contract_duration_months) setDuration(String(u.contract_duration_months));
        })();
    }, []);

    // ── File picker ──────────────────────────────────────────────────────────
    const handlePickFile = async (key: DocKey) => {
        try {
            const result = await DocumentPicker.getDocumentAsync({
                type: ['application/pdf', 'image/jpeg', 'image/png'],
                copyToCacheDirectory: true,
            });
            if (result.canceled) return;
            const asset = result.assets[0];
            if (asset.size && asset.size > 10 * 1024 * 1024) {
                toast.error('File Too Large', 'Maximum file size is 10MB.');
                return;
            }
            setFiles(prev => ({ ...prev, [key]: asset }));
            const docLabel = DOCS.find(d => d.key === key)?.title || 'File';
            toast.success(`${docLabel} selected`);
        } catch {
            toast.error('Error', 'Could not open file picker.');
        }
    };

    const removeFile = (key: DocKey) => {
        setFiles(prev => { const n = { ...prev }; delete n[key]; return n; });
    };

    // ── Submit — exactly the same logic as web ProfileScreen.handleSubmit ────
    const handleSubmit = async () => {
        if (!provider) { toast.warning('Missing Field', 'Please select a network provider.'); return; }
        if (!duration) { toast.warning('Missing Field', 'Please select a contract duration.'); return; }
        const requiredDocs = DOCS.filter(d => d.required);
        for (const doc of requiredDocs) {
            if (!files[doc.key]) {
                toast.warning('Missing Document', `${doc.title} is required.`);
                return;
            }
        }

        setLoading(true);
        try {
            const userStr = await AsyncStorage.getItem('user');
            if (!userStr) {
                toast.error('Session Expired', 'Please login again.');
                navigation.reset({ index: 0, routes: [{ name: 'Login' }] });
                return;
            }
            const currentUser = JSON.parse(userStr);

            const endDate = new Date();
            endDate.setMonth(endDate.getMonth() + parseInt(duration, 10));

            const data = {
                network_provider:         provider,
                contract_duration_months: parseInt(duration, 10),
                contract_end_date:        endDate.toISOString().split('T')[0],
                invoice_file:             files.invoice_file        || null,
                id_document:              files.id_document         || null,
                payslip_document:         files.payslip_document    || null,
                residence_document:       files.residence_document  || null,
            };

            const result = await authAPI.completeProfile(currentUser.client_user_id, data);

            if (result.success) {
                const updatedUser = {
                    ...currentUser,
                    registration_status:      'Profile_Completed',
                    network_provider:         provider,
                    contract_duration_months: parseInt(duration, 10),
                    ...(result.data?.user || {}),
                };
                await AsyncStorage.setItem('user', JSON.stringify(updatedUser));
                setUser(updatedUser);
                setProfileDone(true);
                toast.success('Profile Completed!', result.message || 'You can now browse available devices.');
            } else {
                toast.error('Failed', result.message || 'Profile completion failed. Please try again.');
            }
        } catch (err: any) {
            const status = err.response?.status;
            const msg    = err.response?.data?.message;
            if (!err.response)  toast.error('Connection Error', 'Cannot connect to server.');
            else if (status === 409) toast.warning('Already Submitted', msg || 'Profile has already been submitted.');
            else if (status === 422) toast.error('Invalid Data', msg || 'Please check your documents and try again.');
            else toast.error('Failed', msg || err.message || 'Profile completion failed.');
        } finally {
            setLoading(false);
        }
    };

    const avatarInitial = user
        ? (user.first_name?.[0] || user.email?.[0] || 'U').toUpperCase()
        : 'U';

    const statusColor = user?.registration_status === 'Verified'
        ? { bg: C.greenSoft, fg: C.green }
        : { bg: C.amberSoft, fg: C.amber };

    const providerLabel = PROVIDERS.find(p => p.value === provider)?.label || 'Select provider';
    const durationLabel = DURATIONS.find(d => d.value === duration)?.label || 'Select duration';

    return (
        <DrawerLayout>
            <View style={s.root}>
                <KeyboardAvoidingView
                    style={{ flex: 1 }}
                    behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
                >
                    {/* ── Header ──────────────────────────────────────────────── */}
                    <View style={s.header}>
                        <Pressable style={s.backBtn} onPress={() => navigation.goBack()} hitSlop={8}>
                            <Ionicons name="arrow-back" size={20} color={C.text} />
                        </Pressable>
                        <View style={s.headerIcon}>
                            <Ionicons name="person-outline" size={20} color={C.accent} />
                        </View>
                        <View>
                            <Text style={s.headerTitle}>My Profile</Text>
                            <Text style={s.headerSub}>Account information and profile settings</Text>
                        </View>
                    </View>

                    <ScrollView
                        style={{ flex: 1 }}
                        contentContainerStyle={s.body}
                        showsVerticalScrollIndicator={false}
                        keyboardShouldPersistTaps="handled"
                    >
                        {/* ── Account Info Card ───────────────────────────────── */}
                        <Text style={s.sectionTitle}>Account Information</Text>
                        <View style={s.accountCard}>
                            {/* Avatar row */}
                            <View style={s.avatarRow}>
                                <View style={s.avatar}>
                                    <Text style={s.avatarText}>{avatarInitial}</Text>
                                </View>
                                <View style={{ flex: 1 }}>
                                    <Text style={s.accountName}>{user?.first_name} {user?.last_name}</Text>
                                    <Text style={s.accountEmail}>{user?.email}</Text>
                                    <View style={[s.statusBadge, { backgroundColor: statusColor.bg }]}>
                                        <Text style={[s.statusBadgeText, { color: statusColor.fg }]}>
                                            {(user?.registration_status || 'Pending').replace('_', ' ')}
                                        </Text>
                                    </View>
                                </View>
                            </View>

                            {/* Info rows */}
                            {[
                                { label: 'Email Address',    value: user?.email || '—',                              icon: 'mail-outline' },
                                { label: 'User Type',        value: user?.user_type || '—',                          icon: 'person-outline' },
                                { label: 'Account Status',   value: (user?.registration_status || '—').replace('_', ' '), icon: 'shield-checkmark-outline' },
                                { label: 'Network Provider', value: user?.network_provider || 'Not set',             icon: 'phone-portrait-outline' },
                                { label: 'Contract Duration',value: user?.contract_duration_months ? `${user.contract_duration_months} Months` : 'Not set', icon: 'calendar-outline' },
                            ].map((row, i) => (
                                <View key={i} style={[s.infoRow, i === 4 && { borderBottomWidth: 0 }]}>
                                    <Ionicons name={row.icon as any} size={15} color={C.muted} style={s.infoIco} />
                                    <Text style={s.infoLabel}>{row.label}</Text>
                                    <Text style={s.infoVal} numberOfLines={1}>{row.value}</Text>
                                </View>
                            ))}
                        </View>

                        {/* ── Profile Completion Form ──────────────────────────── */}
                        {!profileDone && (
                            <View style={{ marginTop: 24 }}>
                                <View style={s.sectionHeaderRow}>
                                    <Text style={s.sectionTitle}>Complete Your Profile</Text>
                                    <View style={s.requiredBadge}>
                                        <Text style={s.requiredBadgeText}>Required to apply</Text>
                                    </View>
                                </View>

                                {/* Info banner */}
                                <View style={s.infoBanner}>
                                    <Ionicons name="information-circle-outline" size={16} color={C.accent} />
                                    <Text style={s.infoBannerText}>
                                        Upload the required documents and select your preferences below.
                                        Your profile will be reviewed before you can apply for devices.
                                    </Text>
                                </View>

                                <View style={s.formCard}>
                                    {/* Provider picker */}
                                    <Text style={s.fieldLabel}>NETWORK PROVIDER</Text>
                                    <Pressable
                                        style={[s.pickerBtn, provider ? s.pickerBtnFilled : {}]}
                                        onPress={() => setProviderModal(true)}
                                        disabled={loading}
                                    >
                                        <Text style={[s.pickerBtnText, !provider && s.pickerBtnPlaceholder]}>
                                            {providerLabel}
                                        </Text>
                                        <Ionicons name="chevron-down" size={16} color={C.muted} />
                                    </Pressable>

                                    {/* Duration picker */}
                                    <Text style={[s.fieldLabel, { marginTop: 14 }]}>CONTRACT DURATION</Text>
                                    <Pressable
                                        style={[s.pickerBtn, duration ? s.pickerBtnFilled : {}]}
                                        onPress={() => setDurationModal(true)}
                                        disabled={loading}
                                    >
                                        <Text style={[s.pickerBtnText, !duration && s.pickerBtnPlaceholder]}>
                                            {durationLabel}
                                        </Text>
                                        <Ionicons name="chevron-down" size={16} color={C.muted} />
                                    </Pressable>

                                    {/* Documents */}
                                    <Text style={[s.fieldLabel, { marginTop: 20, marginBottom: 12 }]}>DOCUMENTS</Text>
                                    {DOCS.map(doc => {
                                        const hasFile = !!files[doc.key];
                                        return (
                                            <View key={doc.id} style={[s.docCard, hasFile && s.docCardDone]}>
                                                <View style={s.docTop}>
                                                    <View style={[s.docIco, { backgroundColor: hasFile ? C.greenSoft : C.accentSoft }]}>
                                                        <Ionicons
                                                            name={doc.icon as any}
                                                            size={18}
                                                            color={hasFile ? C.green : C.accent}
                                                        />
                                                    </View>
                                                    <View style={{ flex: 1 }}>
                                                        <Text style={s.docTitle}>{doc.title}</Text>
                                                        <Text style={s.docSub}>{doc.subtitle}</Text>
                                                    </View>
                                                    {doc.required && !hasFile && (
                                                        <View style={s.docRequired}>
                                                            <Text style={s.docRequiredText}>Required</Text>
                                                        </View>
                                                    )}
                                                    {hasFile && (
                                                        <Ionicons name="checkmark-circle" size={18} color={C.green} />
                                                    )}
                                                </View>

                                                {hasFile ? (
                                                    <View style={s.docFileRow}>
                                                        <Text style={s.docFileName} numberOfLines={1}>
                                                            📄 {files[doc.key]?.name || 'File selected'}
                                                        </Text>
                                                        <Pressable onPress={() => removeFile(doc.key)} hitSlop={6}>
                                                            <Ionicons name="close" size={16} color={C.rose} />
                                                        </Pressable>
                                                    </View>
                                                ) : (
                                                    <Pressable
                                                        style={({ pressed }) => [s.uploadBtn, pressed && { opacity: 0.8 }]}
                                                        onPress={() => handlePickFile(doc.key)}
                                                        disabled={loading}
                                                    >
                                                        <Ionicons name="cloud-upload-outline" size={15} color={C.accent} />
                                                        <Text style={s.uploadBtnText}>Upload</Text>
                                                    </Pressable>
                                                )}
                                            </View>
                                        );
                                    })}

                                    {/* Submit */}
                                    <Pressable
                                        style={({ pressed }) => [s.submitBtn, (loading || pressed) && s.submitBtnDisabled]}
                                        onPress={handleSubmit}
                                        disabled={loading}
                                    >
                                        {loading ? (
                                            <ActivityIndicator color="#fff" size="small" />
                                        ) : (
                                            <>
                                                <Ionicons name="checkmark-circle" size={18} color="#fff" />
                                                <Text style={s.submitBtnText}>Submit Profile</Text>
                                            </>
                                        )}
                                    </Pressable>
                                </View>
                            </View>
                        )}

                        {/* ── Profile completed state ──────────────────────────── */}
                        {profileDone && (
                            <View style={s.completedCard}>
                                <View style={s.completedIco}>
                                    <Ionicons name="checkmark-circle" size={36} color={C.green} />
                                </View>
                                <Text style={s.completedTitle}>Profile Submitted</Text>
                                <Text style={s.completedSub}>
                                    Your profile has been submitted and is under review. You'll be notified
                                    when your eligibility is confirmed.
                                </Text>
                                <Pressable
                                    style={({ pressed }) => [s.completedBtn, pressed && { opacity: 0.85 }]}
                                    onPress={() => navigation.navigate('DeviceCatalog')}
                                >
                                    <Text style={s.completedBtnText}>Browse Devices</Text>
                                </Pressable>
                            </View>
                        )}
                    </ScrollView>
                </KeyboardAvoidingView>

                {/* Picker modals */}
                <PickerModal
                    visible={providerModal}
                    title="Select Network Provider"
                    options={PROVIDERS}
                    selected={provider}
                    onSelect={setProvider}
                    onClose={() => setProviderModal(false)}
                />
                <PickerModal
                    visible={durationModal}
                    title="Select Contract Duration"
                    options={DURATIONS}
                    selected={duration}
                    onSelect={setDuration}
                    onClose={() => setDurationModal(false)}
                />
            </View>
        </DrawerLayout>
    );
}

const s = StyleSheet.create({
    root: { flex: 1, backgroundColor: C.bg },

    header: {
        backgroundColor: C.surface, borderBottomWidth: 1, borderBottomColor: C.border,
        paddingHorizontal: 16, paddingVertical: 14,
        flexDirection: 'row', alignItems: 'center', gap: 10,
    },
    backBtn:    { width: 36, height: 36, borderRadius: 10, backgroundColor: C.bg, borderWidth: 1, borderColor: C.border, justifyContent: 'center', alignItems: 'center' },
    headerIcon: { width: 40, height: 40, borderRadius: 12, backgroundColor: C.accentSoft, justifyContent: 'center', alignItems: 'center' },
    headerTitle:{ fontSize: 17, fontWeight: '800', color: C.text },
    headerSub:  { fontSize: 11, color: C.muted, marginTop: 1 },

    body: { padding: 16, paddingBottom: 48 },

    sectionTitle:    { fontSize: 15, fontWeight: '800', color: C.text, marginBottom: 12 },
    sectionHeaderRow:{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 },
    requiredBadge:   { backgroundColor: C.amberSoft, paddingHorizontal: 10, paddingVertical: 4, borderRadius: 20 },
    requiredBadgeText:{ fontSize: 11, fontWeight: '700', color: C.amber },

    // Account card
    accountCard: { backgroundColor: C.surface, borderRadius: 16, borderWidth: 1, borderColor: C.border, overflow: 'hidden' },
    avatarRow:   { flexDirection: 'row', alignItems: 'center', gap: 14, padding: 18, borderBottomWidth: 1, borderBottomColor: C.border },
    avatar:      { width: 56, height: 56, borderRadius: 16, backgroundColor: C.accent, justifyContent: 'center', alignItems: 'center' },
    avatarText:  { fontSize: 22, fontWeight: '900', color: '#fff' },
    accountName: { fontSize: 16, fontWeight: '800', color: C.text, marginBottom: 2 },
    accountEmail:{ fontSize: 13, color: C.muted, marginBottom: 6 },
    statusBadge: { alignSelf: 'flex-start', paddingHorizontal: 10, paddingVertical: 3, borderRadius: 20 },
    statusBadgeText: { fontSize: 11, fontWeight: '700' },
    infoRow:     { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 16, paddingVertical: 12, borderBottomWidth: 1, borderBottomColor: C.border },
    infoIco:     { marginRight: 10 },
    infoLabel:   { fontSize: 13, color: C.muted, width: 140, flexShrink: 0 },
    infoVal:     { fontSize: 13, fontWeight: '600', color: C.text, flex: 1 },

    infoBanner:    { flexDirection: 'row', alignItems: 'flex-start', gap: 10, backgroundColor: C.accentSoft, borderWidth: 1, borderColor: `${C.accent}30`, borderRadius: 12, padding: 12, marginBottom: 14 },
    infoBannerText:{ fontSize: 13, color: '#1E3A8A', lineHeight: 20, flex: 1 },

    formCard: { backgroundColor: C.surface, borderRadius: 16, borderWidth: 1, borderColor: C.border, padding: 18 },

    fieldLabel:            { fontSize: 10, fontWeight: '700', color: C.muted, letterSpacing: 0.8, marginBottom: 8 },
    pickerBtn:             { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', backgroundColor: C.bg, borderWidth: 1.5, borderColor: C.border, borderRadius: 12, paddingHorizontal: 14, paddingVertical: 13 },
    pickerBtnFilled:       { borderColor: C.accent, backgroundColor: '#FAFBFF' },
    pickerBtnText:         { fontSize: 14, color: C.text, fontWeight: '500' },
    pickerBtnPlaceholder:  { color: C.mutedLight },

    docCard:     { backgroundColor: C.bg, borderRadius: 12, padding: 14, borderWidth: 1.5, borderColor: C.border, marginBottom: 10 },
    docCardDone: { borderColor: `${C.green}60`, backgroundColor: `${C.greenSoft}80` },
    docTop:      { flexDirection: 'row', alignItems: 'flex-start', gap: 10, marginBottom: 10 },
    docIco:      { width: 36, height: 36, borderRadius: 10, justifyContent: 'center', alignItems: 'center', flexShrink: 0 },
    docTitle:    { fontSize: 13, fontWeight: '700', color: C.text, marginBottom: 2 },
    docSub:      { fontSize: 11, color: C.muted },
    docRequired: { backgroundColor: C.amberSoft, paddingHorizontal: 7, paddingVertical: 2, borderRadius: 10, flexShrink: 0 },
    docRequiredText: { fontSize: 10, fontWeight: '700', color: C.amber },
    docFileRow:  { flexDirection: 'row', alignItems: 'center', gap: 8, backgroundColor: C.surface, borderRadius: 8, paddingHorizontal: 10, paddingVertical: 8, borderWidth: 1, borderColor: C.border },
    docFileName: { fontSize: 12, color: C.text, flex: 1 },
    uploadBtn:   { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6, paddingVertical: 10, backgroundColor: C.accentSoft, borderWidth: 1, borderColor: `${C.accent}40`, borderRadius: 9 },
    uploadBtnText:{ fontSize: 13, fontWeight: '700', color: C.accent },

    submitBtn:        { flexDirection: 'row', justifyContent: 'center', alignItems: 'center', gap: 10, backgroundColor: C.navy, paddingVertical: 14, borderRadius: 12, marginTop: 20, shadowColor: C.navy, shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.25, shadowRadius: 10, elevation: 6 },
    submitBtnDisabled:{ opacity: 0.6 },
    submitBtnText:    { fontSize: 15, fontWeight: '700', color: '#fff' },

    completedCard: { backgroundColor: C.surface, borderRadius: 16, borderWidth: 1, borderColor: C.border, padding: 36, alignItems: 'center', marginTop: 24 },
    completedIco:  { width: 68, height: 68, borderRadius: 20, backgroundColor: C.greenSoft, justifyContent: 'center', alignItems: 'center', marginBottom: 18 },
    completedTitle:{ fontSize: 18, fontWeight: '800', color: C.text, marginBottom: 8 },
    completedSub:  { fontSize: 14, color: C.muted, textAlign: 'center', lineHeight: 22, marginBottom: 20, maxWidth: 340 },
    completedBtn:  { backgroundColor: C.navy, paddingHorizontal: 28, paddingVertical: 13, borderRadius: 12 },
    completedBtnText: { color: '#fff', fontWeight: '700', fontSize: 14 },
});