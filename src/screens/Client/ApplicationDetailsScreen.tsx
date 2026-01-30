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
        backgroundColor: '#f5f7fa',
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
    errorContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        padding: 40,
        backgroundColor: '#f5f7fa',
    },
    errorTitle: {
        fontSize: 24,
        fontWeight: 'bold',
        color: '#1e293b',
        marginTop: 24,
        marginBottom: 12,
    },
    errorText: {
        fontSize: 16,
        color: '#64748b',
        textAlign: 'center',
        lineHeight: 24,
        marginBottom: 32,
    },
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: 20,
        backgroundColor: 'white',
        borderBottomWidth: 1,
        borderBottomColor: '#e2e8f0',
    },
    backButton: {
        padding: 8,
    },
    headerTitle: {
        fontSize: 20,
        fontWeight: 'bold',
        color: '#1e293b',
    },
    statusCard: {
        backgroundColor: 'white',
        margin: 16,
        padding: 20,
        borderRadius: 16,
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.1,
        shadowRadius: 8,
        elevation: 4,
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
        marginBottom: 4,
    },
    statusBadge: {
        alignSelf: 'flex-start',
        paddingHorizontal: 12,
        paddingVertical: 6,
        borderRadius: 12,
    },
    statusBadgeText: {
        color: 'white',
        fontSize: 14,
        fontWeight: 'bold',
    },
    statusDetails: {
        backgroundColor: '#f8fafc',
        padding: 16,
        borderRadius: 12,
        marginBottom: 16,
    },
    statusDetailRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        marginBottom: 8,
    },
    statusDetailLabel: {
        fontSize: 14,
        color: '#64748b',
    },
    statusDetailValue: {
        fontSize: 14,
        color: '#1e293b',
        fontWeight: '500',
    },
    cancelButton: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        padding: 16,
        borderRadius: 12,
        borderWidth: 1,
        borderColor: '#ef4444',
        gap: 8,
    },
    cancelButtonText: {
        color: '#ef4444',
        fontSize: 16,
        fontWeight: 'bold',
    },
    card: {
        backgroundColor: 'white',
        marginHorizontal: 16,
        marginBottom: 16,
        padding: 20,
        borderRadius: 16,
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.1,
        shadowRadius: 8,
        elevation: 4,
    },
    cardTitle: {
        fontSize: 18,
        fontWeight: 'bold',
        color: '#1e293b',
        marginBottom: 20,
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
        fontWeight: 'bold',
        color: '#1e293b',
        marginBottom: 4,
    },
    deviceModel: {
        fontSize: 14,
        color: '#64748b',
    },
    priceContainer: {
        alignItems: 'flex-end',
    },
    price: {
        fontSize: 24,
        fontWeight: 'bold',
        color: '#10b981',
    },
    priceLabel: {
        fontSize: 12,
        color: '#94a3b8',
    },
    detailRow: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 12,
    },
    detailLabel: {
        width: 100,
        fontSize: 14,
        color: '#64748b',
        marginLeft: 12,
    },
    detailValue: {
        flex: 1,
        fontSize: 14,
        color: '#1e293b',
        fontWeight: '500',
    },
    planDetailsContainer: {
        marginTop: 16,
        paddingTop: 16,
        borderTopWidth: 1,
        borderTopColor: '#f1f5f9',
    },
    planDetailsLabel: {
        fontSize: 14,
        fontWeight: '600',
        color: '#64748b',
        marginBottom: 8,
    },
    planDetails: {
        fontSize: 14,
        color: '#4b5563',
        lineHeight: 20,
    },
    rejectionCard: {
        borderWidth: 1,
        borderColor: '#fee2e2',
        backgroundColor: '#fef2f2',
    },
    rejectionTitle: {
        fontSize: 16,
        fontWeight: 'bold',
        color: '#dc2626',
        marginBottom: 12,
    },
    rejectionReason: {
        fontSize: 14,
        color: '#7f1d1d',
        lineHeight: 20,
    },
    timeline: {
        marginLeft: 12,
    },
    timelineItem: {
        flexDirection: 'row',
        marginBottom: 20,
    },
    timelineDot: {
        width: 12,
        height: 12,
        borderRadius: 6,
        backgroundColor: '#10b981',
        marginTop: 4,
        marginRight: 12,
    },
    timelineContent: {
        flex: 1,
    },
    timelineTitle: {
        fontSize: 14,
        fontWeight: '500',
        color: '#1e293b',
        marginBottom: 2,
    },
    timelineDate: {
        fontSize: 12,
        color: '#64748b',
    },
    contactCard: {
        backgroundColor: '#eff6ff',
        borderWidth: 1,
        borderColor: '#dbeafe',
    },
    contactHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 12,
    },
    contactTitle: {
        fontSize: 18,
        fontWeight: 'bold',
        color: '#1e40af',
        marginLeft: 12,
    },
    contactText: {
        fontSize: 14,
        color: '#4b5563',
        lineHeight: 20,
        marginBottom: 8,
    },
    contactEmail: {
        fontSize: 16,
        fontWeight: '600',
        color: '#1e40af',
    },
    bottomSpacing: {
        height: 40,
    },
    backButtonText: {
        color: 'white',
        fontWeight: 'bold',
    },
});