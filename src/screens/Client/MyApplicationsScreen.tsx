import React, { useState, useEffect } from 'react';
import {
    View,
    Text,
    StyleSheet,
    FlatList,
    TouchableOpacity,
    Alert,
    ActivityIndicator,
    RefreshControl
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { deviceAPI } from '../../services/api';
import { StackNavigationProp } from '@react-navigation/stack';
import { RootStackParamList } from '../../navigation/AppNavigator';
import { useNavigation } from '@react-navigation/native';

type NavigationProp = StackNavigationProp<RootStackParamList, 'MyApplications'>;

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

export default function MyApplicationsScreen() {
    const [applications, setApplications] = useState<Application[]>([]);
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);
    const [user, setUser] = useState<any>(null);
    const navigation = useNavigation<NavigationProp>();

    useEffect(() => {
        loadApplications();
    }, []);

    const loadApplications = async () => {
        try {
            const userData = await AsyncStorage.getItem('user');
            if (userData) {
                const parsedUser = JSON.parse(userData);
                setUser(parsedUser);

                const response = await deviceAPI.getUserApplications(parsedUser.client_user_id);
                setApplications(response.data.data);
            }
        } catch (error) {
            console.error('Error loading applications:', error);
            Alert.alert('Error', 'Failed to load applications');
        } finally {
            setLoading(false);
        }
    };

    const onRefresh = async () => {
        setRefreshing(true);
        await loadApplications();
        setRefreshing(false);
    };

    const handleCancelApplication = async (applicationId: number) => {
        if (!user?.client_user_id) {
            Alert.alert('Error', 'User not found');
            return;
        }

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
                                user.applicationId
                            );

                            if (response.data.success) {
                                Alert.alert('Success', 'Application cancelled successfully');
                                await loadApplications();
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

    const renderApplication = ({ item }: { item: Application }) => (
        <TouchableOpacity
            style={styles.applicationCard}
            onPress={() => navigation.navigate('ApplicationDetails', {
                applicationId: item.application_id
            })}
        >
            <View style={styles.applicationHeader}>
                <View>
                    <Text style={styles.deviceName}>{item.device_name}</Text>
                    <Text style={styles.deviceModel}>{item.model} • {item.manufacturer}</Text>
                </View>
                <View style={[styles.statusBadge, { backgroundColor: getStatusColor(item.application_status) }]}>
                    <Ionicons name={getStatusIcon(item.application_status)} size={14} color="white" />
                    <Text style={styles.statusText}>{item.application_status}</Text>
                </View>
            </View>

            <View style={styles.applicationDetails}>
                <View style={styles.detailRow}>
                    <Ionicons name="document-text-outline" size={16} color="#64748b" />
                    <Text style={styles.planName}>{item.plan_name}</Text>
                </View>
                <View style={styles.detailRow}>
                    <Ionicons name="cash-outline" size={16} color="#64748b" />
                    <Text style={styles.cost}>R{item.monthly_cost}/month</Text>
                </View>
                <View style={styles.detailRow}>
                    <Ionicons name="calendar-outline" size={16} color="#64748b" />
                    <Text style={styles.contract}>{item.contract_duration_months} months</Text>
                </View>
            </View>

            <View style={styles.applicationFooter}>
                <Text style={styles.applicationDate}>
                    Applied: {new Date(item.submission_date).toLocaleDateString()}
                </Text>

                {item.application_status === 'Pending' && (
                    <TouchableOpacity
                        style={styles.cancelButton}
                        onPress={(e) => {
                            e.stopPropagation();
                            handleCancelApplication(item.application_id);
                        }}
                    >
                        <Ionicons name="close-circle-outline" size={16} color="#ef4444" />
                        <Text style={styles.cancelText}>Cancel</Text>
                    </TouchableOpacity>
                )}
            </View>

            {item.rejection_reason && (
                <View style={styles.rejectionContainer}>
                    <Text style={styles.rejectionLabel}>Rejection Reason:</Text>
                    <Text style={styles.rejectionReason}>{item.rejection_reason}</Text>
                </View>
            )}
        </TouchableOpacity>
    );

    const filterApplications = (status?: string) => {
        if (!status) return applications;
        return applications.filter(app => app.application_status === status);
    };

    if (loading) {
        return (
            <View style={styles.loadingContainer}>
                <ActivityIndicator size="large" color="#1e3a8a" />
                <Text style={styles.loadingText}>Loading applications...</Text>
            </View>
        );
    }

    return (
        <View style={styles.container}>
            {/* Status Filters */}
            <View style={styles.filtersContainer}>
                <TouchableOpacity
                    style={[styles.filterButton, styles.filterAll]}
                    onPress={() => {}}
                >
                    <Text style={styles.filterText}>All ({applications.length})</Text>
                </TouchableOpacity>
                <TouchableOpacity style={styles.filterButton}>
                    <Text style={styles.filterText}>Pending ({filterApplications('Pending').length})</Text>
                </TouchableOpacity>
                <TouchableOpacity style={styles.filterButton}>
                    <Text style={styles.filterText}>Approved ({filterApplications('Approved').length})</Text>
                </TouchableOpacity>
            </View>

            {/* Applications List */}
            <FlatList
                data={applications}
                renderItem={renderApplication}
                keyExtractor={(item) => item.application_id.toString()}
                refreshControl={
                    <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
                }
                ListEmptyComponent={
                    <View style={styles.emptyContainer}>
                        <Ionicons name="document-text-outline" size={64} color="#cbd5e1" />
                        <Text style={styles.emptyTitle}>No applications</Text>
                        <Text style={styles.emptyText}>
                            You haven't submitted any applications yet
                        </Text>
                        <TouchableOpacity
                            style={styles.browseButton}
                            onPress={() => navigation.navigate('DeviceCatalog')}
                        >
                            <Text style={styles.browseButtonText}>Browse Devices</Text>
                        </TouchableOpacity>
                    </View>
                }
                contentContainerStyle={styles.listContent}
            />
        </View>
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
    // Enhanced Filters
    filtersContainer: {
        flexDirection: 'row',
        paddingHorizontal: 20,
        paddingVertical: 16,
        gap: 10,
    },
    filterButton: {
        backgroundColor: 'white',
        paddingHorizontal: 18,
        paddingVertical: 12,
        borderRadius: 20,
        borderWidth: 1,
        borderColor: '#e2e8f0',
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.05,
        shadowRadius: 4,
        elevation: 2,
    },
    filterAll: {
        backgroundColor: '#1e3a8a',
        borderColor: '#1e3a8a',
    },
    filterText: {
        fontSize: 13,
        fontWeight: '600',
        color: '#64748b',
        letterSpacing: 0.3,
    },
    listContent: {
        padding: 20,
        paddingTop: 0,
    },
    // Enhanced Application Card
    applicationCard: {
        backgroundColor: 'white',
        borderRadius: 18,
        padding: 24,
        marginBottom: 16,
        shadowColor: "#1e3a8a",
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.08,
        shadowRadius: 12,
        elevation: 4,
        borderWidth: 1,
        borderColor: '#f1f5f9',
    },
    applicationHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'flex-start',
        marginBottom: 20,
    },
    deviceName: {
        fontSize: 18,
        fontWeight: '700',
        color: '#1e293b',
        marginBottom: 6,
        letterSpacing: -0.3,
    },
    deviceModel: {
        fontSize: 14,
        color: '#64748b',
        fontWeight: '400',
    },
    statusBadge: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: 14,
        paddingVertical: 8,
        borderRadius: 20,
        gap: 6,
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.1,
        shadowRadius: 2,
        elevation: 1,
    },
    statusText: {
        color: 'white',
        fontSize: 12,
        fontWeight: '700',
        letterSpacing: 0.5,
    },
    applicationDetails: {
        marginBottom: 20,
    },
    detailRow: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 10,
    },
    planName: {
        fontSize: 16,
        color: '#1e293b',
        marginLeft: 10,
        flex: 1,
        fontWeight: '500',
    },
    cost: {
        fontSize: 16,
        fontWeight: '700',
        color: '#10b981',
        marginLeft: 10,
    },
    contract: {
        fontSize: 14,
        color: '#64748b',
        marginLeft: 10,
        fontWeight: '400',
    },
    applicationFooter: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingTop: 20,
        borderTopWidth: 1,
        borderTopColor: '#f1f5f9',
    },
    applicationDate: {
        fontSize: 13,
        color: '#94a3b8',
        fontWeight: '400',
    },
    cancelButton: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: 14,
        paddingVertical: 8,
        borderRadius: 10,
        borderWidth: 1,
        borderColor: '#fee2e2',
        backgroundColor: '#fef2f2',
        gap: 6,
    },
    cancelText: {
        color: '#ef4444',
        fontSize: 13,
        fontWeight: '600',
    },
    rejectionContainer: {
        marginTop: 20,
        padding: 16,
        backgroundColor: '#fef2f2',
        borderRadius: 12,
        borderWidth: 1,
        borderColor: '#fee2e2',
    },
    rejectionLabel: {
        fontSize: 12,
        fontWeight: '700',
        color: '#dc2626',
        marginBottom: 6,
        letterSpacing: 0.5,
    },
    rejectionReason: {
        fontSize: 14,
        color: '#7f1d1d',
        lineHeight: 22,
        fontWeight: '400',
    },
    emptyContainer: {
        alignItems: 'center',
        padding: 60,
    },
    emptyTitle: {
        fontSize: 20,
        fontWeight: '700',
        color: '#64748b',
        marginTop: 24,
        marginBottom: 10,
        letterSpacing: -0.3,
    },
    emptyText: {
        fontSize: 16,
        color: '#94a3b8',
        textAlign: 'center',
        marginBottom: 28,
        fontWeight: '400',
        lineHeight: 22,
    },
    browseButton: {
        backgroundColor: '#1e3a8a',
        paddingHorizontal: 28,
        paddingVertical: 14,
        borderRadius: 12,
        shadowColor: "#1e3a8a",
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.2,
        shadowRadius: 8,
        elevation: 4,
    },
    browseButtonText: {
        color: 'white',
        fontWeight: '700',
        fontSize: 15,
    },
});