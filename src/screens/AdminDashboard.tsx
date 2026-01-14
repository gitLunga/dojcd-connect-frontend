import React, { useEffect, useState } from "react";
import { View, Text, FlatList, StyleSheet, ActivityIndicator } from "react-native";
import { adminAPI } from "../services/api";

export default function AdminDashboard() {
    const [users, setUsers] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetchUsers();
    }, []);

    const fetchUsers = async () => {
        try {
            const response = await adminAPI.getAllUsers();
            //const response = await adminAPI.getAllClientUsers();

            // This should match your backend response shape
            setUsers(response.data.data || []);
        } catch (error) {
            console.log("❌ Failed to fetch users:", error);
        } finally {
            setLoading(false);
        }
    };

    // @ts-ignore
    const renderUser = ({ item }) => (
        <View style={styles.row}>
            <Text style={[styles.cell, styles.name]}>
                {item.title} {item.first_name} {item.last_name}
            </Text>

            <Text style={[styles.cell, styles.email]}>{item.email}</Text>
            <Text style={[styles.cell, styles.phone]}>{item.phone_number}</Text>
            <Text style={[styles.cell, styles.region]}>{item.region}</Text>

            <Text style={[styles.cell, styles.persal]}>{item.persal_id}</Text>
            <Text style={[styles.cell, styles.department]}>{item.department_id}</Text>

            <Text style={[styles.cell, styles.type]}>{item.user_type}</Text>
            <Text style={[styles.cell, styles.status]}>{item.registration_status}</Text>
        </View>
    );

    return (
        <View style={styles.container}>
            <Text style={styles.title}>Admin Dashboard</Text>
            <Text style={styles.subtitle}>Registered Client Users</Text>

            {loading ? (
                <ActivityIndicator size="large" color="#1e3a8a" style={{ marginTop: 20 }} />
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
                        keyExtractor={(item) => String(item.client_user_id)}
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
        marginBottom: 20,
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
});
