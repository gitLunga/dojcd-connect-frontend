import React, { useEffect, useState } from 'react';
import { 
    View, 
    Text, 
    StyleSheet, 
    TouchableOpacity, 
    ScrollView, 
    Alert, 
    Modal,
    Image,
    RefreshControl,
    ActivityIndicator
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { StackNavigationProp } from '@react-navigation/stack';
import { RootStackParamList } from '../../navigation/AppNavigator';
import { useNavigation } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import { authAPI } from '../../services/api';

type NavigationProp = StackNavigationProp<
    RootStackParamList,
    'DOJCDDashboard'
>;

export default function ClientDashboard() {
    const [user, setUser] = useState<any>(null);
    const [showProfileModal, setShowProfileModal] = useState(false);
    const [hasCompletedProfile, setHasCompletedProfile] = useState(false);
    const [refreshing, setRefreshing] = useState(false);
    const [loading, setLoading] = useState(true);
    const navigation = useNavigation<NavigationProp>();

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
            }
        } catch (error) {
            console.error('Error loading user:', error);
        } finally {
            setLoading(false);
        }
    };

    const onRefresh = async () => {
        setRefreshing(true);
        await loadUser();
        setRefreshing(false);
    };

    const checkProfileCompletion = (userData: any) => {
        try {
            // Check registration_status
            if (userData.registration_status === 'Profile_Completed' || 
                userData.registration_status === 'Verified' || 
                userData.registration_status === 'Rejected') {
                setHasCompletedProfile(true);
                setShowProfileModal(false);
            } else if (userData.registration_status === 'Pending') {
                setShowProfileModal(true);
                setHasCompletedProfile(false);
            } else {
                // For other cases, check if profile fields are filled
                const hasProfileFields = userData.network_provider && 
                                         userData.contract_duration_months && 
                                         userData.contract_end_date;
                
                if (!hasProfileFields) {
                    setShowProfileModal(true);
                    setHasCompletedProfile(false);
                } else {
                    setHasCompletedProfile(true);
                    setShowProfileModal(false);
                }
            }
        } catch (error) {
            console.log('Error checking profile:', error);
        }
    };

    const handleProfileComplete = () => {
        setShowProfileModal(false);
        navigation.navigate('CompleteProfile');
    };

    const handleSkipForNow = async () => {
        setShowProfileModal(false);
        await AsyncStorage.setItem('profile_skipped', 'true');
    };

    const handleLogout = () => {
        Alert.alert(
            'Confirm Logout',
            'Are you sure you want to logout?',
            [
                {
                    text: 'Cancel',
                    style: 'cancel',
                    onPress: () => {
                        console.log('❎ Logout cancelled by user');
                    },
                },
                {
                    text: 'Logout',
                    style: 'destructive',
                    onPress: async () => {
                        try {
                            await AsyncStorage.removeItem('user');
                            await AsyncStorage.removeItem('profile_skipped');
                            
                            Alert.alert('Logged Out', 'You have been logged out successfully');

                            navigation.reset({
                                index: 0,
                                routes: [{ name: 'Login' }],
                            });
                        } catch (error) {
                            console.log('❌ Logout error:', error);
                            Alert.alert('Error', 'Failed to logout');
                        }
                    },
                },
            ],
            { cancelable: true }
        );
    };

    const renderStatusBadge = (status: string = 'Pending') => {
        const colors: any = {
            'Pending': '#f59e0b',
            'Profile_Completed': '#10b981',
            'Verified': '#3b82f6',
            'Rejected': '#ef4444'
        };

        return (
            <View style={[styles.statusBadge, { backgroundColor: colors[status] || '#6b7280' }]}>
                <Text style={styles.statusBadgeText}>{status.replace('_', ' ')}</Text>
            </View>
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
                {/* HEADER */}
                <View style={styles.header}>
                    <View style={styles.userInfo}>
                        <View style={styles.avatar}>
                            <Text style={styles.avatarText}>
                                {user?.first_name?.[0]}{user?.last_name?.[0]}
                            </Text>
                        </View>
                        <View>
                            <Text style={styles.welcome}>Welcome Back 👋</Text>
                            <Text style={styles.name}>
                                {user?.first_name || 'Client'} {user?.last_name || ''}
                            </Text>
                            <Text style={styles.email}>{user?.email || ''}</Text>
                        </View>
                    </View>

                    <TouchableOpacity 
                        style={styles.logoutButton} 
                        onPress={handleLogout}
                    >
                        <Ionicons name="log-out-outline" size={24} color="#ef4444" />
                    </TouchableOpacity>
                </View>

                {/* PROFILE WARNING */}
                {!hasCompletedProfile && (
                    <TouchableOpacity 
                        style={styles.profileWarning}
                        onPress={() => navigation.navigate('CompleteProfile')}
                    >
                        <View style={styles.warningIcon}>
                            <Ionicons name="alert-circle" size={20} color="#92400e" />
                        </View>
                        <View style={styles.warningContent}>
                            <Text style={styles.warningTitle}>Complete Your Profile</Text>
                            <Text style={styles.warningText}>
                                Add contract details to unlock all features
                            </Text>
                        </View>
                        <Ionicons name="chevron-forward" size={20} color="#92400e" />
                    </TouchableOpacity>
                )}

                {/* QUICK STATS */}
                <View style={styles.statsContainer}>
                    <Text style={styles.sectionTitle}>Quick Stats</Text>
                    <View style={styles.statsGrid}>
                        <View style={styles.statCard}>
                            <Ionicons name="document-text-outline" size={24} color="#3b82f6" />
                            <Text style={styles.statNumber}>0</Text>
                            <Text style={styles.statLabel}>Applications</Text>
                        </View>
                        <View style={styles.statCard}>
                            <Ionicons name="time-outline" size={24} color="#f59e0b" />
                            <Text style={styles.statNumber}>0</Text>
                            <Text style={styles.statLabel}>Pending</Text>
                        </View>
                        <View style={styles.statCard}>
                            <Ionicons name="checkmark-circle-outline" size={24} color="#10b981" />
                            <Text style={styles.statNumber}>0</Text>
                            <Text style={styles.statLabel}>Approved</Text>
                        </View>
                    </View>
                </View>

                {/* QUICK ACTIONS */}
                <View style={styles.actionsContainer}>
                    <Text style={styles.sectionTitle}>Quick Actions</Text>
                    <View style={styles.actionsGrid}>
                        <TouchableOpacity 
                            style={[styles.actionCard, !hasCompletedProfile && styles.actionCardDisabled]}
                            onPress={() => {
                                if (hasCompletedProfile) {
                                    // Navigate to upload invoice
                                    Alert.alert('Coming Soon', 'Upload feature will be available soon');
                                } else {
                                    Alert.alert('Complete Profile', 'Please complete your profile first');
                                }
                            }}
                            disabled={!hasCompletedProfile}
                        >
                            <View style={[styles.actionIcon, { backgroundColor: '#3b82f6' }]}>
                                <Ionicons name="cloud-upload-outline" size={24} color="white" />
                            </View>
                            <Text style={styles.actionTitle}>Upload Invoice</Text>
                            <Text style={styles.actionDesc}>Submit invoices for processing</Text>
                            {!hasCompletedProfile && (
                                <Text style={styles.lockedText}>Complete profile to unlock</Text>
                            )}
                        </TouchableOpacity>

                        <TouchableOpacity 
                            style={[styles.actionCard, !hasCompletedProfile && styles.actionCardDisabled]}
                            onPress={() => {
                                if (hasCompletedProfile) {
                                    Alert.alert('Coming Soon', 'Status tracking will be available soon');
                                }
                            }}
                            disabled={!hasCompletedProfile}
                        >
                            <View style={[styles.actionIcon, { backgroundColor: '#10b981' }]}>
                                <Ionicons name="analytics-outline" size={24} color="white" />
                            </View>
                            <Text style={styles.actionTitle}>View Status</Text>
                            <Text style={styles.actionDesc}>Track application progress</Text>
                            {!hasCompletedProfile && (
                                <Text style={styles.lockedText}>Complete profile to unlock</Text>
                            )}
                        </TouchableOpacity>
                    </View>
                </View>

                {/* NOTIFICATIONS */}
                <View style={styles.notificationsContainer}>
                    <Text style={styles.sectionTitle}>Notifications</Text>
                    <View style={styles.notificationCard}>
                        <View style={styles.notificationIcon}>
                            <Ionicons name="notifications-outline" size={24} color="#3b82f6" />
                        </View>
                        <View style={styles.notificationContent}>
                            <Text style={styles.notificationTitle}>No new notifications</Text>
                            <Text style={styles.notificationText}>
                                You are all caught up! Check back later for updates.
                            </Text>
                        </View>
                    </View>
                </View>

                {/* NEXT STEPS */}
                <View style={styles.nextStepsContainer}>
                    <Text style={styles.sectionTitle}>Next Steps</Text>
                    <View style={styles.nextStepsCard}>
                        {!hasCompletedProfile ? (
                            <>
                                <View style={styles.nextStepItem}>
                                    <Ionicons name="checkmark-circle" size={20} color="#10b981" />
                                    <Text style={styles.nextStepText}>Complete your profile setup</Text>
                                </View>
                                <View style={styles.nextStepItem}>
                                    <Ionicons name="document-outline" size={20} color="#6b7280" />
                                    <Text style={styles.nextStepText}>Submit your first invoice</Text>
                                </View>
                                <View style={styles.nextStepItem}>
                                    <Ionicons name="time-outline" size={20} color="#6b7280" />
                                    <Text style={styles.nextStepText}>Check application status</Text>
                                </View>
                            </>
                        ) : (
                            <>
                                <View style={styles.nextStepItem}>
                                    <Ionicons name="checkmark-circle" size={20} color="#10b981" />
                                    <Text style={styles.nextStepText}>Profile completed ✓</Text>
                                </View>
                                <View style={styles.nextStepItem}>
                                    <Ionicons name="document-outline" size={20} color="#6b7280" />
                                    <Text style={styles.nextStepText}>Submit your first invoice</Text>
                                </View>
                                <View style={styles.nextStepItem}>
                                    <Ionicons name="time-outline" size={20} color="#6b7280" />
                                    <Text style={styles.nextStepText}>Track your application</Text>
                                </View>
                            </>
                        )}
                    </View>
                </View>

                {/* ACCOUNT INFO */}
                <View style={styles.accountInfo}>
                    <Text style={styles.sectionTitle}>Account Information</Text>
                    <View style={styles.infoCard}>
                        <View style={styles.infoRow}>
                            <Text style={styles.infoLabel}>Status:</Text>
                            {renderStatusBadge(user?.registration_status)}
                        </View>
                        <View style={styles.infoRow}>
                            <Text style={styles.infoLabel}>User Type:</Text>
                            <Text style={styles.infoValue}>{user?.user_type || 'Client'}</Text>
                        </View>
                        {user?.region && (
                            <View style={styles.infoRow}>
                                <Text style={styles.infoLabel}>Region:</Text>
                                <Text style={styles.infoValue}>{user.region}</Text>
                            </View>
                        )}
                        {user?.persal_id && (
                            <View style={styles.infoRow}>
                                <Text style={styles.infoLabel}>Persal ID:</Text>
                                <Text style={styles.infoValue}>{user.persal_id}</Text>
                            </View>
                        )}
                    </View>
                </View>
            </ScrollView>

            {/* PROFILE COMPLETION MODAL */}
            <Modal
                visible={showProfileModal}
                transparent={true}
                animationType="slide"
            >
                <View style={styles.modalOverlay}>
                    <View style={styles.modalContent}>
                        <View style={styles.modalHeader}>
                            <View style={styles.modalIcon}>
                                <Ionicons name="person-circle-outline" size={40} color="#1e3a8a" />
                            </View>
                            <Text style={styles.modalTitle}>Complete Your Profile</Text>
                            <Text style={styles.modalSubtitle}>
                                Welcome! Let's set up your account
                            </Text>
                        </View>

                        <View style={styles.modalBody}>
                            <Text style={styles.modalText}>
                                To get started, please complete your profile by providing:
                            </Text>
                            
                            <View style={styles.requirementsList}>
                                <View style={styles.requirementItem}>
                                    <Ionicons name="checkmark-circle" size={20} color="#10b981" />
                                    <Text style={styles.requirementText}>✓ Personal information (Done)</Text>
                                </View>
                                <View style={styles.requirementItem}>
                                    <Ionicons name="cellular-outline" size={20} color="#6b7280" />
                                    <Text style={styles.requirementText}>Network provider details</Text>
                                </View>
                                <View style={styles.requirementItem}>
                                    <Ionicons name="calendar-outline" size={20} color="#6b7280" />
                                    <Text style={styles.requirementText}>Contract information</Text>
                                </View>
                                <View style={styles.requirementItem}>
                                    <Ionicons name="document-outline" size={20} color="#6b7280" />
                                    <Text style={styles.requirementText}>Upload an invoice</Text>
                                </View>
                            </View>

                            <Text style={styles.modalNote}>
                                This information is required for device procurement requests.
                            </Text>
                        </View>

                        <View style={styles.modalButtons}>
                            <TouchableOpacity 
                                style={styles.primaryButton}
                                onPress={handleProfileComplete}
                            >
                                <Ionicons name="checkmark-circle" size={20} color="white" />
                                <Text style={styles.primaryButtonText}>Complete Profile Now</Text>
                            </TouchableOpacity>
                            
                            <TouchableOpacity 
                                style={styles.secondaryButton}
                                onPress={handleSkipForNow}
                            >
                                <Text style={styles.secondaryButtonText}>Skip for now</Text>
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
        alignItems: 'center',
        padding: 20,
        backgroundColor: "#ffffff",
        borderBottomWidth: 1,
        borderBottomColor: "#e2e8f0",
    },
    userInfo: {
        flexDirection: 'row',
        alignItems: 'center',
        flex: 1,
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
        fontSize: 24,
        fontWeight: "bold",
        color: "#1e293b",
        marginBottom: 2,
    },
    email: {
        fontSize: 14,
        color: "#64748b",
    },
    logoutButton: {
        padding: 8,
    },
    profileWarning: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#fef3c7',
        margin: 20,
        marginTop: 0,
        padding: 16,
        borderRadius: 12,
        borderWidth: 1,
        borderColor: '#f59e0b',
    },
    warningIcon: {
        marginRight: 12,
    },
    warningContent: {
        flex: 1,
    },
    warningTitle: {
        fontSize: 16,
        fontWeight: '600',
        color: '#92400e',
        marginBottom: 4,
    },
    warningText: {
        fontSize: 14,
        color: '#92400e',
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
        justifyContent: "space-between",
        gap: 12,
    },
    statCard: {
        flex: 1,
        backgroundColor: "#fff",
        padding: 16,
        borderRadius: 12,
        alignItems: 'center',
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
        elevation: 3,
    },
    statNumber: {
        fontSize: 24,
        fontWeight: "bold",
        color: "#1e293b",
        marginTop: 8,
        marginBottom: 4,
    },
    statLabel: {
        fontSize: 12,
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
    notificationsContainer: {
        padding: 20,
        paddingTop: 0,
    },
    notificationCard: {
        backgroundColor: "#fff",
        padding: 20,
        borderRadius: 16,
        flexDirection: 'row',
        alignItems: 'center',
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.1,
        shadowRadius: 8,
        elevation: 4,
    },
    notificationIcon: {
        marginRight: 16,
    },
    notificationContent: {
        flex: 1,
    },
    notificationTitle: {
        fontSize: 16,
        fontWeight: "600",
        color: "#1e293b",
        marginBottom: 4,
    },
    notificationText: {
        fontSize: 14,
        color: "#64748b",
    },
    nextStepsContainer: {
        padding: 20,
        paddingTop: 0,
    },
    nextStepsCard: {
        backgroundColor: "#fff",
        padding: 20,
        borderRadius: 16,
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.1,
        shadowRadius: 8,
        elevation: 4,
    },
    nextStepItem: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 12,
    },
    nextStepText: {
        fontSize: 14,
        color: "#374151",
        marginLeft: 12,
        flex: 1,
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
        width: 80,
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
        alignSelf: 'flex-start',
    },
    statusBadgeText: {
        color: "white",
        fontSize: 12,
        fontWeight: "600",
    },
    modalOverlay: {
        flex: 1,
        backgroundColor: 'rgba(0, 0, 0, 0.5)',
        justifyContent: 'center',
        alignItems: 'center',
        padding: 20,
    },
    modalContent: {
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
    modalHeader: {
        alignItems: 'center',
        marginBottom: 24,
    },
    modalIcon: {
        marginBottom: 16,
    },
    modalTitle: {
        fontSize: 24,
        fontWeight: 'bold',
        color: '#1e293b',
        marginBottom: 8,
        textAlign: 'center',
    },
    modalSubtitle: {
        fontSize: 16,
        color: '#6b7280',
        textAlign: 'center',
    },
    modalBody: {
        marginBottom: 24,
    },
    modalText: {
        fontSize: 16,
        color: '#4b5563',
        marginBottom: 20,
        lineHeight: 24,
        textAlign: 'center',
    },
    requirementsList: {
        marginBottom: 20,
    },
    requirementItem: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 12,
    },
    requirementText: {
        fontSize: 15,
        color: '#374151',
        marginLeft: 12,
        flex: 1,
    },
    modalNote: {
        fontSize: 14,
        color: '#6b7280',
        fontStyle: 'italic',
        textAlign: 'center',
        lineHeight: 20,
    },
    modalButtons: {
        gap: 12,
    },
    primaryButton: {
        backgroundColor: '#1e3a8a',
        paddingVertical: 16,
        borderRadius: 12,
        alignItems: 'center',
        flexDirection: 'row',
        justifyContent: 'center',
        gap: 8,
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
});