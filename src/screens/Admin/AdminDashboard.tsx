import React, { useEffect, useState } from "react";
import {
    View,
    Text,
    FlatList,
    StyleSheet,
    ActivityIndicator,
    Alert,
    TouchableOpacity,
    ScrollView,
    RefreshControl,
    TextInput,
    Modal,
    Dimensions
} from "react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { useNavigation } from "@react-navigation/native";
import { StackNavigationProp } from "@react-navigation/stack";
import { adminAPI } from "../../services/api";
import { RootStackParamList } from "../../navigation/AppNavigator";
import { SystemUser, UserStats, UpdateUserStatusData } from "../../types/types";

type AdminNavigationProp = StackNavigationProp<RootStackParamList, "AdminDashboard">;

const { width } = Dimensions.get('window');

export default function AdminDashboard() {
    const navigation = useNavigation<AdminNavigationProp>();
    const [adminUser, setAdminUser] = useState<any>(null);
    const [users, setUsers] = useState<SystemUser[]>([]);
    const [clientUsers, setClientUsers] = useState<SystemUser[]>([]);
    const [operationalUsers, setOperationalUsers] = useState<SystemUser[]>([]);
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);
    const [activeTab, setActiveTab] = useState<'dashboard' | 'clients' | 'operational' | 'all'>('dashboard');
    const [searchQuery, setSearchQuery] = useState('');
    const [searchResults, setSearchResults] = useState<SystemUser[]>([]);
    const [showSearchModal, setShowSearchModal] = useState(false);
    const [showUserModal, setShowUserModal] = useState(false);
    const [selectedUser, setSelectedUser] = useState<SystemUser | null>(null);
    const [statusUpdateNotes, setStatusUpdateNotes] = useState('');
    const [selectedStatus, setSelectedStatus] = useState<'Pending' | 'Verified' | 'Rejected'>('Verified');
    const [stats, setStats] = useState<UserStats | null>(null);
    const [recentRegistrations, setRecentRegistrations] = useState<SystemUser[]>([]);
    const [dashboardData, setDashboardData] = useState<any>(null);

    useEffect(() => {
        loadAdmin();
        loadDashboardData();
    }, [activeTab]);

    const loadAdmin = async () => {
        try {
            const storedUser = await AsyncStorage.getItem("user");
            if (storedUser) {
                setAdminUser(JSON.parse(storedUser));
            }
        } catch (error) {
            console.log("❌ Failed to load admin user:", error);
        }
    };

    const loadDashboardData = async () => {
        setLoading(true);
        try {
            if (activeTab === 'dashboard') {
                const [dashboardRes, recentRes] = await Promise.all([
                    adminAPI.getDashboardData(),
                    adminAPI.getRecentRegistrations()
                ]);
                setDashboardData(dashboardRes.data.data);
                setRecentRegistrations(recentRes.data.data.registrations || []);
                setStats(dashboardRes.data.data?.statistics);
            } else if (activeTab === 'clients') {
                const response = await adminAPI.getAllClientUsers();
                setClientUsers(response.data.data.users || []);
            } else if (activeTab === 'operational') {
                const response = await adminAPI.getAllOperationalUsers();
                setOperationalUsers(response.data.data.users || []);
            } else if (activeTab === 'all') {
                const response = await adminAPI.getAllUsers();
                setUsers(response.data.data || []);
            }
        } catch (error: any) {
            console.error("Error loading data:", error);
            Alert.alert("Error", error.message || "Failed to load data");
        } finally {
            setLoading(false);
            setRefreshing(false);
        }
    };

    const onRefresh = () => {
        setRefreshing(true);
        loadDashboardData();
    };

    const handleSearch = async () => {
        if (searchQuery.length < 2) {
            Alert.alert("Search Error", "Please enter at least 2 characters");
            return;
        }

        try {
            const response = await adminAPI.searchUsers(searchQuery);
            setSearchResults(response.data.data.users || []);
            setShowSearchModal(true);
        } catch (error: any) {
            Alert.alert("Search Error", error.message || "Search failed");
        }
    };

    const handleUpdateStatus = async (userId: number) => {
        if (!statusUpdateNotes.trim()) {
            Alert.alert("Error", "Please enter verification notes");
            return;
        }

        try {
            const updateData: UpdateUserStatusData = {
                status: selectedStatus,
                notes: statusUpdateNotes
            };

            await adminAPI.updateClientUserStatus(userId, updateData);
            Alert.alert("Success", "User status updated successfully");
            
            // Refresh data
            loadDashboardData();
            setShowUserModal(false);
            setStatusUpdateNotes('');
        } catch (error: any) {
            Alert.alert("Error", error.message || "Failed to update status");
        }
    };

    const handleLogout = () => {
        Alert.alert(
            "Confirm Logout",
            "Are you sure you want to logout?",
            [
                { text: "Cancel", style: "cancel" },
                {
                    text: "Logout",
                    style: "destructive",
                    onPress: async () => {
                        await AsyncStorage.removeItem("user");
                        navigation.reset({
                            index: 0,
                            routes: [{ name: "Login" }],
                        });
                    },
                },
            ],
            { cancelable: true }
        );
    };

    const renderStatusBadge = (status: string | null | undefined = 'Pending') => {
        const colors: any = {
            'Pending': '#f59e0b',
            'Profile_Completed': '#10b981',
            'Verified': '#3b82f6',
            'Rejected': '#ef4444'
        };

        const safeStatus = status ?? 'Pending';
        return (
            <View style={[styles.statusBadge, { backgroundColor: colors[safeStatus] || '#6b7280' }]}>
                <Text style={styles.statusBadgeText}>{safeStatus.replace('_', ' ')}</Text>
            </View>
        );
    };

    const renderDashboard = () => {
        if (!dashboardData || !stats) {
            return <ActivityIndicator size="large" color="#1e3a8a" style={{ marginTop: 40 }} />;
        }

        return (
            <ScrollView>
                {/* Stats Cards */}
                <View style={styles.statsRow}>
                    <View style={styles.statCard}>
                        <Text style={styles.statNumber}>{stats.total_users || 0}</Text>
                        <Text style={styles.statLabel}>Total Users</Text>
                    </View>
                    <View style={styles.statCard}>
                        <Text style={styles.statNumber}>{stats.client_users?.total || 0}</Text>
                        <Text style={styles.statLabel}>Client Users</Text>
                    </View>
                    <View style={styles.statCard}>
                        <Text style={styles.statNumber}>{stats.operational_users?.total || 0}</Text>
                        <Text style={styles.statLabel}>Operational Users</Text>
                    </View>
                </View>

                {/* Recent Registrations */}
                <Text style={styles.sectionTitle}>Recent Registrations</Text>
                <View style={styles.recentList}>
                    {recentRegistrations.slice(0, 5).map((user) => (
                        <TouchableOpacity
                            key={`${user.user_type}-${user.id}`}
                            style={styles.recentItem}
                            onPress={() => {
                                if (user.user_type === 'client') {
                                    setSelectedUser(user);
                                    setShowUserModal(true);
                                }
                            }}
                        >
                            <View style={styles.recentAvatar}>
                                <Text style={styles.recentAvatarText}>
                                    {user.first_name?.[0]}{user.last_name?.[0]}
                                </Text>
                            </View>
                            <View style={styles.recentInfo}>
                                <Text style={styles.recentName}>
                                    {user.first_name} {user.last_name}
                                </Text>
                                <Text style={styles.recentEmail}>{user.email}</Text>
                                <Text style={styles.recentType}>
                                    {user.user_type} • {new Date(user.created_at).toLocaleDateString()}
                                </Text>
                            </View>
                            {renderStatusBadge(user.registration_status)}
                        </TouchableOpacity>
                    ))}
                </View>

                {/* Client Status Breakdown */}
                <Text style={styles.sectionTitle}>Client Status Overview</Text>
                <View style={styles.statusGrid}>
                    {stats.client_users?.stats?.map((stat: any) => (
                        <View key={stat.registration_status} style={styles.statusItem}>
                            <Text style={styles.statusCount}>{stat.count}</Text>
                            <Text style={styles.statusLabel}>{stat.registration_status}</Text>
                        </View>
                    ))}
                </View>

                {/* Operational Roles */}
                <Text style={styles.sectionTitle}>Operational Roles</Text>
                <View style={styles.rolesGrid}>
                    {stats.operational_users?.stats?.map((stat: any) => (
                        <View key={stat.user_role} style={styles.roleItem}>
                            <Text style={styles.roleCount}>{stat.count}</Text>
                            <Text style={styles.roleLabel}>{stat.user_role}</Text>
                        </View>
                    ))}
                </View>
            </ScrollView>
        );
    };

    const renderUserTable = (data: SystemUser[], type: 'client' | 'operational' | 'all') => {
        const columns = type === 'client' ? [
            { key: 'name', label: 'Name', flex: 2 },
            { key: 'email', label: 'Email', flex: 1.5 },
            { key: 'phone', label: 'Phone', flex: 1 },
            { key: 'region', label: 'Region', flex: 1 },
            { key: 'persal', label: 'Persal', flex: 1 },
            { key: 'status', label: 'Status', flex: 1 },
        ] : type === 'operational' ? [
            { key: 'name', label: 'Name', flex: 2 },
            { key: 'email', label: 'Email', flex: 2 },
            { key: 'role', label: 'Role', flex: 1.5 },
        ] : [
            { key: 'name', label: 'Name', flex: 2 },
            { key: 'email', label: 'Email', flex: 1.5 },
            { key: 'type', label: 'Type', flex: 1 },
            { key: 'role', label: 'Role', flex: 1 },
            { key: 'status', label: 'Status', flex: 1 },
        ];

        return (
            <View style={{ flex: 1 }}>
                <View style={styles.tableHeader}>
                    {columns.map(col => (
                        <Text key={col.key} style={[styles.headerCell, { flex: col.flex }]}>
                            {col.label}
                        </Text>
                    ))}
                </View>

                <FlatList
                    data={data}
                    keyExtractor={(item, index) => `${item.user_type}-${item.id}-${index}`}
                    renderItem={({ item }) => (
                        <TouchableOpacity
                            style={styles.row}
                            onPress={() => {
                                if (item.user_type === 'client') {
                                    setSelectedUser(item);
                                    setShowUserModal(true);
                                }
                            }}
                        >
                            {type === 'client' ? (
                                <>
                                    <Text style={[styles.cell, { flex: 2 }]} numberOfLines={1}>
                                        {item.title ? `${item.title} ` : ''}{item.first_name} {item.last_name}
                                    </Text>
                                    <Text style={[styles.cell, { flex: 1.5 }]} numberOfLines={1}>{item.email}</Text>
                                    <Text style={[styles.cell, { flex: 1 }]}>{item.phone_number || '—'}</Text>
                                    <Text style={[styles.cell, { flex: 1 }]}>{item.region || '—'}</Text>
                                    <Text style={[styles.cell, { flex: 1 }]}>{item.persal_id || '—'}</Text>
                                    <View style={{ flex: 1 }}>
                                        {renderStatusBadge(item.registration_status)}
                                    </View>
                                </>
                            ) : type === 'operational' ? (
                                <>
                                    <Text style={[styles.cell, { flex: 2 }]} numberOfLines={1}>
                                        {item.first_name} {item.last_name}
                                    </Text>
                                    <Text style={[styles.cell, { flex: 2 }]} numberOfLines={1}>{item.email}</Text>
                                    <Text style={[styles.cell, { flex: 1.5 }]}>{item.user_role || '—'}</Text>
                                </>
                            ) : (
                                <>
                                    <Text style={[styles.cell, { flex: 2 }]} numberOfLines={1}>
                                        {item.title ? `${item.title} ` : ''}{item.first_name} {item.last_name}
                                    </Text>
                                    <Text style={[styles.cell, { flex: 1.5 }]} numberOfLines={1}>{item.email}</Text>
                                    <Text style={[styles.cell, { flex: 1 }]}>{item.user_type}</Text>
                                    <Text style={[styles.cell, { flex: 1 }]}>{item.user_role || '—'}</Text>
                                    <View style={{ flex: 1 }}>
                                        {item.user_type === 'client' ? 
                                            renderStatusBadge(item.registration_status) : 
                                            <Text style={styles.verifiedText}>Verified</Text>
                                        }
                                    </View>
                                </>
                            )}
                        </TouchableOpacity>
                    )}
                    ListEmptyComponent={
                        <Text style={styles.emptyText}>No users found</Text>
                    }
                    // ✅ Add pull-to-refresh
                    refreshControl={
                        <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
                    }
                />
            </View>
        );
    };

    return (
        <View style={styles.container}>
            {/* Header */}
            <View style={styles.header}>
                <View>
                    <Text style={styles.title}>Admin Dashboard</Text>
                    <Text style={styles.welcome}>
                        Welcome, {adminUser?.first_name || "Admin"}
                    </Text>
                </View>
                <TouchableOpacity style={styles.logoutButton} onPress={handleLogout}>
                    <Text style={styles.logoutText}>Logout</Text>
                </TouchableOpacity>
            </View>

            {/* Search Bar */}
            <View style={styles.searchContainer}>
                <TextInput
                    style={styles.searchInput}
                    placeholder="Search users by name, email, or persal ID..."
                    value={searchQuery}
                    onChangeText={setSearchQuery}
                    onSubmitEditing={handleSearch}
                />
                <TouchableOpacity style={styles.searchButton} onPress={handleSearch}>
                    <Text style={styles.searchButtonText}>Search</Text>
                </TouchableOpacity>
            </View>

            {/* Tabs */}
            <View style={styles.tabContainer}>
                <TouchableOpacity
                    style={[styles.tab, activeTab === 'dashboard' && styles.activeTab]}
                    onPress={() => setActiveTab('dashboard')}
                >
                    <Text style={[styles.tabText, activeTab === 'dashboard' && styles.activeTabText]}>
                        Dashboard
                    </Text>
                </TouchableOpacity>
                <TouchableOpacity
                    style={[styles.tab, activeTab === 'clients' && styles.activeTab]}
                    onPress={() => setActiveTab('clients')}
                >
                    <Text style={[styles.tabText, activeTab === 'clients' && styles.activeTabText]}>
                        Client Users ({clientUsers.length})
                    </Text>
                </TouchableOpacity>
                <TouchableOpacity
                    style={[styles.tab, activeTab === 'operational' && styles.activeTab]}
                    onPress={() => setActiveTab('operational')}
                >
                    <Text style={[styles.tabText, activeTab === 'operational' && styles.activeTabText]}>
                        Operational ({operationalUsers.length})
                    </Text>
                </TouchableOpacity>
                <TouchableOpacity
                    style={[styles.tab, activeTab === 'all' && styles.activeTab]}
                    onPress={() => setActiveTab('all')}
                >
                    <Text style={[styles.tabText, activeTab === 'all' && styles.activeTabText]}>
                        All Users ({users.length})
                    </Text>
                </TouchableOpacity>
            </View>

            {/* Content - FIX APPLIED HERE */}
            <View style={styles.contentContainer}>
                {loading ? (
                    <ActivityIndicator size="large" color="#1e3a8a" style={{ marginTop: 40 }} />
                ) : activeTab === 'dashboard' ? (
                    // Dashboard still needs ScrollView since it uses regular Views
                    <ScrollView 
                        refreshControl={
                            <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
                        }
                    >
                        {renderDashboard()}
                    </ScrollView>
                ) : activeTab === 'clients' ? (
                    // FlatLists handle their own scrolling and refresh control
                    renderUserTable(clientUsers, 'client')
                ) : activeTab === 'operational' ? (
                    renderUserTable(operationalUsers, 'operational')
                ) : (
                    renderUserTable(users, 'all')
                )}
            </View>

            {/* Search Results Modal */}
            <Modal
                visible={showSearchModal}
                transparent={true}
                animationType="slide"
                onRequestClose={() => setShowSearchModal(false)}
            >
                <View style={styles.modalOverlay}>
                    <View style={styles.modalContent}>
                        <View style={styles.modalHeader}>
                            <Text style={styles.modalTitle}>
                                Search Results ({searchResults.length})
                            </Text>
                            <TouchableOpacity onPress={() => setShowSearchModal(false)}>
                                <Text style={styles.modalClose}>✕</Text>
                            </TouchableOpacity>
                        </View>
                        <FlatList
                            data={searchResults}
                            keyExtractor={(item, index) => `search-${item.id}-${index}`}
                            renderItem={({ item }) => (
                                <TouchableOpacity
                                    style={styles.searchResultItem}
                                    onPress={() => {
                                        if (item.user_type === 'client') {
                                            setSelectedUser(item);
                                            setShowUserModal(true);
                                            setShowSearchModal(false);
                                        }
                                    }}
                                >
                                    <View style={styles.searchResultAvatar}>
                                        <Text style={styles.searchResultAvatarText}>
                                            {item.first_name?.[0]}{item.last_name?.[0]}
                                        </Text>
                                    </View>
                                    <View style={{ flex: 1 }}>
                                        <Text style={styles.searchResultName}>
                                            {item.first_name} {item.last_name}
                                        </Text>
                                        <Text style={styles.searchResultEmail}>{item.email}</Text>
                                        <Text style={styles.searchResultType}>
                                            {item.user_type} • {item.registration_status || 'Verified'}
                                        </Text>
                                    </View>
                                </TouchableOpacity>
                            )}
                            ListEmptyComponent={
                                <Text style={styles.emptyText}>No results found</Text>
                            }
                        />
                    </View>
                </View>
            </Modal>

            {/* User Details/Update Modal */}
            <Modal
                visible={showUserModal}
                transparent={true}
                animationType="slide"
                onRequestClose={() => setShowUserModal(false)}
            >
                <View style={styles.modalOverlay}>
                    <View style={styles.modalContent}>
                        <View style={styles.modalHeader}>
                            <Text style={styles.modalTitle}>User Details</Text>
                            <TouchableOpacity onPress={() => setShowUserModal(false)}>
                                <Text style={styles.modalClose}>✕</Text>
                            </TouchableOpacity>
                        </View>
                        
                        {selectedUser && (
                            <ScrollView style={styles.userDetails}>
                                <View style={styles.userDetailRow}>
                                    <Text style={styles.detailLabel}>Name:</Text>
                                    <Text style={styles.detailValue}>
                                        {selectedUser.title ? `${selectedUser.title} ` : ''}
                                        {selectedUser.first_name} {selectedUser.last_name}
                                    </Text>
                                </View>
                                <View style={styles.userDetailRow}>
                                    <Text style={styles.detailLabel}>Email:</Text>
                                    <Text style={styles.detailValue}>{selectedUser.email}</Text>
                                </View>
                                {/* <View style={styles.userDetailRow}>
                                    <Text style={styles.detailLabel}>Phone:</Text>
                                    <Text style={styles.detailValue}>{selectedUser.phone_number || '—'}</Text>
                                </View> */}
                                {selectedUser.region && (
                                    <View style={styles.userDetailRow}>
                                        <Text style={styles.detailLabel}>Region:</Text>
                                        <Text style={styles.detailValue}>{selectedUser.region}</Text>
                                    </View>
                                )}
                                {selectedUser.persal_id && (
                                    <View style={styles.userDetailRow}>
                                        <Text style={styles.detailLabel}>Persal ID:</Text>
                                        <Text style={styles.detailValue}>{selectedUser.persal_id}</Text>
                                    </View>
                                )}
                                {selectedUser.user_role && (
                                    <View style={styles.userDetailRow}>
                                        <Text style={styles.detailLabel}>Role:</Text>
                                        <Text style={styles.detailValue}>{selectedUser.user_role}</Text>
                                    </View>
                                )}
                                <View style={styles.userDetailRow}>
                                    <Text style={styles.detailLabel}>Current Status:</Text>
                                    {renderStatusBadge(selectedUser.registration_status)}
                                </View>

                                {/* Status Update Section - Only for client users */}
                                {selectedUser.user_type === 'client' && (
                                    <>
                                        <Text style={styles.updateTitle}>Update Status</Text>
                                        <View style={styles.statusOptions}>
                                            {['Pending', 'Verified', 'Rejected'].map(status => (
                                                <TouchableOpacity
                                                    key={status}
                                                    style={[
                                                        styles.statusOption,
                                                        selectedStatus === status && styles.statusOptionSelected
                                                    ]}
                                                    onPress={() => setSelectedStatus(status as any)}
                                                >
                                                    <Text style={[
                                                        styles.statusOptionText,
                                                        selectedStatus === status && styles.statusOptionTextSelected
                                                    ]}>
                                                        {status}
                                                    </Text>
                                                </TouchableOpacity>
                                            ))}
                                        </View>

                                        <TextInput
                                            style={styles.notesInput}
                                            placeholder="Enter verification notes..."
                                            value={statusUpdateNotes}
                                            onChangeText={setStatusUpdateNotes}
                                            multiline
                                            numberOfLines={3}
                                        />

                                        <TouchableOpacity
                                            style={styles.updateButton}
                                            onPress={() => handleUpdateStatus(selectedUser.id)}
                                        >
                                            <Text style={styles.updateButtonText}>Update Status</Text>
                                        </TouchableOpacity>
                                    </>
                                )}
                            </ScrollView>
                        )}
                    </View>
                </View>
            </Modal>
        </View>
    );
}

/* ================= STYLES ================= */

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: "#ffffff" },
    header: {
        flexDirection: "row",
        justifyContent: "space-between",
        alignItems: "center",
        padding: 20,
        backgroundColor: "#1e3a8a",
    },
    title: { fontSize: 24, fontWeight: "bold", color: "white" },
    welcome: { fontSize: 14, color: "#dbeafe", marginTop: 4 },
    logoutButton: {
        backgroundColor: "#dc2626",
        paddingVertical: 8,
        paddingHorizontal: 16,
        borderRadius: 8,
    },
    logoutText: { color: "white", fontWeight: "600", fontSize: 14 },
    searchContainer: {
        flexDirection: "row",
        padding: 15,
        backgroundColor: "#f8fafc",
        borderBottomWidth: 1,
        borderBottomColor: "#e2e8f0",
    },
    searchInput: {
        flex: 1,
        backgroundColor: "white",
        padding: 12,
        borderRadius: 8,
        borderWidth: 1,
        borderColor: "#cbd5e1",
        marginRight: 10,
        fontSize: 14,
    },
    searchButton: {
        backgroundColor: "#3b82f6",
        paddingHorizontal: 20,
        paddingVertical: 12,
        borderRadius: 8,
        justifyContent: "center",
    },
    searchButtonText: { color: "white", fontWeight: "600", fontSize: 14 },
    tabContainer: {
        flexDirection: "row",
        backgroundColor: "#f1f5f9",
        borderBottomWidth: 1,
        borderBottomColor: "#e2e8f0",
    },
    tab: {
        flex: 1,
        paddingVertical: 15,
        alignItems: "center",
    },
    activeTab: {
        borderBottomWidth: 3,
        borderBottomColor: "#1e3a8a",
        backgroundColor: "white",
    },
    tabText: {
        fontSize: 14,
        color: "#64748b",
        fontWeight: "500",
    },
    activeTabText: {
        color: "#1e3a8a",
        fontWeight: "600",
    },
    contentContainer: {
        flex: 1,
        paddingHorizontal: 15,
        paddingVertical: 10,
    },
    statsRow: {
        flexDirection: "row",
        justifyContent: "space-between",
        marginBottom: 20,
    },
    statCard: {
        flex: 1,
        backgroundColor: "white",
        padding: 15,
        borderRadius: 10,
        marginHorizontal: 5,
        alignItems: "center",
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
        elevation: 3,
    },
    statNumber: {
        fontSize: 24,
        fontWeight: "bold",
        color: "#1e3a8a",
        marginBottom: 5,
    },
    statLabel: {
        fontSize: 12,
        color: "#64748b",
        textAlign: "center",
    },
    sectionTitle: {
        fontSize: 18,
        fontWeight: "600",
        color: "#1e293b",
        marginTop: 20,
        marginBottom: 10,
    },
    recentList: {
        backgroundColor: "white",
        borderRadius: 10,
        padding: 10,
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
        elevation: 3,
    },
    recentItem: {
        flexDirection: "row",
        alignItems: "center",
        paddingVertical: 10,
        borderBottomWidth: 1,
        borderBottomColor: "#f1f5f9",
    },
    recentAvatar: {
        width: 40,
        height: 40,
        borderRadius: 20,
        backgroundColor: "#3b82f6",
        justifyContent: "center",
        alignItems: "center",
        marginRight: 12,
    },
    recentAvatarText: {
        color: "white",
        fontWeight: "bold",
        fontSize: 16,
    },
    recentInfo: {
        flex: 1,
    },
    recentName: {
        fontSize: 14,
        fontWeight: "600",
        color: "#1e293b",
    },
    recentEmail: {
        fontSize: 12,
        color: "#64748b",
        marginTop: 2,
    },
    recentType: {
        fontSize: 11,
        color: "#94a3b8",
        marginTop: 2,
    },
    statusBadge: {
        paddingHorizontal: 10,
        paddingVertical: 4,
        borderRadius: 12,
        minWidth: 80,
        alignItems: 'center',
    },
    statusBadgeText: {
        color: "white",
        fontSize: 10,
        fontWeight: "600",
    },
    statusGrid: {
        flexDirection: "row",
        flexWrap: "wrap",
        justifyContent: "space-between",
    },
    statusItem: {
        width: (width - 60) / 4,
        backgroundColor: "white",
        padding: 15,
        borderRadius: 8,
        alignItems: "center",
        marginBottom: 10,
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.1,
        shadowRadius: 2,
        elevation: 2,
    },
    statusCount: {
        fontSize: 20,
        fontWeight: "bold",
        color: "#1e3a8a",
        marginBottom: 5,
    },
    statusLabel: {
        fontSize: 11,
        color: "#64748b",
        textAlign: "center",
    },
    rolesGrid: {
        flexDirection: "row",
        flexWrap: "wrap",
        justifyContent: "space-between",
    },
    roleItem: {
        width: (width - 60) / 3,
        backgroundColor: "white",
        padding: 15,
        borderRadius: 8,
        alignItems: "center",
        marginBottom: 10,
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.1,
        shadowRadius: 2,
        elevation: 2,
    },
    roleCount: {
        fontSize: 20,
        fontWeight: "bold",
        color: "#059669",
        marginBottom: 5,
    },
    roleLabel: {
        fontSize: 11,
        color: "#64748b",
        textAlign: "center",
    },
    tableHeader: {
        flexDirection: "row",
        backgroundColor: "#1e3a8a",
        padding: 12,
        borderRadius: 8,
        marginBottom: 8,
    },
    headerCell: {
        color: "white",
        fontWeight: "700",
        fontSize: 12,
        textAlign: "center",
    },
    row: {
        flexDirection: "row",
        backgroundColor: "#f8fafc",
        borderBottomWidth: 1,
        borderBottomColor: "#e2e8f0",
        padding: 12,
        borderRadius: 6,
        marginBottom: 6,
        alignItems: "center",
    },
    cell: {
        fontSize: 12,
        color: "#334155",
        paddingHorizontal: 5,
    },
    verifiedText: {
        color: "#16a34a",
        fontWeight: "600",
        fontSize: 12,
    },
    emptyText: {
        textAlign: "center",
        marginTop: 40,
        fontSize: 16,
        color: "#64748b",
    },
    modalOverlay: {
        flex: 1,
        backgroundColor: "rgba(0, 0, 0, 0.5)",
        justifyContent: "flex-end",
    },
    modalContent: {
        backgroundColor: "white",
        borderTopLeftRadius: 20,
        borderTopRightRadius: 20,
        maxHeight: "80%",
    },
    modalHeader: {
        flexDirection: "row",
        justifyContent: "space-between",
        alignItems: "center",
        padding: 20,
        borderBottomWidth: 1,
        borderBottomColor: "#e5e7eb",
    },
    modalTitle: {
        fontSize: 18,
        fontWeight: "bold",
        color: "#1e3a8a",
    },
    modalClose: {
        fontSize: 24,
        color: "#6b7280",
        paddingHorizontal: 10,
    },
    searchResultItem: {
        flexDirection: "row",
        alignItems: "center",
        padding: 15,
        borderBottomWidth: 1,
        borderBottomColor: "#f1f5f9",
    },
    searchResultAvatar: {
        width: 36,
        height: 36,
        borderRadius: 18,
        backgroundColor: "#3b82f6",
        justifyContent: "center",
        alignItems: "center",
        marginRight: 12,
    },
    searchResultAvatarText: {
        color: "white",
        fontWeight: "bold",
        fontSize: 14,
    },
    searchResultName: {
        fontSize: 14,
        fontWeight: "600",
        color: "#1e293b",
    },
    searchResultEmail: {
        fontSize: 12,
        color: "#64748b",
        marginTop: 2,
    },
    searchResultType: {
        fontSize: 11,
        color: "#94a3b8",
        marginTop: 2,
    },
    userDetails: {
        padding: 20,
    },
    userDetailRow: {
        flexDirection: "row",
        marginBottom: 15,
        alignItems: 'center',
    },
    detailLabel: {
        width: 100,
        fontSize: 14,
        fontWeight: "600",
        color: "#374151",
    },
    detailValue: {
        flex: 1,
        fontSize: 14,
        color: "#6b7280",
    },
    updateTitle: {
        fontSize: 16,
        fontWeight: "bold",
        color: "#1e293b",
        marginTop: 20,
        marginBottom: 15,
    },
    statusOptions: {
        flexDirection: "row",
        marginBottom: 20,
    },
    statusOption: {
        flex: 1,
        paddingVertical: 10,
        alignItems: "center",
        borderWidth: 1,
        borderColor: "#d1d5db",
        marginHorizontal: 5,
        borderRadius: 8,
    },
    statusOptionSelected: {
        backgroundColor: "#1e3a8a",
        borderColor: "#1e3a8a",
    },
    statusOptionText: {
        fontSize: 12,
        color: "#6b7280",
        fontWeight: "500",
    },
    statusOptionTextSelected: {
        color: "white",
        fontWeight: "600",
    },
    notesInput: {
        backgroundColor: "#f9fafb",
        borderWidth: 1,
        borderColor: "#d1d5db",
        borderRadius: 8,
        padding: 12,
        fontSize: 14,
        marginBottom: 20,
        textAlignVertical: "top",
        minHeight: 80,
    },
    updateButton: {
        backgroundColor: "#1e3a8a",
        paddingVertical: 15,
        borderRadius: 8,
        alignItems: "center",
        marginBottom: 20,
    },
    updateButtonText: {
        color: "white",
        fontSize: 16,
        fontWeight: "bold",
    },
});