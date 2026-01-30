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
                                applicationId
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
        backgroundColor: '#f5f7fa',
    },
    loadingContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
    },
    loadingText: {
        marginTop: 12,
        fontSize: 16,
        color: '#64748b',
    },
    filtersContainer: {
        flexDirection: 'row',
        padding: 16,
        gap: 8,
    },
    filterButton: {
        backgroundColor: 'white',
        paddingHorizontal: 16,
        paddingVertical: 10,
        borderRadius: 20,
        borderWidth: 1,
        borderColor: '#e2e8f0',
    },
    filterAll: {
        backgroundColor: '#1e3a8a',
        borderColor: '#1e3a8a',
    },
    filterText: {
        fontSize: 14,
        fontWeight: '500',
        color: '#64748b',
    },
    listContent: {
        padding: 16,
        paddingTop: 0,
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
        alignItems: 'flex-start',
        marginBottom: 16,
    },
    deviceName: {
        fontSize: 18,
        fontWeight: 'bold',
        color: '#1e293b',
        marginBottom: 4,
    },
    deviceModel: {
        fontSize: 14,
        color: '#64748b',
    },
    statusBadge: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: 12,
        paddingVertical: 6,
        borderRadius: 12,
        gap: 4,
    },
    statusText: {
        color: 'white',
        fontSize: 12,
        fontWeight: '600',
    },
    applicationDetails: {
        marginBottom: 16,
    },
    detailRow: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 8,
    },
    planName: {
        fontSize: 16,
        color: '#1e293b',
        marginLeft: 8,
        flex: 1,
    },
    cost: {
        fontSize: 16,
        fontWeight: '600',
        color: '#10b981',
        marginLeft: 8,
    },
    contract: {
        fontSize: 14,
        color: '#64748b',
        marginLeft: 8,
    },
    applicationFooter: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingTop: 16,
        borderTopWidth: 1,
        borderTopColor: '#f1f5f9',
    },
    applicationDate: {
        fontSize: 12,
        color: '#94a3b8',
    },
    cancelButton: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: 12,
        paddingVertical: 6,
        borderRadius: 8,
        borderWidth: 1,
        borderColor: '#ef4444',
        gap: 4,
    },
    cancelText: {
        color: '#ef4444',
        fontSize: 12,
        fontWeight: '600',
    },
    rejectionContainer: {
        marginTop: 16,
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
    emptyContainer: {
        alignItems: 'center',
        padding: 40,
    },
    emptyTitle: {
        fontSize: 20,
        fontWeight: 'bold',
        color: '#64748b',
        marginTop: 16,
        marginBottom: 8,
    },
    emptyText: {
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
});