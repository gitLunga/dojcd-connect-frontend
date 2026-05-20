import React, {useEffect, useState, useRef} from 'react';
import {
    View, Text, StyleSheet, TouchableOpacity, ScrollView,
    Alert, Modal, RefreshControl, ActivityIndicator, FlatList, Animated
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import {StackNavigationProp} from '@react-navigation/stack';
import {RootStackParamList} from '../../navigation/AppNavigator';
import {useNavigation, useFocusEffect} from '@react-navigation/native';
import {Ionicons} from '@expo/vector-icons';
import {deviceAPI, notificationAPI} from '../../services/api';
import {useToast} from '../../components/ToastProvider';

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
    Approved: {bg: C.greenSoft, text: C.green, dot: C.green, icon: 'checkmark-circle'},
    Pending: {bg: C.amberSoft, text: C.amber, dot: C.amber, icon: 'time'},
    Rejected: {bg: C.roseSoft, text: C.rose, dot: C.rose, icon: 'close-circle'},
    Cancelled: {bg: C.slateSoft, text: C.slate, dot: C.slate, icon: 'close-circle'},
} as const;

function StatusChip({status}: { status: string }) {
    const m = STATUS[status as keyof typeof STATUS] || {bg: C.slateSoft, text: C.slate, dot: C.slate};
    return (
        <View style={[chip.wrap, {backgroundColor: m.bg}]}>
            <View style={[chip.dot, {backgroundColor: m.dot}]}/>
            <Text style={[chip.text, {color: m.text}]}>{status}</Text>
        </View>
    );
}

const chip = StyleSheet.create({
    wrap: {flexDirection: 'row', alignItems: 'center', paddingHorizontal: 10, paddingVertical: 5, borderRadius: 20},
    dot: {width: 5, height: 5, borderRadius: 3, marginRight: 5},
    text: {fontSize: 11, fontWeight: '700'},
});

interface Notification {
    notification_id: number;
    title: string;
    message: string;
    is_read: boolean;
    created_at: string;
}

interface Device {
    device_id: number;
    device_name: string;
    model: string;
    manufacturer: string;
    plan_name: string;
    plan_details: string;
    monthly_cost: number;
    contract_duration_months: number;
    status: string;
}

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

interface Summary {
    total_applications: number;
    pending: number;
    approved: number;
    rejected: number;
    cancelled: number;
}

export default function ClientDashboard() {
    const toast = useToast();
    const navigation = useNavigation<NavigationProp>();

    const [user, setUser] = useState<any>(null);
    const [hasProfile, setHasProfile] = useState(false);
    const [refreshing, setRefreshing] = useState(false);
    const [loading, setLoading] = useState(true);
    const [devices, setDevices] = useState<Device[]>([]);
    const [applications, setApplications] = useState<Application[]>([]);
    const [summary, setSummary] = useState<Summary | null>(null);
    const [isEligible, setIsEligible] = useState(false);
    const [eligibilityLoading, setEligibilityLoading] = useState(false);
    const [showDevicesModal, setShowDevicesModal] = useState(false);
    const [showApplicationsModal, setShowApplicationsModal] = useState(false);
    const [notifications, setNotifications] = useState<Notification[]>([]);
    const [unreadCount, setUnreadCount] = useState(0);
    const [showNotificationsModal, setShowNotificationsModal] = useState(false);
    const [notificationsLoading, setNotificationsLoading] = useState(false);
    const bellScale = useRef(new Animated.Value(1)).current;
    const dotOpacity = useRef(new Animated.Value(0)).current;

    useFocusEffect(React.useCallback(() => {
        if (user?.client_user_id) {
            loadNotifications();
            loadUnreadCount();
        }
    }, [user]));

    useEffect(() => {
        loadUser();
    }, []);

    const loadUser = async () => {
        try {
            const ud = await AsyncStorage.getItem('user');
            if (ud) {
                const u = JSON.parse(ud);
                setUser(u);
                checkProfile(u);
                if (u.registration_status === 'Verified') {
                    await Promise.all([checkEligibility(u.client_user_id), loadApplications(u.client_user_id), loadSummary(u.client_user_id), loadNotificationsForUser(u.client_user_id), loadUnreadCountForUser(u.client_user_id)]);
                }
            }
        } catch (e) {
            console.error(e);
        } finally {
            setLoading(false);
        }
    };

    const loadNotificationsForUser = async (id: number) => {
        try {
            setNotificationsLoading(true);
            const r = await notificationAPI.getUserNotifications(id, 'Client');
            if (r.data.success) setNotifications(r.data.data);
        } catch {
        } finally {
            setNotificationsLoading(false);
        }
    };
    const loadNotifications = () => user?.client_user_id && loadNotificationsForUser(user.client_user_id);

    const loadUnreadCountForUser = async (id: number) => {
        try {
            const r = await notificationAPI.getUnreadCount(id, 'Client');
            if (r.data.success) {
                const c = r.data.unreadCount || 0;
                setUnreadCount(c);
                if (c > 0) Animated.timing(dotOpacity, {toValue: 1, duration: 300, useNativeDriver: true}).start();
            }
        } catch {
        }
    };
    const loadUnreadCount = () => user?.client_user_id && loadUnreadCountForUser(user.client_user_id);

    const handleMarkAllAsRead = async () => {
        if (!user?.client_user_id) return;
        try {
            const r = await notificationAPI.markAllAsRead(user.client_user_id, 'Client');
            if (r.data.success) {
                setNotifications(prev => prev.map(n => ({...n, is_read: true})));
                setUnreadCount(0);
                Animated.timing(dotOpacity, {toValue: 0, duration: 300, useNativeDriver: true}).start();
                toast.success('All notifications marked as read');
            }
        } catch {
            toast.error('Error', 'Failed to mark notifications as read.');
        }
    };

    const handleMarkAsRead = async (id: number) => {
        try {
            const r = await notificationAPI.markAsRead(id, user.client_user_id, 'Client');
            if (r.data.success) {
                setNotifications(prev => prev.map(n => n.notification_id === id ? {...n, is_read: true} : n));
                setUnreadCount(prev => Math.max(0, prev - 1));
            }
        } catch {
        }
    };

    const handleDeleteNotification = (nid: number) => {
        if (!user?.client_user_id) return;
        Alert.alert('Delete Notification', 'Are you sure?', [
            {text: 'Cancel', style: 'cancel'},
            {
                text: 'Delete', style: 'destructive', onPress: async () => {
                    try {
                        const r = await notificationAPI.deleteNotification(nid, user.client_user_id, 'Client');
                        if (r.data.success) {
                            const d = notifications.find(n => n.notification_id === nid);
                            setNotifications(prev => prev.filter(n => n.notification_id !== nid));
                            if (d && !d.is_read) setUnreadCount(prev => Math.max(0, prev - 1));
                            toast.success('Notification deleted');
                        }
                    } catch {
                        toast.error('Error', 'Failed to delete notification.');
                    }
                }
            },
        ]);
    };

    const animateBell = () => {
        Animated.sequence([
            Animated.timing(bellScale, {toValue: 1.25, duration: 100, useNativeDriver: true}),
            Animated.timing(bellScale, {toValue: 1, duration: 100, useNativeDriver: true}),
        ]).start();
        setShowNotificationsModal(true);
    };

    const checkEligibility = async (id: number) => {
        try {
            setEligibilityLoading(true);
            const r = await deviceAPI.checkEligibility(id);
            console.log('✅ Eligibility response:', r.data); // Add debug log
            // The eligibility object is in r.data.data.eligibility
            setIsEligible(r.data.data.eligibility?.eligible || false);
            if (r.data.data.eligibility?.eligible) await loadDevices();
        } catch (error) {
            console.error('Error checking eligibility:', error);
            setIsEligible(false);
        } finally {
            setEligibilityLoading(false);
        }
    };

    const loadDevices = async () => {
        try {
            const r = await deviceAPI.getAvailableDevices();
            setDevices(r.data.data.devices || []);
        } catch(error) {
            console.error('Error loading devices:', error);
            setDevices([]);
        }
    };
    const loadApplications = async (id: number) => {
        try {
            const r = await deviceAPI.getUserApplications(id);
            setApplications(r.data.data.applications || []);
        } catch (error){
            console.error('Error loading applications:', error);
            setApplications([]);
        }
    };
    const loadSummary = async (id: number) => {
        try {
            const r = await deviceAPI.getApplicationSummary(id);
            setSummary(r.data.data.summary || null);
        } catch (error){
            console.error('Error loading summary:', error);
            setSummary(null);
        }
    };
    const checkProfile = (u: any) => {
        const s = u.registration_status || '';
        setHasProfile(s === 'Verified' || s === 'Profile_Completed' || !!(u.network_provider && u.contract_duration_months));
    };
    const onRefresh = async () => {
        setRefreshing(true);
        await loadUser();
        setRefreshing(false);
    };

    const handleApplyForDevice = (deviceId: number) => {
        if (!user?.client_user_id) {
            toast.error('Error', 'User not found.');
            return;
        }
        Alert.alert('Confirm Application', 'Apply for this device?', [
            {text: 'Cancel', style: 'cancel'},
            {
                text: 'Apply', onPress: async () => {
                    try {
                        const r = await deviceAPI.submitApplication(user.client_user_id, deviceId);
                        if (r.data.success) {
                            toast.success('Application Submitted!', r.data.message || 'Your application is now pending review.');
                            setShowDevicesModal(false);
                            await loadApplications(user.client_user_id);
                            await loadSummary(user.client_user_id);
                        } else {
                            toast.error('Submission Failed', r.data.message);
                        }
                    } catch (error: any) {
                        const s = error.response?.status;
                        const m = error.response?.data?.message;
                        if (s === 409) toast.warning('Already Applied', m || 'You already have an active application for this device.');
                        else if (s === 422) toast.error('Not Eligible', m || 'You are not currently eligible to apply.');
                        else toast.error('Submission Failed', m || error.message || 'Failed to submit application.');
                    }
                }
            },
        ]);
    };

    const handleCancelApplication = (applicationId: number) => {
        if (!user?.client_user_id) {
            toast.error('Error', 'User not found.');
            return;
        }
        Alert.alert('Cancel Application', 'Are you sure? This cannot be undone.', [
            {text: 'No', style: 'cancel'},
            {
                text: 'Yes, Cancel', style: 'destructive', onPress: async () => {
                    try {
                        const r = await deviceAPI.cancelApplication(user.client_user_id, applicationId);
                        if (r.data.success) {
                            toast.success('Application Cancelled', r.data.message);
                            await loadApplications(user.client_user_id);
                            await loadSummary(user.client_user_id);
                        } else {
                            toast.error('Cancel Failed', r.data.message);
                        }
                    } catch (error: any) {
                        const s = error.response?.status;
                        const m = error.response?.data?.message;
                        if (s === 409) toast.warning('Already Finalised', m || 'This application cannot be cancelled.');
                        else toast.error('Cancel Failed', m || error.message || 'Failed to cancel application.');
                    }
                }
            },
        ]);
    };

    const handleLogout = () => {
        Alert.alert('Confirm Logout', 'Are you sure you want to sign out?', [
            {text: 'Cancel', style: 'cancel'},
            {
                text: 'Sign Out', style: 'destructive', onPress: async () => {
                    try {
                        await AsyncStorage.removeItem('user');
                        await AsyncStorage.removeItem('profile_skipped');
                        navigation.reset({index: 0, routes: [{name: 'Login'}]});
                    } catch {
                        toast.error('Error', 'Failed to sign out. Please try again.');
                    }
                }
            },
        ]);
    };

    const formatTime = (d: string) => {
        const diff = Date.now() - new Date(d).getTime();
        const m = Math.floor(diff / 60000);
        const h = Math.floor(diff / 3600000);
        const dy = Math.floor(diff / 86400000);
        if (m < 60) return `${m}m ago`;
        if (h < 24) return `${h}h ago`;
        if (dy < 7) return `${dy}d ago`;
        return new Date(d).toLocaleDateString();
    };

    // ── Stat cards data ───────────────────────────────────────────────────────
    const stats = [
        {
            label: 'Total',
            value: summary?.total_applications || 0,
            icon: 'document-text-outline',
            color: C.accent,
            bg: C.accentSoft
        },
        {label: 'Pending', value: summary?.pending || 0, icon: 'time-outline', color: C.amber, bg: C.amberSoft},
        {
            label: 'Approved',
            value: summary?.approved || 0,
            icon: 'checkmark-circle-outline',
            color: C.green,
            bg: C.greenSoft
        },
        {label: 'Rejected', value: summary?.rejected || 0, icon: 'close-circle-outline', color: C.rose, bg: C.roseSoft},
    ];

    // ── Render helpers ────────────────────────────────────────────────────────
    const renderNotification = ({item}: { item: Notification }) => (
        <TouchableOpacity style={[d.notifCard, !item.is_read && d.notifUnread]}
                          onPress={() => handleMarkAsRead(item.notification_id)} activeOpacity={0.75}>
            <View style={d.notifHeader}>
                <View style={d.notifLeft}>
                    <View style={[d.notifIconWrap, {backgroundColor: item.is_read ? C.slateSoft : C.accentSoft}]}>
                        <Ionicons name="notifications-outline" size={16} color={item.is_read ? C.muted : C.accent}/>
                    </View>
                    <View style={{flex: 1}}>
                        <Text style={d.notifTitle} numberOfLines={1}>{item.title}</Text>
                        <Text style={d.notifTime}>{formatTime(item.created_at)}</Text>
                    </View>
                </View>
                <TouchableOpacity onPress={() => handleDeleteNotification(item.notification_id)} hitSlop={10}>
                    <Ionicons name="close-outline" size={18} color={C.mutedLight}/>
                </TouchableOpacity>
            </View>
            <Text style={d.notifMsg} numberOfLines={3}>{item.message}</Text>
            {!item.is_read && <View style={d.unreadPill}><Text style={d.unreadPillText}>New</Text></View>}
        </TouchableOpacity>
    );

    const renderDevice = ({item}: { item: Device }) => (
        <View style={d.deviceCard}>
            <View style={d.deviceCardTop}>
                <View style={{flex: 1}}>
                    <Text style={d.deviceCardName}>{item.device_name}</Text>
                    <Text style={d.deviceCardModel}>{item.model} · {item.manufacturer}</Text>
                </View>
                <View style={d.devicePricePill}>
                    <Text style={d.devicePrice}>R{item.monthly_cost}</Text>
                    <Text style={d.devicePriceLabel}>/mo</Text>
                </View>
            </View>
            <Text style={d.devicePlan}>{item.plan_name}</Text>
            <Text style={d.devicePlanDetail} numberOfLines={2}>{item.plan_details}</Text>
            <View style={d.deviceCardFooter}>
                <View style={d.deviceContractPill}>
                    <Ionicons name="calendar-outline" size={13} color={C.muted}/>
                    <Text style={d.deviceContractText}>{item.contract_duration_months} months</Text>
                </View>
                <TouchableOpacity style={d.applyBtn} onPress={() => handleApplyForDevice(item.device_id)}>
                    <Text style={d.applyBtnText}>Apply Now</Text>
                    <Ionicons name="arrow-forward" size={14} color="#fff"/>
                </TouchableOpacity>
            </View>
        </View>
    );

    const renderApplication = ({item}: { item: Application }) => (
        <View style={d.appCard}>
            <View style={d.appCardHeader}>
                <View style={{flex: 1}}>
                    <Text style={d.appDeviceName}>{item.device_name}</Text>
                    <Text style={d.appDeviceModel}>{item.model}</Text>
                </View>
                <StatusChip status={item.application_status}/>
            </View>
            <View style={d.appRow}>
                <View style={d.appDetail}>
                    <Text style={d.appDetailLabel}>Plan</Text>
                    <Text style={d.appDetailValue}>{item.plan_name}</Text>
                </View>
                <View style={d.appDetail}>
                    <Text style={d.appDetailLabel}>Monthly</Text>
                    <Text style={[d.appDetailValue, {color: C.green, fontWeight: '700'}]}>R{item.monthly_cost}</Text>
                </View>
            </View>
            <View style={d.appCardFooter}>
                <Text style={d.appDate}>{new Date(item.submission_date).toLocaleDateString('en-ZA', {
                    day: 'numeric',
                    month: 'short',
                    year: 'numeric'
                })}</Text>
                {item.application_status === 'Pending' && (
                    <TouchableOpacity style={d.cancelAppBtn}
                                      onPress={() => handleCancelApplication(item.application_id)}>
                        <Ionicons name="close-circle-outline" size={15} color={C.rose}/>
                        <Text style={d.cancelAppText}>Cancel</Text>
                    </TouchableOpacity>
                )}
            </View>
            {item.rejection_reason && (
                <View style={d.rejectionBanner}>
                    <Ionicons name="alert-circle-outline" size={14} color={C.rose}/>
                    <Text style={d.rejectionText} numberOfLines={2}>{item.rejection_reason}</Text>
                </View>
            )}
        </View>
    );

    if (loading) {
        return (
            <View style={d.loadingScreen}>
                <View style={d.loadingInner}>
                    <ActivityIndicator size="large" color={C.accent}/>
                    <Text style={d.loadingText}>Loading dashboard…</Text>
                </View>
            </View>
        );
    }

    return (
        <>
            <ScrollView style={d.root} refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh}
                                                                       tintColor={C.accent}/>}
                        showsVerticalScrollIndicator={false}>

                {/* ── Header ──────────────────────────────────────────── */}
                <View style={d.header}>
                    <View style={d.headerRing}/>
                    <View style={d.headerTop}>
                        <View style={d.avatarWrap}>
                            <View style={d.avatar}>
                                <Text
                                    style={d.avatarText}>{(user?.first_name?.[0] || 'U')}{(user?.last_name?.[0] || '')}</Text>
                            </View>
                            <View style={d.avatarBadge}>
                                <View
                                    style={[d.avatarBadgeDot, {backgroundColor: user?.registration_status === 'Verified' ? '#4ADE80' : C.amber}]}/>
                            </View>
                        </View>
                        <View style={d.headerInfo}>
                            <Text
                                style={d.headerGreeting}>Good {new Date().getHours() < 12 ? 'morning' : new Date().getHours() < 17 ? 'afternoon' : 'evening'} 👋</Text>
                            <Text style={d.headerName}
                                  numberOfLines={1}>{user?.first_name || 'User'} {user?.last_name || ''}</Text>
                            <View style={d.headerStatusPill}>
                                <View
                                    style={[d.headerStatusDot, {backgroundColor: user?.registration_status === 'Verified' ? '#4ADE80' : C.amber}]}/>
                                <Text
                                    style={d.headerStatusText}>{(user?.registration_status || 'Unknown').replace('_', ' ')}</Text>
                            </View>
                        </View>
                        <View style={d.headerActions}>
                            <TouchableOpacity style={d.headerIconBtn} onPress={animateBell}>
                                <Animated.View style={{transform: [{scale: bellScale}]}}>
                                    <Ionicons name="notifications-outline" size={22} color="rgba(255,255,255,0.9)"/>
                                </Animated.View>
                                {unreadCount > 0 && (
                                    <Animated.View style={[d.notifBadge, {opacity: dotOpacity}]}>
                                        <Text style={d.notifBadgeText}>{unreadCount > 9 ? '9+' : unreadCount}</Text>
                                    </Animated.View>
                                )}
                            </TouchableOpacity>
                            <TouchableOpacity style={d.headerIconBtn} onPress={handleLogout}>
                                <Ionicons name="log-out-outline" size={22} color="rgba(255,255,255,0.9)"/>
                            </TouchableOpacity>
                        </View>
                    </View>

                    {/* Eligibility / profile bar */}
                    {hasProfile && user?.registration_status === 'Verified' && (
                        <View style={[d.eligBanner, isEligible ? d.eligBannerGreen : d.eligBannerAmber]}>
                            <Ionicons name={isEligible ? 'checkmark-circle' : 'time-outline'} size={18}
                                      color={isEligible ? C.green : C.amber}/>
                            <Text style={[d.eligText, {color: isEligible ? C.green : C.amber}]}>
                                {isEligible ? 'Eligible to apply for devices' : eligibilityLoading ? 'Checking eligibility…' : 'Eligibility pending verification'}
                            </Text>
                        </View>
                    )}
                </View>

                {/* ── Profile banner ───────────────────────────────────── */}
                {!hasProfile && (
                    <TouchableOpacity style={d.profileBanner} onPress={() => navigation.navigate('CompleteProfile')}
                                      activeOpacity={0.85}>
                        <View style={d.profileBannerLeft}>
                            <View style={d.profileBannerIcon}>
                                <Ionicons name="person-add-outline" size={20} color={C.amber}/>
                            </View>
                            <View>
                                <Text style={d.profileBannerTitle}>Complete your profile</Text>
                                <Text style={d.profileBannerSub}>Required to access device applications</Text>
                            </View>
                        </View>
                        <Ionicons name="chevron-forward" size={18} color={C.amber}/>
                    </TouchableOpacity>
                )}

                {/* ── Stats ────────────────────────────────────────────── */}
                <View style={d.section}>
                    <Text style={d.sectionTitle}>Application Summary</Text>
                    <View style={d.statsGrid}>
                        {stats.map((st, i) => (
                            <View key={i} style={d.statCard}>
                                <View style={[d.statIcon, {backgroundColor: st.bg}]}>
                                    <Ionicons name={st.icon as any} size={18} color={st.color}/>
                                </View>
                                <Text style={d.statValue}>{st.value}</Text>
                                <Text style={d.statLabel}>{st.label}</Text>
                            </View>
                        ))}
                    </View>
                </View>

                {/* ── Quick actions ────────────────────────────────────── */}
                <View style={d.section}>
                    <Text style={d.sectionTitle}>Quick Actions</Text>
                    <View style={d.actionsRow}>
                        <TouchableOpacity
                            style={[d.actionCard, d.actionCardPrimary, (!hasProfile || !isEligible) && d.actionCardDisabled]}
                            onPress={() => {
                                if (!hasProfile) navigation.navigate('CompleteProfile');
                                else if (!isEligible) toast.warning('Not Eligible', 'Your account is not currently eligible for device applications.');
                                else setShowDevicesModal(true);
                            }}
                        >
                            <View style={[d.actionIco, {backgroundColor: 'rgba(255,255,255,0.15)'}]}>
                                <Ionicons name="phone-portrait-outline" size={24} color="#fff"/>
                            </View>
                            <Text style={d.actionTitleWhite}>Browse{'\n'}Devices</Text>
                            {!hasProfile && <Text style={d.actionHint}>Profile needed</Text>}
                        </TouchableOpacity>

                        <TouchableOpacity
                            style={[d.actionCard, d.actionCardGreen, !hasProfile && d.actionCardDisabled]}
                            onPress={() => {
                                if (hasProfile) setShowApplicationsModal(true);
                            }}
                        >
                            <View style={[d.actionIco, {backgroundColor: 'rgba(255,255,255,0.15)'}]}>
                                <Ionicons name="list-outline" size={24} color="#fff"/>
                            </View>
                            <Text style={d.actionTitleWhite}>My{'\n'}Applications</Text>
                            {applications.length > 0 && (
                                <View style={d.actionBadge}><Text style={d.actionBadgeText}>{applications.length}</Text></View>
                            )}
                        </TouchableOpacity>
                    </View>
                </View>

                {/* ── Recent applications ───────────────────────────────── */}
                {applications.length > 0 && (
                    <View style={d.section}>
                        <View style={d.sectionRow}>
                            <Text style={d.sectionTitle}>Recent Applications</Text>
                            <TouchableOpacity onPress={() => setShowApplicationsModal(true)}>
                                <Text style={d.seeAll}>See all</Text>
                            </TouchableOpacity>
                        </View>
                        {applications.slice(0, 3).map(app => (
                            <View key={app.application_id} style={d.recentCard}>
                                <View style={d.recentLeft}>
                                    <View style={d.recentIco}><Ionicons name="phone-portrait-outline" size={18}
                                                                        color={C.accent}/></View>
                                    <View style={{flex: 1}}>
                                        <Text style={d.recentDevice} numberOfLines={1}>{app.device_name}</Text>
                                        <Text
                                            style={d.recentDate}>{new Date(app.submission_date).toLocaleDateString('en-ZA')}</Text>
                                    </View>
                                </View>
                                <StatusChip status={app.application_status}/>
                            </View>
                        ))}
                    </View>
                )}

                {/* ── Account info ─────────────────────────────────────── */}
                <View style={[d.section, {marginBottom: 40}]}>
                    <Text style={d.sectionTitle}>Account</Text>
                    <View style={d.infoCard}>
                        {[
                            {label: 'Email', value: user?.email || '—'},
                            {label: 'User Type', value: user?.user_type || '—'},
                            {
                                label: 'Eligibility',
                                value: eligibilityLoading ? 'Checking…' : isEligible ? 'Eligible' : 'Not Eligible',
                                color: isEligible ? C.green : C.rose
                            },
                        ].map((row, i, arr) => (
                            <View key={i} style={[d.infoRow, i < arr.length - 1 && d.infoRowBorder]}>
                                <Text style={d.infoLabel}>{row.label}</Text>
                                <Text style={[d.infoValue, row.color ? {
                                    color: row.color,
                                    fontWeight: '700'
                                } : {}]}>{row.value}</Text>
                            </View>
                        ))}
                    </View>
                </View>

            </ScrollView>

            {/* ── Notifications modal ───────────────────────────────── */}
            <Modal visible={showNotificationsModal} animationType="slide" transparent
                   onRequestClose={() => setShowNotificationsModal(false)}>
                <View style={d.sheet}>
                    <View style={d.sheetContent}>
                        <View style={d.sheetHandle}/>
                        <View style={d.sheetHeader}>
                            <View>
                                <Text style={d.sheetTitle}>Notifications</Text>
                                {unreadCount > 0 && <Text style={d.sheetSub}>{unreadCount} unread</Text>}
                            </View>
                            <View style={{flexDirection: 'row', gap: 10}}>
                                {unreadCount > 0 && (
                                    <TouchableOpacity style={d.sheetAction} onPress={handleMarkAllAsRead}>
                                        <Text style={d.sheetActionText}>Mark all read</Text>
                                    </TouchableOpacity>
                                )}
                                <TouchableOpacity onPress={() => setShowNotificationsModal(false)}>
                                    <Ionicons name="close" size={24} color={C.muted}/>
                                </TouchableOpacity>
                            </View>
                        </View>
                        {notificationsLoading
                            ? <ActivityIndicator style={{marginTop: 40}} color={C.accent}/>
                            : notifications.length === 0
                                ? <View style={d.empty}><Ionicons name="notifications-off-outline" size={52}
                                                                  color={C.border}/><Text style={d.emptyTitle}>All
                                    caught up</Text><Text style={d.emptyText}>No notifications yet</Text></View>
                                : <FlatList data={notifications} renderItem={renderNotification}
                                            keyExtractor={i => i.notification_id.toString()}
                                            contentContainerStyle={{padding: 16}} showsVerticalScrollIndicator={false}/>
                        }
                    </View>
                </View>
            </Modal>

            {/* ── Devices modal ─────────────────────────────────────── */}
            <Modal visible={showDevicesModal} animationType="slide" transparent>
                <View style={d.sheet}>
                    <View style={d.sheetContent}>
                        <View style={d.sheetHandle}/>
                        <View style={d.sheetHeader}>
                            <View><Text style={d.sheetTitle}>Available Devices</Text><Text
                                style={d.sheetSub}>{devices.length} device{devices.length !== 1 ? 's' : ''}</Text></View>
                            <TouchableOpacity onPress={() => setShowDevicesModal(false)}><Ionicons name="close"
                                                                                                   size={24}
                                                                                                   color={C.muted}/></TouchableOpacity>
                        </View>
                        {devices.length === 0
                            ? <View style={d.empty}><Ionicons name="phone-portrait-outline" size={52} color={C.border}/><Text
                                style={d.emptyTitle}>No devices available</Text><Text style={d.emptyText}>Check back
                                later</Text></View>
                            : <FlatList data={devices} renderItem={renderDevice}
                                        keyExtractor={i => i.device_id.toString()} contentContainerStyle={{padding: 16}}
                                        showsVerticalScrollIndicator={false}/>
                        }
                    </View>
                </View>
            </Modal>

            {/* ── Applications modal ────────────────────────────────── */}
            <Modal visible={showApplicationsModal} animationType="slide" transparent>
                <View style={d.sheet}>
                    <View style={d.sheetContent}>
                        <View style={d.sheetHandle}/>
                        <View style={d.sheetHeader}>
                            <View><Text style={d.sheetTitle}>My Applications</Text><Text
                                style={d.sheetSub}>{applications.length} total</Text></View>
                            <TouchableOpacity onPress={() => setShowApplicationsModal(false)}><Ionicons name="close"
                                                                                                        size={24}
                                                                                                        color={C.muted}/></TouchableOpacity>
                        </View>
                        {applications.length === 0
                            ? <View style={d.empty}><Ionicons name="document-text-outline" size={52}
                                                              color={C.border}/><Text style={d.emptyTitle}>No
                                applications yet</Text><TouchableOpacity style={d.emptyBtn} onPress={() => {
                                setShowApplicationsModal(false);
                                setShowDevicesModal(true);
                            }}><Text style={d.emptyBtnText}>Browse Devices</Text></TouchableOpacity></View>
                            : <FlatList data={applications} renderItem={renderApplication}
                                        keyExtractor={i => i.application_id.toString()}
                                        contentContainerStyle={{padding: 16}} showsVerticalScrollIndicator={false}/>
                        }
                    </View>
                </View>
            </Modal>
        </>
    );
}

const d = StyleSheet.create({
    root: {flex: 1, backgroundColor: C.bg},
    loadingScreen: {flex: 1, backgroundColor: C.navy, justifyContent: 'center', alignItems: 'center'},
    loadingInner: {alignItems: 'center'},
    loadingText: {color: 'rgba(255,255,255,0.7)', marginTop: 16, fontSize: 15, fontWeight: '500'},

    // Header
    header: {backgroundColor: C.navy, paddingTop: 56, paddingBottom: 24, paddingHorizontal: 20, overflow: 'hidden'},
    headerRing: {
        position: 'absolute',
        width: 260,
        height: 260,
        borderRadius: 130,
        borderWidth: 1,
        borderColor: 'rgba(255,255,255,0.05)',
        top: -80,
        right: -60
    },
    headerTop: {flexDirection: 'row', alignItems: 'center'},
    avatarWrap: {position: 'relative', marginRight: 14},
    avatar: {
        width: 52,
        height: 52,
        borderRadius: 16,
        backgroundColor: 'rgba(255,255,255,0.12)',
        borderWidth: 1,
        borderColor: 'rgba(255,255,255,0.2)',
        justifyContent: 'center',
        alignItems: 'center'
    },
    avatarText: {fontSize: 18, fontWeight: '800', color: '#fff'},
    avatarBadge: {
        position: 'absolute',
        bottom: -2,
        right: -2,
        width: 14,
        height: 14,
        borderRadius: 7,
        backgroundColor: C.navy,
        justifyContent: 'center',
        alignItems: 'center'
    },
    avatarBadgeDot: {width: 8, height: 8, borderRadius: 4},
    headerInfo: {flex: 1},
    headerGreeting: {fontSize: 12, color: 'rgba(255,255,255,0.55)', fontWeight: '500'},
    headerName: {fontSize: 20, fontWeight: '800', color: '#fff', marginBottom: 4},
    headerStatusPill: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: 'rgba(255,255,255,0.1)',
        alignSelf: 'flex-start',
        paddingHorizontal: 10,
        paddingVertical: 4,
        borderRadius: 20
    },
    headerStatusDot: {width: 5, height: 5, borderRadius: 3, marginRight: 5},
    headerStatusText: {fontSize: 10, color: 'rgba(255,255,255,0.8)', fontWeight: '700', letterSpacing: 0.5},
    headerActions: {flexDirection: 'row', gap: 8, marginLeft: 8},
    headerIconBtn: {
        width: 40,
        height: 40,
        borderRadius: 12,
        backgroundColor: 'rgba(255,255,255,0.1)',
        justifyContent: 'center',
        alignItems: 'center',
        position: 'relative'
    },
    notifBadge: {
        position: 'absolute',
        top: 4,
        right: 4,
        backgroundColor: '#EF4444',
        minWidth: 16,
        height: 16,
        borderRadius: 8,
        justifyContent: 'center',
        alignItems: 'center',
        borderWidth: 1.5,
        borderColor: C.navy
    },
    notifBadgeText: {fontSize: 9, fontWeight: '800', color: '#fff'},
    eligBanner: {
        flexDirection: 'row',
        alignItems: 'center',
        marginTop: 16,
        paddingHorizontal: 14,
        paddingVertical: 10,
        borderRadius: 12,
        gap: 8
    },
    eligBannerGreen: {backgroundColor: 'rgba(5,150,105,0.15)', borderWidth: 1, borderColor: 'rgba(5,150,105,0.3)'},
    eligBannerAmber: {backgroundColor: 'rgba(217,119,6,0.15)', borderWidth: 1, borderColor: 'rgba(217,119,6,0.3)'},
    eligText: {fontSize: 13, fontWeight: '600'},

    // Profile banner
    profileBanner: {
        margin: 16,
        marginTop: 0,
        backgroundColor: '#FFFBEB',
        borderWidth: 1,
        borderColor: '#FDE68A',
        borderRadius: 16,
        padding: 16,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between'
    },
    profileBannerLeft: {flexDirection: 'row', alignItems: 'center', gap: 12, flex: 1},
    profileBannerIcon: {
        width: 40,
        height: 40,
        borderRadius: 12,
        backgroundColor: '#FEF3C7',
        justifyContent: 'center',
        alignItems: 'center'
    },
    profileBannerTitle: {fontSize: 14, fontWeight: '700', color: '#92400E', marginBottom: 2},
    profileBannerSub: {fontSize: 12, color: '#B45309'},

    // Sections
    section: {paddingHorizontal: 16, marginTop: 20},
    sectionTitle: {fontSize: 16, fontWeight: '800', color: C.text, letterSpacing: -0.3, marginBottom: 14},
    sectionRow: {flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14},
    seeAll: {fontSize: 13, color: C.accent, fontWeight: '600'},

    // Stats
    statsGrid: {flexDirection: 'row', gap: 10},
    statCard: {
        flex: 1,
        backgroundColor: C.surface,
        borderRadius: 16,
        padding: 14,
        alignItems: 'center',
        borderWidth: 1,
        borderColor: C.border,
        shadowColor: C.navy,
        shadowOffset: {width: 0, height: 2},
        shadowOpacity: 0.06,
        shadowRadius: 8,
        elevation: 3
    },
    statIcon: {
        width: 36,
        height: 36,
        borderRadius: 10,
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: 8
    },
    statValue: {fontSize: 22, fontWeight: '800', color: C.text},
    statLabel: {fontSize: 10, color: C.muted, fontWeight: '600', marginTop: 2, letterSpacing: 0.3},

    // Actions
    actionsRow: {flexDirection: 'row', gap: 12},
    actionCard: {flex: 1, borderRadius: 20, padding: 20, overflow: 'hidden'},
    actionCardPrimary: {backgroundColor: C.navy},
    actionCardGreen: {backgroundColor: C.green},
    actionCardDisabled: {opacity: 0.5},
    actionIco: {
        width: 44,
        height: 44,
        borderRadius: 12,
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: 12
    },
    actionTitleWhite: {fontSize: 15, fontWeight: '800', color: '#fff', lineHeight: 20},
    actionHint: {fontSize: 10, color: 'rgba(255,255,255,0.6)', marginTop: 4},
    actionBadge: {
        position: 'absolute',
        top: 12,
        right: 12,
        backgroundColor: '#EF4444',
        minWidth: 20,
        height: 20,
        borderRadius: 10,
        justifyContent: 'center',
        alignItems: 'center',
        paddingHorizontal: 5
    },
    actionBadgeText: {fontSize: 10, fontWeight: '800', color: '#fff'},

    // Recent cards
    recentCard: {
        backgroundColor: C.surface,
        borderRadius: 14,
        padding: 14,
        marginBottom: 8,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        borderWidth: 1,
        borderColor: C.border
    },
    recentLeft: {flexDirection: 'row', alignItems: 'center', gap: 12, flex: 1, marginRight: 12},
    recentIco: {
        width: 36,
        height: 36,
        borderRadius: 10,
        backgroundColor: C.accentSoft,
        justifyContent: 'center',
        alignItems: 'center'
    },
    recentDevice: {fontSize: 14, fontWeight: '700', color: C.text, marginBottom: 2},
    recentDate: {fontSize: 12, color: C.muted},

    // Info card
    infoCard: {backgroundColor: C.surface, borderRadius: 16, borderWidth: 1, borderColor: C.border, overflow: 'hidden'},
    infoRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingHorizontal: 16,
        paddingVertical: 14
    },
    infoRowBorder: {borderBottomWidth: 1, borderBottomColor: C.border},
    infoLabel: {fontSize: 13, color: C.muted},
    infoValue: {fontSize: 13, fontWeight: '600', color: C.text},

    // Sheet (modals)
    sheet: {flex: 1, backgroundColor: 'rgba(15,31,61,0.55)', justifyContent: 'flex-end'},
    sheetContent: {
        backgroundColor: C.surface,
        borderTopLeftRadius: 28,
        borderTopRightRadius: 28,
        maxHeight: '88%',
        minHeight: '55%'
    },
    sheetHandle: {
        width: 36,
        height: 4,
        backgroundColor: C.border,
        borderRadius: 2,
        alignSelf: 'center',
        marginTop: 12,
        marginBottom: 4
    },
    sheetHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'flex-start',
        padding: 20,
        borderBottomWidth: 1,
        borderBottomColor: C.border
    },
    sheetTitle: {fontSize: 20, fontWeight: '800', color: C.text},
    sheetSub: {fontSize: 13, color: C.muted, marginTop: 2},
    sheetAction: {backgroundColor: C.accentSoft, paddingHorizontal: 12, paddingVertical: 6, borderRadius: 20},
    sheetActionText: {fontSize: 12, color: C.accent, fontWeight: '700'},

    // Notifications
    notifCard: {
        backgroundColor: C.bg,
        borderRadius: 14,
        padding: 14,
        marginBottom: 10,
        borderWidth: 1,
        borderColor: C.border
    },
    notifUnread: {backgroundColor: '#F0F5FF', borderColor: C.accent + '40'},
    notifHeader: {flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 8},
    notifLeft: {flexDirection: 'row', alignItems: 'flex-start', gap: 10, flex: 1},
    notifIconWrap: {width: 32, height: 32, borderRadius: 10, justifyContent: 'center', alignItems: 'center'},
    notifTitle: {fontSize: 14, fontWeight: '700', color: C.text, marginBottom: 2, flex: 1},
    notifTime: {fontSize: 11, color: C.mutedLight},
    notifMsg: {fontSize: 13, color: C.muted, lineHeight: 19},
    unreadPill: {
        alignSelf: 'flex-start',
        backgroundColor: C.accentSoft,
        paddingHorizontal: 8,
        paddingVertical: 3,
        borderRadius: 20,
        marginTop: 8
    },
    unreadPillText: {fontSize: 10, fontWeight: '700', color: C.accent},

    // Device cards
    deviceCard: {
        backgroundColor: C.bg,
        borderRadius: 16,
        padding: 18,
        marginBottom: 12,
        borderWidth: 1,
        borderColor: C.border
    },
    deviceCardTop: {flexDirection: 'row', alignItems: 'flex-start', marginBottom: 12},
    deviceCardName: {fontSize: 17, fontWeight: '800', color: C.text, marginBottom: 4},
    deviceCardModel: {fontSize: 12, color: C.muted},
    devicePricePill: {
        backgroundColor: C.greenSoft,
        paddingHorizontal: 12,
        paddingVertical: 6,
        borderRadius: 12,
        alignItems: 'center'
    },
    devicePrice: {fontSize: 18, fontWeight: '800', color: C.green},
    devicePriceLabel: {fontSize: 10, color: C.green, fontWeight: '600'},
    devicePlan: {fontSize: 14, fontWeight: '700', color: C.text, marginBottom: 4},
    devicePlanDetail: {fontSize: 13, color: C.muted, lineHeight: 19, marginBottom: 14},
    deviceCardFooter: {flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center'},
    deviceContractPill: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 5,
        backgroundColor: C.surface,
        borderWidth: 1,
        borderColor: C.border,
        paddingHorizontal: 10,
        paddingVertical: 6,
        borderRadius: 10
    },
    deviceContractText: {fontSize: 12, color: C.muted, fontWeight: '500'},
    applyBtn: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: C.navy,
        paddingHorizontal: 16,
        paddingVertical: 10,
        borderRadius: 12,
        gap: 6
    },
    applyBtnText: {color: '#fff', fontSize: 13, fontWeight: '700'},

    // Application cards
    appCard: {
        backgroundColor: C.bg,
        borderRadius: 16,
        padding: 16,
        marginBottom: 12,
        borderWidth: 1,
        borderColor: C.border
    },
    appCardHeader: {flexDirection: 'row', alignItems: 'flex-start', marginBottom: 14},
    appDeviceName: {fontSize: 15, fontWeight: '800', color: C.text, marginBottom: 3, flex: 1},
    appDeviceModel: {fontSize: 12, color: C.muted},
    appRow: {flexDirection: 'row', gap: 12, marginBottom: 12},
    appDetail: {
        flex: 1,
        backgroundColor: C.surface,
        padding: 12,
        borderRadius: 12,
        borderWidth: 1,
        borderColor: C.border
    },
    appDetailLabel: {fontSize: 10, color: C.muted, fontWeight: '600', letterSpacing: 0.5, marginBottom: 4},
    appDetailValue: {fontSize: 13, fontWeight: '600', color: C.text},
    appCardFooter: {flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center'},
    appDate: {fontSize: 12, color: C.mutedLight},
    cancelAppBtn: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 5,
        paddingHorizontal: 12,
        paddingVertical: 6,
        backgroundColor: C.roseSoft,
        borderRadius: 10,
        borderWidth: 1,
        borderColor: '#FECACA'
    },
    cancelAppText: {fontSize: 12, color: C.rose, fontWeight: '700'},
    rejectionBanner: {
        flexDirection: 'row',
        alignItems: 'flex-start',
        gap: 8,
        marginTop: 10,
        padding: 12,
        backgroundColor: C.roseSoft,
        borderRadius: 10,
        borderWidth: 1,
        borderColor: '#FECACA'
    },
    rejectionText: {fontSize: 12, color: '#7F1D1D', flex: 1, lineHeight: 17},

    // Empty
    empty: {flex: 1, alignItems: 'center', justifyContent: 'center', paddingVertical: 60},
    emptyTitle: {fontSize: 18, fontWeight: '700', color: C.muted, marginTop: 16, marginBottom: 6},
    emptyText: {fontSize: 14, color: C.mutedLight, textAlign: 'center'},
    emptyBtn: {backgroundColor: C.navy, paddingHorizontal: 24, paddingVertical: 12, borderRadius: 12, marginTop: 20},
    emptyBtnText: {color: '#fff', fontWeight: '700', fontSize: 14},
});