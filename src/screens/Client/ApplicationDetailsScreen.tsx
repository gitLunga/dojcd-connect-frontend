import React, { useState, useEffect } from 'react';
import {
    View,
    Text,
    StyleSheet,
    ScrollView,
    ActivityIndicator,
    Alert,
    TouchableOpacity
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { deviceAPI } from '../../services/api';
import { StackNavigationProp } from '@react-navigation/stack';
import { RootStackParamList } from '../../navigation/AppNavigator';
import { RouteProp, useNavigation, useRoute } from '@react-navigation/native';

type NavigationProp = StackNavigationProp<RootStackParamList, 'ApplicationDetails'>;
type RouteProps = RouteProp<RootStackParamList, 'ApplicationDetails'>;

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

export default function ApplicationDetailsScreen() {
    const [application, setApplication] = useState<ApplicationDetails | null>(null);
    const [loading, setLoading] = useState(true);
    const [user, setUser] = useState<any>(null);
    const navigation = useNavigation<NavigationProp>();
    const route = useRoute<RouteProps>();
    const { applicationId } = route.params;

    useEffect(() => {
        loadApplicationDetails();
    }, [applicationId]);

    const loadApplicationDetails = async () => {
        try {
            const userData = await AsyncStorage.getItem('user');
            if (userData) {
                const parsedUser = JSON.parse(userData);
                setUser(parsedUser);

                const response = await deviceAPI.getApplicationDetails(
                    parsedUser.client_user_id,
                    applicationId
                );
                setApplication(response.data.data);
            }
        } catch (error) {
            console.error('Error loading application details:', error);
            Alert.alert('Error', 'Failed to load application details');
        } finally {
            setLoading(false);
        }
    };

    const handleCancelApplication = async () => {
        if (!user?.client_user_id || !application) return;

        Alert.alert(
            'Cancel Application',
            'Are you sure you want to cancel this application? This action cannot be undone.',
            [
                { text: 'No', style: 'cancel' },
                {
                    text: 'Yes, Cancel',
                    style: 'destructive',
                    onPress: async () => {
                        try {
                            const response = await deviceAPI.cancelApplication(
                                user.client_user_id,
                                application.application_id
                            );

                            if (response.data.success) {
                                Alert.alert(
                                    'Success',
                                    'Application cancelled successfully',
                                    [{ text: 'OK', onPress: () => navigation.goBack() }]
                                );
                            } else {
                                Alert.alert('Error', response.data.message);
                            }
                        } catch (error: any) {
                            Alert.alert('Error', error.message);
                        }
                    }
                }
            ]
        );
    };

    const getStatusColor = (status: string) => {
        switch (status) {
            case 'Approved': return '#10b981';
            case 'Pending': return '#f59e0b';
            case 'Rejected': return '#ef4444';
            case 'Cancelled': return '#94a3b8';
            default: return '#64748b';
        }
    };

    const getStatusIcon = (status: string) => {
        switch (status) {
            case 'Approved': return 'checkmark-circle';
            case 'Pending': return 'time';
            case 'Rejected': return 'close-circle';
            case 'Cancelled': return 'close-circle';
            default: return 'help-circle';
        }
    };

    const formatDate = (dateString: string) => {
        const date = new Date(dateString);
        return date.toLocaleDateString('en-US', {
            year: 'numeric',
            month: 'long',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        });
    };

    if (loading) {
        return (
            <View style={styles.loadingContainer}>
                <ActivityIndicator size="large" color="#1e3a8a" />
                <Text style={styles.loadingText}>Loading application details...</Text>
            </View>
        );
    }

    if (!application) {
        return (
            <View style={styles.errorContainer}>
                <Ionicons name="alert-circle-outline" size={64} color="#ef4444" />
                <Text style={styles.errorTitle}>Application Not Found</Text>
                <Text style={styles.errorText}>
                    The application you're looking for doesn't exist or you don't have permission to view it.
                </Text>
                <TouchableOpacity
                    style={styles.backButton}
                    onPress={() => navigation.goBack()}
                >
                    <Text style={styles.backButtonText}>Back to Applications</Text>
                </TouchableOpacity>
            </View>
        );
    }

    return (
        <ScrollView style={styles.container}>
            {/* Header */}
            <View style={styles.header}>
                <TouchableOpacity
                    style={styles.backButton}
                    onPress={() => navigation.goBack()}
                >
                    <Ionicons name="arrow-back" size={24} color="#1e293b" />
                </TouchableOpacity>
                <Text style={styles.headerTitle}>Application Details</Text>
                <View style={{ width: 40 }} />
            </View>

            {/* Application Status Card */}
            <View style={styles.statusCard}>
                <View style={styles.statusHeader}>
                    <Ionicons
                        name={getStatusIcon(application.application_status)}
                        size={32}
                        color={getStatusColor(application.application_status)}
                    />
                    <View style={styles.statusTextContainer}>
                        <Text style={styles.statusTitle}>Application Status</Text>
                        <View style={[styles.statusBadge, { backgroundColor: getStatusColor(application.application_status) }]}>
                            <Text style={styles.statusBadgeText}>{application.application_status}</Text>
                        </View>
                    </View>
                </View>

                <View style={styles.statusDetails}>
                    <View style={styles.statusDetailRow}>
                        <Text style={styles.statusDetailLabel}>Submitted:</Text>
                        <Text style={styles.statusDetailValue}>{formatDate(application.submission_date)}</Text>
                    </View>
                    <View style={styles.statusDetailRow}>
                        <Text style={styles.statusDetailLabel}>Last Updated:</Text>
                        <Text style={styles.statusDetailValue}>{formatDate(application.last_updated)}</Text>
                    </View>
                    <View style={styles.statusDetailRow}>
                        <Text style={styles.statusDetailLabel}>Application ID:</Text>
                        <Text style={styles.statusDetailValue}>#{application.application_id}</Text>
                    </View>
                </View>

                {application.application_status === 'Pending' && (
                    <TouchableOpacity
                        style={styles.cancelButton}
                        onPress={handleCancelApplication}
                    >
                        <Ionicons name="close-circle-outline" size={20} color="#ef4444" />
                        <Text style={styles.cancelButtonText}>Cancel Application</Text>
                    </TouchableOpacity>
                )}
            </View>

            {/* Device Details Card */}
            <View style={styles.card}>
                <Text style={styles.cardTitle}>Device Information</Text>

                <View style={styles.deviceHeader}>
                    <View style={styles.deviceInfo}>
                        <Text style={styles.deviceName}>{application.device_name}</Text>
                        <Text style={styles.deviceModel}>{application.model}</Text>
                    </View>
                    <View style={styles.priceContainer}>
                        <Text style={styles.price}>R{application.monthly_cost}</Text>
                        <Text style={styles.priceLabel}>/month</Text>
                    </View>
                </View>

                <View style={styles.detailRow}>
                    <Ionicons name="business-outline" size={16} color="#64748b" />
                    <Text style={styles.detailLabel}>Manufacturer:</Text>
                    <Text style={styles.detailValue}>{application.manufacturer}</Text>
                </View>

                <View style={styles.detailRow}>
                    <Ionicons name="document-text-outline" size={16} color="#64748b" />
                    <Text style={styles.detailLabel}>Plan Name:</Text>
                    <Text style={styles.detailValue}>{application.plan_name}</Text>
                </View>

                <View style={styles.detailRow}>
                    <Ionicons name="calendar-outline" size={16} color="#64748b" />
                    <Text style={styles.detailLabel}>Contract Duration:</Text>
                    <Text style={styles.detailValue}>{application.contract_duration_months} months</Text>
                </View>

                <View style={styles.planDetailsContainer}>
                    <Text style={styles.planDetailsLabel}>Plan Details:</Text>
                    <Text style={styles.planDetails}>{application.plan_details}</Text>
                </View>
            </View>

            {/* Applicant Information Card */}
            <View style={styles.card}>
                <Text style={styles.cardTitle}>Applicant Information</Text>

                <View style={styles.detailRow}>
                    <Ionicons name="person-outline" size={16} color="#64748b" />
                    <Text style={styles.detailLabel}>Name:</Text>
                    <Text style={styles.detailValue}>{application.first_name} {application.last_name}</Text>
                </View>

                <View style={styles.detailRow}>
                    <Ionicons name="mail-outline" size={16} color="#64748b" />
                    <Text style={styles.detailLabel}>Email:</Text>
                    <Text style={styles.detailValue}>{application.email}</Text>
                </View>

                {application.phone_number && (
                    <View style={styles.detailRow}>
                        <Ionicons name="call-outline" size={16} color="#64748b" />
                        <Text style={styles.detailLabel}>Phone:</Text>
                        <Text style={styles.detailValue}>{application.phone_number}</Text>
                    </View>
                )}

                {application.region && (
                    <View style={styles.detailRow}>
                        <Ionicons name="location-outline" size={16} color="#64748b" />
                        <Text style={styles.detailLabel}>Region:</Text>
                        <Text style={styles.detailValue}>{application.region}</Text>
                    </View>
                )}

                {application.persal_id && (
                    <View style={styles.detailRow}>
                        <Ionicons name="card-outline" size={16} color="#64748b" />
                        <Text style={styles.detailLabel}>Personal ID:</Text>
                        <Text style={styles.detailValue}>{application.persal_id}</Text>
                    </View>
                )}
            </View>

            {/* Rejection Reason (if rejected) */}
            {application.rejection_reason && (
                <View style={[styles.card, styles.rejectionCard]}>
                    <Text style={styles.rejectionTitle}>
                        <Ionicons name="alert-circle-outline" size={18} color="#dc2626" /> Rejection Reason
                    </Text>
                    <Text style={styles.rejectionReason}>{application.rejection_reason}</Text>
                </View>
            )}

            {/* Application Timeline (Optional - you can expand this later) */}
            <View style={styles.card}>
                <Text style={styles.cardTitle}>Application Timeline</Text>

                <View style={styles.timeline}>
                    <View style={styles.timelineItem}>
                        <View style={styles.timelineDot} />
                        <View style={styles.timelineContent}>
                            <Text style={styles.timelineTitle}>Application Submitted</Text>
                            <Text style={styles.timelineDate}>{formatDate(application.submission_date)}</Text>
                        </View>
                    </View>

                    <View style={styles.timelineItem}>
                        <View style={[styles.timelineDot, { backgroundColor: application.application_status !== 'Pending' ? '#10b981' : '#cbd5e1' }]} />
                        <View style={styles.timelineContent}>
                            <Text style={styles.timelineTitle}>Under Review</Text>
                            <Text style={styles.timelineDate}>
                                {application.application_status !== 'Pending' ?
                                    formatDate(application.last_updated) : 'In progress...'}
                            </Text>
                        </View>
                    </View>

                    {application.application_status === 'Approved' && (
                        <View style={styles.timelineItem}>
                            <View style={styles.timelineDot} />
                            <View style={styles.timelineContent}>
                                <Text style={styles.timelineTitle}>Approved</Text>
                                <Text style={styles.timelineDate}>{formatDate(application.last_updated)}</Text>
                            </View>
                        </View>
                    )}

                    {application.application_status === 'Rejected' && (
                        <View style={styles.timelineItem}>
                            <View style={styles.timelineDot} />
                            <View style={styles.timelineContent}>
                                <Text style={styles.timelineTitle}>Decision Made</Text>
                                <Text style={styles.timelineDate}>{formatDate(application.last_updated)}</Text>
                            </View>
                        </View>
                    )}
                </View>
            </View>

            {/* Contact Information */}
            <View style={[styles.card, styles.contactCard]}>
                <View style={styles.contactHeader}>
                    <Ionicons name="help-circle-outline" size={24} color="#3b82f6" />
                    <Text style={styles.contactTitle}>Need Help?</Text>
                </View>
                <Text style={styles.contactText}>
                    If you have any questions about your application, please contact our support team.
                </Text>
                <Text style={styles.contactEmail}>support@dojcd.gov.za</Text>
            </View>

            <View style={styles.bottomSpacing} />
        </ScrollView>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#f8fafc',
    },
    loadingContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: '#f8fafc',
    },
    loadingText: {
        marginTop: 16,
        fontSize: 15,
        color: '#64748b',
        fontWeight: '500',
        letterSpacing: 0.3,
    },
    errorContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        padding: 40,
        backgroundColor: '#f8fafc',
    },
    errorTitle: {
        fontSize: 24,
        fontWeight: '700',
        color: '#1e293b',
        marginTop: 24,
        marginBottom: 12,
        letterSpacing: -0.3,
    },
    errorText: {
        fontSize: 15,
        color: '#64748b',
        textAlign: 'center',
        lineHeight: 22,
        marginBottom: 32,
        fontWeight: '400',
    },
    // Enhanced Header
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingHorizontal: 20,
        paddingVertical: 24,
        backgroundColor: 'white',
        borderBottomWidth: 1,
        borderBottomColor: '#f1f5f9',
        shadowColor: "#1e3a8a",
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.05,
        shadowRadius: 8,
        elevation: 3,
    },
    backButton: {
        width: 44,
        height: 44,
        borderRadius: 22,
        backgroundColor: '#f8fafc',
        justifyContent: 'center',
        alignItems: 'center',
    },
    headerTitle: {
        fontSize: 20,
        fontWeight: '700',
        color: '#1e293b',
        letterSpacing: -0.3,
    },
    // Enhanced Status Card
    statusCard: {
        backgroundColor: 'white',
        margin: 20,
        padding: 24,
        borderRadius: 18,
        shadowColor: "#1e3a8a",
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.08,
        shadowRadius: 12,
        elevation: 4,
        borderWidth: 1,
        borderColor: '#f1f5f9',
    },
    statusHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 20,
    },
    statusTextContainer: {
        marginLeft: 16,
        flex: 1,
    },
    statusTitle: {
        fontSize: 14,
        color: '#64748b',
        marginBottom: 6,
        fontWeight: '500',
        letterSpacing: 0.3,
    },
    statusBadge: {
        alignSelf: 'flex-start',
        paddingHorizontal: 14,
        paddingVertical: 8,
        borderRadius: 20,
    },
    statusBadgeText: {
        color: 'white',
        fontSize: 13,
        fontWeight: '700',
        letterSpacing: 0.5,
    },
    statusDetails: {
        backgroundColor: '#f8fafc',
        padding: 20,
        borderRadius: 14,
        marginBottom: 20,
        borderWidth: 1,
        borderColor: '#f1f5f9',
    },
    statusDetailRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        marginBottom: 10,
        paddingBottom: 10,
        borderBottomWidth: 1,
        borderBottomColor: '#f1f5f9',
    },
    statusDetailLabel: {
        fontSize: 14,
        color: '#64748b',
        fontWeight: '400',
    },
    statusDetailValue: {
        fontSize: 14,
        color: '#1e293b',
        fontWeight: '600',
    },
    cancelButton: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        paddingVertical: 16,
        borderRadius: 12,
        borderWidth: 1,
        borderColor: '#fee2e2',
        backgroundColor: '#fef2f2',
        gap: 10,
    },
    cancelButtonText: {
        color: '#ef4444',
        fontSize: 16,
        fontWeight: '700',
    },
    // Enhanced Cards
    card: {
        backgroundColor: 'white',
        marginHorizontal: 20,
        marginBottom: 20,
        padding: 24,
        borderRadius: 18,
        shadowColor: "#1e3a8a",
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.08,
        shadowRadius: 12,
        elevation: 4,
        borderWidth: 1,
        borderColor: '#f1f5f9',
    },
    cardTitle: {
        fontSize: 18,
        fontWeight: '700',
        color: '#1e293b',
        marginBottom: 20,
        letterSpacing: -0.3,
    },
    deviceHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'flex-start',
        marginBottom: 20,
    },
    deviceInfo: {
        flex: 1,
    },
    deviceName: {
        fontSize: 20,
        fontWeight: '800',
        color: '#1e293b',
        marginBottom: 6,
    },
    deviceModel: {
        fontSize: 14,
        color: '#64748b',
        backgroundColor: '#f3f4f6',
        alignSelf: 'flex-start',
        paddingHorizontal: 10,
        paddingVertical: 5,
        borderRadius: 20,
        fontWeight: '500',
    },
    priceContainer: {
        alignItems: 'flex-end',
    },
    price: {
        fontSize: 24,
        fontWeight: '800',
        color: '#10b981',
    },
    priceLabel: {
        fontSize: 12,
        color: '#94a3b8',
        fontWeight: '500',
    },
    detailRow: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 14,
    },
    detailLabel: {
        width: 110,
        fontSize: 14,
        color: '#64748b',
        marginLeft: 12,
        fontWeight: '400',
    },
    detailValue: {
        flex: 1,
        fontSize: 14,
        color: '#1e293b',
        fontWeight: '600',
    },
    planDetailsContainer: {
        marginTop: 20,
        paddingTop: 20,
        borderTopWidth: 1,
        borderTopColor: '#f1f5f9',
    },
    planDetailsLabel: {
        fontSize: 14,
        fontWeight: '600',
        color: '#64748b',
        marginBottom: 10,
    },
    planDetails: {
        fontSize: 14,
        color: '#4b5563',
        lineHeight: 22,
        fontWeight: '400',
    },
    // Enhanced Rejection Card
    rejectionCard: {
        borderWidth: 1,
        borderColor: '#fee2e2',
        backgroundColor: '#fef2f2',
    },
    rejectionTitle: {
        fontSize: 16,
        fontWeight: '700',
        color: '#dc2626',
        marginBottom: 14,
    },
    rejectionReason: {
        fontSize: 14,
        color: '#7f1d1d',
        lineHeight: 22,
        fontWeight: '400',
    },
    // Enhanced Timeline
    timeline: {
        marginLeft: 12,
    },
    timelineItem: {
        flexDirection: 'row',
        marginBottom: 22,
    },
    timelineDot: {
        width: 14,
        height: 14,
        borderRadius: 7,
        backgroundColor: '#10b981',
        marginTop: 4,
        marginRight: 14,
        borderWidth: 3,
        borderColor: 'white',
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.1,
        shadowRadius: 2,
        elevation: 1,
    },
    timelineContent: {
        flex: 1,
    },
    timelineTitle: {
        fontSize: 14,
        fontWeight: '600',
        color: '#1e293b',
        marginBottom: 4,
    },
    timelineDate: {
        fontSize: 13,
        color: '#64748b',
        fontWeight: '400',
    },
    // Enhanced Contact Card
    contactCard: {
        backgroundColor: '#eff6ff',
        borderWidth: 1,
        borderColor: '#dbeafe',
    },
    contactHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 14,
    },
    contactTitle: {
        fontSize: 18,
        fontWeight: '700',
        color: '#1e40af',
        marginLeft: 12,
    },
    contactText: {
        fontSize: 14,
        color: '#4b5563',
        lineHeight: 22,
        marginBottom: 10,
        fontWeight: '400',
    },
    contactEmail: {
        fontSize: 16,
        fontWeight: '700',
        color: '#1e40af',
    },
    bottomSpacing: {
        height: 40,
    },
    backButtonText: {
        color: 'white',
        fontWeight: '700',
        fontSize: 16,
    },
});