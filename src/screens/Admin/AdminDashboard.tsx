import React, { useEffect, useState } from "react";
import {
    View,
    Text,
    FlatList,
    StyleSheet,
    ActivityIndicator,
    Alert,
    TouchableOpacity,
} from "react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { useNavigation } from "@react-navigation/native";
import { StackNavigationProp } from "@react-navigation/stack";

import { adminAPI } from "../../services/api";
import { RootStackParamList } from "../../navigation/AppNavigator";
import { SystemUser } from "../../types/types";

type AdminNavigationProp = StackNavigationProp<
    RootStackParamList,
    "AdminDashboard"
>;

export default function AdminDashboard() {
    const navigation = useNavigation<AdminNavigationProp>();

    const [adminUser, setAdminUser] = useState<any>(null);
    const [users, setUsers] = useState<SystemUser[]>([]);
    const [loading, setLoading] = useState(true);

    /**
     * 🔹 Load logged-in admin + fetch users
     */
    useEffect(() => {
        loadAdmin();
        fetchRegisteredUsers();
    }, []);

    /**
     * Load logged-in admin from storage
     */
    const loadAdmin = async () => {
        try {
            const storedUser = await AsyncStorage.getItem("user");
            console.log("📥 Admin loaded from storage:", storedUser);

            if (storedUser) {
                setAdminUser(JSON.parse(storedUser));
            }
        } catch (error) {
            console.log("❌ Failed to load admin user:", error);
        }
    };

    /**
     * Fetch all registered users from backend
     */
    const fetchRegisteredUsers = async () => {
        try {
            console.log("🔄 Fetching registered users...");
            const response = await adminAPI.getAllUsers();
            //const response = await adminAPI.getAllClientUsers();

            console.log("✅ Users API response:", response.data);

            setUsers(response.data?.data ?? []);
        } catch (error) {
            console.log("❌ Failed to fetch users:", error);
            Alert.alert("Error", "Failed to load registered users");
        } finally {
            setLoading(false);
        }
    };

    /**
     * 🔴 Logout handler
     */
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
                        try {
                            console.log("🚪 Admin logging out...");
                            await AsyncStorage.removeItem("user");

                            navigation.reset({
                                index: 0,
                                routes: [{ name: "Login" }],
                            });
                        } catch (error) {
                            console.log("❌ Logout error:", error);
                            Alert.alert("Error", "Failed to logout");
                        }
                    },
                },
            ],
            { cancelable: true }
        );
    };

    /**
     * Render each user row
     */
    const renderUser = ({ item }: { item: SystemUser }) => {
        const fullName = `${item.title ?? ""} ${item.first_name} ${item.last_name}`;

        return (
            <View style={styles.row}>
                <Text style={[styles.cell, styles.name]} numberOfLines={1}>
                    {fullName.trim()}
                </Text>

                <Text style={[styles.cell, styles.email]} numberOfLines={1}>
                    {item.email}
                </Text>

                <Text style={[styles.cell, styles.phone]}>
                    {item.phone_number ?? "—"}
                </Text>

                <Text style={[styles.cell, styles.region]}>
                    {item.region ?? "—"}
                </Text>

                <Text style={[styles.cell, styles.persal]}>
                    {item.persal_id ?? "—"}
                </Text>

                <Text style={[styles.cell, styles.department]}>
                    {item.department_id ?? "—"}
                </Text>

                <Text style={[styles.cell, styles.type]}>
                    {item.user_type === "operational"
                        ? item.user_role ?? "Operational"
                        : "Client"}
                </Text>

                <Text
                    style={[
                        styles.cell,
                        styles.status,
                        item.registration_status === "Approved" && styles.statusApproved,
                        item.registration_status === "Pending" && styles.statusPending,
                        item.registration_status === "Rejected" && styles.statusRejected,
                    ]}
                >
                    {item.registration_status ?? "—"}
                </Text>
            </View>
        );
    };

    return (
        <View style={styles.container}>
            <Text style={styles.title}>Admin Dashboard</Text>
            <Text style={styles.subtitle}>Registered Users</Text>

            <Text style={styles.welcome}>
                Welcome, {adminUser?.first_name ?? "Admin"}
            </Text>

            <TouchableOpacity style={styles.logoutButton} onPress={handleLogout}>
                <Text style={styles.logoutText}>Logout</Text>
            </TouchableOpacity>

            {loading ? (
                <ActivityIndicator size="large" color="#1e3a8a" style={{ marginTop: 40 }} />
            ) : (
                <>
                    <View style={styles.tableHeader}>
                        <Text style={[styles.headerCell, styles.name]}>Name</Text>
                        <Text style={[styles.headerCell, styles.email]}>Email</Text>
                        <Text style={[styles.headerCell, styles.phone]}>Phone</Text>
                        <Text style={[styles.headerCell, styles.region]}>Region</Text>
                        <Text style={[styles.headerCell, styles.persal]}>Persal</Text>
                        <Text style={[styles.headerCell, styles.department]}>Dept</Text>
                        <Text style={[styles.headerCell, styles.type]}>Type</Text>
                        <Text style={[styles.headerCell, styles.status]}>Status</Text>
                    </View>

                    <FlatList
                        data={users}
                        renderItem={renderUser}
                        keyExtractor={(item) =>
                            String(item.client_user_id ?? item.operational_user_id)
                        }
                        ListEmptyComponent={
                            <Text style={styles.emptyText}>No users registered</Text>
                        }
                        contentContainerStyle={{ paddingBottom: 40 }}
                    />
                </>
            )}
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        padding: 20,
        backgroundColor: "#ffffff",
    },
    title: {
        fontSize: 26,
        fontWeight: "bold",
        color: "#1e293b",
    },
    subtitle: {
        fontSize: 16,
        color: "#475569",
        marginBottom: 10,
    },
    welcome: {
        fontSize: 14,
        marginBottom: 12,
        color: "#334155",
    },
    tableHeader: {
        flexDirection: "row",
        backgroundColor: "#1e3a8a",
        padding: 10,
        borderRadius: 6,
        marginBottom: 8,
    },
    headerCell: {
        color: "white",
        fontWeight: "700",
        fontSize: 13,
    },
    row: {
        flexDirection: "row",
        backgroundColor: "#f1f5f9",
        borderBottomWidth: 1,
        borderBottomColor: "#e2e8f0",
        padding: 10,
        borderRadius: 6,
        marginBottom: 6,
    },
    cell: {
        fontSize: 12,
        color: "#334155",
    },
    name: { flex: 2 },
    email: { flex: 1.5 },
    phone: { flex: 1 },
    region: { flex: 1 },
    persal: { flex: 1 },
    department: { flex: 1 },
    type: { flex: 1 },
    status: { flex: 1 },
    logoutButton: {
        backgroundColor: "#dc2626",
        paddingVertical: 8,
        paddingHorizontal: 14,
        borderRadius: 8,
        alignSelf: "flex-start",
        marginBottom: 12,
    },
    logoutText: {
        color: "white",
        fontWeight: "600",
    },
    statusApproved: { color: "#16a34a", fontWeight: "700" },
    statusPending: { color: "#ca8a04", fontWeight: "700" },
    statusRejected: { color: "#dc2626", fontWeight: "700" },
    emptyText: {
        textAlign: "center",
        marginTop: 40,
        fontSize: 16,
        color: "#64748b",
    },
});
