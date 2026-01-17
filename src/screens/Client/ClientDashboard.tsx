// ClientDashboard.tsx
import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, Alert, Modal } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { StackNavigationProp } from '@react-navigation/stack';
import { RootStackParamList } from '../../navigation/AppNavigator';
import { useNavigation } from '@react-navigation/native';
import { authAPI } from '../../services/api';

type NavigationProp = StackNavigationProp<
    RootStackParamList,
    'DOJCDDashboard'
>;

export default function ClientDashboard() {
    const [user, setUser] = useState<any>(null);
    const [showProfileModal, setShowProfileModal] = useState(false);
    const [hasCompletedProfile, setHasCompletedProfile] = useState(false);
    const navigation = useNavigation<NavigationProp>();

    useEffect(() => {
        const loadUser = async () => {
            const userData = await AsyncStorage.getItem("user");
            console.log('📥 User loaded from storage:', userData);
            if (userData) {
                const parsedUser = JSON.parse(userData);
                setUser(parsedUser);
                
                // Check if user has completed profile
                checkProfileCompletion(parsedUser);
            }
        };
        loadUser();
    }, []);

  const checkProfileCompletion = async (userData: any) => {
    try {
        // Check registration_status
        if (userData.registration_status === 'Profile_Completed') {
            setHasCompletedProfile(true);
            setShowProfileModal(false);
        } else if (userData.registration_status === 'Pending') {
            setShowProfileModal(true);
            setHasCompletedProfile(false);
        } else {
            // For 'Verified' or 'Rejected' status
            setHasCompletedProfile(true);
            setShowProfileModal(false);
        }

        // Optional: Also check if profile fields are filled as backup
        const hasProfileFields = userData.network_provider && 
                                 userData.contract_duration_months && 
                                 userData.contract_end_date;
        
        if (!hasProfileFields && userData.registration_status === 'Pending') {
            setShowProfileModal(true);
            setHasCompletedProfile(false);
        }
        
    } catch (error) {
        console.log('Error checking profile:', error);
    }
};

    const handleProfileComplete = () => {
        setShowProfileModal(false);
        navigation.navigate('CompleteProfile');
    };

    const handleSkipForNow = () => {
        setShowProfileModal(false);
        // You might want to set a flag in AsyncStorage to not show this again
        AsyncStorage.setItem('profile_skipped', 'true');
    };

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
                            await AsyncStorage.removeItem('user');
                            await AsyncStorage.removeItem('profile_skipped');
                            
                            Alert.alert('Logged Out', 'You have been logged out successfully');

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
        <>
            <ScrollView style={styles.container}>
                {/* HEADER */}
                <View style={styles.header}>
                    <View>
                        <Text style={styles.welcome}>Welcome Back 👋</Text>
                        <Text style={styles.name}>
                            {user?.first_name || 'Client'}
                        </Text>
                        
                        {/* Show profile completion status */}
                        {!hasCompletedProfile && (
                            <View style={styles.profileWarning}>
                                <Text style={styles.warningText}>Profile incomplete</Text>
                                <TouchableOpacity 
                                    onPress={() => navigation.navigate('CompleteProfile')}
                                    style={styles.completeBtn}
                                >
                                    <Text style={styles.completeBtnText}>Complete Now</Text>
                                </TouchableOpacity>
                            </View>
                        )}
                    </View>

                    {/* LOGOUT BUTTON */}
                    <TouchableOpacity onPress={handleLogout}>
                        <Text style={styles.logout}>Logout</Text>
                    </TouchableOpacity>
                </View>

                {/* QUICK ACTIONS */}
                <Text style={styles.sectionTitle}>Quick Actions</Text>
                <View style={styles.row}>
                    <TouchableOpacity 
                        style={[styles.card, !hasCompletedProfile && styles.disabledCard]}
                        onPress={() => {
                            if (hasCompletedProfile) {
                                // Navigate to upload invoice
                            } else {
                                Alert.alert('Complete Profile', 'Please complete your profile first');
                            }
                        }}
                        disabled={!hasCompletedProfile}
                    >
                        <Text style={styles.cardTitle}>Upload Invoice</Text>
                        <Text style={styles.cardDesc}>Submit your invoices easily</Text>
                        {!hasCompletedProfile && (
                            <Text style={styles.lockedText}>Complete profile to unlock</Text>
                        )}
                    </TouchableOpacity>

                    <TouchableOpacity 
                        style={[styles.card, !hasCompletedProfile && styles.disabledCard]}
                        onPress={() => {
                            if (hasCompletedProfile) {
                                // Navigate to view status
                            }
                        }}
                        disabled={!hasCompletedProfile}
                    >
                        <Text style={styles.cardTitle}>View Status</Text>
                        <Text style={styles.cardDesc}>Track all your submissions</Text>
                        {!hasCompletedProfile && (
                            <Text style={styles.lockedText}>Complete profile to unlock</Text>
                        )}
                    </TouchableOpacity>
                </View>

                {/* REST OF YOUR DASHBOARD CODE... */}
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
                    {!hasCompletedProfile ? (
                        <>
                            <Text style={styles.nextStepsText}>• Complete your profile setup</Text>
                            <Text style={styles.nextStepsText}>• Submit your first invoice</Text>
                            <Text style={styles.nextStepsText}>• Check your invoice processing status</Text>
                        </>
                    ) : (
                        <>
                            <Text style={styles.nextStepsText}>• Submit your first invoice</Text>
                            <Text style={styles.nextStepsText}>• Check your invoice processing status</Text>
                            <Text style={styles.nextStepsText}>• Contact support if you need help</Text>
                        </>
                    )}
                </View>
            </ScrollView>

            {/* MODAL FOR PROFILE COMPLETION */}
            <Modal
                visible={showProfileModal}
                transparent={true}
                animationType="slide"
            >
                <View style={styles.modalOverlay}>
                    <View style={styles.modalContent}>
                        <Text style={styles.modalTitle}>Complete Your Profile</Text>
                        <Text style={styles.modalText}>
                            Welcome! To get started, please complete your profile by providing:
                        </Text>
                        <View style={styles.modalList}>
                            <Text style={styles.modalListItem}>• Network provider information</Text>
                            <Text style={styles.modalListItem}>• Contract details</Text>
                            <Text style={styles.modalListItem}>• Upload an invoice</Text>
                        </View>
                        
                        <View style={styles.modalButtons}>
                            <TouchableOpacity 
                                style={[styles.modalButton, styles.primaryButton]}
                                onPress={handleProfileComplete}
                            >
                                <Text style={styles.primaryButtonText}>Complete Profile</Text>
                            </TouchableOpacity>
                            
                            <TouchableOpacity 
                                style={[styles.modalButton, styles.secondaryButton]}
                                onPress={handleSkipForNow}
                            >
                                <Text style={styles.secondaryButtonText}>Skip for now</Text>
                            </TouchableOpacity>
                        </View>
                    </View>
                </View>
            </Modal>
        </>
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
    disabledCard: {
        opacity: 0.5,
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
    lockedText: {
        fontSize: 11,
        color: "#ef4444",
        marginTop: 5,
        fontStyle: 'italic',
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
    profileWarning: {
        backgroundColor: '#fef3c7',
        padding: 10,
        borderRadius: 8,
        marginTop: 10,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
    },
    warningText: {
        color: '#92400e',
        fontWeight: '600',
    },
    completeBtn: {
        backgroundColor: '#3b82f6',
        paddingHorizontal: 12,
        paddingVertical: 6,
        borderRadius: 6,
    },
    completeBtnText: {
        color: 'white',
        fontWeight: '600',
        fontSize: 12,
    },
    // Modal styles
    modalOverlay: {
        flex: 1,
        backgroundColor: 'rgba(0, 0, 0, 0.5)',
        justifyContent: 'center',
        alignItems: 'center',
    },
    modalContent: {
        backgroundColor: 'white',
        borderRadius: 16,
        padding: 24,
        width: '85%',
        maxWidth: 400,
    },
    modalTitle: {
        fontSize: 22,
        fontWeight: 'bold',
        marginBottom: 12,
        textAlign: 'center',
    },
    modalText: {
        fontSize: 16,
        color: '#4b5563',
        marginBottom: 16,
        textAlign: 'center',
    },
    modalList: {
        marginBottom: 24,
        paddingLeft: 16,
    },
    modalListItem: {
        fontSize: 14,
        color: '#6b7280',
        marginBottom: 6,
    },
    modalButtons: {
        gap: 12,
    },
    modalButton: {
        paddingVertical: 14,
        borderRadius: 10,
        alignItems: 'center',
    },
    primaryButton: {
        backgroundColor: '#3b82f6',
    },
    primaryButtonText: {
        color: 'white',
        fontWeight: '600',
        fontSize: 16,
    },
    secondaryButton: {
        backgroundColor: '#f3f4f6',
    },
    secondaryButtonText: {
        color: '#4b5563',
        fontWeight: '600',
        fontSize: 16,
    },
});