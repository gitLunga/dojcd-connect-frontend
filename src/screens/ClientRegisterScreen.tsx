import React, { useState } from 'react';
import {
    View,
    Text,
    StyleSheet,
    Pressable,
    ScrollView,
    TextInput,
    Alert,
    ActivityIndicator,
    Modal,
    TouchableOpacity,
    FlatList,
    SafeAreaView,
    Platform
} from 'react-native';
import { StackNavigationProp } from '@react-navigation/stack';
import { RootStackParamList } from '../navigation/AppNavigator';
import { authAPI } from '../services/api';
import { Ionicons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import * as DocumentPicker from 'expo-document-picker';
import DateTimePicker from '@react-native-community/datetimepicker';
import { responsive } from "../utils/Responsive";

const spacingValue = responsive.spacing.md;

// --- DESIGN SYSTEM ---
const COLORS = {
    primary: '#1e3a8a',
    primaryLight: '#3b82f6',
    textPrimary: '#1f2937',
    textSecondary: '#6b7280',
    surface: '#ffffff',
    background: '#f9fafb',
    border: '#e5e7eb',
    error: '#ef4444',
    success: '#10b981',
    disabled: '#9ca3af',
};

// --- CONSTANTS ---
const TITLES = [
    { value: 'Mr', label: 'Mr' },
    { value: 'Mrs', label: 'Mrs' },
    { value: 'Miss', label: 'Miss' },
    { value: 'Ms', label: 'Ms' },
    { value: 'Dr', label: 'Dr' },
    { value: 'Prof', label: 'Professor' },
];

const SOUTH_AFRICAN_REGIONS = [
    { value: 'Eastern Cape', label: 'Eastern Cape' },
    { value: 'Free State', label: 'Free State' },
    { value: 'Gauteng', label: 'Gauteng' },
    { value: 'KwaZulu-Natal', label: 'KwaZulu-Natal' },
    { value: 'Limpopo', label: 'Limpopo' },
    { value: 'Mpumalanga', label: 'Mpumalanga' },
    { value: 'Northern Cape', label: 'Northern Cape' },
    { value: 'North West', label: 'North West' },
    { value: 'Western Cape', label: 'Western Cape' },
];

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

const COUNTRY_CODE = '+27';

type ClientRegisterScreenNavigationProp = StackNavigationProp<
    RootStackParamList,
    'ClientRegister'
>;

interface InputProps {
    label: string;
    placeholder: string;
    value: string;
    onChangeText: (text: string) => void;
    editable: boolean;
    secureTextEntry?: boolean;
    keyboardType?: 'default' | 'email-address' | 'numeric' | 'phone-pad';
    autoCapitalize?: 'none' | 'sentences' | 'words' | 'characters';
    error?: string;
    onBlur?: () => void;
}

const ModernInput: React.FC<InputProps> = ({
                                               label,
                                               error,
                                               onBlur,
                                               ...props
                                           }) => {
    const [isFocused, setIsFocused] = useState(false);

    return (
        <View style={styles.inputGroup}>
            <Text style={styles.label}>{label}</Text>
            <TextInput
                style={[
                    styles.input,
                    isFocused && styles.inputFocused,
                    error && styles.inputError
                ]}
                onFocus={() => setIsFocused(true)}
                onBlur={() => {
                    setIsFocused(false);
                    onBlur?.();
                }}
                placeholderTextColor={COLORS.textSecondary}
                {...props}
            />
            {error && <Text style={styles.errorText}>{error}</Text>}
        </View>
    );
};

interface SelectInputProps {
    label: string;
    value: string;
    placeholder: string;
    onSelect: (value: string) => void;
    editable: boolean;
    options: { value: string; label: string }[];
    error?: string;
}

const SelectInput: React.FC<SelectInputProps> = ({
                                                     label,
                                                     value,
                                                     placeholder,
                                                     onSelect,
                                                     editable,
                                                     options,
                                                     error
                                                 }) => {
    const [modalVisible, setModalVisible] = useState(false);

    const selectedLabel = options.find(opt => opt.value === value)?.label || '';

    return (
        <>
            <View style={styles.inputGroup}>
                <Text style={styles.label}>{label}</Text>
                <Pressable
                    style={[
                        styles.selectInput,
                        error && styles.inputError
                    ]}
                    onPress={() => editable && setModalVisible(true)}
                    disabled={!editable}
                >
                    <Text style={[
                        styles.selectInputText,
                        !value && styles.placeholderText
                    ]}>
                        {selectedLabel || placeholder}
                    </Text>
                    <Ionicons name="chevron-down" size={20} color={COLORS.textSecondary} />
                </Pressable>
                {error && <Text style={styles.errorText}>{error}</Text>}
            </View>

            <Modal
                visible={modalVisible}
                transparent
                animationType="slide"
                onRequestClose={() => setModalVisible(false)}
            >
                <View style={styles.modalOverlay}>
                    <View style={styles.modalContent}>
                        <View style={styles.modalHeader}>
                            <Text style={styles.modalTitle}>Select {label}</Text>
                            <TouchableOpacity onPress={() => setModalVisible(false)}>
                                <Ionicons name="close" size={24} color={COLORS.textPrimary} />
                            </TouchableOpacity>
                        </View>
                        <FlatList
                            data={options}
                            keyExtractor={(item) => item.value}
                            renderItem={({ item }) => (
                                <TouchableOpacity
                                    style={styles.optionItem}
                                    onPress={() => {
                                        onSelect(item.value);
                                        setModalVisible(false);
                                    }}
                                >
                                    <Text style={styles.optionText}>{item.label}</Text>
                                    {value === item.value && (
                                        <Ionicons name="checkmark" size={20} color={COLORS.primary} />
                                    )}
                                </TouchableOpacity>
                            )}
                            ItemSeparatorComponent={() => <View style={styles.separator} />}
                        />
                    </View>
                </View>
            </Modal>
        </>
    );
};

const PasswordInput: React.FC<{
    label: string;
    value: string;
    onChangeText: (text: string) => void;
    error?: string;
    showPassword: boolean;
    onToggleVisibility: () => void;
    onBlur?: () => void;
    editable?: boolean;
}> = ({
          label,
          value,
          onChangeText,
          error,
          showPassword,
          onToggleVisibility,
          onBlur,
          editable = true
      }) => {
    const [isFocused, setIsFocused] = useState(false);

    return (
        <View style={styles.inputGroup}>
            <Text style={styles.label}>{label}</Text>
            <View style={[
                styles.passwordContainer,
                isFocused && styles.inputFocused,
                error && styles.inputError
            ]}>
                <TextInput
                    style={styles.passwordInput}
                    placeholder="Enter password"
                    placeholderTextColor={COLORS.textSecondary}
                    value={value}
                    onChangeText={onChangeText}
                    secureTextEntry={!showPassword}
                    editable={editable}
                    onFocus={() => setIsFocused(true)}
                    onBlur={() => {
                        setIsFocused(false);
                        onBlur?.();
                    }}
                    autoCapitalize="none"
                    autoCorrect={false}
                    spellCheck={false}
                />
                <TouchableOpacity
                    onPress={onToggleVisibility}
                    style={styles.eyeButton}
                    disabled={!editable}
                >
                    <Ionicons
                        name={showPassword ? "eye-off" : "eye"}
                        size={20}
                        color={COLORS.textSecondary}
                    />
                </TouchableOpacity>
            </View>
            {error && <Text style={styles.errorText}>{error}</Text>}
            {label === 'Password *' && !error && value && (
                <Text style={styles.hintText}>
                    Must be at least 8 characters long
                </Text>
            )}
        </View>
    );
};

export default function ClientRegisterScreen({ navigation }: { navigation: ClientRegisterScreenNavigationProp }) {
    const [formData, setFormData] = useState({
        title: '',
        firstName: '',
        lastName: '',
        email: '',
        phoneNumber: '',
        region: '',
        persalId: '',
        departmentId: '',
        userType: 'Advocate' as 'Advocate' | 'Magistrate',
        networkProvider: '',
        contractDuration: '',
        contractEndDate: new Date(),
        password: '',
        confirmPassword: '',
    });

    const [invoiceFile, setInvoiceFile] = useState<any>(null);
    const [errors, setErrors] = useState<Record<string, string>>({});
    const [loading, setLoading] = useState(false);
    const [uploading, setUploading] = useState(false);
    const [showPassword, setShowPassword] = useState(false);
    const [showConfirmPassword, setShowConfirmPassword] = useState(false);
    const [showDatePicker, setShowDatePicker] = useState(false);

    const validateField = (field: string, value: any): string => {
        switch (field) {
            case 'email':
                if (!value) return 'Email is required';
                if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value)) return 'Please enter a valid email address';
                return '';

            case 'phoneNumber':
                if (value) {
                    const cleanNumber = value.replace(COUNTRY_CODE, '').replace(/\D/g, '');
                    if (!/^[0-9]{9}$/.test(cleanNumber)) return 'Please enter a valid South African phone number (9 digits after +27)';
                }
                return '';

            case 'password':
                if (!value) return 'Password is required';
                if (value.length < 8) return 'Password must be at least 8 characters';
                return '';

            case 'confirmPassword':
                if (!value) return 'Please confirm your password';
                if (value !== formData.password) return 'Passwords do not match';
                return '';

            case 'networkProvider':
                return !value ? 'Please select a network provider' : '';

            case 'contractDuration':
                return !value ? 'Please select contract duration' : '';

            case 'contractEndDate':
                if (!value) return 'Please select contract end date';
                if (new Date(value) < new Date()) return 'Contract end date must be in the future';
                return '';

            case 'invoiceFile':
                return !invoiceFile ? 'Please upload latest invoice' : '';

            case 'firstName':
            case 'lastName':
            case 'title':
            case 'region':
            case 'persalId':
            case 'departmentId':
                if (!value) return 'This field is required';
                return '';

            default:
                return '';
        }
    };

    const handleBlur = (field: string) => {
        const error = validateField(field, formData[field as keyof typeof formData] || invoiceFile);
        setErrors(prev => ({ ...prev, [field]: error }));
    };

    const handlePhoneNumberChange = (text: string) => {
        let cleaned = text.replace(/\D/g, '');

        if (cleaned.startsWith('27')) {
            cleaned = cleaned.slice(0, 11);
        } else {
            cleaned = '27' + cleaned;
            cleaned = cleaned.slice(0, 11);
        }

        let formatted = COUNTRY_CODE + ' ';
        if (cleaned.length > 2) {
            formatted += cleaned.slice(2, 5);
        }
        if (cleaned.length > 5) {
            formatted += ' ' + cleaned.slice(5, 8);
        }
        if (cleaned.length > 8) {
            formatted += ' ' + cleaned.slice(8);
        }

        setFormData({ ...formData, phoneNumber: formatted });
    };

    const handleDateChange = (event: any, selectedDate?: Date) => {
        setShowDatePicker(false);
        if (selectedDate) {
            setFormData({ ...formData, contractEndDate: selectedDate });
            setErrors(prev => ({ ...prev, contractEndDate: '' }));
        }
    };

    const pickInvoice = async () => {
        try {
            const result = await DocumentPicker.getDocumentAsync({
                type: ['image/*', 'application/pdf'],
                copyToCacheDirectory: true,
            });

            if (result.assets && result.assets.length > 0) {
                const file = result.assets[0];
                setInvoiceFile({
                    uri: file.uri,
                    name: file.name || 'invoice',
                    mimeType: file.mimeType || 'application/octet-stream',
                    size: file.size || 0,
                });
                setErrors(prev => ({ ...prev, invoiceFile: '' }));
            }
        } catch (error) {
            Alert.alert('Error', 'Failed to pick document');
        }
    };

    const takePhoto = async () => {
        const permissionResult = await ImagePicker.requestCameraPermissionsAsync();

        if (permissionResult.granted === false) {
            Alert.alert('Permission Required', 'Camera permission is required to take photos');
            return;
        }

        const result = await ImagePicker.launchCameraAsync({
            allowsEditing: true,
            aspect: [4, 3],
            quality: 0.8,
            base64: true,
        });

        if (!result.canceled && result.assets && result.assets.length > 0) {
            const photo = result.assets[0];
            setInvoiceFile({
                uri: photo.uri,
                name: 'invoice_photo.jpg',
                mimeType: 'image/jpeg',
                size: photo.base64 ? photo.base64.length : 0,
            });
            setErrors(prev => ({ ...prev, invoiceFile: '' }));
        }
    };

    const convertFileToBase64 = (fileUri: string): Promise<string> => {
        return new Promise((resolve, reject) => {
            const xhr = new XMLHttpRequest();
            xhr.onload = function() {
                const reader = new FileReader();
                reader.onloadend = function() {
                    resolve(reader.result as string);
                };
                reader.onerror = reject;
                reader.readAsDataURL(xhr.response);
            };
            xhr.onerror = reject;
            xhr.open('GET', fileUri);
            xhr.responseType = 'blob';
            xhr.send();
        });
    };

    const handleRegister = async () => {
        const newErrors: Record<string, string> = {};
        const fieldsToValidate = [
            ...Object.keys(formData),
            'invoiceFile'
        ];

        fieldsToValidate.forEach(key => {
            const value = key === 'invoiceFile' ? invoiceFile : formData[key as keyof typeof formData];
            const error = validateField(key, value);
            if (error) newErrors[key] = error;
        });

        if (Object.keys(newErrors).length > 0) {
            setErrors(newErrors);
            Alert.alert('Validation Error', 'Please fix the errors in the form');
            return;
        }

        setLoading(true);

        try {
            let invoiceData = null;
            let invoiceFilename = null;

            if (invoiceFile) {
                setUploading(true);
                try {
                    const base64Data = await convertFileToBase64(invoiceFile.uri);
                    invoiceData = base64Data;
                    invoiceFilename = invoiceFile.name || 'invoice';
                } catch (error) {
                    Alert.alert('Error', 'Failed to process invoice file');
                    setLoading(false);
                    setUploading(false);
                    return;
                }
                setUploading(false);
            }

            const registrationData = {
                title: formData.title,
                first_name: formData.firstName,
                last_name: formData.lastName,
                email: formData.email,
                phone_number: formData.phoneNumber,
                region: formData.region,
                persal_id: formData.persalId,
                department_id: formData.departmentId,
                user_type: formData.userType,
                network_provider: formData.networkProvider,
                contract_duration_months: formData.contractDuration ? parseInt(formData.contractDuration) : undefined,
                contract_end_date: formData.contractEndDate ? formData.contractEndDate.toISOString().split('T')[0] : undefined,
                invoice_data: invoiceData,
                invoice_filename: invoiceFilename,
                password: formData.password,
            };

            Object.keys(registrationData).forEach(key => {
                if (registrationData[key as keyof typeof registrationData] === undefined) {
                    delete registrationData[key as keyof typeof registrationData];
                }
            });

            const response = await authAPI.registerClient(registrationData);

            Alert.alert(
                'Registration Submitted',
                response.data.message || 'Your registration has been submitted for verification. You will receive an email once your account is approved.',
                [
                    {
                        text: 'OK',
                        onPress: () => navigation.navigate('Login')
                    }
                ]
            );

            setFormData({
                title: '',
                firstName: '',
                lastName: '',
                email: '',
                phoneNumber: '',
                region: '',
                persalId: '',
                departmentId: '',
                userType: 'Advocate',
                networkProvider: '',
                contractDuration: '',
                contractEndDate: new Date(),
                password: '',
                confirmPassword: '',
            });
            setInvoiceFile(null);
            setErrors({});

        } catch (error: any) {
            console.error('Registration error:', error);

            let errorMessage = 'Registration failed. Please try again.';

            if (error.response) {
                const serverError = error.response.data;
                if (serverError.message) {
                    errorMessage = serverError.message;
                } else if (serverError.email) {
                    errorMessage = `Email: ${serverError.email}`;
                } else if (serverError.phone_number) {
                    errorMessage = `Phone: ${serverError.phone_number}`;
                }
            } else if (error.request) {
                errorMessage = 'Network error. Please check your connection.';
            } else {
                errorMessage = error.message || 'An unexpected error occurred';
            }

            Alert.alert('Registration Failed', errorMessage);
        } finally {
            setLoading(false);
            setUploading(false);
        }
    };

    const formatDate = (date: Date) => {
        return date.toLocaleDateString('en-ZA', {
            year: 'numeric',
            month: 'long',
            day: 'numeric'
        });
    };

    return (
        <SafeAreaView style={styles.safeArea}>
            <ScrollView
                contentContainerStyle={styles.scrollContainer}
                style={styles.container}
                showsVerticalScrollIndicator={Platform.OS === 'web'}
            >
                <View style={styles.header}>
                    <Text style={styles.title}>Client Registration</Text>
                    <Text style={styles.subtitle}>Create your account to request devices</Text>
                </View>

                <View style={styles.form}>
                    <Text style={styles.sectionTitle}>Personal Information</Text>

                    <SelectInput
                        label="Title *"
                        value={formData.title}
                        placeholder="Select your title"
                        onSelect={(value) => {
                            setFormData({ ...formData, title: value });
                            setErrors(prev => ({ ...prev, title: '' }));
                        }}
                        editable={!loading}
                        options={TITLES}
                        error={errors.title}
                    />

                    <ModernInput
                        label="First Name *"
                        placeholder="Enter your first name"
                        value={formData.firstName}
                        onChangeText={(text) => setFormData({ ...formData, firstName: text })}
                        editable={!loading}
                        onBlur={() => handleBlur('firstName')}
                        error={errors.firstName}
                    />

                    <ModernInput
                        label="Last Name *"
                        placeholder="Enter your last name"
                        value={formData.lastName}
                        onChangeText={(text) => setFormData({ ...formData, lastName: text })}
                        editable={!loading}
                        onBlur={() => handleBlur('lastName')}
                        error={errors.lastName}
                    />

                    <ModernInput
                        label="Email Address *"
                        placeholder="Enter your email"
                        keyboardType="email-address"
                        autoCapitalize="none"
                        value={formData.email}
                        onChangeText={(text) => setFormData({ ...formData, email: text })}
                        editable={!loading}
                        onBlur={() => handleBlur('email')}
                        error={errors.email}
                    />

                    <ModernInput
                        label="Phone Number"
                        placeholder={`${COUNTRY_CODE} 00 000 0000`}
                        keyboardType="phone-pad"
                        value={formData.phoneNumber}
                        onChangeText={handlePhoneNumberChange}
                        editable={!loading}
                        onBlur={() => handleBlur('phoneNumber')}
                        error={errors.phoneNumber}
                    />

                    <SelectInput
                        label="Region *"
                        value={formData.region}
                        placeholder="Select your region"
                        onSelect={(value) => {
                            setFormData({ ...formData, region: value });
                            setErrors(prev => ({ ...prev, region: '' }));
                        }}
                        editable={!loading}
                        options={SOUTH_AFRICAN_REGIONS}
                        error={errors.region}
                    />

                    <Text style={styles.sectionTitle}>Employment Information</Text>

                    <ModernInput
                        label="Personal ID Number *"
                        placeholder="Enter your personal ID Number"
                        value={formData.persalId}
                        onChangeText={(text) => setFormData({ ...formData, persalId: text })}
                        editable={!loading}
                        onBlur={() => handleBlur('persalId')}
                        error={errors.persalId}
                    />

                    <ModernInput
                        label="Department ID *"
                        placeholder="Enter your department ID"
                        value={formData.departmentId}
                        onChangeText={(text) => setFormData({ ...formData, departmentId: text })}
                        editable={!loading}
                        onBlur={() => handleBlur('departmentId')}
                        error={errors.departmentId}
                    />

                    <View style={styles.inputGroup}>
                        <Text style={styles.label}>User Type *</Text>
                        <View style={styles.radioGroup}>
                            {['Advocate', 'Magistrate'].map((type) => (
                                <Pressable
                                    key={type}
                                    style={({ pressed }) => [
                                        styles.radioButton,
                                        formData.userType === type && styles.radioButtonSelected,
                                        loading && styles.radioButtonDisabled,
                                        pressed && styles.buttonPressed
                                    ]}
                                    onPress={() => {
                                        setFormData({ ...formData, userType: type as any });
                                        setErrors(prev => ({ ...prev, userType: '' }));
                                    }}
                                    disabled={loading}
                                >
                                    <Text style={[
                                        styles.radioText,
                                        formData.userType === type && styles.radioTextSelected
                                    ]}>
                                        {type === 'Advocate' ? 'Advocate' : 'Magistrate'}
                                    </Text>
                                </Pressable>
                            ))}
                        </View>
                    </View>

                    <Text style={styles.sectionTitle}>Network & Contract Preferences</Text>

                    <SelectInput
                        label="Preferred Network Provider *"
                        value={formData.networkProvider}
                        placeholder="Select network provider"
                        onSelect={(value) => {
                            setFormData({ ...formData, networkProvider: value });
                            setErrors(prev => ({ ...prev, networkProvider: '' }));
                        }}
                        editable={!loading}
                        options={NETWORK_PROVIDERS}
                        error={errors.networkProvider}
                    />

                    <SelectInput
                        label="Preferred Contract Duration *"
                        value={formData.contractDuration}
                        placeholder="Select contract duration"
                        onSelect={(value) => {
                            setFormData({ ...formData, contractDuration: value });
                            setErrors(prev => ({ ...prev, contractDuration: '' }));
                        }}
                        editable={!loading}
                        options={CONTRACT_DURATIONS}
                        error={errors.contractDuration}
                    />

                    <View style={styles.inputGroup}>
                        <Text style={styles.label}>Contract End Date *</Text>
                        <Pressable
                            style={[
                                styles.dateInput,
                                errors.contractEndDate && styles.inputError
                            ]}
                            onPress={() => !loading && setShowDatePicker(true)}
                            disabled={loading}
                        >
                            <Text style={styles.dateInputText}>
                                {formatDate(formData.contractEndDate)}
                            </Text>
                            <Ionicons name="calendar" size={20} color={COLORS.textSecondary} />
                        </Pressable>
                        {errors.contractEndDate && <Text style={styles.errorText}>{errors.contractEndDate}</Text>}
                    </View>

                    {showDatePicker && (
                        <DateTimePicker
                            value={formData.contractEndDate}
                            mode="date"
                            display="default"
                            onChange={handleDateChange}
                            minimumDate={new Date()}
                        />
                    )}

                    <Text style={styles.sectionTitle}>Proof of Employment</Text>

                    <View style={styles.inputGroup}>
                        <Text style={styles.label}>Latest Invoice/Payslip *</Text>
                        <Text style={styles.hintText}>
                            Upload a clear photo or PDF of your latest payslip or invoice for verification
                        </Text>

                        {invoiceFile ? (
                            <View style={styles.uploadPreview}>
                                <Ionicons name="document-text" size={40} color={COLORS.primary} />
                                <View style={styles.uploadInfo}>
                                    <Text style={styles.fileName} numberOfLines={1}>
                                        {invoiceFile.name}
                                    </Text>
                                    <Text style={styles.fileSize}>
                                        {invoiceFile.size ?
                                            `${(invoiceFile.size / 1024).toFixed(1)} KB` :
                                            'Photo'
                                        }
                                    </Text>
                                </View>
                                <TouchableOpacity
                                    onPress={() => setInvoiceFile(null)}
                                    disabled={loading}
                                >
                                    <Ionicons name="close-circle" size={24} color={COLORS.error} />
                                </TouchableOpacity>
                            </View>
                        ) : (
                            <View style={styles.uploadOptions}>
                                <Pressable
                                    style={({ pressed }) => [
                                        styles.uploadButton,
                                        loading && styles.uploadButtonDisabled,
                                        pressed && styles.buttonPressed
                                    ]}
                                    onPress={pickInvoice}
                                    disabled={loading}
                                >
                                    <Ionicons name="document-attach" size={24} color={COLORS.primary} />
                                    <Text style={styles.uploadButtonText}>Choose File</Text>
                                </Pressable>

                                <Text style={styles.uploadOrText}>or</Text>

                                <Pressable
                                    style={({ pressed }) => [
                                        styles.uploadButton,
                                        loading && styles.uploadButtonDisabled,
                                        pressed && styles.buttonPressed
                                    ]}
                                    onPress={takePhoto}
                                    disabled={loading}
                                >
                                    <Ionicons name="camera" size={24} color={COLORS.primary} />
                                    <Text style={styles.uploadButtonText}>Take Photo</Text>
                                </Pressable>
                            </View>
                        )}
                        {errors.invoiceFile && <Text style={styles.errorText}>{errors.invoiceFile}</Text>}
                        {uploading && (
                            <View style={styles.uploadingIndicator}>
                                <ActivityIndicator size="small" color={COLORS.primary} />
                                <Text style={styles.uploadingText}>Uploading invoice...</Text>
                            </View>
                        )}
                    </View>

                    <Text style={styles.sectionTitle}>Account Security</Text>

                    <PasswordInput
                        label="Password *"
                        value={formData.password}
                        onChangeText={(text) => setFormData({ ...formData, password: text })}
                        error={errors.password}
                        showPassword={showPassword}
                        onToggleVisibility={() => setShowPassword(!showPassword)}
                        onBlur={() => handleBlur('password')}
                        editable={!loading}
                    />

                    <PasswordInput
                        label="Confirm Password *"
                        value={formData.confirmPassword}
                        onChangeText={(text) => setFormData({ ...formData, confirmPassword: text })}
                        error={errors.confirmPassword}
                        showPassword={showConfirmPassword}
                        onToggleVisibility={() => setShowConfirmPassword(!showConfirmPassword)}
                        onBlur={() => handleBlur('confirmPassword')}
                        editable={!loading}
                    />

                    <View style={styles.termsContainer}>
                        <Text style={styles.termsTitle}>Terms and Conditions</Text>
                        <ScrollView style={styles.termsContent}>
                            <Text style={styles.termsText}>
                                1. By registering, you agree to our terms and conditions.{'\n\n'}
                                2. All information provided must be accurate and verifiable.{'\n\n'}
                                3. You must maintain active employment with the Department.{'\n\n'}
                                4. Your invoice/payslip will be used for verification only.{'\n\n'}
                                5. You agree to receive communications regarding your account.
                            </Text>
                        </ScrollView>
                    </View>

                    <Pressable
                        style={({ pressed }) => [
                            styles.registerButton,
                            (loading || uploading) && styles.registerButtonDisabled,
                            pressed && styles.buttonPressed
                        ]}
                        onPress={handleRegister}
                        disabled={loading || uploading}
                    >
                        {loading || uploading ? (
                            <View style={styles.buttonContent}>
                                <ActivityIndicator color="white" size="small" />
                                <Text style={styles.registerButtonText}>
                                    {uploading ? 'Uploading...' : 'Creating Account...'}
                                </Text>
                            </View>
                        ) : (
                            <Text style={styles.registerButtonText}>Create Account</Text>
                        )}
                    </Pressable>

                    <Pressable
                        style={styles.loginLink}
                        onPress={() => navigation.navigate('Login')}
                        disabled={loading}
                    >
                        <Text style={styles.loginText}>
                            Already have an account? <Text style={styles.loginTextBold}>Sign In</Text>
                        </Text>
                    </Pressable>
                </View>
            </ScrollView>
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    safeArea: {
        flex: 1,
        backgroundColor: COLORS.surface,
    },
    container: {
        flex: 1,
        backgroundColor: COLORS.surface,
    },
    scrollContainer: {
        flexGrow: 1,
        paddingHorizontal: responsive.spacing.md,
        ...(Platform.OS === 'web' && { minHeight: '100vh' as any }),
    },

    header: {
        padding: 24,
        borderBottomWidth: 1,
        borderBottomColor: COLORS.border,
        backgroundColor: COLORS.background,
    },
    title: {
        fontSize: 28,
        fontWeight: '700',
        color: COLORS.textPrimary,
        marginBottom: 8,
    },
    subtitle: {
        fontSize: 16,
        color: COLORS.textSecondary,
    },
    form: {
        padding: 24,
    },
    sectionTitle: {
        fontSize: 18,
        fontWeight: '700',
        color: COLORS.primary,
        marginTop: 20,
        marginBottom: 16,
        paddingBottom: 8,
        borderBottomWidth: 1,
        borderBottomColor: COLORS.border,
    },
    inputGroup: {
        marginBottom: 16,
    },
    label: {
        fontSize: 14,
        fontWeight: '600',
        color: COLORS.textPrimary,
        marginBottom: 8,
    },
    input: {
        borderWidth: 1,
        borderColor: COLORS.border,
        borderRadius: 10,
        padding: 14,
        fontSize: 16,
        backgroundColor: COLORS.background,
    },
    inputFocused: {
        borderColor: COLORS.primaryLight,
        backgroundColor: COLORS.surface,
    },
    inputError: {
        borderColor: COLORS.error,
    },
    errorText: {
        color: COLORS.error,
        fontSize: 12,
        marginTop: 4,
    },
    hintText: {
        color: COLORS.textSecondary,
        fontSize: 12,
        marginBottom: 12,
        fontStyle: 'italic',
    },
    selectInput: {
        borderWidth: 1,
        borderColor: COLORS.border,
        borderRadius: 10,
        padding: 14,
        fontSize: 16,
        backgroundColor: COLORS.background,
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        ...Platform.select({
            web: {
                cursor: 'pointer',
            },
        }),
    },
    selectInputText: {
        fontSize: 16,
        color: COLORS.textPrimary,
    },
    placeholderText: {
        color: COLORS.textSecondary,
    },
    dateInput: {
        borderWidth: 1,
        borderColor: COLORS.border,
        borderRadius: 10,
        padding: 14,
        fontSize: 16,
        backgroundColor: COLORS.background,
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        ...Platform.select({
            web: {
                cursor: 'pointer',
            },
        }),
    },
    dateInputText: {
        fontSize: 16,
        color: COLORS.textPrimary,
    },
    radioGroup: {
        flexDirection: 'row',
        gap: 12,
    },
    radioButton: {
        flex: 1,
        padding: 16,
        borderWidth: 1,
        borderColor: COLORS.border,
        borderRadius: 10,
        alignItems: 'center',
        backgroundColor: COLORS.background,
        ...Platform.select({
            web: {
                cursor: 'pointer',
                transition: 'transform 0.2s',
            },
        }),
    },
    radioButtonSelected: {
        backgroundColor: COLORS.primaryLight,
        borderColor: COLORS.primaryLight,
    },
    radioButtonDisabled: {
        opacity: 0.6,
    },
    buttonPressed: {
        transform: [{ scale: 0.98 }],
        opacity: 0.9,
    },
    radioText: {
        fontSize: 16,
        fontWeight: '600',
        color: COLORS.textPrimary,
    },
    radioTextSelected: {
        color: 'white',
    },
    uploadOptions: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-around',
        marginTop: 8,
    },
    uploadButton: {
        flex: 1,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        padding: 12,
        borderWidth: 1,
        borderColor: COLORS.border,
        borderRadius: 10,
        backgroundColor: COLORS.background,
        marginHorizontal: 4,
        ...Platform.select({
            web: {
                cursor: 'pointer',
                transition: 'transform 0.2s',
            },
        }),
    },
    uploadButtonDisabled: {
        opacity: 0.5,
    },
    uploadButtonText: {
        marginLeft: 8,
        color: COLORS.textPrimary,
        fontWeight: '500',
    },
    uploadOrText: {
        marginHorizontal: 12,
        color: COLORS.textSecondary,
    },
    uploadPreview: {
        flexDirection: 'row',
        alignItems: 'center',
        padding: 12,
        borderWidth: 1,
        borderColor: COLORS.border,
        borderRadius: 10,
        backgroundColor: COLORS.background,
        marginTop: 8,
    },
    uploadInfo: {
        flex: 1,
        marginLeft: 12,
    },
    fileName: {
        fontSize: 14,
        color: COLORS.textPrimary,
        fontWeight: '500',
    },
    fileSize: {
        fontSize: 12,
        color: COLORS.textSecondary,
        marginTop: 2,
    },
    uploadingIndicator: {
        flexDirection: 'row',
        alignItems: 'center',
        marginTop: 8,
    },
    uploadingText: {
        marginLeft: 8,
        fontSize: 12,
        color: COLORS.textSecondary,
    },
    passwordContainer: {
        borderWidth: 1,
        borderColor: COLORS.border,
        borderRadius: 10,
        backgroundColor: COLORS.background,
        flexDirection: 'row',
        alignItems: 'center',
    },
    passwordInput: {
        flex: 1,
        padding: 14,
        fontSize: 16,
    },
    eyeButton: {
        padding: 8,
        marginRight: 6,
        ...Platform.select({
            web: {
                cursor: 'pointer',
            },
        }),
    },
    termsContainer: {
        marginTop: 20,
        marginBottom: 24,
    },
    termsTitle: {
        fontSize: 16,
        fontWeight: '600',
        color: COLORS.textPrimary,
        marginBottom: 8,
    },
    termsContent: {
        maxHeight: 120,
        borderWidth: 1,
        borderColor: COLORS.border,
        borderRadius: 10,
        backgroundColor: COLORS.background,
        padding: 12,
    },
    termsText: {
        fontSize: 12,
        color: COLORS.textSecondary,
        lineHeight: 18,
    },
    registerButton: {
        backgroundColor: COLORS.primary,
        padding: 16,
        borderRadius: 10,
        alignItems: 'center',
        marginBottom: 16,
        ...Platform.select({
            web: {
                cursor: 'pointer',
                transition: 'transform 0.2s',
            },
        }),
    },
    registerButtonDisabled: {
        backgroundColor: COLORS.disabled,
    },
    buttonContent: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
    },
    registerButtonText: {
        color: 'white',
        fontSize: 16,
        fontWeight: '600',
    },
    loginLink: {
        alignItems: 'center',
        padding: 8,
        ...Platform.select({
            web: {
                cursor: 'pointer',
            },
        }),
    },
    loginText: {
        color: COLORS.textSecondary,
        fontSize: 14,
    },
    loginTextBold: {
        color: COLORS.primary,
        fontWeight: '600',
    },
    modalOverlay: {
        flex: 1,
        backgroundColor: 'rgba(0, 0, 0, 0.5)',
        justifyContent: 'flex-end',
    },
    modalContent: {
        backgroundColor: COLORS.surface,
        borderTopLeftRadius: 20,
        borderTopRightRadius: 20,
        maxHeight: '80%',
    },
    modalHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        padding: 16,
        borderBottomWidth: 1,
        borderBottomColor: COLORS.border,
    },
    modalTitle: {
        fontSize: 18,
        fontWeight: '600',
        color: COLORS.textPrimary,
    },
    optionItem: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        padding: 16,
        ...Platform.select({
            web: {
                cursor: 'pointer',
            },
        }),
    },
    optionText: {
        fontSize: 16,
        color: COLORS.textPrimary,
    },
    separator: {
        height: 1,
        backgroundColor: COLORS.border,
        marginHorizontal: 16,
    },
});