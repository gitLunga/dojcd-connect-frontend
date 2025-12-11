import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';

export default function ClientDashboard({ }) {
    const [user, setUser] = useState<any>(null);

    useEffect(() => {
        const loadUser = async () => {
            const userData = await AsyncStorage.getItem("user");
            if (userData) {
                setUser(JSON.parse(userData));
            }
        };
        loadUser();
    }, []);

    return (
        <ScrollView style={styles.container}>

            {/* HEADER */}
            <View style={styles.header}>
                <Text style={styles.welcome}>Welcome Back 👋</Text>
                <Text style={styles.name}>
                    {user?.first_name ? user.first_name : "Client"}
                </Text>
            </View>

            {/* QUICK ACTIONS */}
            <Text style={styles.sectionTitle}>Quick Actions</Text>
            <View style={styles.row}>
                <TouchableOpacity style={styles.card}>
                    <Text style={styles.cardTitle}>Upload Invoice</Text>
                    <Text style={styles.cardDesc}>Submit your invoices easily</Text>
                </TouchableOpacity>

                <TouchableOpacity style={styles.card}>
                    <Text style={styles.cardTitle}>View Status</Text>
                    <Text style={styles.cardDesc}>Track all your submissions</Text>
                </TouchableOpacity>
            </View>

            {/* NOTIFICATIONS */}
            <Text style={styles.sectionTitle}>Notifications</Text>
            <View style={styles.notification}>
                <Text style={styles.notificationTitle}>No new notifications</Text>
                <Text style={styles.notificationText}>
                    You are all caught up!
                </Text>
            </View>

            {/* NEXT STEPS */}
            <Text style={styles.sectionTitle}>Next Steps</Text>
            <View style={styles.nextSteps}>
                <Text style={styles.nextStepsText}>• Submit your first invoice</Text>
                <Text style={styles.nextStepsText}>• Check your invoice processing status</Text>
                <Text style={styles.nextStepsText}>• Contact support if you need help</Text>
            </View>

        </ScrollView>
    );
}

const styles = StyleSheet.create({
    container: {
        padding: 20,
        backgroundColor: "#f5f7fa",
        flex: 1,
    },
    header: {
        marginBottom: 25,
    },
    welcome: {
        fontSize: 22,
        color: "#666",
    },
    name: {
        fontSize: 32,
        fontWeight: "bold",
        marginTop: 5,
    },
    sectionTitle: {
        fontSize: 20,
        fontWeight: "600",
        marginBottom: 10,
        marginTop: 20,
    },
    row: {
        flexDirection: "row",
        justifyContent: "space-between",
    },
    card: {
        backgroundColor: "#fff",
        width: "48%",
        padding: 15,
        borderRadius: 12,
        elevation: 3,
    },
    cardTitle: {
        fontSize: 18,
        fontWeight: "600",
        marginBottom: 5,
    },
    cardDesc: {
        fontSize: 13,
        color: "#666",
    },
    notification: {
        backgroundColor: "#fff",
        padding: 15,
        borderRadius: 12,
        elevation: 3,
    },
    notificationTitle: {
        fontSize: 16,
        fontWeight: "600",
    },
    notificationText: {
        color: "#555",
        marginTop: 5,
    },
    nextSteps: {
        backgroundColor: "#fff",
        padding: 15,
        borderRadius: 12,
        marginBottom: 30,
        elevation: 3,
    },
    nextStepsText: {
        fontSize: 14,
        marginBottom: 5,
    }
});
