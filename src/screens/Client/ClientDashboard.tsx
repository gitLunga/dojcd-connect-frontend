import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView,Alert } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { StackNavigationProp } from '@react-navigation/stack';
import { RootStackParamList } from '../../navigation/AppNavigator';
import { useNavigation } from '@react-navigation/native';

type NavigationProp = StackNavigationProp<
    RootStackParamList,
    'DOJCDDashboard'
>;

type Props = {
    navigation: NavigationProp;
};

export default function ClientDashboard({ }) {
    const [user, setUser] = useState<any>(null);
    const navigation = useNavigation<NavigationProp>();

    useEffect(() => {
        const loadUser = async () => {
            const userData = await AsyncStorage.getItem("user");
            console.log('📥 User loaded from storage:', userData);
            if (userData) {
                setUser(JSON.parse(userData));
            }
        };
        loadUser();
    }, []);
    /**
      * 🔴 LOGOUT FUNCTION
    */
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
                            // 1️⃣ Check stored user BEFORE logout
                            const storedUser = await AsyncStorage.getItem('user');
                            console.log('🚪 Logging out user:', storedUser);

                            // 2️⃣ Remove user from storage
                            await AsyncStorage.removeItem('user');

                            // 3️⃣ Confirm storage is cleared
                            const afterLogout = await AsyncStorage.getItem('user');
                            console.log('🧹 Storage after logout:', afterLogout); // null

                            Alert.alert('Logged Out', 'You have been logged out successfully');

                            // 4️⃣ Reset navigation back to Login
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

    return (
        <ScrollView style={styles.container}>

            {/* HEADER */}
            <View style={styles.header}>
                <View>
                    <Text style={styles.welcome}>Welcome Back 👋</Text>
                    <Text style={styles.name}>
                        {user?.first_name || 'Client'}
                    </Text>
                </View>

                {/* LOGOUT BUTTON */}
                <TouchableOpacity onPress={handleLogout}>
                    <Text style={styles.logout}>Logout</Text>
                </TouchableOpacity>
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
    },
    logout: {
        color: '#ef4444',
        fontWeight: '600',
        fontSize: 16,
    },
});
