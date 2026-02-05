// Update your ClientDashboard.tsx
import React, { useEffect, useState, useRef } from 'react'; // ADD useRef
import {
    View,
    Text,
    StyleSheet,
    TouchableOpacity,
    ScrollView,
    Alert,
    Modal,
    RefreshControl,
    ActivityIndicator,
    FlatList,
    Animated // ADD Animated
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { StackNavigationProp } from '@react-navigation/stack';
import { RootStackParamList } from '../../navigation/AppNavigator';
import { useNavigation, useFocusEffect } from '@react-navigation/native'; // FIX: Import useFocusEffect here
import { Ionicons } from '@expo/vector-icons';
import { deviceAPI, notificationAPI } from '../../services/api';

type NavigationProp = StackNavigationProp<
    RootStackParamList,
    'DOJCDDashboard'
>;

// Add Notification interface
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
    const [user, setUser] = useState<any>(null);
    const [showProfileModal, setShowProfileModal] = useState(false);
    const [hasCompletedProfile, setHasCompletedProfile] = useState(false);
    const [refreshing, setRefreshing] = useState(false);
    const [loading, setLoading] = useState(true);
    const [devices, setDevices] = useState<Device[]>([]);
    const [applications, setApplications] = useState<Application[]>([]);
    const [summary, setSummary] = useState<Summary | null>(null);
    const [isEligible, setIsEligible] = useState<boolean>(false);
    const [eligibilityLoading, setEligibilityLoading] = useState(false);
    const [showDevicesModal, setShowDevicesModal] = useState(false);
    const [showApplicationsModal, setShowApplicationsModal] = useState(false);

    // NEW: Notification states
    const [notifications, setNotifications] = useState<Notification[]>([]);
    const [unreadCount, setUnreadCount] = useState(0);
    const [showNotificationsModal, setShowNotificationsModal] = useState(false);
    const [notificationsLoading, setNotificationsLoading] = useState(false);
    const [showNotificationDot, setShowNotificationDot] = useState(false);

    // ADD: Animation refs
    const bellScale = useRef(new Animated.Value(1)).current;
    const dotOpacity = useRef(new Animated.Value(0)).current;

    const navigation = useNavigation<NavigationProp>();

    // FIX: Add useFocusEffect
    useFocusEffect(
        React.useCallback(() => {
            if (user?.client_user_id) {
                loadNotifications();
                loadUnreadCount();
            }
            return () => {};
        }, [user])
    );

    useEffect(() => {
        loadUser();
    }, []);

    const loadUser = async () => {
        try {
            const userData = await AsyncStorage.getItem("user");
            console.log('📥 User loaded from storage:', userData);
            if (userData) {
                const parsedUser = JSON.parse(userData);
                setUser(parsedUser);
                checkProfileCompletion(parsedUser);

                // Load data if profile is completed
                if (parsedUser.registration_status === 'Verified') {
                    await checkEligibility(parsedUser.client_user_id);
                    await loadApplications(parsedUser.client_user_id);
                    await loadSummary(parsedUser.client_user_id);
                    await loadNotifications(); // Load notifications
                    await loadUnreadCount(); // Load unread count
                }
            }
        } catch (error) {
            console.error('Error loading user:', error);
        } finally {
            setLoading(false);
        }
    };

    const loadNotifications = async () => {
        if (!user?.client_user_id) return;

        try {
            setNotificationsLoading(true);
            const response = await notificationAPI.getUserNotifications(
                user.client_user_id,
                'Client'
            );

            if (response.data.success) {
                setNotifications(response.data.data);
                console.log('📬 Notifications loaded:', response.data.data.length);
            }
        } catch (error) {
            console.error('Error loading notifications:', error);
        } finally {
            setNotificationsLoading(false);
        }
    };

    // Load unread count
    const loadUnreadCount = async () => {
        if (!user?.client_user_id) return;

        try {
            const response = await notificationAPI.getUnreadCount(
                user.client_user_id,
                'Client'
            );

            if (response.data.success) {
                const count = response.data.unreadCount || 0;
                setUnreadCount(count);
                setShowNotificationDot(count > 0);

                // Animate dot if there are unread notifications
                if (count > 0) {
                    Animated.sequence([
                        Animated.timing(dotOpacity, {
                            toValue: 1,
                            duration: 300,
                            useNativeDriver: true,
                        }),
                        Animated.timing(dotOpacity, {
                            toValue: 0.7,
                            duration: 500,
                            useNativeDriver: true,
                        }),
                    ]).start();
                }
            }
        } catch (error) {
            console.error('Error loading unread count:', error);
        }
    };

    // Mark notification as read
    const handleMarkAsRead = async (notificationId: number) => {
        if (!user?.client_user_id) return;

        try {
            const response = await notificationAPI.markAsRead(
                notificationId,
                user.client_user_id,
                'Client'
            );

            if (response.data.success) {
                // Update local state
                setNotifications(prev =>
                    prev.map(notif =>
                        notif.notification_id === notificationId
                            ? { ...notif, is_read: true }
                            : notif
                    )
                );

                // Update unread count
                setUnreadCount(prev => Math.max(0, prev - 1));

                // If no more unread, hide dot
                if (unreadCount - 1 <= 0) {
                    setShowNotificationDot(false);
                    Animated.timing(dotOpacity, {
                        toValue: 0,
                        duration: 300,
                        useNativeDriver: true,
                    }).start();
                }
            }
        } catch (error) {
            console.error('Error marking notification as read:', error);
        }
    };

    // Mark all as read
    const handleMarkAllAsRead = async () => {
        if (!user?.client_user_id) return;

        try {
            const response = await notificationAPI.markAllAsRead(
                user.client_user_id,
                'Client'
            );

            if (response.data.success) {
                // Update all notifications to read
                setNotifications(prev =>
                    prev.map(notif => ({ ...notif, is_read: true }))
                );

                // Reset unread count and hide dot
                setUnreadCount(0);
                setShowNotificationDot(false);
                Animated.timing(dotOpacity, {
                    toValue: 0,
                    duration: 300,
                    useNativeDriver: true,
                }).start();

                Alert.alert('Success', `Marked ${response.data.updatedCount} notifications as read`);
            }
        } catch (error) {
            console.error('Error marking all as read:', error);
            Alert.alert('Error', 'Failed to mark notifications as read');
        }
    };

    // Delete notification
    const handleDeleteNotification = (notificationId: number) => {
        if (!user?.client_user_id) return;

        Alert.alert(
            'Delete Notification',
            'Are you sure you want to delete this notification?',
            [
                {
                    text: 'Cancel',
                    style: 'cancel'
                },
                {
                    text: 'Delete',
                    style: 'destructive',
                    onPress: async () => {
                        try {
                            const response = await notificationAPI.deleteNotification(
                                notificationId,
                                user.client_user_id,
                                'Client'
                            );

                            if (response.data.success) {
                                // Remove from local state
                                setNotifications(prev =>
                                    prev.filter(notif => notif.notification_id !== notificationId)
                                );

                                // If it was unread, update count
                                const deletedNotif = notifications.find(n => n.notification_id === notificationId);
                                if (deletedNotif && !deletedNotif.is_read) {
                                    setUnreadCount(prev => Math.max(0, prev - 1));
                                }
                            }
                        } catch (error) {
                            console.error('Error deleting notification:', error);
                            Alert.alert('Error', 'Failed to delete notification');
                        }
                    }
                }
            ]
        );
    };

    // Animate bell when clicked
    const animateBell = () => {
        Animated.sequence([
            Animated.timing(bellScale, {
                toValue: 1.2,
                duration: 100,
                useNativeDriver: true,
            }),
            Animated.timing(bellScale, {
                toValue: 1,
                duration: 100,
                useNativeDriver: true,
            })
        ]).start();

        setShowNotificationsModal(true);
    };

    const checkEligibility = async (clientUserId: number) => {
        try {
            setEligibilityLoading(true);
            const response = await deviceAPI.checkEligibility(clientUserId);

            setIsEligible(response.data.data.eligible);

            console.log('✅ Eligibility check result:', {
                success: response.data.success,
                eligible: response.data.data.eligible,
                reason: response.data.data.reason
            });

            if (response.data.data.eligible) {
                await loadDevices();
            }
        } catch (error) {
            console.error('❌ Error checking eligibility:', error);
            Alert.alert('Error', 'Failed to check eligibility');
        } finally {
            setEligibilityLoading(false);
        }
    };

    const loadDevices = async () => {
        try {
            const response = await deviceAPI.getAvailableDevices();
            setDevices(response.data.data);
        } catch (error) {
            console.error('Error loading devices:', error);
        }
    };

    const loadApplications = async (clientUserId: number) => {
        try {
            const response = await deviceAPI.getUserApplications(clientUserId);
            setApplications(response.data.data);
        } catch (error) {
            console.error('Error loading applications:', error);
        }
    };

    const loadSummary = async (clientUserId: number) => {
        try {
            const response = await deviceAPI.getApplicationSummary(clientUserId);
            setSummary(response.data.data);
        } catch (error) {
            console.error('Error loading summary:', error);
        }
    };

    const checkProfileCompletion = (userData: any) => {
        try {
            console.log('🔍 Checking profile completion for user:', {
                status: userData.registration_status,
                hasNetwork: !!userData.network_provider,
                hasDuration: !!userData.contract_duration_months,
                hasEndDate: !!userData.contract_end_date
            });

            const status = userData.registration_status || '';

            // If user is verified, they can browse devices regardless of profile fields
            if (status === 'Verified') {
                console.log('✅ User is verified - can browse devices');
                setHasCompletedProfile(true);
                setShowProfileModal(false);
                return;
            }

            // If user has completed profile (but not yet verified)
            if (status === 'Profile_Completed') {
                console.log('✅ User has completed profile - waiting for verification');
                setHasCompletedProfile(true);
                setShowProfileModal(false);
                return;
            }

            // If user is rejected
            if (status === 'Rejected') {
                console.log('⚠️ User is rejected');
                setHasCompletedProfile(true);
                setShowProfileModal(false);
                return;
            }

            // If user is pending - show profile modal
            if (status === 'Pending') {
                console.log('⚠️ User is pending - show profile modal');
                setShowProfileModal(true);
                setHasCompletedProfile(false);
                return;
            }

            // For any other status or no status, check if profile fields exist
            const hasProfileFields = userData.network_provider &&
                userData.contract_duration_months &&
                userData.contract_end_date;

            console.log('🔍 Checking profile fields:', {
                hasProfileFields,
                network: userData.network_provider,
                duration: userData.contract_duration_months,
                endDate: userData.contract_end_date
            });

            if (!hasProfileFields) {
                console.log('❌ Missing profile fields - show profile modal');
                setShowProfileModal(true);
                setHasCompletedProfile(false);
            } else {
                console.log('✅ Has all profile fields');
                setHasCompletedProfile(true);
                setShowProfileModal(false);
            }

        } catch (error) {
            console.log('❌ Error checking profile:', error);
            // Default to showing modal if there's an error
            setShowProfileModal(true);
            setHasCompletedProfile(false);
        }
    };

    const onRefresh = async () => {
        setRefreshing(true);
        await loadUser();
        setRefreshing(false);
    };

    const handleApplyForDevice = async (deviceId: number) => {
        if (!user?.client_user_id) {
            Alert.alert('Error', 'User not found');
            return;
        }

        Alert.alert(
            'Confirm Application',
            'Are you sure you want to apply for this device?',
            [
                {
                    text: 'Cancel',
                    style: 'cancel'
                },
                {
                    text: 'Apply',
                    onPress: async () => {
                        try {
                            const response = await deviceAPI.submitApplication(
                                user.client_user_id,
                                deviceId
                            );

                            if (response.data.success) {
                                Alert.alert('Success', 'Application submitted successfully!');
                                setShowDevicesModal(false);
                                await loadApplications(user.client_user_id);
                                await loadSummary(user.client_user_id);
                                await loadNotifications(); // Refresh notifications after submission
                            } else {
                                Alert.alert('Error', response.data.message || 'Failed to submit application');
                            }
                        } catch (error: any) {
                            Alert.alert('Error', error.message || 'Failed to submit application');
                        }
                    }
                }
            ]
        );
    };

    const handleCancelApplication = async (applicationId: number) => {
        if (!user?.client_user_id) {
            Alert.alert('Error', 'User not found');
            return;
        }

        Alert.alert(
            'Cancel Application',
            'Are you sure you want to cancel this application?',
            [
                {
                    text: 'No',
                    style: 'cancel'
                },
                {
                    text: 'Yes, Cancel',
                    style: 'destructive',
                    onPress: async () => {
                        try {
                            const response = await deviceAPI.cancelApplication(
                                user.client_user_id,
                                applicationId
                            );

                            if (response.data.success) {
                                Alert.alert('Success', 'Application cancelled successfully');
                                await loadApplications(user.client_user_id);
                                await loadSummary(user.client_user_id);
                                await loadNotifications(); // Refresh notifications after cancellation
                            } else {
                                Alert.alert('Error', response.data.message || 'Failed to cancel application');
                            }
                        } catch (error: any) {
                            Alert.alert('Error', error.message || 'Failed to cancel application');
                        }
                    }
                }
            ]
        );
    };

    const renderNotificationItem = ({ item }: { item: Notification }) => (
        <TouchableOpacity
            style={[
                styles.notificationCard,
                !item.is_read && styles.unreadNotification
            ]}
            onPress={() => handleMarkAsRead(item.notification_id)}
            activeOpacity={0.7}
        >
            <View style={styles.notificationHeader}>
                <View style={styles.notificationTitleRow}>
                    <Ionicons
                        name={getNotificationIcon(item.title)}
                        size={20}
                        color={getNotificationColor(item.title)}
                        style={styles.notificationIcon}
                    />
                    <Text style={styles.notificationTitle} numberOfLines={1}>
                        {item.title}
                    </Text>
                </View>

                <TouchableOpacity
                    onPress={() => handleDeleteNotification(item.notification_id)}
                    hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
                >
                    <Ionicons name="close-outline" size={18} color="#94a3b8" />
                </TouchableOpacity>
            </View>

            <Text style={styles.notificationMessage} numberOfLines={3}>
                {item.message}
            </Text>

            <View style={styles.notificationFooter}>
                <Text style={styles.notificationTime}>
                    {formatNotificationTime(item.created_at)}
                </Text>

                {!item.is_read && (
                    <View style={styles.unreadBadge}>
                        <Text style={styles.unreadBadgeText}>New</Text>
                    </View>
                )}
            </View>
        </TouchableOpacity>
    );

    // Helper functions for notifications
    const getNotificationIcon = (title: string) => {
        if (title.includes('Approved')) return 'checkmark-circle';
        if (title.includes('Rejected')) return 'close-circle';
        if (title.includes('Submitted')) return 'document-text';
        if (title.includes('Cancelled')) return 'trash-outline';
        return 'notifications-outline';
    };

    const getNotificationColor = (title: string) => {
        if (title.includes('Approved')) return '#10b981';
        if (title.includes('Rejected')) return '#ef4444';
        if (title.includes('Submitted')) return '#3b82f6';
        if (title.includes('Cancelled')) return '#94a3b8';
        return '#6b7280';
    };

    const formatNotificationTime = (dateString: string) => {
        const date = new Date(dateString);
        const now = new Date();
        const diffMs = now.getTime() - date.getTime();
        const diffMins = Math.floor(diffMs / 60000);
        const diffHours = Math.floor(diffMs / 3600000);
        const diffDays = Math.floor(diffMs / 86400000);

        if (diffMins < 60) {
            return `${diffMins}m ago`;
        } else if (diffHours < 24) {
            return `${diffHours}h ago`;
        } else if (diffDays < 7) {
            return `${diffDays}d ago`;
        } else {
            return date.toLocaleDateString();
        }
    };

    const renderDeviceItem = ({ item }: { item: Device }) => (
        <View style={styles.deviceCard}>
            <View style={styles.deviceHeader}>
                <Text style={styles.deviceName}>{item.device_name}</Text>
                <Text style={styles.deviceModel}>{item.model}</Text>
            </View>

            <View style={styles.deviceDetails}>
                <Text style={styles.deviceManufacturer}>{item.manufacturer}</Text>
                <Text style={styles.planName}>{item.plan_name}</Text>
                <Text style={styles.planDetails}>{item.plan_details}</Text>
            </View>

            <View style={styles.deviceFooter}>
                <View style={styles.costContainer}>
                    <Text style={styles.costLabel}>Monthly Cost:</Text>
                    <Text style={styles.costValue}>R{item.monthly_cost}</Text>
                </View>
                <View style={styles.contractContainer}>
                    <Text style={styles.contractLabel}>Contract:</Text>
                    <Text style={styles.contractValue}>{item.contract_duration_months} months</Text>
                </View>
            </View>

            <TouchableOpacity
                style={styles.applyButton}
                onPress={() => handleApplyForDevice(item.device_id)}
            >
                <Ionicons name="add-circle-outline" size={20} color="white" />
                <Text style={styles.applyButtonText}>Apply Now</Text>
            </TouchableOpacity>
        </View>
    );

    const renderApplicationItem = ({ item }: { item: Application }) => (
        <View style={styles.applicationCard}>
            <View style={styles.applicationHeader}>
                <Text style={styles.applicationDeviceName}>{item.device_name}</Text>
                <View style={[styles.statusBadge,
                    item.application_status === 'Approved' && styles.statusApproved,
                    item.application_status === 'Pending' && styles.statusPending,
                    item.application_status === 'Rejected' && styles.statusRejected,
                    item.application_status === 'Cancelled' && styles.statusCancelled
                ]}>
                    <Text style={styles.statusText}>{item.application_status}</Text>
                </View>
            </View>

            <Text style={styles.applicationModel}>{item.model} • {item.manufacturer}</Text>

            <View style={styles.applicationDetails}>
                <Text style={styles.applicationPlan}>{item.plan_name}</Text>
                <Text style={styles.applicationCost}>R{item.monthly_cost}/month</Text>
            </View>

            <Text style={styles.applicationDate}>
                Applied: {new Date(item.submission_date).toLocaleDateString()}
            </Text>

            {item.application_status === 'Pending' && (
                <TouchableOpacity
                    style={styles.cancelAppButton}
                    onPress={() => handleCancelApplication(item.application_id)}
                >
                    <Ionicons name="close-circle-outline" size={18} color="#ef4444" />
                    <Text style={styles.cancelAppText}>Cancel Application</Text>
                </TouchableOpacity>
            )}

            {item.rejection_reason && (
                <View style={styles.rejectionContainer}>
                    <Text style={styles.rejectionLabel}>Reason:</Text>
                    <Text style={styles.rejectionReason}>{item.rejection_reason}</Text>
                </View>
            )}
        </View>
    );

    const handleLogout = () => {
        Alert.alert(
            'Confirm Logout',
            'Are you sure you want to logout?',
            [
                { text: 'Cancel', style: 'cancel' },
                {
                    text: 'Logout',
                    style: 'destructive',
                    onPress: async () => {
                        try {
                            await AsyncStorage.removeItem('user');
                            await AsyncStorage.removeItem('profile_skipped');
                            navigation.reset({
                                index: 0,
                                routes: [{ name: 'Login' }],
                            });
                        } catch (error) {
                            Alert.alert('Error', 'Failed to logout');
                        }
                    },
                },
            ]
        );
    };

    if (loading) {
        return (
            <View style={styles.loadingContainer}>
                <ActivityIndicator size="large" color="#1e3a8a" />
                <Text style={styles.loadingText}>Loading dashboard...</Text>
            </View>
        );
    }

    return (
        <>
            <ScrollView
                style={styles.container}
                refreshControl={
                    <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
                }
            >
                {/* UPDATED HEADER WITH NOTIFICATION BELL */}
                <View style={styles.header}>
                    <View style={styles.userInfo}>
                        <View style={styles.avatar}>
                            <Text style={styles.avatarText}>
                                {user?.first_name?.[0]}{user?.last_name?.[0]}
                            </Text>
                        </View>
                        <View style={styles.userDetails}>
                            <Text style={styles.welcome}>Welcome Back 👋</Text>
                            <Text style={styles.name} numberOfLines={1}>
                                {user?.first_name || 'Client'} {user?.last_name || ''}
                            </Text>
                            <Text style={styles.email} numberOfLines={1}>
                                {user?.email || ''}
                            </Text>
                        </View>
                    </View>

                    {/* NOTIFICATIONS BELL AND LOGOUT BUTTON */}
                    <View style={styles.headerActions}>
                        <TouchableOpacity
                            style={styles.notificationButton}
                            onPress={animateBell}
                            activeOpacity={0.7}
                        >
                            <Animated.View style={{ transform: [{ scale: bellScale }] }}>
                                <Ionicons name="notifications-outline" size={24} color="#4b5563" />
                            </Animated.View>

                            {/* UNREAD BADGE */}
                            {showNotificationDot && (
                                <Animated.View
                                    style={[
                                        styles.notificationBadge,
                                        { opacity: dotOpacity }
                                    ]}
                                >
                                    {unreadCount > 0 && (
                                        <Text style={styles.badgeText}>
                                            {unreadCount > 99 ? '99+' : unreadCount}
                                        </Text>
                                    )}
                                </Animated.View>
                            )}
                        </TouchableOpacity>

                        <TouchableOpacity
                            onPress={handleLogout}
                            style={styles.logoutButton}
                        >
                            <Ionicons name="log-out-outline" size={24} color="#ef4444" />
                        </TouchableOpacity>
                    </View>
                </View>

                {/* ELIGIBILITY BANNER */}
                {hasCompletedProfile && user?.registration_status === 'Verified' && (
                    <View style={[styles.eligibilityBanner,
                        isEligible ? styles.eligibleBanner : styles.notEligibleBanner
                    ]}>
                        <Ionicons
                            name={isEligible ? "checkmark-circle" : "alert-circle"}
                            size={24}
                            color={isEligible ? "#10b981" : "#f59e0b"}
                        />
                        <View style={styles.eligibilityContent}>
                            <Text style={styles.eligibilityTitle}>
                                {isEligible ? 'You are eligible to apply!' : 'Checking eligibility...'}
                            </Text>
                            <Text style={styles.eligibilityText}>
                                {isEligible
                                    ? 'Browse available devices and submit applications'
                                    : eligibilityLoading ? 'Checking...' : 'Please wait while we verify your account'
                                }
                            </Text>
                        </View>
                    </View>
                )}

                {/* QUICK STATS */}
                <View style={styles.statsContainer}>
                    <Text style={styles.sectionTitle}>Application Summary</Text>
                    <View style={styles.statsGrid}>
                        <View style={styles.statCard}>
                            <Ionicons name="document-text-outline" size={24} color="#3b82f6" />
                            <Text style={styles.statNumber}>{summary?.total_applications || 0}</Text>
                            <Text style={styles.statLabel}>Total</Text>
                        </View>
                        <View style={styles.statCard}>
                            <Ionicons name="time-outline" size={24} color="#f59e0b" />
                            <Text style={styles.statNumber}>{summary?.pending || 0}</Text>
                            <Text style={styles.statLabel}>Pending</Text>
                        </View>
                        <View style={styles.statCard}>
                            <Ionicons name="checkmark-circle-outline" size={24} color="#10b981" />
                            <Text style={styles.statNumber}>{summary?.approved || 0}</Text>
                            <Text style={styles.statLabel}>Approved</Text>
                        </View>
                        <View style={styles.statCard}>
                            <Ionicons name="close-circle-outline" size={24} color="#ef4444" />
                            <Text style={styles.statNumber}>{summary?.rejected || 0}</Text>
                            <Text style={styles.statLabel}>Rejected</Text>
                        </View>
                        <View style={styles.statCard}>
                            <Ionicons name="trash-outline" size={24} color="#94a3b8" />
                            <Text style={styles.statNumber}>{summary?.cancelled || 0}</Text>
                            <Text style={styles.statLabel}>Cancelled</Text>
                        </View>
                    </View>
                </View>

                {/* QUICK ACTIONS */}
                <View style={styles.actionsContainer}>
                    <Text style={styles.sectionTitle}>Quick Actions</Text>
                    <View style={styles.actionsGrid}>
                        <TouchableOpacity
                            style={[styles.actionCard, (!hasCompletedProfile || !isEligible) && styles.actionCardDisabled]}
                            onPress={() => {
                                if (hasCompletedProfile && isEligible) {
                                    setShowDevicesModal(true);
                                } else if (!hasCompletedProfile) {
                                    Alert.alert('Complete Profile', 'Please complete your profile first');
                                } else {
                                    Alert.alert('Not Eligible', 'Your account is not currently eligible for device applications');
                                }
                            }}
                            disabled={!hasCompletedProfile || !isEligible}
                        >
                            <View style={[styles.actionIcon, { backgroundColor: '#3b82f6' }]}>
                                <Ionicons name="phone-portrait-outline" size={24} color="white" />
                            </View>
                            <Text style={styles.actionTitle}>Browse Devices</Text>
                            <Text style={styles.actionDesc}>View and apply for available devices</Text>
                            {(!hasCompletedProfile || !isEligible) && (
                                <Text style={styles.lockedText}>
                                    {!hasCompletedProfile ? 'Complete profile' : 'Not eligible'}
                                </Text>
                            )}
                        </TouchableOpacity>

                        <TouchableOpacity
                            style={[styles.actionCard, !hasCompletedProfile && styles.actionCardDisabled]}
                            onPress={() => {
                                if (hasCompletedProfile) {
                                    setShowApplicationsModal(true);
                                }
                            }}
                            disabled={!hasCompletedProfile}
                        >
                            <View style={[styles.actionIcon, { backgroundColor: '#10b981' }]}>
                                <Ionicons name="list-outline" size={24} color="white" />
                            </View>
                            <Text style={styles.actionTitle}>My Applications</Text>
                            <Text style={styles.actionDesc}>Track your submitted applications</Text>
                            {!hasCompletedProfile && (
                                <Text style={styles.lockedText}>Complete profile</Text>
                            )}
                        </TouchableOpacity>
                    </View>
                </View>

                {/* RECENT APPLICATIONS */}
                {applications.length > 0 && (
                    <View style={styles.recentApplications}>
                        <View style={styles.sectionHeader}>
                            <Text style={styles.sectionTitle}>Recent Applications</Text>
                            <TouchableOpacity onPress={() => setShowApplicationsModal(true)}>
                                <Text style={styles.seeAllText}>See All</Text>
                            </TouchableOpacity>
                        </View>
                        {applications.slice(0, 3).map((app) => (
                            <TouchableOpacity
                                key={app.application_id}
                                style={styles.recentAppCard}
                                onPress={() => setShowApplicationsModal(true)}
                            >
                                <View style={styles.recentAppHeader}>
                                    <Text style={styles.recentAppDevice}>{app.device_name}</Text>
                                    <View style={[
                                        styles.recentAppStatus,
                                        app.application_status === 'Approved' && styles.statusApproved,
                                        app.application_status === 'Pending' && styles.statusPending,
                                        app.application_status === 'Rejected' && styles.statusRejected,
                                    ]}>
                                        <Text style={styles.recentAppStatusText}>{app.application_status}</Text>
                                    </View>
                                </View>
                                <Text style={styles.recentAppModel}>{app.model}</Text>
                                <Text style={styles.recentAppDate}>
                                    {new Date(app.submission_date).toLocaleDateString()}
                                </Text>
                            </TouchableOpacity>
                        ))}
                    </View>
                )}

                {/* ACCOUNT INFO */}
                <View style={styles.accountInfo}>
                    <Text style={styles.sectionTitle}>Account Information</Text>
                    <View style={styles.infoCard}>
                        <View style={styles.infoRow}>
                            <Text style={styles.infoLabel}>Status:</Text>
                            <View style={[
                                styles.statusBadge,
                                user?.registration_status === 'Verified' && styles.statusApproved,
                                user?.registration_status === 'Pending' && styles.statusPending,
                                user?.registration_status === 'Rejected' && styles.statusRejected,
                            ]}>
                                <Text style={styles.statusText}>
                                    {user?.registration_status?.replace('_', ' ') || 'Unknown'}
                                </Text>
                            </View>
                        </View>
                        <View style={styles.infoRow}>
                            <Text style={styles.infoLabel}>Eligibility:</Text>
                            <Text style={[
                                styles.eligibilityStatus,
                                isEligible ? styles.eligibleText : styles.notEligibleText
                            ]}>
                                {eligibilityLoading ? 'Checking...' : (isEligible ? 'Eligible' : 'Not Eligible')}
                            </Text>
                        </View>
                        {user?.user_type && (
                            <View style={styles.infoRow}>
                                <Text style={styles.infoLabel}>User Type:</Text>
                                <Text style={styles.infoValue}>{user.user_type}</Text>
                            </View>
                        )}
                    </View>
                </View>
            </ScrollView>

            {/* NOTIFICATIONS MODAL */}
            <Modal
                visible={showNotificationsModal}
                animationType="slide"
                transparent={true}
                onRequestClose={() => setShowNotificationsModal(false)}
            >
                <View style={styles.modalContainer}>
                    <View style={styles.slideUpModalContent}>
                        <View style={styles.slideUpModalHeader}>
                            <View style={styles.modalTitleRow}>
                                <Text style={styles.slideUpModalTitle}>
                                    Notifications {unreadCount > 0 && `(${unreadCount})`}
                                </Text>
                                {notifications.length > 0 && unreadCount > 0 && (
                                    <TouchableOpacity
                                        style={styles.markAllButton}
                                        onPress={handleMarkAllAsRead}
                                    >
                                        <Text style={styles.markAllText}>Mark all as read</Text>
                                    </TouchableOpacity>
                                )}
                            </View>
                            <TouchableOpacity
                                onPress={() => setShowNotificationsModal(false)}
                                hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
                            >
                                <Ionicons name="close" size={24} color="#64748b" />
                            </TouchableOpacity>
                        </View>

                        {notificationsLoading ? (
                            <View style={styles.loadingNotifications}>
                                <ActivityIndicator size="large" color="#1e3a8a" />
                                <Text style={styles.loadingText}>Loading notifications...</Text>
                            </View>
                        ) : notifications.length === 0 ? (
                            <View style={styles.emptyState}>
                                <Ionicons name="notifications-off-outline" size={64} color="#cbd5e1" />
                                <Text style={styles.emptyStateTitle}>No Notifications</Text>
                                <Text style={styles.emptyStateText}>
                                    You're all caught up! Check back later for updates.
                                </Text>
                            </View>
                        ) : (
                            <FlatList
                                data={notifications}
                                renderItem={renderNotificationItem}
                                keyExtractor={(item) => item.notification_id.toString()}
                                showsVerticalScrollIndicator={false}
                                contentContainerStyle={styles.notificationsList}
                                refreshing={notificationsLoading}
                                onRefresh={loadNotifications}
                            />
                        )}
                    </View>
                </View>
            </Modal>

            {/* DEVICES MODAL */}
            <Modal
                visible={showDevicesModal}
                animationType="slide"
                transparent={true}
            >
                <View style={styles.modalContainer}>
                    <View style={styles.slideUpModalContent}>
                        <View style={styles.slideUpModalHeader}>
                            <Text style={styles.slideUpModalTitle}>Available Devices</Text>
                            <TouchableOpacity onPress={() => setShowDevicesModal(false)}>
                                <Ionicons name="close" size={24} color="#64748b" />
                            </TouchableOpacity>
                        </View>

                        {devices.length === 0 ? (
                            <View style={styles.emptyState}>
                                <Ionicons name="phone-portrait-outline" size={48} color="#cbd5e1" />
                                <Text style={styles.emptyStateTitle}>No Devices Available</Text>
                                <Text style={styles.emptyStateText}>
                                    Check back later for available devices
                                </Text>
                            </View>
                        ) : (
                            <FlatList
                                data={devices}
                                renderItem={renderDeviceItem}
                                keyExtractor={(item) => item.device_id.toString()}
                                showsVerticalScrollIndicator={false}
                                contentContainerStyle={styles.devicesList}
                            />
                        )}
                    </View>
                </View>
            </Modal>

            {/* APPLICATIONS MODAL */}
            <Modal
                visible={showApplicationsModal}
                animationType="slide"
                transparent={true}
            >
                <View style={styles.modalContainer}>
                    <View style={styles.slideUpModalContent}>
                        <View style={styles.slideUpModalHeader}>
                            <Text style={styles.slideUpModalTitle}>My Applications</Text>
                            <TouchableOpacity onPress={() => setShowApplicationsModal(false)}>
                                <Ionicons name="close" size={24} color="#64748b" />
                            </TouchableOpacity>
                        </View>

                        {applications.length === 0 ? (
                            <View style={styles.emptyState}>
                                <Ionicons name="document-text-outline" size={48} color="#cbd5e1" />
                                <Text style={styles.emptyStateTitle}>No Applications</Text>
                                <Text style={styles.emptyStateText}>
                                    You haven't submitted any applications yet
                                </Text>
                                <TouchableOpacity
                                    style={styles.browseButton}
                                    onPress={() => {
                                        setShowApplicationsModal(false);
                                        setShowDevicesModal(true);
                                    }}
                                >
                                    <Text style={styles.browseButtonText}>Browse Devices</Text>
                                </TouchableOpacity>
                            </View>
                        ) : (
                            <FlatList
                                data={applications}
                                renderItem={renderApplicationItem}
                                keyExtractor={(item) => item.application_id.toString()}
                                showsVerticalScrollIndicator={false}
                                contentContainerStyle={styles.applicationsList}
                            />
                        )}
                    </View>
                </View>
            </Modal>

            {/* PROFILE COMPLETION MODAL */}
            <Modal visible={showProfileModal} transparent animationType="slide">
                <View style={styles.profileModalOverlay}>
                    <View style={styles.profileModalContent}>
                        <View style={styles.profileModalHeader}>
                            <View style={styles.profileModalIcon}>
                                <Ionicons name="person-circle-outline" size={40} color="#1e3a8a" />
                            </View>
                            <Text style={styles.profileModalTitle}>Complete Your Profile</Text>
                        </View>
                        <Text style={styles.profileModalText}>
                            Complete your profile to unlock device applications
                        </Text>
                        <View style={styles.modalButtons}>
                            <TouchableOpacity
                                style={styles.primaryButton}
                                onPress={() => {
                                    setShowProfileModal(false);
                                    navigation.navigate('CompleteProfile');
                                }}
                            >
                                <Text style={styles.primaryButtonText}>Complete Profile</Text>
                            </TouchableOpacity>
                            <TouchableOpacity
                                style={styles.secondaryButton}
                                onPress={() => setShowProfileModal(false)}
                            >
                                <Text style={styles.secondaryButtonText}>Later</Text>
                            </TouchableOpacity>
                        </View>
                    </View>
                </View>
            </Modal>
        </>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: "#f5f7fa",
    },
    loadingContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: '#f5f7fa',
    },
    loadingText: {
        marginTop: 12,
        fontSize: 16,
        color: '#64748b',
    },
    header: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'flex-start',
        padding: 20,
        backgroundColor: "#ffffff",
        minHeight: 100, // Add min height
    },
    userInfo: {
        flexDirection: 'row',
        alignItems: 'flex-start',
        flex: 1,
        marginRight: 16,
    },
    avatar: {
        width: 60,
        height: 60,
        borderRadius: 30,
        backgroundColor: "#1e3a8a",
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: 16,
    },
    avatarText: {
        fontSize: 24,
        fontWeight: 'bold',
        color: 'white',
    },
    welcome: {
        fontSize: 16,
        color: "#6b7280",
        marginBottom: 2,
    },
    name: {
        fontSize: 20,
        fontWeight: "bold",
        color: "#1e293b",
        marginBottom: 2,
        flexShrink:1,
    },
    email: {
        fontSize: 13,
        color: "#64748b",
        flexShrink:1,
    },
    eligibilityBanner: {
        flexDirection: 'row',
        alignItems: 'center',
        margin: 20,
        marginTop: 0,
        padding: 16,
        borderRadius: 12,
    },
    eligibleBanner: {
        backgroundColor: '#d1fae5',
        borderWidth: 1,
        borderColor: '#10b981',
    },
    notEligibleBanner: {
        backgroundColor: '#fef3c7',
        borderWidth: 1,
        borderColor: '#f59e0b',
    },
    eligibilityContent: {
        flex: 1,
        marginLeft: 12,
    },
    eligibilityTitle: {
        fontSize: 16,
        fontWeight: '600',
        marginBottom: 4,
    },
    eligibilityText: {
        fontSize: 14,
    },
    statsContainer: {
        padding: 20,
        paddingBottom: 0,
    },
    sectionTitle: {
        fontSize: 18,
        fontWeight: "600",
        color: "#1e293b",
        marginBottom: 16,
    },
    statsGrid: {
        flexDirection: "row",
        flexWrap: 'wrap',
        justifyContent: 'space-between',
        gap: 12,
    },
    statCard: {
        width: '18%', // Changed from 23% to 18% for 5 items
        minWidth: 70, // Reduced min width
        backgroundColor: "#fff",
        padding: 12, // Reduced padding
        borderRadius: 12,
        alignItems: 'center',
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
        elevation: 3,
    },
    statNumber: {
        fontSize: 21,
        fontWeight: "bold",
        color: "#1e293b",
        marginTop: 8,
        marginBottom: 4,
    },
    statLabel: {
        fontSize: 11,
        color: "#64748b",
        textAlign: 'center',
    },
    actionsContainer: {
        padding: 20,
        paddingTop: 0,
    },
    actionsGrid: {
        flexDirection: "row",
        justifyContent: "space-between",
        gap: 12,
    },
    actionCard: {
        flex: 1,
        backgroundColor: "#fff",
        padding: 20,
        borderRadius: 16,
        alignItems: 'center',
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.1,
        shadowRadius: 8,
        elevation: 4,
    },
    actionCardDisabled: {
        opacity: 0.6,
    },
    actionIcon: {
        width: 56,
        height: 56,
        borderRadius: 28,
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: 12,
    },
    actionTitle: {
        fontSize: 16,
        fontWeight: "600",
        color: "#1e293b",
        marginBottom: 8,
        textAlign: 'center',
    },
    actionDesc: {
        fontSize: 13,
        color: "#64748b",
        textAlign: 'center',
        marginBottom: 8,
    },
    lockedText: {
        fontSize: 11,
        color: "#ef4444",
        fontStyle: 'italic',
        textAlign: 'center',
    },
    recentApplications: {
        padding: 20,
        paddingTop: 0,
    },
    sectionHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 16,
    },
    seeAllText: {
        color: '#3b82f6',
        fontWeight: '500',
    },
    recentAppCard: {
        backgroundColor: '#fff',
        padding: 16,
        borderRadius: 12,
        marginBottom: 12,
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.05,
        shadowRadius: 3,
        elevation: 2,
    },
    recentAppHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 4,
    },
    recentAppDevice: {
        fontSize: 16,
        fontWeight: '600',
        color: '#1e293b',
        flex: 1,
    },
    recentAppStatus: {
        paddingHorizontal: 8,
        paddingVertical: 4,
        borderRadius: 6,
        marginLeft: 8,
    },
    recentAppStatusText: {
        fontSize: 11,
        fontWeight: '600',
        color: 'white',
    },
    recentAppModel: {
        fontSize: 14,
        color: '#64748b',
        marginBottom: 4,
    },
    recentAppDate: {
        fontSize: 12,
        color: '#94a3b8',
    },
    accountInfo: {
        padding: 20,
        paddingTop: 0,
        marginBottom: 30,
    },
    infoCard: {
        backgroundColor: "#fff",
        padding: 20,
        borderRadius: 16,
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.1,
        shadowRadius: 8,
        elevation: 4,
    },
    infoRow: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 12,
    },
    infoLabel: {
        width: 100,
        fontSize: 14,
        fontWeight: '500',
        color: "#64748b",
    },
    infoValue: {
        fontSize: 14,
        color: "#1f2937",
        fontWeight: '500',
    },
    statusBadge: {
        paddingHorizontal: 12,
        paddingVertical: 6,
        borderRadius: 12,
    },
    statusText: {
        color: "white",
        fontSize: 12,
        fontWeight: "600",
    },
    statusApproved: {
        backgroundColor: '#10b981',
    },
    statusPending: {
        backgroundColor: '#f59e0b',
    },
    statusRejected: {
        backgroundColor: '#ef4444',
    },
    statusCancelled: {
        backgroundColor: '#94a3b8',
    },
    eligibilityStatus: {
        fontSize: 14,
        fontWeight: '500',
    },
    eligibleText: {
        color: '#10b981',
    },
    notEligibleText: {
        color: '#ef4444',
    },
    modalContainer: {
        flex: 1,
        backgroundColor: 'rgba(0, 0, 0, 0.5)',
    },
    slideUpModalContent: {
        flex: 1,
        backgroundColor: '#f5f7fa',
        marginTop: 60,
        borderTopLeftRadius: 20,
        borderTopRightRadius: 20,
    },
    slideUpModalHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        padding: 20,
        borderBottomWidth: 1,
        borderBottomColor: '#e2e8f0',
        backgroundColor: 'white',
        borderTopLeftRadius: 20,
        borderTopRightRadius: 20,
    },
    slideUpModalTitle: {
        fontSize: 20,
        fontWeight: 'bold',
        color: '#1e293b',
    },
    profileModalOverlay: {
        flex: 1,
        backgroundColor: 'rgba(0, 0, 0, 0.5)',
        justifyContent: 'center',
        alignItems: 'center',
        padding: 20,
    },
    profileModalContent: {
        backgroundColor: 'white',
        borderRadius: 24,
        padding: 24,
        width: '100%',
        maxWidth: 400,
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 8 },
        shadowOpacity: 0.2,
        shadowRadius: 16,
        elevation: 10,
    },
    profileModalHeader: {
        alignItems: 'center',
        marginBottom: 24,
    },
    profileModalIcon: {
        marginBottom: 16,
    },
    profileModalTitle: {
        fontSize: 24,
        fontWeight: 'bold',
        color: '#1e293b',
        textAlign: 'center',
    },
    profileModalText: {
        fontSize: 16,
        color: '#4b5563',
        marginBottom: 24,
        textAlign: 'center',
    },
    modalButtons: {
        gap: 12,
    },
    primaryButton: {
        backgroundColor: '#1e3a8a',
        paddingVertical: 16,
        borderRadius: 12,
        alignItems: 'center',
    },
    primaryButtonText: {
        color: 'white',
        fontSize: 16,
        fontWeight: 'bold',
    },
    secondaryButton: {
        backgroundColor: '#f3f4f6',
        paddingVertical: 16,
        borderRadius: 12,
        alignItems: 'center',
    },
    secondaryButtonText: {
        color: '#4b5563',
        fontSize: 16,
        fontWeight: '600',
    },
    devicesList: {
        padding: 20,
    },
    deviceCard: {
        backgroundColor: 'white',
        borderRadius: 16,
        padding: 20,
        marginBottom: 16,
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.1,
        shadowRadius: 8,
        elevation: 4,
    },
    deviceHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'flex-start',
        marginBottom: 12,
    },
    deviceName: {
        fontSize: 18,
        fontWeight: 'bold',
        color: '#1e293b',
        flex: 1,
    },
    deviceModel: {
        fontSize: 14,
        color: '#64748b',
        backgroundColor: '#f3f4f6',
        paddingHorizontal: 8,
        paddingVertical: 4,
        borderRadius: 6,
    },
    deviceDetails: {
        marginBottom: 16,
    },
    deviceManufacturer: {
        fontSize: 14,
        color: '#6b7280',
        marginBottom: 4,
    },
    planName: {
        fontSize: 16,
        fontWeight: '600',
        color: '#1e293b',
        marginBottom: 4,
    },
    planDetails: {
        fontSize: 14,
        color: '#64748b',
        lineHeight: 20,
    },
    deviceFooter: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        marginBottom: 16,
    },
    costContainer: {
        flex: 1,
    },
    costLabel: {
        fontSize: 12,
        color: '#94a3b8',
        marginBottom: 2,
    },
    costValue: {
        fontSize: 20,
        fontWeight: 'bold',
        color: '#1e293b',
    },
    contractContainer: {
        alignItems: 'flex-end',
    },
    contractLabel: {
        fontSize: 12,
        color: '#94a3b8',
        marginBottom: 2,
    },
    contractValue: {
        fontSize: 16,
        fontWeight: '600',
        color: '#1e293b',
    },
    applyButton: {
        backgroundColor: '#1e3a8a',
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        paddingVertical: 14,
        borderRadius: 12,
        gap: 8,
    },
    applyButtonText: {
        color: 'white',
        fontSize: 16,
        fontWeight: 'bold',
    },
    applicationsList: {
        padding: 20,
    },
    applicationCard: {
        backgroundColor: 'white',
        borderRadius: 16,
        padding: 20,
        marginBottom: 16,
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.1,
        shadowRadius: 8,
        elevation: 4,
    },
    applicationHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 8,
    },
    applicationDeviceName: {
        fontSize: 18,
        fontWeight: 'bold',
        color: '#1e293b',
        flex: 1,
    },
    applicationModel: {
        fontSize: 14,
        color: '#64748b',
        marginBottom: 8,
    },
    applicationDetails: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 12,
    },
    applicationPlan: {
        fontSize: 16,
        fontWeight: '600',
        color: '#1e293b',
    },
    applicationCost: {
        fontSize: 16,
        fontWeight: '600',
        color: '#10b981',
    },
    applicationDate: {
        fontSize: 12,
        color: '#94a3b8',
        marginBottom: 12,
    },
    cancelAppButton: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        paddingVertical: 10,
        borderRadius: 8,
        borderWidth: 1,
        borderColor: '#ef4444',
        gap: 8,
        marginTop: 8,
    },
    cancelAppText: {
        color: '#ef4444',
        fontWeight: '600',
    },
    rejectionContainer: {
        marginTop: 12,
        padding: 12,
        backgroundColor: '#fef2f2',
        borderRadius: 8,
        borderWidth: 1,
        borderColor: '#fee2e2',
    },
    rejectionLabel: {
        fontSize: 12,
        fontWeight: '600',
        color: '#dc2626',
        marginBottom: 4,
    },
    rejectionReason: {
        fontSize: 14,
        color: '#7f1d1d',
    },
    emptyState: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        padding: 40,
    },
    emptyStateTitle: {
        fontSize: 20,
        fontWeight: 'bold',
        color: '#64748b',
        marginTop: 16,
        marginBottom: 8,
    },
    emptyStateText: {
        fontSize: 16,
        color: '#94a3b8',
        textAlign: 'center',
        marginBottom: 24,
    },
    browseButton: {
        backgroundColor: '#1e3a8a',
        paddingHorizontal: 24,
        paddingVertical: 12,
        borderRadius: 8,
    },
    browseButtonText: {
        color: 'white',
        fontWeight: 'bold',
    },
    // NEW STYLES FOR NOTIFICATIONS
    headerActions: {
        flexDirection: 'row',
        alignItems: 'flex-start',
        gap: 12,
        marginTop:4,
    },
    notificationButton: {
        position: 'relative',
        padding: 6,
    },
    notificationBadge: {
        position: 'absolute',
        top: 2,
        right: 4,
        backgroundColor: '#ef4444',
        borderRadius: 10,
        minWidth: 18,
        height: 18,
        justifyContent: 'center',
        alignItems: 'center',
        borderWidth: 1.5,
        borderColor: '#ffffff',
    },
    badgeText: {
        color: 'white',
        fontSize: 9,
        fontWeight: 'bold',
        paddingHorizontal: 4,
    },
    logoutButton: {
        padding: 7,
    },
    modalTitleRow: {
        flex: 1,
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
    },
    markAllButton: {
        paddingHorizontal: 12,
        paddingVertical: 6,
        backgroundColor: '#e5e7eb',
        borderRadius: 16,
    },
    markAllText: {
        fontSize: 12,
        color: '#4b5563',
        fontWeight: '500',
    },
    loadingNotifications: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        padding: 40,
    },
    notificationsList: {
        padding: 16,
    },
    notificationCard: {
        backgroundColor: 'white',
        borderRadius: 12,
        padding: 16,
        marginBottom: 12,
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.05,
        shadowRadius: 3,
        elevation: 2,
        borderLeftWidth: 4,
        borderLeftColor: '#e5e7eb',
    },
    unreadNotification: {
        borderLeftColor: '#3b82f6',
        backgroundColor: '#f0f9ff',
    },
    notificationHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'flex-start',
        marginBottom: 8,
    },
    notificationTitleRow: {
        flexDirection: 'row',
        alignItems: 'center',
        flex: 1,
    },
    notificationIcon: {
        marginRight: 8,
    },
    notificationTitle: {
        fontSize: 16,
        fontWeight: '600',
        color: '#1f2937',
        flex: 1,
    },
    notificationMessage: {
        fontSize: 14,
        color: '#4b5563',
        lineHeight: 20,
        marginBottom: 12,
    },
    notificationFooter: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
    },
    notificationTime: {
        fontSize: 12,
        color: '#94a3b8',
    },
    unreadBadge: {
        backgroundColor: '#3b82f6',
        paddingHorizontal: 8,
        paddingVertical: 2,
        borderRadius: 12,
    },
    unreadBadgeText: {
        color: 'white',
        fontSize: 10,
        fontWeight: '600',
    },
});