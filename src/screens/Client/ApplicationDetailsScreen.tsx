import React, {useState, useEffect} from 'react';
import {
    View, Text, StyleSheet, ScrollView,
    ActivityIndicator, Alert, TouchableOpacity
} from 'react-native';
import {Ionicons} from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import {deviceAPI} from '../../services/api';
import {StackNavigationProp} from '@react-navigation/stack';
import {RootStackParamList} from '../../navigation/AppNavigator';
import {RouteProp, useNavigation, useRoute} from '@react-navigation/native';
import {useToast} from '../../components/ToastProvider';

type NavigationProp = StackNavigationProp<RootStackParamList, 'ApplicationDetails'>;
type RouteProps = RouteProp<RootStackParamList, 'ApplicationDetails'>;

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
    Approved: {bg: C.greenSoft, fg: C.green, dot: C.green, icon: 'checkmark-circle' as const, label: 'Approved'},
    Pending: {bg: C.amberSoft, fg: C.amber, dot: C.amber, icon: 'time' as const, label: 'Under Review'},
    Rejected: {bg: C.roseSoft, fg: C.rose, dot: C.rose, icon: 'close-circle' as const, label: 'Rejected'},
    Cancelled: {bg: C.slateSoft, fg: C.slate, dot: C.slate, icon: 'close-circle' as const, label: 'Cancelled'},
};

interface ApplicationDetails {
    application_id: number;
    client_user_id: number;
    device_id: number;
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
    first_name: string;
    last_name: string;
    email: string;
    phone_number?: string;
    region?: string;
    persal_id?: string;
}

function DetailRow({icon, label, value}: { icon: string; label: string; value: string }) {
    return (
        <View style={r.row}>
            <View style={r.iconWrap}><Ionicons name={icon as any} size={16} color={C.muted}/></View>
            <Text style={r.label}>{label}</Text>
            <Text style={r.value}>{value}</Text>
        </View>
    );
}

const r = StyleSheet.create({
    row: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingVertical: 12,
        borderBottomWidth: 1,
        borderBottomColor: C.border
    },
    iconWrap: {width: 28, marginRight: 10},
    label: {width: 110, fontSize: 13, color: C.muted},
    value: {flex: 1, fontSize: 13, fontWeight: '600', color: C.text},
});

export default function ApplicationDetailsScreen() {
    const toast = useToast();
    const navigation = useNavigation<NavigationProp>();
    const route = useRoute<RouteProps>();
    const {applicationId} = route.params;

    const [application, setApplication] = useState<ApplicationDetails | null>(null);
    const [loading, setLoading] = useState(true);
    const [cancelling, setCancelling] = useState(false);
    const [user, setUser] = useState<any>(null);

    useEffect(() => {
        load();
    }, [applicationId]);

    const load = async () => {
        try {
            const ud = await AsyncStorage.getItem('user');
            if (ud) {
                const u = JSON.parse(ud);
                setUser(u);
                const r = await deviceAPI.getApplicationDetails(u.client_user_id, applicationId);
                setApplication(r.data.data);
            }
        } catch {
            toast.error('Failed to Load', 'Could not load application details.');
        } finally {
            setLoading(false);
        }
    };

    const handleCancel = () => {
        if (!user?.client_user_id || !application) return;
        Alert.alert('Cancel Application', 'Are you sure? This cannot be undone.', [
            {text: 'No', style: 'cancel'},
            {
                text: 'Yes, Cancel', style: 'destructive', onPress: async () => {
                    setCancelling(true);
                    try {
                        const res = await deviceAPI.cancelApplication(user.client_user_id, application.application_id);
                        if (res.data.success) {
                            toast.success('Cancelled', res.data.message || 'Your application has been cancelled.');
                            setTimeout(() => navigation.goBack(), 1200);
                        } else {
                            toast.error('Failed', res.data.message);
                        }
                    } catch (error: any) {
                        const s = error.response?.status;
                        const m = error.response?.data?.message;
                        if (s === 409) toast.warning('Already Finalised', m || 'This application cannot be cancelled.');
                        else toast.error('Failed', m || error.message);
                    } finally {
                        setCancelling(false);
                    }
                }
            },
        ]);
    };

    const fmtDate = (d: string) => new Date(d).toLocaleDateString('en-ZA', {
        day: 'numeric',
        month: 'long',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
    });
    const fmtDateShort = (d: string) => new Date(d).toLocaleDateString('en-ZA', {
        day: 'numeric',
        month: 'short',
        year: 'numeric'
    });

    if (loading) {
        return (
            <View style={s.loadingScreen}>
                <ActivityIndicator size="large" color={C.accent}/>
                <Text style={s.loadingText}>Loading details…</Text>
            </View>
        );
    }

    if (!application) {
        return (
            <View style={s.errorScreen}>
                <View style={s.errorIcon}><Ionicons name="alert-circle-outline" size={40} color={C.rose}/></View>
                <Text style={s.errorTitle}>Not Found</Text>
                <Text style={s.errorSub}>This application could not be found.</Text>
                <TouchableOpacity style={s.backBtn} onPress={() => navigation.goBack()}>
                    <Text style={s.backBtnText}>Go Back</Text>
                </TouchableOpacity>
            </View>
        );
    }

    const meta = STATUS_META[application.application_status as keyof typeof STATUS_META];

    return (
        <View style={s.root}>
            {/* ── Nav bar ─────────────────────────────────────────────── */}
            <View style={s.navbar}>
                <TouchableOpacity style={s.navBack} onPress={() => navigation.goBack()}>
                    <Ionicons name="arrow-back" size={22} color={C.text}/>
                </TouchableOpacity>
                <Text style={s.navTitle}>Application #{application.application_id}</Text>
                <View style={{width: 40}}/>
            </View>

            <ScrollView style={s.scroll} showsVerticalScrollIndicator={false}>

                {/* ── Status hero ──────────────────────────────────────── */}
                <View style={[s.statusHero, {backgroundColor: meta?.bg || C.slateSoft}]}>
                    <View style={[s.statusIcoWrap, {backgroundColor: meta?.dot + '25' || C.border}]}>
                        <Ionicons name={meta?.icon || 'help-circle'} size={36} color={meta?.dot || C.muted}/>
                    </View>
                    <Text
                        style={[s.statusLabel, {color: meta?.fg || C.muted}]}>{meta?.label || application.application_status}</Text>
                    <Text style={s.statusDate}>Last updated {fmtDateShort(application.last_updated)}</Text>
                    {application.application_status === 'Pending' && (
                        <TouchableOpacity
                            style={[s.cancelBtn, cancelling && {opacity: 0.6}]}
                            onPress={handleCancel}
                            disabled={cancelling}
                        >
                            {cancelling
                                ? <ActivityIndicator size="small" color={C.rose}/>
                                : <><Ionicons name="close-circle-outline" size={17} color={C.rose}/><Text
                                    style={s.cancelBtnText}>{cancelling ? 'Cancelling…' : 'Cancel Application'}</Text></>
                            }
                        </TouchableOpacity>
                    )}
                </View>

                {/* ── Device section ───────────────────────────────────── */}
                <View style={s.section}>
                    <Text style={s.sectionTitle}>Device</Text>
                    <View style={s.deviceCard}>
                        <View style={s.deviceCardTop}>
                            <View style={{flex: 1}}>
                                <Text style={s.deviceName}>{application.device_name}</Text>
                                <Text style={s.deviceModel}>{application.model} · {application.manufacturer}</Text>
                            </View>
                            <View style={s.pricePill}>
                                <Text style={s.priceValue}>R{application.monthly_cost}</Text>
                                <Text style={s.priceLabel}>/mo</Text>
                            </View>
                        </View>
                        <View style={s.planRow}>
                            <View style={s.planPill}><Text style={s.planPillText}>{application.plan_name}</Text></View>
                            <View style={s.planPill}><Ionicons name="calendar-outline" size={12} color={C.muted}/><Text
                                style={s.planPillText}>{application.contract_duration_months} months</Text></View>
                        </View>
                        <Text style={s.planDetail}>{application.plan_details}</Text>
                    </View>
                </View>

                {/* ── Applicant section ────────────────────────────────── */}
                <View style={s.section}>
                    <Text style={s.sectionTitle}>Applicant</Text>
                    <View style={s.infoCard}>
                        <DetailRow icon="person-outline" label="Full Name"
                                   value={`${application.first_name} ${application.last_name}`}/>
                        <DetailRow icon="mail-outline" label="Email" value={application.email}/>
                        {application.phone_number &&
                            <DetailRow icon="call-outline" label="Phone" value={application.phone_number}/>}
                        {application.region &&
                            <DetailRow icon="location-outline" label="Region" value={application.region}/>}
                        {application.persal_id &&
                            <DetailRow icon="card-outline" label="Personal ID" value={application.persal_id}/>}
                    </View>
                </View>

                {/* ── Rejection reason ─────────────────────────────────── */}
                {application.rejection_reason && (
                    <View style={s.section}>
                        <Text style={s.sectionTitle}>Rejection Reason</Text>
                        <View style={s.rejectionCard}>
                            <Ionicons name="alert-circle-outline" size={20} color={C.rose}/>
                            <Text style={s.rejectionText}>{application.rejection_reason}</Text>
                        </View>
                    </View>
                )}

                {/* ── Timeline ────────────────────────────────────────── */}
                <View style={[s.section, {marginBottom: 40}]}>
                    <Text style={s.sectionTitle}>Timeline</Text>
                    <View style={s.timeline}>
                        {[
                            {label: 'Application Submitted', date: application.submission_date, done: true},
                            {
                                label: 'Under Review',
                                date: application.last_updated,
                                done: application.application_status !== 'Pending'
                            },
                            ...(application.application_status === 'Approved' || application.application_status === 'Rejected'
                                ? [{
                                    label: application.application_status === 'Approved' ? 'Approved' : 'Rejected',
                                    date: application.last_updated,
                                    done: true
                                }]
                                : []),
                        ].map((step, i, arr) => (
                            <View key={i} style={s.timelineItem}>
                                <View style={s.timelineLeft}>
                                    <View
                                        style={[s.timelineDot, step.done ? s.timelineDotDone : s.timelineDotPending]}/>
                                    {i < arr.length - 1 &&
                                        <View style={[s.timelineLine, step.done && s.timelineLineDone]}/>}
                                </View>
                                <View style={s.timelineRight}>
                                    <Text style={[s.timelineLabel, !step.done && {color: C.muted}]}>{step.label}</Text>
                                    <Text
                                        style={s.timelineDate}>{step.done ? fmtDate(step.date) : 'In progress…'}</Text>
                                </View>
                            </View>
                        ))}
                    </View>
                </View>

            </ScrollView>
        </View>
    );
}

const s = StyleSheet.create({
    root: {flex: 1, backgroundColor: C.bg},
    loadingScreen: {flex: 1, backgroundColor: C.bg, justifyContent: 'center', alignItems: 'center'},
    loadingText: {marginTop: 14, fontSize: 15, color: C.muted, fontWeight: '500'},
    errorScreen: {flex: 1, backgroundColor: C.bg, justifyContent: 'center', alignItems: 'center', padding: 40},
    errorIcon: {
        width: 72,
        height: 72,
        borderRadius: 20,
        backgroundColor: C.roseSoft,
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: 16
    },
    errorTitle: {fontSize: 22, fontWeight: '800', color: C.text, marginBottom: 6},
    errorSub: {fontSize: 14, color: C.muted, textAlign: 'center', marginBottom: 28},
    backBtn: {backgroundColor: C.navy, paddingHorizontal: 24, paddingVertical: 12, borderRadius: 14},
    backBtnText: {color: '#fff', fontWeight: '700', fontSize: 14},

    navbar: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        backgroundColor: C.surface,
        paddingHorizontal: 16,
        paddingVertical: 14,
        borderBottomWidth: 1,
        borderBottomColor: C.border
    },
    navBack: {
        width: 40,
        height: 40,
        borderRadius: 12,
        backgroundColor: C.bg,
        justifyContent: 'center',
        alignItems: 'center'
    },
    navTitle: {fontSize: 16, fontWeight: '700', color: C.text},

    scroll: {flex: 1},

    statusHero: {margin: 16, borderRadius: 20, padding: 24, alignItems: 'center'},
    statusIcoWrap: {
        width: 72,
        height: 72,
        borderRadius: 20,
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: 12
    },
    statusLabel: {fontSize: 22, fontWeight: '800', marginBottom: 4},
    statusDate: {fontSize: 13, color: C.muted, marginBottom: 16},
    cancelBtn: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
        backgroundColor: C.surface,
        paddingHorizontal: 18,
        paddingVertical: 11,
        borderRadius: 14,
        borderWidth: 1,
        borderColor: '#FECACA'
    },
    cancelBtnText: {color: C.rose, fontSize: 14, fontWeight: '700'},

    section: {paddingHorizontal: 16, marginBottom: 8},
    sectionTitle: {
        fontSize: 13,
        fontWeight: '700',
        color: C.muted,
        letterSpacing: 1,
        marginBottom: 10,
        textTransform: 'uppercase'
    },

    deviceCard: {backgroundColor: C.surface, borderRadius: 18, padding: 18, borderWidth: 1, borderColor: C.border},
    deviceCardTop: {flexDirection: 'row', alignItems: 'flex-start', marginBottom: 12},
    deviceName: {fontSize: 18, fontWeight: '800', color: C.text, marginBottom: 4},
    deviceModel: {fontSize: 13, color: C.muted},
    pricePill: {
        backgroundColor: C.greenSoft,
        paddingHorizontal: 12,
        paddingVertical: 6,
        borderRadius: 12,
        alignItems: 'center'
    },
    priceValue: {fontSize: 18, fontWeight: '800', color: C.green},
    priceLabel: {fontSize: 10, color: C.green, fontWeight: '600'},
    planRow: {flexDirection: 'row', gap: 8, marginBottom: 10},
    planPill: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 5,
        backgroundColor: C.bg,
        paddingHorizontal: 10,
        paddingVertical: 5,
        borderRadius: 10,
        borderWidth: 1,
        borderColor: C.border
    },
    planPillText: {fontSize: 12, color: C.muted, fontWeight: '500'},
    planDetail: {fontSize: 13, color: C.muted, lineHeight: 20},

    infoCard: {
        backgroundColor: C.surface,
        borderRadius: 16,
        paddingHorizontal: 16,
        borderWidth: 1,
        borderColor: C.border
    },

    rejectionCard: {
        flexDirection: 'row',
        alignItems: 'flex-start',
        gap: 12,
        backgroundColor: C.roseSoft,
        borderRadius: 16,
        padding: 16,
        borderWidth: 1,
        borderColor: '#FECACA'
    },
    rejectionText: {flex: 1, fontSize: 14, color: '#7F1D1D', lineHeight: 21},

    timeline: {backgroundColor: C.surface, borderRadius: 16, padding: 20, borderWidth: 1, borderColor: C.border},
    timelineItem: {flexDirection: 'row', marginBottom: 8},
    timelineLeft: {alignItems: 'center', width: 24, marginRight: 14},
    timelineDot: {width: 14, height: 14, borderRadius: 7, borderWidth: 2},
    timelineDotDone: {backgroundColor: C.green, borderColor: C.green},
    timelineDotPending: {backgroundColor: C.surface, borderColor: C.mutedLight},
    timelineLine: {width: 2, flex: 1, backgroundColor: C.border, marginVertical: 4},
    timelineLineDone: {backgroundColor: C.green},
    timelineRight: {flex: 1, paddingBottom: 20},
    timelineLabel: {fontSize: 14, fontWeight: '700', color: C.text, marginBottom: 3},
    timelineDate: {fontSize: 12, color: C.muted},
});