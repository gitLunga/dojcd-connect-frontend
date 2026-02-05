import React, { useState, useEffect } from 'react';
import {
    View,
    Text,
    StyleSheet,
    FlatList,
    TouchableOpacity,
    Alert,
    ActivityIndicator,
    TextInput,
    RefreshControl
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { deviceAPI } from '../../services/api';
import { StackNavigationProp } from '@react-navigation/stack';
import { RootStackParamList } from '../../navigation/AppNavigator';
import { RouteProp, useNavigation, useRoute } from '@react-navigation/native';

type NavigationProp = StackNavigationProp<RootStackParamList, 'DeviceCatalog'>;

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

export default function DeviceCatalogScreen() {
    const [devices, setDevices] = useState<Device[]>([]);
    const [filteredDevices, setFilteredDevices] = useState<Device[]>([]);
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);
    const [searchQuery, setSearchQuery] = useState('');
    const [user, setUser] = useState<any>(null);
    const [isEligible, setIsEligible] = useState(false);
    const navigation = useNavigation<NavigationProp>();

    useEffect(() => {
        loadUserAndDevices();
    }, []);

    useEffect(() => {
        filterDevices();
    }, [searchQuery, devices]);

    const loadUserAndDevices = async () => {
        try {
            const userData = await AsyncStorage.getItem('user');
            if (userData) {
                const parsedUser = JSON.parse(userData);
                setUser(parsedUser);

                // Check eligibility
                const eligibilityRes = await deviceAPI.checkEligibility(parsedUser.client_user_id);
                setIsEligible(eligibilityRes.data.eligible);

                if (eligibilityRes.data.eligible) {
                    await loadDevices();
                }
            }
        } catch (error) {
            console.error('Error loading data:', error);
            Alert.alert('Error', 'Failed to load devices');
        } finally {
            setLoading(false);
        }
    };

    const loadDevices = async () => {
        try {
            const response = await deviceAPI.getAvailableDevices();
            setDevices(response.data.data);
        } catch (error) {
            console.error('Error loading devices:', error);
            Alert.alert('Error', 'Failed to load devices');
        }
    };

    const filterDevices = () => {
        if (!searchQuery.trim()) {
            setFilteredDevices(devices);
            return;
        }

        const query = searchQuery.toLowerCase();
        const filtered = devices.filter(device =>
            device.device_name.toLowerCase().includes(query) ||
            device.model.toLowerCase().includes(query) ||
            device.manufacturer.toLowerCase().includes(query) ||
            device.plan_name.toLowerCase().includes(query)
        );
        setFilteredDevices(filtered);
    };

    const onRefresh = async () => {
        setRefreshing(true);
        await loadUserAndDevices();
        setRefreshing(false);
    };

    const handleApply = async (deviceId: number) => {
        if (!user?.client_user_id) {
            Alert.alert('Error', 'User not found');
            return;
        }

        Alert.alert(
            'Confirm Application',
            'Are you sure you want to apply for this device?',
            [
                { text: 'Cancel', style: 'cancel' },
                {
                    text: 'Apply',
                    onPress: async () => {
                        try {
                            const response = await deviceAPI.submitApplication(
                                user.client_user_id,
                                deviceId
                            );

                            if (response.data.success) {
                                Alert.alert(
                                    'Success',
                                    'Application submitted successfully!',
                                    [
                                        {
                                            text: 'OK',
                                            onPress: () => navigation.navigate('MyApplications')
                                        }
                                    ]
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

    const renderDevice = ({ item }: { item: Device }) => (
        <View style={styles.deviceCard}>
            <View style={styles.deviceHeader}>
                <View style={styles.deviceTitleContainer}>
                    <Text style={styles.deviceName}>{item.device_name}</Text>
                    <Text style={styles.deviceModel}>{item.model}</Text>
                </View>
                <View style={styles.priceContainer}>
                    <Text style={styles.price}>R{item.monthly_cost}</Text>
                    <Text style={styles.priceLabel}>/month</Text>
                </View>
            </View>

            <View style={styles.deviceInfo}>
                <Text style={styles.manufacturer}>{item.manufacturer}</Text>
                <Text style={styles.planName}>{item.plan_name}</Text>
                <Text style={styles.planDetails}>{item.plan_details}</Text>
            </View>

            <View style={styles.footer}>
                <View style={styles.contractInfo}>
                    <Ionicons name="calendar-outline" size={16} color="#64748b" />
                    <Text style={styles.contractText}>
                        {item.contract_duration_months} months contract
                    </Text>
                </View>
                <TouchableOpacity
                    style={styles.applyButton}
                    onPress={() => handleApply(item.device_id)}
                >
                    <Ionicons name="add-circle-outline" size={18} color="white" />
                    <Text style={styles.applyButtonText}>Apply</Text>
                </TouchableOpacity>
            </View>
        </View>
    );

    if (loading) {
        return (
            <View style={styles.loadingContainer}>
                <ActivityIndicator size="large" color="#1e3a8a" />
                <Text style={styles.loadingText}>Loading devices...</Text>
            </View>
        );
    }

    if (!isEligible) {
        return (
            <View style={styles.eligibilityContainer}>
                <Ionicons name="alert-circle-outline" size={64} color="#f59e0b" />
                <Text style={styles.eligibilityTitle}>Not Eligible</Text>
                <Text style={styles.eligibilityText}>
                    Your account is not currently eligible to apply for devices.
                    Please ensure your profile is complete and verified.
                </Text>
                <TouchableOpacity
                    style={styles.dashboardButton}
                    onPress={() => navigation.goBack()}
                >
                    <Text style={styles.dashboardButtonText}>Return to Dashboard</Text>
                </TouchableOpacity>
            </View>
        );
    }

    return (
        <View style={styles.container}>
            {/* Search Bar */}
            <View style={styles.searchContainer}>
                <Ionicons name="search-outline" size={20} color="#94a3b8" />
                <TextInput
                    style={styles.searchInput}
                    placeholder="Search devices..."
                    value={searchQuery}
                    onChangeText={setSearchQuery}
                />
                {searchQuery.length > 0 && (
                    <TouchableOpacity onPress={() => setSearchQuery('')}>
                        <Ionicons name="close-circle" size={20} color="#94a3b8" />
                    </TouchableOpacity>
                )}
            </View>

            {/* Device Count */}
            <View style={styles.countContainer}>
                <Text style={styles.countText}>
                    {filteredDevices.length} device{filteredDevices.length !== 1 ? 's' : ''} available
                </Text>
            </View>

            {/* Devices List */}
            <FlatList
                data={filteredDevices}
                renderItem={renderDevice}
                keyExtractor={(item) => item.device_id.toString()}
                refreshControl={
                    <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
                }
                ListEmptyComponent={
                    <View style={styles.emptyContainer}>
                        <Ionicons name="phone-portrait-outline" size={64} color="#cbd5e1" />
                        <Text style={styles.emptyTitle}>No devices found</Text>
                        <Text style={styles.emptyText}>
                            {searchQuery ? 'Try a different search term' : 'No devices available at the moment'}
                        </Text>
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
    eligibilityContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        padding: 40,
        backgroundColor: '#f8fafc',
    },
    eligibilityTitle: {
        fontSize: 24,
        fontWeight: '700',
        color: '#1e293b',
        marginTop: 24,
        marginBottom: 14,
        letterSpacing: -0.3,
    },
    eligibilityText: {
        fontSize: 16,
        color: '#64748b',
        textAlign: 'center',
        lineHeight: 24,
        marginBottom: 32,
        fontWeight: '400',
    },
    dashboardButton: {
        backgroundColor: '#1e3a8a',
        paddingHorizontal: 32,
        paddingVertical: 16,
        borderRadius: 14,
        shadowColor: "#1e3a8a",
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.2,
        shadowRadius: 8,
        elevation: 4,
    },
    dashboardButtonText: {
        color: 'white',
        fontSize: 16,
        fontWeight: '700',
    },
    // Enhanced Search
    searchContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: 'white',
        margin: 20,
        marginBottom: 12,
        paddingHorizontal: 20,
        paddingVertical: 14,
        borderRadius: 14,
        borderWidth: 1,
        borderColor: '#e2e8f0',
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.05,
        shadowRadius: 6,
        elevation: 2,
    },
    searchInput: {
        flex: 1,
        marginLeft: 14,
        fontSize: 16,
        color: '#1e293b',
        fontWeight: '400',
    },
    countContainer: {
        paddingHorizontal: 20,
        marginBottom: 12,
    },
    countText: {
        fontSize: 14,
        color: '#64748b',
        fontWeight: '500',
        letterSpacing: 0.3,
    },
    listContent: {
        padding: 20,
        paddingTop: 0,
    },
    // Enhanced Device Card
    deviceCard: {
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
    deviceHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'flex-start',
        marginBottom: 20,
    },
    deviceTitleContainer: {
        flex: 1,
    },
    deviceName: {
        fontSize: 20,
        fontWeight: '700',
        color: '#1e293b',
        marginBottom: 6,
        letterSpacing: -0.3,
    },
    deviceModel: {
        fontSize: 13,
        color: '#64748b',
        backgroundColor: '#f3f4f6',
        alignSelf: 'flex-start',
        paddingHorizontal: 12,
        paddingVertical: 6,
        borderRadius: 20,
        fontWeight: '600',
        overflow: 'hidden',
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
    deviceInfo: {
        marginBottom: 24,
    },
    manufacturer: {
        fontSize: 14,
        color: '#6b7280',
        marginBottom: 6,
        fontWeight: '400',
    },
    planName: {
        fontSize: 16,
        fontWeight: '600',
        color: '#1e293b',
        marginBottom: 10,
    },
    planDetails: {
        fontSize: 14,
        color: '#64748b',
        lineHeight: 22,
        fontWeight: '400',
    },
    footer: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
    },
    contractInfo: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    contractText: {
        fontSize: 14,
        color: '#64748b',
        marginLeft: 8,
        fontWeight: '400',
    },
    applyButton: {
        backgroundColor: '#1e3a8a',
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: 24,
        paddingVertical: 14,
        borderRadius: 12,
        gap: 8,
        shadowColor: "#1e3a8a",
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.2,
        shadowRadius: 8,
        elevation: 4,
    },
    applyButtonText: {
        color: 'white',
        fontSize: 16,
        fontWeight: '700',
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
        fontWeight: '400',
        lineHeight: 22,
    },
});