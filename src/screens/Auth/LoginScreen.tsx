import React, {useState} from 'react';
import {
    View, Text, StyleSheet, Pressable, ScrollView,
    TextInput, ActivityIndicator, KeyboardAvoidingView, Platform
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import {StackNavigationProp} from '@react-navigation/stack';
import {RootStackParamList} from '../../navigation/AppNavigator';
import {authAPI} from '../../services/api';
import {useToast} from '../../components/ToastProvider';
import {Ionicons} from '@expo/vector-icons';

const C = {
    navy: '#0F1F3D', navyLight: '#1E3A5F', accent: '#1E4FD8',
    accentSoft: '#EBF0FF', surface: '#FFFFFF', bg: '#F4F6FA',
    border: '#E2E8F2', text: '#0F1F3D', muted: '#64748B',
    error: '#DC2626', errorSoft: '#FEF2F2', success: '#059669',
};

type LoginScreenNavigationProp = StackNavigationProp<RootStackParamList, 'Login'>;
type Props = { navigation: LoginScreenNavigationProp };

export default function LoginScreen({navigation}: Props) {
    const toast = useToast();
    const [formData, setFormData] = useState({email: '', password: '', rememberMe: false});
    const [loading, setLoading] = useState(false);
    const [showPassword, setShowPassword] = useState(false);
    const [errors, setErrors] = useState({email: '', password: ''});
    const [focused, setFocused] = useState<string | null>(null);

    const validate = () => {
        const e = {email: '', password: ''};
        let ok = true;
        if (!formData.email.trim()) {
            e.email = 'Email is required';
            ok = false;
        } else if (!/\S+@\S+\.\S+/.test(formData.email)) {
            e.email = 'Enter a valid email address';
            ok = false;
        }
        if (!formData.password) {
            e.password = 'Password is required';
            ok = false;
        } else if (formData.password.length < 6) {
            e.password = 'At least 6 characters required';
            ok = false;
        }
        setErrors(e);
        return ok;
    };

    const handleLogin = async () => {
        if (!validate()) {
            toast.warning('Please fix the errors before continuing');
            return;
        }
        setLoading(true);
        setErrors({email: '', password: ''});
        try {
            console.log('🔵 [LOGIN] Attempting login for:', formData.email);

            const response = await authAPI.login({email: formData.email, password: formData.password});

            // Backend shape: { success, message, data: { user: {...} }, timestamp }
            // authAPI.login() returns the full Axios response — actual body is at response.data
            const body = response;

            if (!body.success) {
                toast.error('Login Failed', body.message);
                return;
            }

            const user = body.data?.user;

            console.log('✅ [LOGIN] User extracted:', user?.email);

            if (!user) {
                throw new Error('No user data received from server');
            }

            await AsyncStorage.setItem('user', JSON.stringify(user));

            if (formData.rememberMe) {
                await AsyncStorage.setItem('rememberedEmail', formData.email);
            } else {
                await AsyncStorage.removeItem('rememberedEmail');
            }

            toast.success('Welcome back!', body.message || 'Login successful');

            setTimeout(() => {
                const userType = user.user_type || null;
                if (userType === 'client') {
                    navigation.reset({index: 0, routes: [{name: 'DOJCDDashboard'}]});
                } else if (userType === 'operational' && user.user_role === 'Admin') {
                    navigation.reset({index: 0, routes: [{name: 'AdminDashboard'}]});
                } else {
                    toast.warning('Access Restricted', "Your role doesn't have mobile access yet.");
                }
            }, 900);

        } catch (error: any) {
            console.log('🔴 [LOGIN] Error caught');
            console.log('    Message:', error.message);
            console.log('    Status:', error.response?.status);
            console.log('    Data:', error.response?.data);

            const status = error.response?.status;
            const message = error.response?.data?.message;

            if (!error.response) {
                toast.error('Connection Error', 'Cannot connect to server. Check your connection.');
            } else if (status === 401) {
                toast.error('Login Failed', message || 'Invalid credentials. Please try again.');
            } else if (status === 404) {
                toast.error('Account Not Found', message || 'No account found with this email.');
            } else {
                toast.error('Login Failed', message || 'Invalid email or password.');
            }
        } finally {
            setLoading(false);
        }
    };

    return (
        <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
                              style={{flex: 1, backgroundColor: C.navy}}>
            <ScrollView contentContainerStyle={{flexGrow: 1}} keyboardShouldPersistTaps="handled"
                        showsVerticalScrollIndicator={false}>

                {/* Hero */}
                <View style={s.hero}>
                    <View style={s.ring1}/><View style={s.ring2}/>
                    <View style={s.emblemOuter}>
                        <View style={s.emblem}><Text style={{fontSize: 38}}>⚖️</Text></View>
                    </View>
                    <Text style={s.heroTitle}>DOJCD Connect</Text>
                    <Text style={s.heroSub}>Department of Justice & Constitutional Development</Text>
                    <View style={s.badge}>
                        <View style={s.badgeDot}/>
                        <Text style={s.badgeText}>Secure Portal</Text>
                    </View>
                </View>

                {/* Card */}
                <View style={s.card}>
                    <Text style={s.cardTitle}>Sign In</Text>
                    <Text style={s.cardSub}>Enter your credentials to continue</Text>

                    {/* Email field */}
                    <View style={s.fieldWrap}>
                        <Text style={s.label}>EMAIL ADDRESS</Text>
                        <View style={[s.inputRow, focused === 'email' && s.inputFocused, errors.email ? s.inputError : undefined]}>
                            <Ionicons name="mail-outline" size={18}
                                      color={errors.email ? C.error : focused === 'email' ? C.accent : C.muted}
                                      style={s.icoL}/>
                            <TextInput
                                style={s.input}
                                placeholder="your.email@dojcd.gov.za"
                                placeholderTextColor="#A0ABBE"
                                keyboardType="email-address"
                                autoCapitalize="none"
                                autoCorrect={false}
                                value={formData.email}
                                onFocus={() => setFocused('email')}
                                onBlur={() => setFocused(null)}
                                onChangeText={(t) => {
                                    setFormData({...formData, email: t});
                                    if (errors.email) setErrors({...errors, email: ''});
                                }}
                                editable={!loading}
                            />
                        </View>
                        {errors.email ? <Text style={s.errText}>{errors.email}</Text> : null}
                    </View>

                    {/* Password field */}
                    <View style={s.fieldWrap}>
                        <Text style={s.label}>PASSWORD</Text>
                        <View style={[s.inputRow, focused === 'pass' && s.inputFocused, errors.password ? s.inputError : undefined]}>
                            <Ionicons name="lock-closed-outline" size={18}
                                      color={errors.password ? C.error : focused === 'pass' ? C.accent : C.muted}
                                      style={s.icoL}/>
                            <TextInput
                                style={s.input}
                                placeholder="Enter your password"
                                placeholderTextColor="#A0ABBE"
                                secureTextEntry={!showPassword}
                                value={formData.password}
                                onFocus={() => setFocused('pass')}
                                onBlur={() => setFocused(null)}
                                onChangeText={(t) => {
                                    setFormData({...formData, password: t});
                                    if (errors.password) setErrors({...errors, password: ''});
                                }}
                                editable={!loading}
                            />
                            <Pressable onPress={() => setShowPassword(!showPassword)} style={s.eyeBtn} hitSlop={10}>
                                <Ionicons name={showPassword ? 'eye-off-outline' : 'eye-outline'} size={20}
                                          color={C.muted}/>
                            </Pressable>
                        </View>
                        {errors.password ? <Text style={s.errText}>{errors.password}</Text> : null}
                    </View>

                    {/* Remember / Forgot */}
                    <View style={s.remRow}>
                        <Pressable style={s.remBtn}
                                   onPress={() => setFormData({...formData, rememberMe: !formData.rememberMe})}>
                            <View style={[s.checkBox, formData.rememberMe && s.checkBoxOn]}>
                                {formData.rememberMe && <Ionicons name="checkmark" size={12} color="#fff"/>}
                            </View>
                            <Text style={s.remLabel}>Remember me</Text>
                        </Pressable>
                        <Pressable onPress={() => toast.info('Coming Soon', 'Password reset will be available soon.')}>
                            <Text style={s.forgotText}>Forgot password?</Text>
                        </Pressable>
                    </View>

                    {/* Submit */}
                    <Pressable style={[s.submitBtn, loading && s.submitDisabled]} onPress={handleLogin}
                               disabled={loading}>
                        {loading
                            ? <ActivityIndicator color="#fff" size="small"/>
                            : <><Text style={s.submitText}>Sign In</Text><Ionicons name="arrow-forward" size={18}
                                                                                   color="#fff"
                                                                                   style={{marginLeft: 8}}/></>
                        }
                    </Pressable>

                    {/* Divider */}
                    <View style={s.divider}>
                        <View style={s.divLine}/>
                        <Text style={s.divText}>NEW USER?</Text>
                        <View style={s.divLine}/>
                    </View>

                    {/* Register cards */}
                    <View style={s.regRow}>
                        <Pressable style={[s.regCard, {borderColor: C.accent + '50'}]}
                                   onPress={() => navigation.navigate('ClientRegister')} disabled={loading}>
                            <View style={[s.regIco, {backgroundColor: C.accentSoft}]}>
                                <Ionicons name="person-outline" size={22} color={C.accent}/>
                            </View>
                            <Text style={[s.regTitle, {color: C.accent}]}>Client</Text>
                            <Text style={s.regSub}>Device requests</Text>
                        </Pressable>
                    </View>
                </View>

                {/* Footer */}
                <View style={s.footer}>
                    <Text style={s.footerText}>support@dojcd.gov.za</Text>
                    <Text style={s.footerVersion}>v1.0.0 • Republic of South Africa</Text>
                </View>
            </ScrollView>
        </KeyboardAvoidingView>
    );
}

const s = StyleSheet.create({
    hero: {backgroundColor: C.navy, paddingTop: 60, paddingBottom: 48, alignItems: 'center', overflow: 'hidden'},
    ring1: {
        position: 'absolute', width: 280, height: 280, borderRadius: 140,
        borderWidth: 1, borderColor: 'rgba(255,255,255,0.05)', top: -60, right: -60
    },
    ring2: {
        position: 'absolute', width: 180, height: 180, borderRadius: 90,
        borderWidth: 1, borderColor: 'rgba(255,255,255,0.07)', bottom: 20, left: -50
    },
    emblemOuter: {
        shadowColor: '#C9A84C', shadowOffset: {width: 0, height: 8},
        shadowOpacity: 0.35, shadowRadius: 20, elevation: 16, marginBottom: 20
    },
    emblem: {
        width: 80, height: 80, borderRadius: 24,
        backgroundColor: 'rgba(255,255,255,0.08)',
        borderWidth: 1, borderColor: 'rgba(255,255,255,0.15)',
        justifyContent: 'center', alignItems: 'center'
    },
    heroTitle: {fontSize: 26, fontWeight: '800', color: '#fff', letterSpacing: 1.5, marginBottom: 6},
    heroSub: {
        fontSize: 12, color: 'rgba(255,255,255,0.5)', textAlign: 'center',
        letterSpacing: 0.3, paddingHorizontal: 40, marginBottom: 16
    },
    badge: {
        flexDirection: 'row', alignItems: 'center',
        backgroundColor: 'rgba(255,255,255,0.08)',
        borderWidth: 1, borderColor: 'rgba(255,255,255,0.12)',
        paddingHorizontal: 14, paddingVertical: 6, borderRadius: 20
    },
    badgeDot: {width: 6, height: 6, borderRadius: 3, backgroundColor: '#4ADE80', marginRight: 7},
    badgeText: {fontSize: 11, color: 'rgba(255,255,255,0.7)', fontWeight: '600', letterSpacing: 0.5},

    card: {
        backgroundColor: C.surface, borderTopLeftRadius: 32, borderTopRightRadius: 32,
        paddingHorizontal: 28, paddingTop: 36, paddingBottom: 24, flex: 1
    },
    cardTitle: {fontSize: 26, fontWeight: '800', color: C.text, marginBottom: 4},
    cardSub: {fontSize: 14, color: C.muted, marginBottom: 32},

    fieldWrap: {marginBottom: 20},
    label: {fontSize: 10, fontWeight: '700', color: C.muted, letterSpacing: 1.2, marginBottom: 8},
    inputRow: {
        flexDirection: 'row', alignItems: 'center',
        borderWidth: 1.5, borderColor: C.border, borderRadius: 14, backgroundColor: C.bg
    },
    inputFocused: {borderColor: C.accent, backgroundColor: '#FAFBFF'},
    inputError: {borderColor: C.error, backgroundColor: C.errorSoft},
    icoL: {marginLeft: 14, marginRight: 4},
    input: {flex: 1, paddingVertical: 14, paddingHorizontal: 8, fontSize: 15, color: C.text},
    eyeBtn: {paddingHorizontal: 14},
    errText: {fontSize: 11, color: C.error, marginTop: 5, marginLeft: 4},

    remRow: {flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 28},
    remBtn: {flexDirection: 'row', alignItems: 'center'},
    checkBox: {
        width: 20, height: 20, borderRadius: 6, borderWidth: 1.5, borderColor: C.border,
        justifyContent: 'center', alignItems: 'center', marginRight: 10, backgroundColor: C.bg
    },
    checkBoxOn: {backgroundColor: C.accent, borderColor: C.accent},
    remLabel: {fontSize: 14, color: C.text},
    forgotText: {fontSize: 14, color: C.accent, fontWeight: '600'},

    submitBtn: {
        flexDirection: 'row', justifyContent: 'center', alignItems: 'center',
        backgroundColor: C.navy, borderRadius: 16, paddingVertical: 17,
        shadowColor: C.navy, shadowOffset: {width: 0, height: 6},
        shadowOpacity: 0.28, shadowRadius: 12, elevation: 8, marginBottom: 28
    },
    submitDisabled: {backgroundColor: '#94A3B8', shadowOpacity: 0},
    submitText: {color: '#fff', fontSize: 16, fontWeight: '700', letterSpacing: 0.5},

    divider: {flexDirection: 'row', alignItems: 'center', marginBottom: 20},
    divLine: {flex: 1, height: 1, backgroundColor: C.border},
    divText: {paddingHorizontal: 14, fontSize: 10, color: C.muted, fontWeight: '700', letterSpacing: 1.2},

    regRow: {flexDirection: 'row', gap: 12, marginBottom: 8},
    regCard: {flex: 1, borderWidth: 1.5, borderRadius: 16, padding: 16, alignItems: 'center', backgroundColor: C.bg},
    regIco: {width: 44, height: 44, borderRadius: 12, justifyContent: 'center', alignItems: 'center', marginBottom: 8},
    regTitle: {fontSize: 15, fontWeight: '700', marginBottom: 2},
    regSub: {fontSize: 11, color: C.muted, textAlign: 'center'},

    footer: {
        backgroundColor: C.surface, paddingVertical: 20, alignItems: 'center',
        borderTopWidth: 1, borderTopColor: C.border
    },
    footerText: {fontSize: 12, color: C.muted, marginBottom: 4},
    footerVersion: {fontSize: 10, color: '#B0BCCF', letterSpacing: 0.5},
});