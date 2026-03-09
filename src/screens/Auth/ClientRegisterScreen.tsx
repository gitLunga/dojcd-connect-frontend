import React, {useState} from 'react';
import {
    View, Text, StyleSheet, Pressable, ScrollView, TextInput,
    ActivityIndicator, Modal, TouchableOpacity, FlatList,
    SafeAreaView, Platform, KeyboardAvoidingView
} from 'react-native';
import {StackNavigationProp} from '@react-navigation/stack';
import {RootStackParamList} from '../../navigation/AppNavigator';
import {authAPI} from '../../services/api';
import {Ionicons} from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import {responsive} from '../../utils/Responsive';
import {useToast} from '../../components/ToastProvider';

// ─── Shared design tokens ─────────────────────────────────────────────────────
const C = {
    navy: '#0F1F3D',
    accent: '#1E4FD8',
    accentSoft: '#EBF0FF',
    surface: '#FFFFFF',
    bg: '#F4F6FA',
    border: '#E2E8F2',
    text: '#0F1F3D',
    muted: '#64748B',
    mutedLight: '#94A3B8',
    green: '#059669',
    greenSoft: '#D1FAE5',
    amber: '#D97706',
    amberSoft: '#FEF3C7',
    error: '#DC2626',
    errorSoft: '#FEF2F2',
    disabled: '#94A3B8',
};

// ─── Static data (unchanged) ──────────────────────────────────────────────────
const spacingValue = responsive.spacing.md;

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

// ─── SA ID validation (unchanged) ─────────────────────────────────────────────
const validateSouthAfricanID = (idNumber: string): string | null => {
    const cleanId = idNumber.replace(/\s/g, '');
    if (!/^\d{13}$/.test(cleanId)) return 'ID number must be 13 digits';
    const year = parseInt(cleanId.substring(0, 2));
    const month = parseInt(cleanId.substring(2, 4));
    const day = parseInt(cleanId.substring(4, 6));
    if (month < 1 || month > 12) return 'Invalid month in ID number';
    if (day < 1 || day > 31) return 'Invalid day in ID number';
    const fullYear = year < 22 ? 2000 + year : 1900 + year;
    const date = new Date(fullYear, month - 1, day);
    if (date.getFullYear() !== fullYear || date.getMonth() + 1 !== month || date.getDate() !== day)
        return 'Invalid date of birth in ID number';
    if (date > new Date()) return 'Date of birth cannot be in the future';
    return null;
};

type ClientRegisterScreenNavigationProp = StackNavigationProp<RootStackParamList, 'ClientRegister'>;

// ─── Sub-components ───────────────────────────────────────────────────────────

interface FieldProps {
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
    icon?: string;
    hint?: string;
}

const Field: React.FC<FieldProps> = ({label, error, onBlur, icon, hint, ...props}) => {
    const [focused, setFocused] = useState(false);
    return (
        <View style={f.wrap}>
            <Text style={f.label}>{label.toUpperCase()}</Text>
            <View style={[f.inputRow, focused && f.inputFocused, !!error && f.inputError]}>
                {icon && (
                    <Ionicons
                        name={icon as any}
                        size={17}
                        color={error ? C.error : focused ? C.accent : C.muted}
                        style={f.ico}
                    />
                )}
                <TextInput
                    style={f.input}
                    onFocus={() => setFocused(true)}
                    onBlur={() => {
                        setFocused(false);
                        onBlur?.();
                    }}
                    placeholderTextColor={C.mutedLight}
                    {...props}
                />
            </View>
            {error ? <Text style={f.errorText}>{error}</Text> : null}
            {hint && !error ? <Text style={f.hintText}>{hint}</Text> : null}
        </View>
    );
};

const f = StyleSheet.create({
    wrap: {marginBottom: 16},
    label: {fontSize: 10, fontWeight: '700', color: C.muted, letterSpacing: 1.1, marginBottom: 8},
    inputRow: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: C.bg,
        borderWidth: 1.5,
        borderColor: C.border,
        borderRadius: 14
    },
    inputFocused: {borderColor: C.accent, backgroundColor: '#FAFBFF'},
    inputError: {borderColor: C.error, backgroundColor: C.errorSoft},
    ico: {marginLeft: 14, marginRight: 4},
    input: {flex: 1, paddingVertical: 13, paddingHorizontal: 10, fontSize: 15, color: C.text},
    errorText: {fontSize: 11, color: C.error, marginTop: 5, marginLeft: 4},
    hintText: {fontSize: 11, color: C.muted, marginTop: 4, marginLeft: 4, fontStyle: 'italic'},
});

interface PasswordFieldProps {
    label: string;
    value: string;
    onChangeText: (text: string) => void;
    error?: string;
    showPassword: boolean;
    onToggleVisibility: () => void;
    onBlur?: () => void;
    editable?: boolean;
}

const PasswordField: React.FC<PasswordFieldProps> = ({
                                                         label,
                                                         value,
                                                         onChangeText,
                                                         error,
                                                         showPassword,
                                                         onToggleVisibility,
                                                         onBlur,
                                                         editable = true,
                                                     }) => {
    const [focused, setFocused] = useState(false);
    return (
        <View style={f.wrap}>
            <Text style={f.label}>{label.toUpperCase()}</Text>
            <View style={[f.inputRow, focused && f.inputFocused, !!error && f.inputError]}>
                <Ionicons
                    name="lock-closed-outline"
                    size={17}
                    color={error ? C.error : focused ? C.accent : C.muted}
                    style={f.ico}
                />
                <TextInput
                    style={f.input}
                    placeholder="Enter password"
                    placeholderTextColor={C.mutedLight}
                    value={value}
                    onChangeText={onChangeText}
                    secureTextEntry={!showPassword}
                    editable={editable}
                    onFocus={() => setFocused(true)}
                    onBlur={() => {
                        setFocused(false);
                        onBlur?.();
                    }}
                    autoCapitalize="none"
                    autoCorrect={false}
                />
                <TouchableOpacity onPress={onToggleVisibility} style={pf.eye} disabled={!editable}>
                    <Ionicons name={showPassword ? 'eye-off-outline' : 'eye-outline'} size={20} color={C.muted}/>
                </TouchableOpacity>
            </View>
            {error ? <Text style={f.errorText}>{error}</Text> : null}
        </View>
    );
};
const pf = StyleSheet.create({eye: {paddingHorizontal: 14}});

interface SelectFieldProps {
    label: string;
    value: string;
    placeholder: string;
    onSelect: (value: string) => void;
    editable: boolean;
    options: { value: string; label: string }[];
    error?: string;
    icon?: string;
}

const SelectField: React.FC<SelectFieldProps> = ({
                                                     label,
                                                     value,
                                                     placeholder,
                                                     onSelect,
                                                     editable,
                                                     options,
                                                     error,
                                                     icon
                                                 }) => {
    const [open, setOpen] = useState(false);
    const found = options.find(o => o.value === value)?.label || '';
    return (
        <>
            <View style={f.wrap}>
                <Text style={f.label}>{label.toUpperCase()}</Text>
                <Pressable
                    style={[sf.btn, !!error && f.inputError, !editable && {opacity: 0.55}]}
                    onPress={() => editable && setOpen(true)}
                    disabled={!editable}
                >
                    {icon && <Ionicons name={icon as any} size={17} color={value ? C.text : C.muted} style={f.ico}/>}
                    <Text style={[sf.btnText, !value && sf.placeholder]}>{found || placeholder}</Text>
                    <Ionicons name="chevron-down" size={16} color={C.muted} style={{marginRight: 14}}/>
                </Pressable>
                {error ? <Text style={f.errorText}>{error}</Text> : null}
            </View>

            <Modal visible={open} transparent animationType="slide" onRequestClose={() => setOpen(false)}>
                <View style={sf.overlay}>
                    <View style={sf.sheet}>
                        <View style={sf.handle}/>
                        <View style={sf.sheetHeader}>
                            <Text style={sf.sheetTitle}>Select {label}</Text>
                            <TouchableOpacity onPress={() => setOpen(false)}>
                                <Ionicons name="close" size={22} color={C.muted}/>
                            </TouchableOpacity>
                        </View>
                        <FlatList
                            data={options}
                            keyExtractor={i => i.value}
                            renderItem={({item}) => (
                                <TouchableOpacity
                                    style={sf.option}
                                    onPress={() => {
                                        onSelect(item.value);
                                        setOpen(false);
                                    }}
                                >
                                    <Text style={[sf.optionText, value === item.value && sf.optionActive]}>
                                        {item.label}
                                    </Text>
                                    {value === item.value && (
                                        <Ionicons name="checkmark" size={18} color={C.accent}/>
                                    )}
                                </TouchableOpacity>
                            )}
                            ItemSeparatorComponent={() => <View
                                style={{height: 1, backgroundColor: C.border, marginHorizontal: 16}}/>}
                        />
                    </View>
                </View>
            </Modal>
        </>
    );
};
const sf = StyleSheet.create({
    btn: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: C.bg,
        borderWidth: 1.5,
        borderColor: C.border,
        borderRadius: 14
    },
    btnText: {flex: 1, paddingVertical: 13, paddingHorizontal: 10, fontSize: 15, color: C.text},
    placeholder: {color: C.mutedLight},
    overlay: {flex: 1, backgroundColor: 'rgba(15,31,61,0.5)', justifyContent: 'flex-end'},
    sheet: {backgroundColor: C.surface, borderTopLeftRadius: 28, borderTopRightRadius: 28, maxHeight: '65%'},
    handle: {width: 36, height: 4, backgroundColor: C.border, borderRadius: 2, alignSelf: 'center', marginTop: 12},
    sheetHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        padding: 20,
        borderBottomWidth: 1,
        borderBottomColor: C.border
    },
    sheetTitle: {fontSize: 18, fontWeight: '800', color: C.text},
    option: {flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: 18},
    optionText: {fontSize: 16, color: C.text},
    optionActive: {color: C.accent, fontWeight: '700'},
});

// ─── Step progress bar ────────────────────────────────────────────────────────
const STEP_LABELS = ['Personal', 'Employment', 'Security', 'Terms'];

const StepBar: React.FC<{ current: number; total: number }> = ({current, total}) => (
    <View style={sb.wrap}>
        {STEP_LABELS.map((label, i) => {
            const done = i < current - 1;
            const active = i === current - 1;
            return (
                <React.Fragment key={label}>
                    <View style={sb.item}>
                        <View style={[sb.circle, done && sb.circleDone, active && sb.circleActive]}>
                            {done
                                ? <Ionicons name="checkmark" size={12} color="#fff"/>
                                : <Text style={[sb.num, active && sb.numActive]}>{i + 1}</Text>
                            }
                        </View>
                        <Text style={[sb.label, active && sb.labelActive, done && sb.labelDone]}>{label}</Text>
                    </View>
                    {i < total - 1 && (
                        <View style={[sb.connector, (done || active) && sb.connectorFilled]}/>
                    )}
                </React.Fragment>
            );
        })}
    </View>
);
const sb = StyleSheet.create({
    wrap: {flexDirection: 'row', alignItems: 'flex-start', justifyContent: 'center', marginTop: 8},
    item: {alignItems: 'center', width: 54},
    circle: {
        width: 28,
        height: 28,
        borderRadius: 14,
        backgroundColor: 'rgba(255,255,255,0.1)',
        borderWidth: 1,
        borderColor: 'rgba(255,255,255,0.2)',
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: 5
    },
    circleDone: {backgroundColor: C.green, borderColor: C.green},
    circleActive: {backgroundColor: C.accent, borderColor: C.accent},
    num: {fontSize: 11, color: 'rgba(255,255,255,0.45)', fontWeight: '700'},
    numActive: {color: '#fff'},
    label: {fontSize: 9, color: 'rgba(255,255,255,0.35)', fontWeight: '600', letterSpacing: 0.3, textAlign: 'center'},
    labelActive: {color: 'rgba(255,255,255,0.9)'},
    labelDone: {color: 'rgba(255,255,255,0.6)'},
    connector: {flex: 1, height: 1, backgroundColor: 'rgba(255,255,255,0.12)', marginTop: 14, maxWidth: 18},
    connectorFilled: {backgroundColor: C.accent},
});

// ─── Main screen ──────────────────────────────────────────────────────────────
export default function ClientRegisterScreen({navigation}: { navigation: ClientRegisterScreenNavigationProp }) {
    const toast = useToast();
    const [currentStep, setCurrentStep] = useState(1);
    const totalSteps = 4;

    const [formData, setFormData] = useState({
        title: '', firstName: '', lastName: '', email: '',
        phoneNumber: '', region: '', persalId: '', departmentId: '',
        userType: 'Advocate' as 'Advocate' | 'Magistrate',
        password: '', confirmPassword: '',
    });

    const [errors, setErrors] = useState<Record<string, string>>({});
    const [loading, setLoading] = useState(false);
    const [showPassword, setShowPassword] = useState(false);
    const [showConfirmPassword, setShowConfirmPassword] = useState(false);

    // ── Validation (unchanged logic) ──────────────────────────────────────────
    const validateCurrentStep = (): boolean => {
        const newErrors: Record<string, string> = {};
        let isValid = true;

        switch (currentStep) {
            case 1:
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
                    const clean = formData.phoneNumber.replace(COUNTRY_CODE, '').replace(/\D/g, '');
                    if (!/^[0-9]{9}$/.test(clean)) {
                        newErrors.phoneNumber = 'Please enter a valid South African phone number (9 digits after +27)';
                        isValid = false;
                    }
                }
                break;
            case 2:
                if (!formData.region) {
                    newErrors.region = 'Region is required';
                    isValid = false;
                }
                if (!formData.persalId) {
                    newErrors.persalId = 'Personal ID is required';
                    isValid = false;
                } else {
                    const idErr = validateSouthAfricanID(formData.persalId);
                    if (idErr) {
                        newErrors.persalId = idErr;
                        isValid = false;
                    }
                }
                if (!formData.departmentId) {
                    newErrors.departmentId = 'Department ID is required';
                    isValid = false;
                }
                break;
            case 3:
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
        }

        setErrors(newErrors);
        return isValid;
    };

    const handleNextStep = () => {
        if (validateCurrentStep()) {
            if (currentStep < totalSteps) setCurrentStep(currentStep + 1);
        } else {
            toast.warning('Please fix the errors before continuing');
        }
    };

    const handlePrevStep = () => {
        if (currentStep > 1) {
            setCurrentStep(currentStep - 1);
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
        if (cleaned.length > 2) formatted += cleaned.slice(2, 5);
        if (cleaned.length > 5) formatted += ' ' + cleaned.slice(5, 8);
        if (cleaned.length > 8) formatted += ' ' + cleaned.slice(8);
        setFormData({...formData, phoneNumber: formatted});
    };

    // ── API call (unchanged) ──────────────────────────────────────────────────
    const handleRegister = async () => {
        if (!validateCurrentStep()) {
            toast.warning('Please review the terms before submitting');
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

            Object.keys(registrationData).forEach(key => {
                if (registrationData[key] === undefined) delete registrationData[key];
            });

            console.log('🔵 [FRONTEND] Sending registration request...');
            const response = await authAPI.registerClient(registrationData);

            console.log('✅ [FRONTEND] Registration successful:', response.user.email);
            await AsyncStorage.setItem('user', JSON.stringify(response.user));

            toast.success(
                'Registration Submitted!',
                response.message || 'Your account is pending verification. You will be notified by email.',
            );

            setFormData({
                title: '', firstName: '', lastName: '', email: '',
                phoneNumber: '', region: '', persalId: '', departmentId: '',
                userType: 'Advocate', password: '', confirmPassword: '',
            });
            setErrors({});
            setCurrentStep(1);

            setTimeout(() => navigation.navigate('Login'), 1800);

        } catch (error: any) {
            console.log('🔴 [FRONTEND] Catch block triggered');
            console.log('    Error message:', error.message);
            console.log('    Error response:', error.response);
            console.log('    Status code:', error.response?.status);
            console.log('    Full error:', JSON.stringify(error, null, 2));

            const status = error.response?.status;
            const serverMessage = error.response?.data?.message;

            console.log(`    → Processing as status ${status}`);

            if (!error.response) {
                console.log('    → No response, connection error');
                toast.error('Connection Error', 'Network error. Please check your connection.');
            } else if (status === 409) {
                console.log('    → 409 Conflict detected, showing duplicate error');
                toast.error('Account Already Exists', serverMessage || 'An account with this email already exists.');
                setErrors(prev => ({...prev, email: 'This email is already registered'}));
                setCurrentStep(1);
            } else if (status === 422) {
                console.log('    → 422 Validation error');
                toast.error('Invalid Data', serverMessage || 'Please check your information and try again.');
            } else {
                console.log('    → Generic error');
                toast.error('Registration Failed', serverMessage || 'Registration failed. Please try again.');
            }
        } finally {
            setLoading(false);
        }
    };

    // ── Step content ──────────────────────────────────────────────────────────
    const renderStep = () => {
        switch (currentStep) {

            case 1:
                return (
                    <View>
                        <View style={st.stepIntro}>
                            <View style={[st.stepIco, {backgroundColor: C.accentSoft}]}>
                                <Ionicons name="person-outline" size={20} color={C.accent}/>
                            </View>
                            <View>
                                <Text style={st.stepTitle}>Personal Information</Text>
                                <Text style={st.stepSub}>Tell us about yourself</Text>
                            </View>
                        </View>

                        <SelectField
                            label="Title" value={formData.title} placeholder="Select your title"
                            onSelect={v => {
                                setFormData({...formData, title: v});
                                setErrors(p => ({...p, title: ''}));
                            }}
                            editable={!loading} options={TITLES} error={errors.title}
                            icon="person-circle-outline"
                        />
                        <Field
                            label="First Name *" placeholder="Enter your first name"
                            value={formData.firstName} editable={!loading}
                            onChangeText={t => setFormData({...formData, firstName: t})}
                            onBlur={() => setErrors(p => ({
                                ...p,
                                firstName: !formData.firstName ? 'First name is required' : ''
                            }))}
                            error={errors.firstName} icon="text-outline"
                        />
                        <Field
                            label="Last Name *" placeholder="Enter your last name"
                            value={formData.lastName} editable={!loading}
                            onChangeText={t => setFormData({...formData, lastName: t})}
                            onBlur={() => setErrors(p => ({
                                ...p,
                                lastName: !formData.lastName ? 'Last name is required' : ''
                            }))}
                            error={errors.lastName} icon="text-outline"
                        />
                        <Field
                            label="Email Address *" placeholder="Enter your email"
                            keyboardType="email-address" autoCapitalize="none"
                            value={formData.email} editable={!loading}
                            onChangeText={t => setFormData({...formData, email: t})}
                            onBlur={() => {
                                if (!formData.email) setErrors(p => ({...p, email: 'Email is required'}));
                                else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) setErrors(p => ({
                                    ...p,
                                    email: 'Please enter a valid email address'
                                }));
                                else setErrors(p => ({...p, email: ''}));
                            }}
                            error={errors.email} icon="mail-outline"
                        />
                        <Field
                            label="Phone Number (Optional)" placeholder={`${COUNTRY_CODE} 00 000 0000`}
                            keyboardType="phone-pad" value={formData.phoneNumber} editable={!loading}
                            onChangeText={handlePhoneNumberChange}
                            onBlur={() => {
                                if (formData.phoneNumber) {
                                    const clean = formData.phoneNumber.replace(COUNTRY_CODE, '').replace(/\D/g, '');
                                    if (!/^[0-9]{9}$/.test(clean)) setErrors(p => ({
                                        ...p,
                                        phoneNumber: 'Please enter a valid South African phone number (9 digits after +27)'
                                    }));
                                    else setErrors(p => ({...p, phoneNumber: ''}));
                                }
                            }}
                            error={errors.phoneNumber} icon="call-outline"
                        />
                    </View>
                );

            case 2:
                return (
                    <View>
                        <View style={st.stepIntro}>
                            <View style={[st.stepIco, {backgroundColor: C.amberSoft}]}>
                                <Ionicons name="briefcase-outline" size={20} color={C.amber}/>
                            </View>
                            <View>
                                <Text style={st.stepTitle}>Employment Information</Text>
                                <Text style={st.stepSub}>Your work details</Text>
                            </View>
                        </View>

                        <SelectField
                            label="Region *" value={formData.region} placeholder="Select your region"
                            onSelect={v => {
                                setFormData({...formData, region: v});
                                setErrors(p => ({...p, region: ''}));
                            }}
                            editable={!loading} options={SOUTH_AFRICAN_REGIONS} error={errors.region}
                            icon="location-outline"
                        />
                        <Field
                            label="Personal ID Number *" placeholder="Enter 13-digit ID number"
                            keyboardType="numeric" value={formData.persalId} editable={!loading}
                            onChangeText={t => {
                                const digits = t.replace(/\D/g, '').slice(0, 13);
                                setFormData({...formData, persalId: digits});
                                if (errors.persalId) setErrors(p => ({...p, persalId: ''}));
                            }}
                            onBlur={() => {
                                if (!formData.persalId.trim()) setErrors(p => ({
                                    ...p,
                                    persalId: 'Personal ID is required'
                                }));
                                else if (formData.persalId.length !== 13) setErrors(p => ({
                                    ...p,
                                    persalId: 'ID number must be exactly 13 digits'
                                }));
                                else setErrors(p => ({
                                        ...p,
                                        persalId: validateSouthAfricanID(formData.persalId) || ''
                                    }));
                            }}
                            error={errors.persalId} icon="card-outline"
                        />
                        <Field
                            label="Department ID *" placeholder="Enter your department ID"
                            value={formData.departmentId} editable={!loading}
                            onChangeText={t => setFormData({...formData, departmentId: t})}
                            onBlur={() => setErrors(p => ({
                                ...p,
                                departmentId: !formData.departmentId ? 'Department ID is required' : ''
                            }))}
                            error={errors.departmentId} icon="business-outline"
                        />

                        {/* User type toggle */}
                        <View style={{marginBottom: 16}}>
                            <Text style={f.label}>USER TYPE *</Text>
                            <View style={st.typeRow}>
                                {(['Advocate', 'Magistrate'] as const).map(type => {
                                    const active = formData.userType === type;
                                    return (
                                        <Pressable
                                            key={type}
                                            style={({pressed}) => [
                                                st.typeBtn,
                                                active && st.typeBtnActive,
                                                loading && {opacity: 0.5},
                                                pressed && {opacity: 0.85},
                                            ]}
                                            onPress={() => setFormData({...formData, userType: type})}
                                            disabled={loading}
                                        >
                                            <Ionicons
                                                name={type === 'Advocate' ? 'person-outline' : 'briefcase-outline'}
                                                size={16}
                                                color={active ? '#fff' : C.muted}
                                                style={{marginRight: 6}}
                                            />
                                            <Text style={[st.typeBtnText, active && st.typeBtnTextActive]}>{type}</Text>
                                        </Pressable>
                                    );
                                })}
                            </View>
                        </View>
                    </View>
                );

            case 3:
                return (
                    <View>
                        <View style={st.stepIntro}>
                            <View style={[st.stepIco, {backgroundColor: '#EDE9FE'}]}>
                                <Ionicons name="lock-closed-outline" size={20} color="#7C3AED"/>
                            </View>
                            <View>
                                <Text style={st.stepTitle}>Account Security</Text>
                                <Text style={st.stepSub}>Create your login credentials</Text>
                            </View>
                        </View>

                        <PasswordField
                            label="Password *" value={formData.password}
                            onChangeText={t => setFormData({...formData, password: t})}
                            error={errors.password} showPassword={showPassword}
                            onToggleVisibility={() => setShowPassword(!showPassword)}
                            onBlur={() => {
                                if (!formData.password) setErrors(p => ({...p, password: 'Password is required'}));
                                else if (formData.password.length < 8) setErrors(p => ({
                                    ...p,
                                    password: 'Password must be at least 8 characters'
                                }));
                                else setErrors(p => ({...p, password: ''}));
                            }}
                            editable={!loading}
                        />
                        <PasswordField
                            label="Confirm Password *" value={formData.confirmPassword}
                            onChangeText={t => setFormData({...formData, confirmPassword: t})}
                            error={errors.confirmPassword} showPassword={showConfirmPassword}
                            onToggleVisibility={() => setShowConfirmPassword(!showConfirmPassword)}
                            onBlur={() => {
                                if (!formData.confirmPassword) setErrors(p => ({
                                    ...p,
                                    confirmPassword: 'Please confirm your password'
                                }));
                                else if (formData.confirmPassword !== formData.password) setErrors(p => ({
                                    ...p,
                                    confirmPassword: 'Passwords do not match'
                                }));
                                else setErrors(p => ({...p, confirmPassword: ''}));
                            }}
                            editable={!loading}
                        />

                        {/* Password requirements card */}
                        <View style={st.reqCard}>
                            <Text style={st.reqTitle}>Password Requirements</Text>
                            <View style={st.reqRow}>
                                <Ionicons
                                    name={formData.password.length >= 8 ? 'checkmark-circle' : 'ellipse-outline'}
                                    size={16}
                                    color={formData.password.length >= 8 ? C.green : C.mutedLight}
                                />
                                <Text style={[st.reqText, formData.password.length >= 8 && st.reqTextMet]}>
                                    At least 8 characters long
                                </Text>
                            </View>
                            <View style={st.reqRow}>
                                <Ionicons
                                    name={formData.password === formData.confirmPassword && formData.confirmPassword.length > 0 ? 'checkmark-circle' : 'ellipse-outline'}
                                    size={16}
                                    color={formData.password === formData.confirmPassword && formData.confirmPassword.length > 0 ? C.green : C.mutedLight}
                                />
                                <Text
                                    style={[st.reqText, formData.password === formData.confirmPassword && formData.confirmPassword.length > 0 && st.reqTextMet]}>
                                    Passwords match
                                </Text>
                            </View>
                        </View>
                    </View>
                );

            case 4:
                return (
                    <View>
                        <View style={st.stepIntro}>
                            <View style={[st.stepIco, {backgroundColor: C.greenSoft}]}>
                                <Ionicons name="document-text-outline" size={20} color={C.green}/>
                            </View>
                            <View>
                                <Text style={st.stepTitle}>Terms & Conditions</Text>
                                <Text style={st.stepSub}>Please review and accept before submitting</Text>
                            </View>
                        </View>

                        {/* Scrollable terms box */}
                        <View style={st.termsBox}>
                            <ScrollView style={st.termsScroll} showsVerticalScrollIndicator>
                                {[
                                    {
                                        bold: 'Account Creation:',
                                        text: 'By registering, you confirm that all information provided is accurate and verifiable.'
                                    },
                                    {
                                        bold: 'Eligibility:',
                                        text: 'You must maintain active employment with the Department of Justice and Constitutional Development.'
                                    },
                                    {
                                        bold: 'Verification:',
                                        text: 'Your registration is subject to verification against departmental records.'
                                    },
                                    {
                                        bold: 'Data Privacy:',
                                        text: 'Your personal information will be used solely for account verification and device allocation purposes.'
                                    },
                                    {
                                        bold: 'Communications:',
                                        text: 'You agree to receive email and SMS notifications regarding your account status and device requests.'
                                    },
                                    {
                                        bold: 'Account Security:',
                                        text: 'You are responsible for maintaining the confidentiality of your login credentials.'
                                    },
                                    {
                                        bold: 'Device Usage:',
                                        text: 'Approved devices must be used for official departmental work only.'
                                    },
                                ].map((t, i) => (
                                    <View key={i} style={st.termItem}>
                                        <View style={st.termDot}/>
                                        <Text style={st.termText}>
                                            <Text style={st.termBold}>{t.bold} </Text>
                                            {t.text}
                                        </Text>
                                    </View>
                                ))}
                            </ScrollView>
                        </View>

                        {/* Accept notice */}
                        <View style={st.acceptBanner}>
                            <Ionicons name="shield-checkmark-outline" size={18} color={C.green}/>
                            <Text style={st.acceptText}>
                                By creating your account, you agree to all the terms and conditions listed above.
                            </Text>
                        </View>
                    </View>
                );

            default:
                return null;
        }
    };

    // ── Render ────────────────────────────────────────────────────────────────
    return (
        <SafeAreaView style={{flex: 1, backgroundColor: C.navy}}>
            <KeyboardAvoidingView
                style={{flex: 1}}
                behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
                keyboardVerticalOffset={Platform.OS === 'ios' ? 10 : 0}
            >
                {/* ── Navy header ─────────────────────────────────────── */}
                <View style={hd.wrap}>
                    <View style={hd.ring}/>

                    <Pressable style={hd.backBtn} onPress={() => navigation.goBack()}>
                        <Ionicons name="arrow-back" size={22} color="rgba(255,255,255,0.9)"/>
                    </Pressable>

                    <View style={hd.titleRow}>
                        <View style={hd.emblem}><Text style={{fontSize: 26}}>⚖️</Text></View>
                        <View>
                            <Text style={hd.title}>Client Registration</Text>
                            <Text style={hd.sub}>Create your account to request devices</Text>
                        </View>
                    </View>

                    <StepBar current={currentStep} total={totalSteps}/>
                </View>

                {/* ── Scrollable form ─────────────────────────────────── */}
                <ScrollView
                    style={{flex: 1, backgroundColor: C.bg}}
                    contentContainerStyle={{padding: 20, paddingBottom: 32}}
                    showsVerticalScrollIndicator={false}
                    keyboardShouldPersistTaps="handled"
                    automaticallyAdjustKeyboardInsets
                >
                    <View style={st.formCard}>
                        {renderStep()}
                    </View>

                    {/* ── Navigation buttons ─────────────────────────── */}
                    <View style={nb.row}>
                        {currentStep > 1 && (
                            <Pressable
                                style={({pressed}) => [nb.back, pressed && {opacity: 0.8}, loading && {opacity: 0.5}]}
                                onPress={handlePrevStep}
                                disabled={loading}
                            >
                                <Ionicons name="arrow-back" size={18} color={C.navy}/>
                                <Text style={nb.backText}>Back</Text>
                            </Pressable>
                        )}

                        {currentStep < totalSteps ? (
                            <Pressable
                                style={({pressed}) => [nb.next, currentStep === 1 && nb.nextFull, pressed && {
                                    opacity: 0.88,
                                    transform: [{scale: 0.99}]
                                }, loading && {opacity: 0.5}]}
                                onPress={handleNextStep}
                                disabled={loading}
                            >
                                <Text style={nb.nextText}>Continue</Text>
                                <Ionicons name="arrow-forward" size={18} color="#fff"/>
                            </Pressable>
                        ) : (
                            <Pressable
                                style={({pressed}) => [nb.submit, loading && nb.submitLoading, pressed && {opacity: 0.88}]}
                                onPress={handleRegister}
                                disabled={loading}
                            >
                                {loading
                                    ? <><ActivityIndicator color="#fff" size="small"/><Text style={nb.submitText}>Creating
                                        Account…</Text></>
                                    : <><Ionicons name="checkmark-circle-outline" size={20} color="#fff"/><Text
                                        style={nb.submitText}>Create Account</Text></>
                                }
                            </Pressable>
                        )}
                    </View>

                    {/* Already have an account */}
                    <Pressable
                        style={({pressed}) => [nb.loginLink, pressed && {opacity: 0.7}]}
                        onPress={() => navigation.navigate('Login')}
                        disabled={loading}
                    >
                        <Text style={nb.loginText}>
                            Already have an account?{'  '}
                            <Text style={nb.loginBold}>Sign In</Text>
                        </Text>
                    </Pressable>
                </ScrollView>
            </KeyboardAvoidingView>
        </SafeAreaView>
    );
}

// ─── StyleSheets ──────────────────────────────────────────────────────────────

// Header
const hd = StyleSheet.create({
    wrap: {backgroundColor: C.navy, paddingTop: 12, paddingBottom: 20, paddingHorizontal: 20, overflow: 'hidden'},
    ring: {
        position: 'absolute',
        width: 240,
        height: 240,
        borderRadius: 120,
        borderWidth: 1,
        borderColor: 'rgba(255,255,255,0.05)',
        top: -80,
        right: -60
    },
    backBtn: {
        width: 40,
        height: 40,
        borderRadius: 12,
        backgroundColor: 'rgba(255,255,255,0.1)',
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: 16
    },
    titleRow: {flexDirection: 'row', alignItems: 'center', gap: 14, marginBottom: 20},
    emblem: {
        width: 52,
        height: 52,
        borderRadius: 14,
        backgroundColor: 'rgba(255,255,255,0.1)',
        borderWidth: 1,
        borderColor: 'rgba(255,255,255,0.15)',
        justifyContent: 'center',
        alignItems: 'center'
    },
    title: {fontSize: 20, fontWeight: '800', color: '#fff', marginBottom: 3},
    sub: {fontSize: 12, color: 'rgba(255,255,255,0.5)'},
});

// Step content
const st = StyleSheet.create({
    formCard: {
        backgroundColor: C.surface,
        borderRadius: 20,
        padding: 20,
        marginBottom: 16,
        borderWidth: 1,
        borderColor: C.border,
        shadowColor: C.navy,
        shadowOffset: {width: 0, height: 3},
        shadowOpacity: 0.06,
        shadowRadius: 10,
        elevation: 3
    },
    stepIntro: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 14,
        marginBottom: 24,
        paddingBottom: 20,
        borderBottomWidth: 1,
        borderBottomColor: C.border
    },
    stepIco: {width: 42, height: 42, borderRadius: 12, justifyContent: 'center', alignItems: 'center'},
    stepTitle: {fontSize: 18, fontWeight: '800', color: C.text, marginBottom: 2},
    stepSub: {fontSize: 12, color: C.muted},
    typeRow: {flexDirection: 'row', gap: 10},
    typeBtn: {
        flex: 1,
        flexDirection: 'row',
        justifyContent: 'center',
        alignItems: 'center',
        paddingVertical: 13,
        borderRadius: 14,
        borderWidth: 1.5,
        borderColor: C.border,
        backgroundColor: C.bg
    },
    typeBtnActive: {backgroundColor: C.navy, borderColor: C.navy},
    typeBtnText: {fontSize: 15, fontWeight: '600', color: C.muted},
    typeBtnTextActive: {color: '#fff'},
    reqCard: {
        backgroundColor: C.bg,
        borderRadius: 14,
        padding: 16,
        borderWidth: 1,
        borderColor: C.border,
        marginTop: 4,
        gap: 10
    },
    reqTitle: {fontSize: 13, fontWeight: '700', color: C.text, marginBottom: 4},
    reqRow: {flexDirection: 'row', alignItems: 'center', gap: 10},
    reqText: {fontSize: 13, color: C.mutedLight},
    reqTextMet: {color: C.green, fontWeight: '600'},
    termsBox: {borderRadius: 14, borderWidth: 1, borderColor: C.border, overflow: 'hidden', marginBottom: 14},
    termsScroll: {maxHeight: 240, padding: 16, backgroundColor: C.bg},
    termItem: {flexDirection: 'row', alignItems: 'flex-start', marginBottom: 14, gap: 10},
    termDot: {width: 6, height: 6, borderRadius: 3, backgroundColor: C.accent, marginTop: 6, flexShrink: 0},
    termText: {flex: 1, fontSize: 12, color: C.muted, lineHeight: 18},
    termBold: {fontWeight: '700', color: C.text},
    acceptBanner: {
        flexDirection: 'row',
        alignItems: 'flex-start',
        gap: 10,
        backgroundColor: C.greenSoft,
        borderRadius: 14,
        padding: 14,
        borderWidth: 1,
        borderColor: C.green + '50'
    },
    acceptText: {flex: 1, fontSize: 13, color: '#065F46', lineHeight: 19, fontWeight: '500'},
});

// Navigation buttons
const nb = StyleSheet.create({
    row: {flexDirection: 'row', gap: 12, marginBottom: 16},
    back: {
        flex: 1,
        flexDirection: 'row',
        justifyContent: 'center',
        alignItems: 'center',
        gap: 8,
        paddingVertical: 15,
        borderRadius: 16,
        borderWidth: 1.5,
        borderColor: C.navy,
        backgroundColor: C.surface
    },
    backText: {color: C.navy, fontSize: 15, fontWeight: '700'},
    next: {
        flex: 2,
        flexDirection: 'row',
        justifyContent: 'center',
        alignItems: 'center',
        gap: 8,
        backgroundColor: C.navy,
        paddingVertical: 16,
        borderRadius: 16,
        shadowColor: C.navy,
        shadowOffset: {width: 0, height: 5},
        shadowOpacity: 0.25,
        shadowRadius: 10,
        elevation: 7
    },
    nextFull: {flex: 1},
    nextText: {color: '#fff', fontSize: 16, fontWeight: '700'},
    submit: {
        flex: 1,
        flexDirection: 'row',
        justifyContent: 'center',
        alignItems: 'center',
        gap: 10,
        backgroundColor: C.green,
        paddingVertical: 16,
        borderRadius: 16,
        shadowColor: C.green,
        shadowOffset: {width: 0, height: 5},
        shadowOpacity: 0.25,
        shadowRadius: 10,
        elevation: 7
    },
    submitLoading: {backgroundColor: C.disabled, shadowOpacity: 0},
    submitText: {color: '#fff', fontSize: 16, fontWeight: '700'},
    loginLink: {alignItems: 'center', paddingVertical: 8},
    loginText: {fontSize: 14, color: C.muted},
    loginBold: {color: C.accent, fontWeight: '700'},
});