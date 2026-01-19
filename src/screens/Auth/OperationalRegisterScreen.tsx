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
import { RootStackParamList } from '../../navigation/AppNavigator';
import { authAPI } from '../../services/api';
import { Ionicons } from '@expo/vector-icons';

type OperationalRegisterScreenNavigationProp = StackNavigationProp<
    RootStackParamList,
    'OperationalRegister'
>;

type Props = {
    navigation: OperationalRegisterScreenNavigationProp;
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

interface PasswordInputProps {
    label: string;
    value: string;
    onChangeText: (text: string) => void;
    error?: string;
    showPassword: boolean;
    onToggleVisibility: () => void;
    onBlur?: () => void;
    editable?: boolean;
}

const PasswordInput: React.FC<PasswordInputProps> = ({
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

export default function OperationalRegisterScreen({ navigation }: Props) {
    const [formData, setFormData] = useState({
        title: '',
        firstName: '',
        lastName: '',
        email: '',
        userRole: 'Admin' as 'Admin' | 'MTN_Staff' | 'Warehouse' | 'Approver',
        password: '',
        confirmPassword: '',
    });
    const [loading, setLoading] = useState(false);
    const [errors, setErrors] = useState<Record<string, string>>({});
    const [showPassword, setShowPassword] = useState(false);
    const [showConfirmPassword, setShowConfirmPassword] = useState(false);

    const userRoles = [
        { value: 'Admin', label: 'Administrator', description: 'Full system access' },
        { value: 'MTN_Staff', label: 'MTN Staff', description: 'Device and order management' },
        { value: 'Warehouse', label: 'Warehouse', description: 'Inventory and delivery' },
        { value: 'Approver', label: 'Approver', description: 'Application process approver' },
    ];

    const validateField = (field: string, value: any): string => {
        switch (field) {
            case 'email':
                if (!value) return 'Email is required';
                if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value)) return 'Please enter a valid email address';
                return '';

            case 'password':
                if (!value) return 'Password is required';
                if (value.length < 8) return 'Password must be at least 8 characters';
                return '';

            case 'confirmPassword':
                if (!value) return 'Please confirm your password';
                if (value !== formData.password) return 'Passwords do not match';
                return '';

            case 'title':
            case 'firstName':
            case 'lastName':
                if (!value) return 'This field is required';
                return '';

            default:
                return '';
        }
    };

    const handleBlur = (field: string) => {
        const error = validateField(field, formData[field as keyof typeof formData]);
        setErrors(prev => ({ ...prev, [field]: error }));
    };

    const handleRegister = async () => {
        const newErrors: Record<string, string> = {};
        const fieldsToValidate = Object.keys(formData);

        fieldsToValidate.forEach(key => {
            const value = formData[key as keyof typeof formData];
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
            console.log('🔄 Registering operational user...');

            const registrationData = {
                title: formData.title,
                first_name: formData.firstName,
                last_name: formData.lastName,
                email: formData.email,
                user_role: formData.userRole,
                password: formData.password,
                created_at: "",
                updated_at: "",
            };

            console.log('📤 Operational registration data:', registrationData);

            const response = await authAPI.registerOperational(registrationData);

            console.log('✅ Operational Registration API Response:', response.data);

            Alert.alert('Success', response.data.message || 'Registration successful!');

            navigation.navigate('Login');

        } catch (error: any) {
            console.log('❌ Operational Registration API Error:', error.message);
            Alert.alert('Registration Failed', error.message || 'Registration failed. Please try again.');
        } finally {
            setLoading(false);
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
                    <Text style={styles.title}>Operational Registration</Text>
                    <Text style={styles.subtitle}>Create your staff account</Text>
                </View>

                <View style={styles.form}>
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
                        placeholder="Enter your work email"
                        keyboardType="email-address"
                        autoCapitalize="none"
                        value={formData.email}
                        onChangeText={(text) => setFormData({ ...formData, email: text })}
                        editable={!loading}
                        onBlur={() => handleBlur('email')}
                        error={errors.email}
                    />

                    <View style={styles.inputGroup}>
                        <Text style={styles.label}>User Role *</Text>
                        <View style={styles.rolesContainer}>
                            {userRoles.map((role) => (
                                <Pressable
                                    key={role.value}
                                    style={({ pressed }) => [
                                        styles.roleCard,
                                        formData.userRole === role.value && styles.roleCardSelected,
                                        loading && styles.roleCardDisabled,
                                        pressed && styles.buttonPressed
                                    ]}
                                    onPress={() => setFormData({ ...formData, userRole: role.value as any })}
                                    disabled={loading}
                                >
                                    <View style={styles.roleHeader}>
                                        <View style={[
                                            styles.roleRadio,
                                            formData.userRole === role.value && styles.roleRadioSelected
                                        ]}>
                                            {formData.userRole === role.value && (
                                                <View style={styles.radioInner} />
                                            )}
                                        </View>
                                        <Text style={[
                                            styles.roleTitle,
                                            formData.userRole === role.value && styles.roleTitleSelected
                                        ]}>
                                            {role.label}
                                        </Text>
                                    </View>
                                    <Text style={[
                                        styles.roleDesc,
                                        formData.userRole === role.value && styles.roleDescSelected
                                    ]}>
                                        {role.description}
                                    </Text>
                                </Pressable>
                            ))}
                        </View>
                    </View>

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

                    <Pressable
                        style={({ pressed }) => [
                            styles.registerButton,
                            loading && styles.registerButtonDisabled,
                            pressed && styles.buttonPressed
                        ]}
                        onPress={handleRegister}
                        disabled={loading}
                    >
                        {loading ? (
                            <View style={styles.buttonContent}>
                                <ActivityIndicator color="white" size="small" />
                                <Text style={styles.registerButtonText}>
                                    Creating Account...
                                </Text>
                            </View>
                        ) : (
                            <Text style={styles.registerButtonText}>Create Staff Account</Text>
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
        paddingHorizontal: 16,
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
    rolesContainer: {
        gap: 12,
    },
    roleCard: {
        borderWidth: 1,
        borderColor: COLORS.border,
        borderRadius: 12,
        padding: 16,
        backgroundColor: COLORS.background,
        ...Platform.select({
            web: {
                cursor: 'pointer',
                transition: 'transform 0.2s',
            },
        }),
    },
    roleCardSelected: {
        borderColor: COLORS.primary,
        backgroundColor: '#eff6ff',
    },
    roleCardDisabled: {
        opacity: 0.6,
    },
    buttonPressed: {
        transform: [{ scale: 0.98 }],
        opacity: 0.9,
    },
    roleHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 8,
    },
    roleRadio: {
        width: 20,
        height: 20,
        borderRadius: 10,
        borderWidth: 2,
        borderColor: COLORS.border,
        marginRight: 12,
        justifyContent: 'center',
        alignItems: 'center',
    },
    roleRadioSelected: {
        borderColor: COLORS.primary,
        backgroundColor: COLORS.primary,
    },
    radioInner: {
        width: 8,
        height: 8,
        borderRadius: 4,
        backgroundColor: 'white',
    },
    roleTitle: {
        fontSize: 16,
        fontWeight: '600',
        color: COLORS.textPrimary,
    },
    roleTitleSelected: {
        color: COLORS.primary,
    },
    roleDesc: {
        fontSize: 14,
        color: COLORS.textSecondary,
        marginLeft: 32,
    },
    roleDescSelected: {
        color: COLORS.textPrimary,
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
    registerButton: {
        backgroundColor: COLORS.primary,
        padding: 16,
        borderRadius: 10,
        alignItems: 'center',
        marginTop: 20,
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