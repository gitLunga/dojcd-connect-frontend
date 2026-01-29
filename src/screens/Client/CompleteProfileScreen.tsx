// CompleteProfileScreen.tsx
import React, { useState } from 'react';
import {
    View,
    Text,
    Pressable,
    Alert,
    StyleSheet,
    ScrollView,
    Modal,
    TouchableOpacity,
    FlatList
} from 'react-native';
import * as DocumentPicker from 'expo-document-picker';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { authAPI } from '../../services/api';
import { CompleteProfileData } from '../../types/types';
import DateTimePicker from '@react-native-community/datetimepicker';

const NETWORK_PROVIDERS = [
    { value: 'MTN', label: 'MTN' },
    { value: 'Vodacom', label: 'Vodacom' },
    { value: 'Cell_C', label: 'Cell C' },
    { value: 'Telkom', label: 'Telkom' },
    { value: 'Rain', label: 'Rain' },
];

const CONTRACT_DURATIONS = [
    { value: '12', label: '12 Months' },
    { value: '24', label: '24 Months' },
    { value: '36', label: '36 Months' },
];

export default function CompleteProfileScreen({ navigation }: any) {
    const [network, setNetwork] = useState('');
    const [duration, setDuration] = useState('');
    const [endDate, setEndDate] = useState<Date>(new Date());
    const [showDatePicker, setShowDatePicker] = useState(false);
    const [invoice, setInvoice] = useState<any>(null);
    const [loading, setLoading] = useState(false);

    // Modal states
    const [showNetworkModal, setShowNetworkModal] = useState(false);
    const [showDurationModal, setShowDurationModal] = useState(false);

    const pickInvoice = async () => {
        try {
            const res = await DocumentPicker.getDocumentAsync({
                type: ['application/pdf', 'image/*'],
                copyToCacheDirectory: true
            });

            if (res.assets && res.assets[0]) {
                setInvoice(res.assets[0]);
            }
        } catch (error) {
            console.error('Error picking invoice:', error);
            Alert.alert('Error', 'Failed to select invoice');
        }
    };

    const onDateChange = (event: any, selectedDate?: Date) => {
        setShowDatePicker(false);
        if (selectedDate) {
            setEndDate(selectedDate);
        }
    };

    const formatDate = (date: Date) => {
        return date.toISOString().split('T')[0]; // YYYY-MM-DD format
    };

    const submitProfile = async () => {
        if (!network || !duration || !invoice) {
            Alert.alert('Error', 'All fields are required');
            return;
        }

        setLoading(true);
        try {
            const userString = await AsyncStorage.getItem('user');
            if (!userString) {
                Alert.alert('Error', 'User not found. Please login again.');
                navigation.goBack();
                return;
            }

            const user = JSON.parse(userString);

            if (!user.client_user_id) {
                Alert.alert('Error', 'User ID not found');
                return;
            }

            // Create CompleteProfileData object
            const profileData: CompleteProfileData = {
                network_provider: network,
                contract_duration_months: Number(duration),
                contract_end_date: formatDate(endDate),
                invoice_file: {
                    uri: invoice.uri,
                    name: invoice.name || 'invoice.pdf',
                    type: invoice.mimeType || 'application/pdf',
                }
            };

            const result = await authAPI.completeProfile(user.client_user_id, profileData);

            // Update user in storage with new profile data
            const updatedUser = {
                ...user,
                ...result,
                registration_status: 'Profile_Completed'  // Add this
            };
            await AsyncStorage.setItem('user', JSON.stringify(updatedUser));

            Alert.alert(
                'Success',
                'Profile completed successfully!',
                [
                    {
                        text: 'OK',
                        onPress: () => navigation.goBack()
                    }
                ]
            );

        } catch (error: any) {
            console.error('Profile completion error:', error);
            Alert.alert('Error', error.message || 'Profile completion failed');
        } finally {
            setLoading(false);
        }
    };

    // Render dropdown item
    const renderDropdownItem = (item: any, setValue: Function, closeModal: Function) => (
        <TouchableOpacity
            style={styles.dropdownItem}
            onPress={() => {
                setValue(item.value);
                closeModal();
            }}
        >
            <Text style={styles.dropdownItemText}>{item.label}</Text>
        </TouchableOpacity>
    );

    return (
        <ScrollView style={styles.container}>
            <Text style={styles.title}>Complete Your Profile</Text>
            <Text style={styles.subtitle}>Please provide your contract details</Text>

            {/* Network Provider Dropdown */}
            <View style={styles.inputGroup}>
                <Text style={styles.label}>Network Provider *</Text>
                <TouchableOpacity
                    style={styles.dropdownButton}
                    onPress={() => setShowNetworkModal(true)}
                >
                    <Text style={styles.dropdownButtonText}>
                        {network ? NETWORK_PROVIDERS.find(p => p.value === network)?.label : 'Select Network Provider'}
                    </Text>
                    <Text style={styles.dropdownArrow}>▼</Text>
                </TouchableOpacity>
            </View>

            {/* Contract Duration Dropdown */}
            <View style={styles.inputGroup}>
                <Text style={styles.label}>Contract Duration *</Text>
                <TouchableOpacity
                    style={styles.dropdownButton}
                    onPress={() => setShowDurationModal(true)}
                >
                    <Text style={styles.dropdownButtonText}>
                        {duration ? CONTRACT_DURATIONS.find(d => d.value === duration)?.label : 'Select Contract Duration'}
                    </Text>
                    <Text style={styles.dropdownArrow}>▼</Text>
                </TouchableOpacity>
            </View>

            {/* Contract End Date Picker */}
            <View style={styles.inputGroup}>
                <Text style={styles.label}>Contract End Date</Text>
                <TouchableOpacity
                    style={styles.datePickerButton}
                    onPress={() => setShowDatePicker(true)}
                >
                    <Text style={styles.datePickerText}>{formatDate(endDate)}</Text>
                    <Text style={styles.calendarIcon}>📅</Text>
                </TouchableOpacity>
                {showDatePicker && (
                    <DateTimePicker
                        value={endDate}
                        mode="date"
                        display="default"
                        onChange={onDateChange}
                    />
                )}
            </View>

            {/* Invoice Upload */}
            <View style={styles.inputGroup}>
                <Text style={styles.label}>Upload Employment Letter *</Text>
                <Pressable
                    style={[styles.uploadButton, invoice && styles.uploadButtonSuccess]}
                    onPress={pickInvoice}
                >
                    <Text style={styles.uploadButtonText}>
                        {invoice ? `✓ ${invoice.name}` : 'Select Invoice (PDF/Image)'}
                    </Text>
                    <Text style={styles.uploadIcon}>📎</Text>
                </Pressable>
                {invoice && (
                    <Text style={styles.fileInfo}>
                        {(invoice.size / 1024).toFixed(2)} KB • {invoice.mimeType || 'Unknown type'}
                    </Text>
                )}
            </View>

            {/* Submit Button */}
            <Pressable
                style={[styles.submitButton, loading && styles.submitButtonDisabled]}
                onPress={submitProfile}
                disabled={loading}
            >
                <Text style={styles.submitButtonText}>
                    {loading ? 'Processing...' : 'Complete Profile'}
                </Text>
            </Pressable>

            {/* Network Provider Modal */}
            <Modal
                visible={showNetworkModal}
                transparent={true}
                animationType="slide"
                onRequestClose={() => setShowNetworkModal(false)}
            >
                <View style={styles.modalOverlay}>
                    <View style={styles.modalContent}>
                        <View style={styles.modalHeader}>
                            <Text style={styles.modalTitle}>Select Network Provider</Text>
                            <TouchableOpacity onPress={() => setShowNetworkModal(false)}>
                                <Text style={styles.modalClose}>✕</Text>
                            </TouchableOpacity>
                        </View>
                        <FlatList
                            data={NETWORK_PROVIDERS}
                            keyExtractor={(item) => item.value}
                            renderItem={({ item }) => renderDropdownItem(item, setNetwork, () => setShowNetworkModal(false))}
                        />
                    </View>
                </View>
            </Modal>

            {/* Contract Duration Modal */}
            <Modal
                visible={showDurationModal}
                transparent={true}
                animationType="slide"
                onRequestClose={() => setShowDurationModal(false)}
            >
                <View style={styles.modalOverlay}>
                    <View style={styles.modalContent}>
                        <View style={styles.modalHeader}>
                            <Text style={styles.modalTitle}>Select Contract Duration</Text>
                            <TouchableOpacity onPress={() => setShowDurationModal(false)}>
                                <Text style={styles.modalClose}>✕</Text>
                            </TouchableOpacity>
                        </View>
                        <FlatList
                            data={CONTRACT_DURATIONS}
                            keyExtractor={(item) => item.value}
                            renderItem={({ item }) => renderDropdownItem(item, setDuration, () => setShowDurationModal(false))}
                        />
                    </View>
                </View>
            </Modal>
        </ScrollView>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        padding: 20,
        backgroundColor: '#f5f7fa',
    },
    title: {
        fontSize: 28,
        fontWeight: 'bold',
        marginBottom: 8,
        color: '#1e3a8a',
        textAlign: 'center',
    },
    subtitle: {
        fontSize: 16,
        color: '#6b7280',
        marginBottom: 30,
        textAlign: 'center',
    },
    inputGroup: {
        marginBottom: 25,
    },
    label: {
        fontSize: 16,
        fontWeight: '600',
        marginBottom: 10,
        color: '#374151',
    },
    dropdownButton: {
        backgroundColor: 'white',
        padding: 16,
        borderRadius: 10,
        borderWidth: 1,
        borderColor: '#d1d5db',
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
    },
    dropdownButtonText: {
        fontSize: 16,
        color: '#374151',
    },
    dropdownArrow: {
        fontSize: 12,
        color: '#6b7280',
    },
    datePickerButton: {
        backgroundColor: 'white',
        padding: 16,
        borderRadius: 10,
        borderWidth: 1,
        borderColor: '#d1d5db',
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
    },
    datePickerText: {
        fontSize: 16,
        color: '#374151',
    },
    calendarIcon: {
        fontSize: 18,
    },
    uploadButton: {
        backgroundColor: '#3b82f6',
        padding: 16,
        borderRadius: 10,
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
    },
    uploadButtonSuccess: {
        backgroundColor: '#10b981',
    },
    uploadButtonText: {
        color: 'white',
        fontSize: 16,
        fontWeight: '600',
    },
    uploadIcon: {
        fontSize: 18,
        color: 'white',
    },
    fileInfo: {
        fontSize: 12,
        color: '#6b7280',
        marginTop: 6,
        textAlign: 'center',
    },
    submitButton: {
        backgroundColor: '#1e3a8a',
        padding: 18,
        borderRadius: 10,
        alignItems: 'center',
        marginTop: 10,
        marginBottom: 30,
    },
    submitButtonDisabled: {
        backgroundColor: '#9ca3af',
    },
    submitButtonText: {
        color: 'white',
        fontSize: 18,
        fontWeight: 'bold',
    },
    // Modal Styles
    modalOverlay: {
        flex: 1,
        backgroundColor: 'rgba(0, 0, 0, 0.5)',
        justifyContent: 'flex-end',
    },
    modalContent: {
        backgroundColor: 'white',
        borderTopLeftRadius: 20,
        borderTopRightRadius: 20,
        maxHeight: '50%',
    },
    modalHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        padding: 20,
        borderBottomWidth: 1,
        borderBottomColor: '#e5e7eb',
    },
    modalTitle: {
        fontSize: 18,
        fontWeight: 'bold',
        color: '#1e3a8a',
    },
    modalClose: {
        fontSize: 24,
        color: '#6b7280',
        paddingHorizontal: 10,
    },
    dropdownItem: {
        padding: 18,
        borderBottomWidth: 1,
        borderBottomColor: '#e5e7eb',
    },
    dropdownItemText: {
        fontSize: 16,
        color: '#374151',
    },
});