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
    FlatList,
    ActivityIndicator
} from 'react-native';
import * as DocumentPicker from 'expo-document-picker';
import * as ImagePicker from 'expo-image-picker';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { authAPI } from '../../services/api';
import { CompleteProfileData } from '../../types/types';
import DateTimePicker from '@react-native-community/datetimepicker';
import { Ionicons } from '@expo/vector-icons';

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

// Document types
const DOCUMENT_TYPES = [
    {
        id: 'invoice',
        title: 'Current Service Invoice *',
        key: 'invoice_file',
        description: 'Upload your current mobile service invoice',
        required: true
    },
    {
        id: 'id',
        title: 'ID Document *',
        key: 'id_document',
        description: 'Upload a clear copy of your ID/Passport',
        required: true
    },
    {
        id: 'payslip',
        title: 'Latest Payslip *',
        key: 'payslip_document',
        description: 'Upload your most recent payslip',
        required: true
    },
    {
        id: 'residence',
        title: 'Proof of Residence (Optional)',
        key: 'residence_document',
        description: 'Upload proof of residence (utility bill, bank statement)',
        required: false
    }
];

export default function CompleteProfileScreen({ navigation }: any) {
    const [network, setNetwork] = useState('');
    const [duration, setDuration] = useState('');
    const [endDate, setEndDate] = useState<Date>(new Date());
    const [showDatePicker, setShowDatePicker] = useState(false);
    const [loading, setLoading] = useState(false);

    // Document states - using an object to store all documents
    const [documents, setDocuments] = useState<Record<string, any>>({
        invoice_file: null,
        id_document: null,
        payslip_document: null,
        residence_document: null
    });

    // Modal states
    const [showNetworkModal, setShowNetworkModal] = useState(false);
    const [showDurationModal, setShowDurationModal] = useState(false);

    // Handle document selection
    const pickDocument = async (documentKey: string) => {
        try {
            Alert.alert(
                'Select Document',
                'Choose how to upload:',
                [
                    {
                        text: 'Take Photo',
                        onPress: () => takePhoto(documentKey)
                    },
                    {
                        text: 'Choose from Gallery',
                        onPress: () => pickImage(documentKey)
                    },
                    {
                        text: 'Choose PDF/Document',
                        onPress: () => pickPDF(documentKey)
                    },
                    {
                        text: 'Cancel',
                        style: 'cancel'
                    }
                ]
            );
        } catch (error) {
            console.error('Error picking document:', error);
        }
    };

    const takePhoto = async (documentKey: string) => {
        try {
            const { status } = await ImagePicker.requestCameraPermissionsAsync();
            if (status !== 'granted') {
                Alert.alert('Permission required', 'Camera permission is required to take photos');
                return;
            }

            const result = await ImagePicker.launchCameraAsync({
                mediaTypes: ImagePicker.MediaTypeOptions.Images,
                allowsEditing: true,
                quality: 0.8,
            });

            if (!result.canceled && result.assets[0]) {
                const asset = result.assets[0];
                setDocuments(prev => ({
                    ...prev,
                    [documentKey]: {
                        uri: asset.uri,
                        name: `${documentKey}_${Date.now()}.jpg`,
                        type: 'image/jpeg',
                        size: 0
                    }
                }));
                Alert.alert('Success', 'Photo taken successfully');
            }
        } catch (error) {
            console.error('Error taking photo:', error);
            Alert.alert('Error', 'Failed to take photo');
        }
    };

    const pickImage = async (documentKey: string) => {
        try {
            const result = await ImagePicker.launchImageLibraryAsync({
                mediaTypes: ImagePicker.MediaTypeOptions.Images,
                allowsEditing: true,
                quality: 0.8,
            });

            if (!result.canceled && result.assets[0]) {
                const asset = result.assets[0];
                setDocuments(prev => ({
                    ...prev,
                    [documentKey]: {
                        uri: asset.uri,
                        name: `${documentKey}_${Date.now()}.jpg`,
                        type: asset.mimeType || 'image/jpeg',
                        size: 0
                    }
                }));
                Alert.alert('Success', 'Image selected');
            }
        } catch (error) {
            console.error('Error picking image:', error);
            Alert.alert('Error', 'Failed to select image');
        }
    };

    const pickPDF = async (documentKey: string) => {
        try {
            const res = await DocumentPicker.getDocumentAsync({
                type: ['application/pdf', 'application/msword',
                    'application/vnd.openxmlformats-officedocument.wordprocessingml.document'],
                copyToCacheDirectory: true
            });

            if (res.assets && res.assets[0]) {
                const asset = res.assets[0];
                setDocuments(prev => ({
                    ...prev,
                    [documentKey]: {
                        uri: asset.uri,
                        name: asset.name,
                        type: asset.mimeType || 'application/pdf',
                        size: asset.size || 0
                    }
                }));
                Alert.alert('Success', 'Document selected');
            }
        } catch (error) {
            console.error('Error picking PDF:', error);
            Alert.alert('Error', 'Failed to select document');
        }
    };

    // Remove a document
    const removeDocument = (documentKey: string) => {
        setDocuments(prev => ({
            ...prev,
            [documentKey]: null
        }));
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

    const validateForm = () => {
        if (!network) {
            Alert.alert('Error', 'Please select network provider');
            return false;
        }
        if (!duration) {
            Alert.alert('Error', 'Please select contract duration');
            return false;
        }

        // Check required documents
        const requiredDocs = DOCUMENT_TYPES.filter(doc => doc.required);
        for (const doc of requiredDocs) {
            if (!documents[doc.key]) {
                Alert.alert('Error', `${doc.title.replace('*', '')} is required`);
                return false;
            }
        }

        return true;
    };

    const submitProfile = async () => {
        if (!validateForm()) {
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

            // Create CompleteProfileData object with all documents
            const profileData: CompleteProfileData = {
                network_provider: network,
                contract_duration_months: Number(duration),
                contract_end_date: formatDate(endDate),
                invoice_file: documents.invoice_file,
                id_document: documents.id_document,
                payslip_document: documents.payslip_document,
                residence_document: documents.residence_document
            };

            console.log('📤 Submitting profile with documents:', {
                hasInvoice: !!profileData.invoice_file,
                hasID: !!profileData.id_document,
                hasPayslip: !!profileData.payslip_document,
                hasResidence: !!profileData.residence_document
            });

            const result = await authAPI.completeProfile(user.client_user_id, profileData);

            if (result.success) {
                // Update user in storage with new profile data
                const updatedUser = {
                    ...user,
                    ...result.data?.user,
                    registration_status: 'Profile_Completed'
                };
                await AsyncStorage.setItem('user', JSON.stringify(updatedUser));

                Alert.alert(
                    'Success!',
                    'Profile completed successfully! You can now browse devices.',
                    [
                        {
                            text: 'Continue to Dashboard',
                            onPress: () => navigation.goBack()
                        }
                    ]
                );
            } else {
                Alert.alert('Error', result.message || 'Profile completion failed');
            }

        } catch (error: any) {
            console.error('Profile completion error:', error);
            Alert.alert('Error', error.message || 'Profile completion failed');
        } finally {
            setLoading(false);
        }
    };

    // Render document upload card
    const renderDocumentCard = (docType: typeof DOCUMENT_TYPES[0]) => {
        const file = documents[docType.key];

        return (
            <View key={docType.id} style={styles.documentCard}>
                <View style={styles.documentHeader}>
                    <Text style={styles.documentTitle}>
                        {docType.title}
                    </Text>
                    {file && (
                        <TouchableOpacity onPress={() => removeDocument(docType.key)}>
                            <Ionicons name="close-circle" size={20} color="#ef4444" />
                        </TouchableOpacity>
                    )}
                </View>

                <Text style={styles.documentDescription}>
                    {docType.description}
                </Text>

                {file ? (
                    <View style={styles.fileInfoContainer}>
                        <Ionicons name="document-attach" size={18} color="#10b981" />
                        <Text style={styles.fileName} numberOfLines={1}>
                            {file.name}
                        </Text>
                        <Text style={styles.fileSize}>
                            {file.size ? `(${(file.size / 1024).toFixed(1)} KB)` : ''}
                        </Text>
                    </View>
                ) : (
                    <TouchableOpacity
                        style={styles.uploadDocumentButton}
                        onPress={() => pickDocument(docType.key)}
                    >
                        <Ionicons name="cloud-upload-outline" size={20} color="#3b82f6" />
                        <Text style={styles.uploadDocumentText}>
                            Tap to upload
                        </Text>
                    </TouchableOpacity>
                )}
            </View>
        );
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
            <View style={styles.header}>
                <Ionicons name="person-circle-outline" size={50} color="#1e3a8a" />
                <Text style={styles.title}>Complete Your Profile</Text>
                <Text style={styles.subtitle}>
                    Provide your contract details and upload required documents
                </Text>
            </View>

            {/* Contract Details Section */}
            <View style={styles.section}>
                <Text style={styles.sectionTitle}>Contract Details</Text>

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
                        <Ionicons name="chevron-down" size={20} color="#6b7280" />
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
                        <Ionicons name="chevron-down" size={20} color="#6b7280" />
                    </TouchableOpacity>
                </View>

                {/* Contract End Date Picker */}
                <View style={styles.inputGroup}>
                    <Text style={styles.label}>Contract End Date *</Text>
                    <TouchableOpacity
                        style={styles.dropdownButton}
                        onPress={() => setShowDatePicker(true)}
                    >
                        <Text style={styles.dropdownButtonText}>{formatDate(endDate)}</Text>
                        <Ionicons name="calendar-outline" size={20} color="#6b7280" />
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
            </View>

            {/* Documents Section */}
            <View style={styles.section}>
                <Text style={styles.sectionTitle}>Required Documents</Text>
                <Text style={styles.sectionSubtitle}>
                    Upload clear copies of the following documents
                </Text>

                {DOCUMENT_TYPES.map(docType => renderDocumentCard(docType))}

                <Text style={styles.note}>
                    * Required documents must be uploaded. Supported formats: PDF, JPG, PNG (max 10MB each)
                </Text>
            </View>

            {/* Submit Button */}
            <TouchableOpacity
                style={[styles.submitButton, loading && styles.submitButtonDisabled]}
                onPress={submitProfile}
                disabled={loading}
            >
                {loading ? (
                    <ActivityIndicator color="white" />
                ) : (
                    <>
                        <Ionicons name="checkmark-circle-outline" size={22} color="white" />
                        <Text style={styles.submitButtonText}>Complete Profile</Text>
                    </>
                )}
            </TouchableOpacity>

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
                                <Ionicons name="close" size={24} color="#6b7280" />
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
                                <Ionicons name="close" size={24} color="#6b7280" />
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
        backgroundColor: '#f5f7fa',
    },
    header: {
        padding: 24,
        alignItems: 'center',
        backgroundColor: 'white',
        borderBottomLeftRadius: 20,
        borderBottomRightRadius: 20,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.05,
        shadowRadius: 8,
        elevation: 3,
        marginBottom: 20,
    },
    title: {
        fontSize: 26,
        fontWeight: 'bold',
        marginTop: 12,
        color: '#1e3a8a',
        textAlign: 'center',
    },
    subtitle: {
        fontSize: 14,
        color: '#6b7280',
        textAlign: 'center',
        marginTop: 6,
        lineHeight: 20,
    },
    section: {
        backgroundColor: 'white',
        marginHorizontal: 16,
        marginBottom: 20,
        padding: 20,
        borderRadius: 16,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.05,
        shadowRadius: 8,
        elevation: 2,
    },
    sectionTitle: {
        fontSize: 18,
        fontWeight: 'bold',
        color: '#1e293b',
        marginBottom: 8,
    },
    sectionSubtitle: {
        fontSize: 13,
        color: '#6b7280',
        marginBottom: 20,
    },
    inputGroup: {
        marginBottom: 20,
    },
    label: {
        fontSize: 14,
        fontWeight: '600',
        marginBottom: 8,
        color: '#374151',
    },
    dropdownButton: {
        backgroundColor: '#f8fafc',
        padding: 16,
        borderRadius: 12,
        borderWidth: 1,
        borderColor: '#e2e8f0',
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
    },
    dropdownButtonText: {
        fontSize: 16,
        color: '#374151',
    },
    documentCard: {
        backgroundColor: '#f8fafc',
        borderRadius: 12,
        padding: 16,
        marginBottom: 16,
        borderWidth: 1,
        borderColor: '#e2e8f0',
    },
    documentHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 8,
    },
    documentTitle: {
        fontSize: 15,
        fontWeight: '600',
        color: '#1e293b',
        flex: 1,
    },
    documentDescription: {
        fontSize: 12,
        color: '#6b7280',
        marginBottom: 12,
        lineHeight: 16,
    },
    uploadDocumentButton: {
        flexDirection: 'row',
        alignItems: 'center',
        padding: 14,
        backgroundColor: '#eff6ff',
        borderRadius: 10,
        borderWidth: 1,
        borderColor: '#dbeafe',
        borderStyle: 'dashed',
        gap: 10,
    },
    uploadDocumentText: {
        fontSize: 14,
        color: '#3b82f6',
        fontWeight: '500',
    },
    fileInfoContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        padding: 12,
        backgroundColor: '#f0fdf4',
        borderRadius: 10,
        borderWidth: 1,
        borderColor: '#bbf7d0',
        gap: 10,
    },
    fileName: {
        flex: 1,
        fontSize: 14,
        color: '#065f46',
        fontWeight: '500',
    },
    fileSize: {
        fontSize: 12,
        color: '#6b7280',
    },
    note: {
        fontSize: 12,
        color: '#94a3b8',
        marginTop: 16,
        fontStyle: 'italic',
        textAlign: 'center',
        lineHeight: 16,
    },
    submitButton: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: '#1e3a8a',
        marginHorizontal: 16,
        marginBottom: 30,
        padding: 18,
        borderRadius: 12,
        gap: 10,
        shadowColor: '#1e3a8a',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.2,
        shadowRadius: 8,
        elevation: 4,
    },
    submitButtonDisabled: {
        backgroundColor: '#9ca3af',
    },
    submitButtonText: {
        color: 'white',
        fontSize: 18,
        fontWeight: 'bold',
        letterSpacing: 0.3,
    },
    // Modal Styles
    modalOverlay: {
        flex: 1,
        backgroundColor: 'rgba(0, 0, 0, 0.5)',
        justifyContent: 'flex-end',
    },
    modalContent: {
        backgroundColor: 'white',
        borderTopLeftRadius: 24,
        borderTopRightRadius: 24,
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