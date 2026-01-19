// ClientRegisterScreen.tsx (Enhanced)
import React, {useState} from 'react';
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
import {StackNavigationProp} from '@react-navigation/stack';
import {RootStackParamList} from '../../navigation/AppNavigator';
import {authAPI} from '../../services/api';
import {Ionicons} from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import {responsive} from "../../utils/Responsive";

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
    {value: 'Mr', label: 'Mr'},
    {value: 'Mrs', label: 'Mrs'},
    {value: 'Miss', label: 'Miss'},
    {value: 'Ms', label: 'Ms'},
    {value: 'Dr', label: 'Dr'},
    {value: 'Prof', label: 'Professor'},
];

const SOUTH_AFRICAN_REGIONS = [
    {value: 'Eastern Cape', label: 'Eastern Cape'},
    {value: 'Free State', label: 'Free State'},
    {value: 'Gauteng', label: 'Gauteng'},
    {value: 'KwaZulu-Natal', label: 'KwaZulu-Natal'},
    {value: 'Limpopo', label: 'Limpopo'},
    {value: 'Mpumalanga', label: 'Mpumalanga'},
    {value: 'Northern Cape', label: 'Northern Cape'},
    {value: 'North West', label: 'North West'},
    {value: 'Western Cape', label: 'Western Cape'},
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
                    <Ionicons name="chevron-down" size={20} color={COLORS.textSecondary}/>
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
                                <Ionicons name="close" size={24} color={COLORS.textPrimary}/>
                            </TouchableOpacity>
                        </View>
                        <FlatList
                            data={options}
                            keyExtractor={(item) => item.value}
                            renderItem={({item}) => (
                                <TouchableOpacity
                                    style={styles.optionItem}
                                    onPress={() => {
                                        onSelect(item.value);
                                        setModalVisible(false);
                                    }}
                                >
                                    <Text style={styles.optionText}>{item.label}</Text>
                                    {value === item.value && (
                                        <Ionicons name="checkmark" size={20} color={COLORS.primary}/>
                                    )}
                                </TouchableOpacity>
                            )}
                            ItemSeparatorComponent={() => <View style={styles.separator}/>}
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

// Step Indicator Component
const StepIndicator: React.FC<{ currentStep: number; totalSteps: number }> = ({ currentStep, totalSteps }) => {
    return (
        <View style={styles.stepIndicatorContainer}>
            <Text style={styles.stepIndicatorText}>
                Step {currentStep} of {totalSteps}
            </Text>
            <View style={styles.stepProgressBar}>
                {Array.from({ length: totalSteps }).map((_, index) => (
                    <View
                        key={index}
                        style={[
                            styles.stepDot,
                            index < currentStep && styles.stepDotCompleted,
                            index === currentStep - 1 && styles.stepDotActive
                        ]}
                    />
                ))}
            </View>
        </View>
    );
};

export default function ClientRegisterScreen({navigation}: { navigation: ClientRegisterScreenNavigationProp }) {
    // Step management
    const [currentStep, setCurrentStep] = useState(1);
    const totalSteps = 4;

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
        password: '',
        confirmPassword: '',
    });

    const [errors, setErrors] = useState<Record<string, string>>({});
    const [loading, setLoading] = useState(false);
    const [showPassword, setShowPassword] = useState(false);
    const [showConfirmPassword, setShowConfirmPassword] = useState(false);

    // Step-specific validation
    const validateCurrentStep = (): boolean => {
        const newErrors: Record<string, string> = {};
        let isValid = true;

        switch (currentStep) {
            case 1: // Personal Information
                if (!formData.title) {
                    newErrors.title = 'Title is required';
                    isValid = false;
                }
                if (!formData.firstName) {
                    newErrors.firstName = 'First name is required';
                    isValid = false;
                }
                if (!formData.lastName) {
                    newErrors.lastName = 'Last name is required';
                    isValid = false;
                }
                if (!formData.email) {
                    newErrors.email = 'Email is required';
                    isValid = false;
                } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
                    newErrors.email = 'Please enter a valid email address';
                    isValid = false;
                }
                if (formData.phoneNumber) {
                    const cleanNumber = formData.phoneNumber.replace(COUNTRY_CODE, '').replace(/\D/g, '');
                    if (!/^[0-9]{9}$/.test(cleanNumber)) {
                        newErrors.phoneNumber = 'Please enter a valid South African phone number (9 digits after +27)';
                        isValid = false;
                    }
                }
                break;

            case 2: // Employment Information
                if (!formData.region) {
                    newErrors.region = 'Region is required';
                    isValid = false;
                }
                if (!formData.persalId) {
                    newErrors.persalId = 'Personal ID is required';
                    isValid = false;
                }
                if (!formData.departmentId) {
                    newErrors.departmentId = 'Department ID is required';
                    isValid = false;
                }
                break;

            case 3: // Account Security
                if (!formData.password) {
                    newErrors.password = 'Password is required';
                    isValid = false;
                } else if (formData.password.length < 8) {
                    newErrors.password = 'Password must be at least 8 characters';
                    isValid = false;
                }
                if (!formData.confirmPassword) {
                    newErrors.confirmPassword = 'Please confirm your password';
                    isValid = false;
                } else if (formData.confirmPassword !== formData.password) {
                    newErrors.confirmPassword = 'Passwords do not match';
                    isValid = false;
                }
                break;

            case 4: // Terms & Conditions (no validation needed)
                break;
        }

        setErrors(newErrors);
        return isValid;
    };

    const handleNextStep = () => {
        if (validateCurrentStep()) {
            if (currentStep < totalSteps) {
                setCurrentStep(currentStep + 1);
            }
        }
    };

    const handlePrevStep = () => {
        if (currentStep > 1) {
            setCurrentStep(currentStep - 1);
            // Clear errors when going back
            setErrors({});
        }
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

        setFormData({...formData, phoneNumber: formatted});
    };

    const handleRegister = async () => {
        if (!validateCurrentStep()) {
            Alert.alert('Validation Error', 'Please fix the errors in the form');
            return;
        }

        setLoading(true);

        try {
            const registrationData: any = {
                title: formData.title,
                first_name: formData.firstName,
                last_name: formData.lastName,
                email: formData.email,
                phone_number: formData.phoneNumber,
                region: formData.region,
                persal_id: formData.persalId,
                department_id: formData.departmentId,
                user_type: formData.userType,
                password: formData.password,
            };

            // Clean up undefined values
            Object.keys(registrationData).forEach(key => {
                if (registrationData[key] === undefined) {
                    delete registrationData[key];
                }
            });

            console.log('📤 Client registration data:', registrationData);

            const response = await authAPI.registerClient(registrationData);

            await AsyncStorage.setItem('user', JSON.stringify(response.user));

            Alert.alert(
                'Registration Submitted',
                response.message || 'Your registration has been submitted for verification. You will receive an email once your account is approved.',
                [
                    {
                        text: 'OK',
                        onPress: () => navigation.navigate('Login')
                    }
                ]
            );

            // Reset form
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
                password: '',
                confirmPassword: '',
            });
            setErrors({});
            setCurrentStep(1);

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
        }
    };

    // Render current step
    const renderStep = () => {
        switch (currentStep) {
            case 1: // Personal Information
                return (
                    <View style={styles.stepContainer}>
                        <Text style={styles.stepTitle}>Personal Information</Text>
                        <Text style={styles.stepSubtitle}>Tell us about yourself</Text>

                        <SelectInput
                            label="Title *"
                            value={formData.title}
                            placeholder="Select your title"
                            onSelect={(value) => {
                                setFormData({...formData, title: value});
                                setErrors(prev => ({...prev, title: ''}));
                            }}
                            editable={!loading}
                            options={TITLES}
                            error={errors.title}
                        />

                        <ModernInput
                            label="First Name *"
                            placeholder="Enter your first name"
                            value={formData.firstName}
                            onChangeText={(text) => setFormData({...formData, firstName: text})}
                            editable={!loading}
                            onBlur={() => setErrors(prev => ({...prev, firstName: !formData.firstName ? 'First name is required' : ''}))}
                            error={errors.firstName}
                        />

                        <ModernInput
                            label="Last Name *"
                            placeholder="Enter your last name"
                            value={formData.lastName}
                            onChangeText={(text) => setFormData({...formData, lastName: text})}
                            editable={!loading}
                            onBlur={() => setErrors(prev => ({...prev, lastName: !formData.lastName ? 'Last name is required' : ''}))}
                            error={errors.lastName}
                        />

                        <ModernInput
                            label="Email Address *"
                            placeholder="Enter your email"
                            keyboardType="email-address"
                            autoCapitalize="none"
                            value={formData.email}
                            onChangeText={(text) => setFormData({...formData, email: text})}
                            editable={!loading}
                            onBlur={() => {
                                if (!formData.email) {
                                    setErrors(prev => ({...prev, email: 'Email is required'}));
                                } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
                                    setErrors(prev => ({...prev, email: 'Please enter a valid email address'}));
                                } else {
                                    setErrors(prev => ({...prev, email: ''}));
                                }
                            }}
                            error={errors.email}
                        />

                        <ModernInput
                            label="Phone Number (Optional)"
                            placeholder={`${COUNTRY_CODE} 00 000 0000`}
                            keyboardType="phone-pad"
                            value={formData.phoneNumber}
                            onChangeText={handlePhoneNumberChange}
                            editable={!loading}
                            onBlur={() => {
                                if (formData.phoneNumber) {
                                    const cleanNumber = formData.phoneNumber.replace(COUNTRY_CODE, '').replace(/\D/g, '');
                                    if (!/^[0-9]{9}$/.test(cleanNumber)) {
                                        setErrors(prev => ({...prev, phoneNumber: 'Please enter a valid South African phone number (9 digits after +27)'}));
                                    } else {
                                        setErrors(prev => ({...prev, phoneNumber: ''}));
                                    }
                                }
                            }}
                            error={errors.phoneNumber}
                        />
                    </View>
                );

            case 2: // Employment Information
                return (
                    <View style={styles.stepContainer}>
                        <Text style={styles.stepTitle}>Employment Information</Text>
                        <Text style={styles.stepSubtitle}>Your work details</Text>

                        <SelectInput
                            label="Region *"
                            value={formData.region}
                            placeholder="Select your region"
                            onSelect={(value) => {
                                setFormData({...formData, region: value});
                                setErrors(prev => ({...prev, region: ''}));
                            }}
                            editable={!loading}
                            options={SOUTH_AFRICAN_REGIONS}
                            error={errors.region}
                        />

                        <ModernInput
                            label="Personal ID Number *"
                            placeholder="Enter your personal ID Number"
                            value={formData.persalId}
                            onChangeText={(text) => setFormData({...formData, persalId: text})}
                            editable={!loading}
                            onBlur={() => setErrors(prev => ({...prev, persalId: !formData.persalId ? 'Personal ID is required' : ''}))}
                            error={errors.persalId}
                        />

                        <ModernInput
                            label="Department ID *"
                            placeholder="Enter your department ID"
                            value={formData.departmentId}
                            onChangeText={(text) => setFormData({...formData, departmentId: text})}
                            editable={!loading}
                            onBlur={() => setErrors(prev => ({...prev, departmentId: !formData.departmentId ? 'Department ID is required' : ''}))}
                            error={errors.departmentId}
                        />

                        <View style={styles.inputGroup}>
                            <Text style={styles.label}>User Type *</Text>
                            <View style={styles.radioGroup}>
                                {['Advocate', 'Magistrate'].map((type) => (
                                    <Pressable
                                        key={type}
                                        style={({pressed}) => [
                                            styles.radioButton,
                                            formData.userType === type && styles.radioButtonSelected,
                                            loading && styles.radioButtonDisabled,
                                            pressed && styles.buttonPressed
                                        ]}
                                        onPress={() => {
                                            setFormData({...formData, userType: type as any});
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
                    </View>
                );

            case 3: // Account Security
                return (
                    <View style={styles.stepContainer}>
                        <Text style={styles.stepTitle}>Account Security</Text>
                        <Text style={styles.stepSubtitle}>Create your login credentials</Text>

                        <PasswordInput
                            label="Password *"
                            value={formData.password}
                            onChangeText={(text) => setFormData({...formData, password: text})}
                            error={errors.password}
                            showPassword={showPassword}
                            onToggleVisibility={() => setShowPassword(!showPassword)}
                            onBlur={() => {
                                if (!formData.password) {
                                    setErrors(prev => ({...prev, password: 'Password is required'}));
                                } else if (formData.password.length < 8) {
                                    setErrors(prev => ({...prev, password: 'Password must be at least 8 characters'}));
                                } else {
                                    setErrors(prev => ({...prev, password: ''}));
                                }
                            }}
                            editable={!loading}
                        />

                        <PasswordInput
                            label="Confirm Password *"
                            value={formData.confirmPassword}
                            onChangeText={(text) => setFormData({...formData, confirmPassword: text})}
                            error={errors.confirmPassword}
                            showPassword={showConfirmPassword}
                            onToggleVisibility={() => setShowConfirmPassword(!showConfirmPassword)}
                            onBlur={() => {
                                if (!formData.confirmPassword) {
                                    setErrors(prev => ({...prev, confirmPassword: 'Please confirm your password'}));
                                } else if (formData.confirmPassword !== formData.password) {
                                    setErrors(prev => ({...prev, confirmPassword: 'Passwords do not match'}));
                                } else {
                                    setErrors(prev => ({...prev, confirmPassword: ''}));
                                }
                            }}
                            editable={!loading}
                        />

                        <View style={styles.passwordTips}>
                            <Text style={styles.passwordTipsTitle}>Password Requirements:</Text>
                            <View style={styles.passwordTipItem}>
                                <Ionicons 
                                    name={formData.password.length >= 8 ? "checkmark-circle" : "ellipse-outline"} 
                                    size={16} 
                                    color={formData.password.length >= 8 ? COLORS.success : COLORS.textSecondary} 
                                />
                                <Text style={styles.passwordTipText}>At least 8 characters long</Text>
                            </View>
                        </View>
                    </View>
                );

            case 4: // Terms & Conditions
                return (
                    <View style={styles.stepContainer}>
                        <Text style={styles.stepTitle}>Terms & Conditions</Text>
                        <Text style={styles.stepSubtitle}>Please review and accept</Text>

                        <View style={styles.termsContainer}>
                            <ScrollView style={styles.termsContent}>
                                <Text style={styles.termsText}>
                                    1. <Text style={styles.termsBold}>Account Creation:</Text> By registering, you confirm that all information provided is accurate and verifiable.{'\n\n'}
                                    2. <Text style={styles.termsBold}>Eligibility:</Text> You must maintain active employment with the Department of Justice and Constitutional Development.{'\n\n'}
                                    3. <Text style={styles.termsBold}>Verification:</Text> Your registration is subject to verification against departmental records.{'\n\n'}
                                    4. <Text style={styles.termsBold}>Data Privacy:</Text> Your personal information will be used solely for account verification and device allocation purposes.{'\n\n'}
                                    5. <Text style={styles.termsBold}>Communications:</Text> You agree to receive email and SMS notifications regarding your account status and device requests.{'\n\n'}
                                    6. <Text style={styles.termsBold}>Account Security:</Text> You are responsible for maintaining the confidentiality of your login credentials.{'\n\n'}
                                    7. <Text style={styles.termsBold}>Device Usage:</Text> Approved devices must be used for official departmental work only.
                                </Text>
                            </ScrollView>
                            
                            <View style={styles.acceptContainer}>
                                <Text style={styles.acceptText}>
                                    By creating your account, you agree to all the terms and conditions listed above.
                                </Text>
                            </View>
                        </View>
                    </View>
                );

            default:
                return null;
        }
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
                    
                    <StepIndicator currentStep={currentStep} totalSteps={totalSteps} />
                </View>

                <View style={styles.form}>
                    {renderStep()}

                    <View style={styles.buttonContainer}>
                        {currentStep > 1 && (
                            <Pressable
                                style={({ pressed }) => [
                                    styles.secondaryButton,
                                    pressed && styles.buttonPressed,
                                    loading && styles.buttonDisabled
                                ]}
                                onPress={handlePrevStep}
                                disabled={loading}
                            >
                                <Ionicons name="arrow-back" size={18} color={COLORS.primary} />
                                <Text style={styles.secondaryButtonText}>Back</Text>
                            </Pressable>
                        )}

                        {currentStep < totalSteps ? (
                            <Pressable
                                style={({ pressed }) => [
                                    styles.primaryButton,
                                    pressed && styles.buttonPressed,
                                    loading && styles.buttonDisabled
                                ]}
                                onPress={handleNextStep}
                                disabled={loading}
                            >
                                <Text style={styles.primaryButtonText}>Continue</Text>
                                <Ionicons name="arrow-forward" size={18} color="white" />
                            </Pressable>
                        ) : (
                            <Pressable
                                style={({ pressed }) => [
                                    styles.submitButton,
                                    (loading) && styles.submitButtonDisabled,
                                    pressed && styles.buttonPressed
                                ]}
                                onPress={handleRegister}
                                disabled={loading}
                            >
                                {loading ? (
                                    <View style={styles.buttonContent}>
                                        <ActivityIndicator color="white" size="small"/>
                                        <Text style={styles.submitButtonText}>
                                            Creating Account...
                                        </Text>
                                    </View>
                                ) : (
                                    <Text style={styles.submitButtonText}>Create Account</Text>
                                )}
                            </Pressable>
                        )}
                    </View>

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
        marginBottom: 20,
    },
    stepIndicatorContainer: {
        marginTop: 8,
    },
    stepIndicatorText: {
        fontSize: 14,
        fontWeight: '600',
        color: COLORS.primary,
        marginBottom: 8,
    },
    stepProgressBar: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
    },
    stepDot: {
        flex: 1,
        height: 4,
        backgroundColor: COLORS.border,
        marginHorizontal: 2,
        borderRadius: 2,
    },
    stepDotActive: {
        backgroundColor: COLORS.primary,
    },
    stepDotCompleted: {
        backgroundColor: COLORS.primaryLight,
    },
    form: {
        padding: 24,
    },
    stepContainer: {
        marginBottom: 32,
    },
    stepTitle: {
        fontSize: 22,
        fontWeight: '700',
        color: COLORS.textPrimary,
        marginBottom: 8,
    },
    stepSubtitle: {
        fontSize: 16,
        color: COLORS.textSecondary,
        marginBottom: 24,
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
    buttonDisabled: {
        opacity: 0.6,
    },
    radioText: {
        fontSize: 16,
        fontWeight: '600',
        color: COLORS.textPrimary,
    },
    radioTextSelected: {
        color: 'white',
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
    passwordTips: {
        marginTop: 16,
        padding: 16,
        backgroundColor: COLORS.background,
        borderRadius: 10,
        borderWidth: 1,
        borderColor: COLORS.border,
    },
    passwordTipsTitle: {
        fontSize: 14,
        fontWeight: '600',
        color: COLORS.textPrimary,
        marginBottom: 12,
    },
    passwordTipItem: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 8,
    },
    passwordTipText: {
        fontSize: 12,
        color: COLORS.textSecondary,
        marginLeft: 8,
    },
    termsContainer: {
        marginTop: 8,
    },
    termsContent: {
        maxHeight: 300,
        borderWidth: 1,
        borderColor: COLORS.border,
        borderRadius: 10,
        backgroundColor: COLORS.background,
        padding: 16,
    },
    termsText: {
        fontSize: 12,
        color: COLORS.textSecondary,
        lineHeight: 18,
    },
    termsBold: {
        fontWeight: '600',
        color: COLORS.textPrimary,
    },
    acceptContainer: {
        marginTop: 16,
        padding: 16,
        backgroundColor: '#f0f9ff',
        borderRadius: 10,
        borderWidth: 1,
        borderColor: '#bae6fd',
    },
    acceptText: {
        fontSize: 14,
        color: COLORS.textPrimary,
        textAlign: 'center',
        fontWeight: '500',
    },
    buttonContainer: {
        flexDirection: 'row',
        gap: 12,
        marginTop: 24,
        marginBottom: 16,
    },
    primaryButton: {
        flex: 1,
        backgroundColor: COLORS.primary,
        padding: 16,
        borderRadius: 10,
        alignItems: 'center',
        justifyContent: 'center',
        flexDirection: 'row',
        gap: 8,
        ...Platform.select({
            web: {
                cursor: 'pointer',
                transition: 'transform 0.2s',
            },
        }),
    },
    secondaryButton: {
        flex: 1,
        backgroundColor: 'transparent',
        padding: 16,
        borderRadius: 10,
        alignItems: 'center',
        justifyContent: 'center',
        flexDirection: 'row',
        gap: 8,
        borderWidth: 1,
        borderColor: COLORS.border,
        ...Platform.select({
            web: {
                cursor: 'pointer',
                transition: 'transform 0.2s',
            },
        }),
    },
    secondaryButtonText: {
        color: COLORS.primary,
        fontSize: 16,
        fontWeight: '600',
    },
    primaryButtonText: {
        color: 'white',
        fontSize: 16,
        fontWeight: '600',
    },
    submitButton: {
        flex: 1,
        backgroundColor: COLORS.success,
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
    submitButtonDisabled: {
        backgroundColor: COLORS.disabled,
    },
    submitButtonText: {
        color: 'white',
        fontSize: 16,
        fontWeight: '600',
    },
    buttonContent: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
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