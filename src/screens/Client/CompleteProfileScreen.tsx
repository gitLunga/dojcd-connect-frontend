import React, {useState} from 'react';
import {
    View, Text, StyleSheet, TouchableOpacity, ScrollView,
    Modal, FlatList, ActivityIndicator, Alert,
} from 'react-native';
import * as DocumentPicker from 'expo-document-picker';
import * as ImagePicker from 'expo-image-picker';
import AsyncStorage from '@react-native-async-storage/async-storage';
import {authAPI} from '../../services/api';
import {CompleteProfileData} from '../../types/types';
import DateTimePicker from '@react-native-community/datetimepicker';
import {Ionicons} from '@expo/vector-icons';
import {useToast} from '../../components/ToastProvider';

const C = {
    navy: '#0F1F3D', accent: '#1E4FD8', accentSoft: '#EBF0FF',
    surface: '#FFFFFF', bg: '#F4F6FA', border: '#E2E8F2',
    text: '#0F1F3D', muted: '#64748B', mutedLight: '#94A3B8',
    green: '#059669', greenSoft: '#D1FAE5',
    amber: '#D97706', amberSoft: '#FEF3C7',
    rose: '#DC2626', roseSoft: '#FEE2E2',
};

const PROVIDERS = [
    {value: 'MTN', label: 'MTN'}, {value: 'Vodacom', label: 'Vodacom'},
    {value: 'Cell_C', label: 'Cell C'}, {value: 'Telkom', label: 'Telkom'}, {value: 'Rain', label: 'Rain'},
];

const DURATIONS = [
    {value: '12', label: '12 Months'}, {value: '24', label: '24 Months'}, {value: '36', label: '36 Months'},
];

const DOCS = [
    {
        id: 'invoice',
        key: 'invoice_file',
        title: 'Service Invoice',
        subtitle: 'Current mobile service invoice',
        icon: 'receipt-outline',
        required: true
    },
    {
        id: 'id',
        key: 'id_document',
        title: 'ID Document',
        subtitle: 'Clear copy of ID or Passport',
        icon: 'card-outline',
        required: true
    },
    {
        id: 'payslip',
        key: 'payslip_document',
        title: 'Latest Payslip',
        subtitle: 'Most recent payslip',
        icon: 'cash-outline',
        required: true
    },
    {
        id: 'residence',
        key: 'residence_document',
        title: 'Proof of Residence',
        subtitle: 'Utility bill or bank statement',
        icon: 'home-outline',
        required: false
    },
];

function SelectField({label, value, placeholder, options, onSelect, disabled}: any) {
    const [open, setOpen] = useState(false);
    const found = options.find((o: any) => o.value === value);
    return (
        <>
            <View style={sf.wrap}>
                <Text style={sf.label}>{label}</Text>
                <TouchableOpacity
                    style={[sf.btn, disabled && sf.disabled]}
                    onPress={() => !disabled && setOpen(true)}
                >
                    <Text style={[sf.btnText, !value && sf.placeholder]}>{found ? found.label : placeholder}</Text>
                    <Ionicons name="chevron-down" size={16} color={C.muted}/>
                </TouchableOpacity>
            </View>
            <Modal visible={open} transparent animationType="slide" onRequestClose={() => setOpen(false)}>
                <View style={sf.overlay}>
                    <View style={sf.sheet}>
                        <View style={sf.sheetHandle}/>
                        <View style={sf.sheetHeader}>
                            <Text style={sf.sheetTitle}>Select {label}</Text>
                            <TouchableOpacity onPress={() => setOpen(false)}>
                                <Ionicons name="close" size={22} color={C.muted}/>
                            </TouchableOpacity>
                        </View>
                        <FlatList
                            data={options}
                            keyExtractor={(i: any) => i.value}
                            renderItem={({item}: any) => (
                                <TouchableOpacity
                                    style={sf.option}
                                    onPress={() => {
                                        onSelect(item.value);
                                        setOpen(false);
                                    }}
                                >
                                    <Text
                                        style={[sf.optionText, value === item.value && sf.optionTextActive]}>{item.label}</Text>
                                    {value === item.value && <Ionicons name="checkmark" size={18} color={C.accent}/>}
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
}

const sf = StyleSheet.create({
    wrap: {marginBottom: 16},
    label: {fontSize: 10, fontWeight: '700', color: C.muted, letterSpacing: 1.1, marginBottom: 8},
    btn: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        backgroundColor: C.bg,
        borderWidth: 1.5,
        borderColor: C.border,
        borderRadius: 14,
        paddingHorizontal: 14,
        paddingVertical: 14
    },
    disabled: {opacity: 0.5},
    btnText: {fontSize: 15, color: C.text, flex: 1},
    placeholder: {color: C.mutedLight},
    overlay: {flex: 1, backgroundColor: 'rgba(15,31,61,0.5)', justifyContent: 'flex-end'},
    sheet: {backgroundColor: C.surface, borderTopLeftRadius: 24, borderTopRightRadius: 24, maxHeight: '55%'},
    sheetHandle: {width: 36, height: 4, backgroundColor: C.border, borderRadius: 2, alignSelf: 'center', marginTop: 12},
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
    optionTextActive: {color: C.accent, fontWeight: '700'},
});

export default function CompleteProfileScreen({navigation}: any) {
    const toast = useToast();

    const [network, setNetwork] = useState('');
    const [duration, setDuration] = useState('');
    const [endDate, setEndDate] = useState<Date>(new Date(Date.now() + 365 * 24 * 60 * 60 * 1000));
    const [showDatePicker, setShowDatePicker] = useState(false);
    const [loading, setLoading] = useState(false);
    const [docs, setDocs] = useState<Record<string, any>>({
        invoice_file: null, id_document: null, payslip_document: null, residence_document: null,
    });

    const pickDoc = (key: string) => {
        Alert.alert('Upload Document', 'Choose upload method:', [
            {text: 'Take Photo', onPress: () => takePhoto(key)},
            {text: 'Choose from Gallery', onPress: () => pickImage(key)},
            {text: 'Choose File (PDF)', onPress: () => pickPDF(key)},
            {text: 'Cancel', style: 'cancel'},
        ]);
    };

    const takePhoto = async (key: string) => {
        const {status} = await ImagePicker.requestCameraPermissionsAsync();
        if (status !== 'granted') {
            toast.warning('Permission Required', 'Camera permission is needed.');
            return;
        }
        const r = await ImagePicker.launchCameraAsync({
            mediaTypes: ImagePicker.MediaTypeOptions.Images,
            allowsEditing: true,
            quality: 0.8
        });
        if (!r.canceled && r.assets[0]) {
            setDocs(p => ({
                ...p,
                [key]: {uri: r.assets[0].uri, name: `${key}_${Date.now()}.jpg`, type: 'image/jpeg', size: 0}
            }));
            toast.success('Photo captured');
        }
    };

    const pickImage = async (key: string) => {
        const r = await ImagePicker.launchImageLibraryAsync({
            mediaTypes: ImagePicker.MediaTypeOptions.Images,
            allowsEditing: true,
            quality: 0.8
        });
        if (!r.canceled && r.assets[0]) {
            setDocs(p => ({
                ...p,
                [key]: {
                    uri: r.assets[0].uri,
                    name: `${key}_${Date.now()}.jpg`,
                    type: r.assets[0].mimeType || 'image/jpeg',
                    size: 0
                }
            }));
            toast.success('Image selected');
        }
    };

    const pickPDF = async (key: string) => {
        const r = await DocumentPicker.getDocumentAsync({
            type: ['application/pdf', 'application/msword'],
            copyToCacheDirectory: true
        });
        if (r.assets?.[0]) {
            const a = r.assets[0];
            setDocs(p => ({
                ...p,
                [key]: {uri: a.uri, name: a.name, type: a.mimeType || 'application/pdf', size: a.size || 0}
            }));
            toast.success('Document selected');
        }
    };

    const validate = () => {
        if (!network) {
            toast.warning('Missing Field', 'Please select a network provider.');
            return false;
        }
        if (!duration) {
            toast.warning('Missing Field', 'Please select a contract duration.');
            return false;
        }
        for (const doc of DOCS.filter(d => d.required)) {
            if (!docs[doc.key]) {
                toast.warning('Missing Document', `${doc.title} is required.`);
                return false;
            }
        }
        return true;
    };

    const submit = async () => {
        if (!validate()) return;
        setLoading(true);
        try {
            const ud = await AsyncStorage.getItem('user');
            if (!ud) {
                toast.error('Session Expired', 'Please login again.');
                navigation.goBack();
                return;
            }
            const user = JSON.parse(ud);
            const data: CompleteProfileData = {
                network_provider: network,
                contract_duration_months: Number(duration),
                contract_end_date: endDate.toISOString().split('T')[0],
                invoice_file: docs.invoice_file,
                id_document: docs.id_document,
                payslip_document: docs.payslip_document,
                residence_document: docs.residence_document,
            };
            const result = await authAPI.completeProfile(user.client_user_id, data);
            if (result.success) {
                await AsyncStorage.setItem('user', JSON.stringify({
                    ...user, ...result.data?.user,
                    registration_status: 'Profile_Completed'
                }));
                toast.success('Profile Completed!', result.message || 'You can now browse available devices.');
                setTimeout(() => navigation.goBack(), 1500);
            } else {
                toast.error('Failed', result.message || 'Profile completion failed.');
            }
        } catch (error: any) {
            const s = error.response?.status;
            const m = error.response?.data?.message;
            if (!error.response) toast.error('Connection Error', 'Cannot connect to server.');
            else if (s === 409) toast.warning('Already Submitted', m || 'Profile has already been submitted.');
            else if (s === 422) toast.error('Invalid Data', m || 'Please check your documents and try again.');
            else toast.error('Failed', m || error.message || 'Profile completion failed.');
        } finally {
            setLoading(false);
        }
    };

    const requiredDone = DOCS.filter(d => d.required).every(d => !!docs[d.key]);
    const totalDone = DOCS.filter(d => !!docs[d.key]).length;

    return (
        <View style={s.root}>
            {/* Header */}
            <View style={s.header}>
                <View style={s.headerRing}/>
                <TouchableOpacity style={s.backBtn} onPress={() => navigation.goBack()}>
                    <Ionicons name="arrow-back" size={22} color="rgba(255,255,255,0.9)"/>
                </TouchableOpacity>
                <View style={s.headerContent}>
                    <View style={s.headerIcon}><Ionicons name="person-add-outline" size={26} color="#fff"/></View>
                    <Text style={s.headerTitle}>Complete Profile</Text>
                    <Text style={s.headerSub}>Upload your documents to unlock device applications</Text>
                </View>
                {/* Progress */}
                <View style={s.progressRow}>
                    <View style={s.progressItem}>
                        <Ionicons name={network ? 'checkmark-circle' : 'ellipse-outline'} size={16}
                                  color={network ? '#4ADE80' : 'rgba(255,255,255,0.4)'}/>
                        <Text style={s.progressLabel}>Network</Text>
                    </View>
                    <View style={s.progressLine}/>
                    <View style={s.progressItem}>
                        <Ionicons name={duration ? 'checkmark-circle' : 'ellipse-outline'} size={16}
                                  color={duration ? '#4ADE80' : 'rgba(255,255,255,0.4)'}/>
                        <Text style={s.progressLabel}>Contract</Text>
                    </View>
                    <View style={s.progressLine}/>
                    <View style={s.progressItem}>
                        <Ionicons name={requiredDone ? 'checkmark-circle' : 'ellipse-outline'} size={16}
                                  color={requiredDone ? '#4ADE80' : 'rgba(255,255,255,0.4)'}/>
                        <Text style={s.progressLabel}>Documents</Text>
                    </View>
                </View>
            </View>

            <ScrollView style={s.scroll} showsVerticalScrollIndicator={false} contentContainerStyle={s.scrollContent}>

                {/* Contract details card */}
                <View style={s.card}>
                    <View style={s.cardTitleRow}>
                        <View style={s.cardTitleIcon}><Ionicons name="phone-portrait-outline" size={18}
                                                                color={C.accent}/></View>
                        <Text style={s.cardTitle}>Contract Details</Text>
                    </View>

                    <SelectField label="NETWORK PROVIDER" value={network} placeholder="Select your provider"
                                 options={PROVIDERS} onSelect={setNetwork} disabled={loading}/>
                    <SelectField label="CONTRACT DURATION" value={duration} placeholder="Select contract length"
                                 options={DURATIONS} onSelect={setDuration} disabled={loading}/>

                    <View style={{marginBottom: 8}}>
                        <Text style={sf.label}>CONTRACT END DATE</Text>
                        <TouchableOpacity style={sf.btn} onPress={() => setShowDatePicker(true)}>
                            <Text style={sf.btnText}>{endDate.toLocaleDateString('en-ZA', {
                                day: 'numeric',
                                month: 'long',
                                year: 'numeric'
                            })}</Text>
                            <Ionicons name="calendar-outline" size={16} color={C.muted}/>
                        </TouchableOpacity>
                        {showDatePicker && (
                            <DateTimePicker value={endDate} mode="date" display="default" onChange={(e, d) => {
                                setShowDatePicker(false);
                                if (d) setEndDate(d);
                            }} minimumDate={new Date()}/>
                        )}
                    </View>
                </View>

                {/* Documents card */}
                <View style={s.card}>
                    <View style={s.cardTitleRow}>
                        <View style={s.cardTitleIcon}><Ionicons name="documents-outline" size={18}
                                                                color={C.accent}/></View>
                        <Text style={s.cardTitle}>Required Documents</Text>
                        <View style={s.docCountPill}>
                            <Text style={s.docCountText}>{totalDone}/{DOCS.length}</Text>
                        </View>
                    </View>
                    <Text style={s.cardSub}>Supported formats: PDF, JPG, PNG (max 10MB each)</Text>

                    {DOCS.map(doc => {
                        const file = docs[doc.key];
                        return (
                            <View key={doc.id} style={[s.docRow, file && s.docRowDone]}>
                                <View
                                    style={[s.docIcon, file ? {backgroundColor: C.greenSoft} : {backgroundColor: C.bg}]}>
                                    <Ionicons name={doc.icon as any} size={20} color={file ? C.green : C.muted}/>
                                </View>
                                <View style={s.docInfo}>
                                    <View style={s.docTitleRow}>
                                        <Text style={s.docTitle}>{doc.title}</Text>
                                        {doc.required && !file && <Text style={s.reqBadge}>Required</Text>}
                                        {file && <Ionicons name="checkmark-circle" size={16} color={C.green}/>}
                                    </View>
                                    {file
                                        ? <Text style={s.docFileName} numberOfLines={1}>{file.name}</Text>
                                        : <Text style={s.docSubtitle}>{doc.subtitle}</Text>
                                    }
                                </View>
                                <TouchableOpacity
                                    style={[s.docActionBtn, file && s.docActionBtnChange]}
                                    onPress={() => file ? setDocs(p => ({...p, [doc.key]: null})) : pickDoc(doc.key)}
                                >
                                    <Ionicons name={file ? 'close' : 'cloud-upload-outline'} size={18}
                                              color={file ? C.rose : C.accent}/>
                                </TouchableOpacity>
                            </View>
                        );
                    })}
                </View>

                {/* Submit */}
                <View style={s.submitWrap}>
                    <TouchableOpacity
                        style={[s.submitBtn, (!network || !duration || !requiredDone || loading) && s.submitDisabled]}
                        onPress={submit}
                        disabled={loading || !network || !duration || !requiredDone}
                    >
                        {loading
                            ? <><ActivityIndicator color="#fff" size="small"/><Text
                                style={s.submitText}>Submitting…</Text></>
                            : <><Ionicons name="checkmark-circle-outline" size={20} color="#fff"/><Text
                                style={s.submitText}>Complete Profile</Text></>
                        }
                    </TouchableOpacity>
                    <Text style={s.submitNote}>Your profile will be reviewed before you can apply for devices</Text>
                </View>

            </ScrollView>
        </View>
    );
}

const s = StyleSheet.create({
    root: {flex: 1, backgroundColor: C.bg},

    header: {backgroundColor: C.navy, paddingTop: 56, paddingBottom: 28, paddingHorizontal: 20, overflow: 'hidden'},
    headerRing: {
        position: 'absolute',
        width: 240,
        height: 240,
        borderRadius: 120,
        borderWidth: 1,
        borderColor: 'rgba(255,255,255,0.06)',
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
        marginBottom: 20
    },
    headerContent: {alignItems: 'center', marginBottom: 24},
    headerIcon: {
        width: 60,
        height: 60,
        borderRadius: 18,
        backgroundColor: 'rgba(255,255,255,0.1)',
        borderWidth: 1,
        borderColor: 'rgba(255,255,255,0.15)',
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: 14
    },
    headerTitle: {fontSize: 24, fontWeight: '800', color: '#fff', marginBottom: 6},
    headerSub: {
        fontSize: 13,
        color: 'rgba(255,255,255,0.55)',
        textAlign: 'center',
        lineHeight: 19,
        paddingHorizontal: 20
    },
    progressRow: {flexDirection: 'row', alignItems: 'center', justifyContent: 'center'},
    progressItem: {alignItems: 'center', gap: 5},
    progressLabel: {fontSize: 10, color: 'rgba(255,255,255,0.6)', fontWeight: '600', letterSpacing: 0.4},
    progressLine: {
        flex: 1,
        height: 1,
        backgroundColor: 'rgba(255,255,255,0.15)',
        marginHorizontal: 8,
        marginBottom: 16
    },

    scroll: {flex: 1},
    scrollContent: {padding: 16, paddingBottom: 40},

    card: {
        backgroundColor: C.surface,
        borderRadius: 20,
        padding: 20,
        marginBottom: 14,
        borderWidth: 1,
        borderColor: C.border,
        shadowColor: C.navy,
        shadowOffset: {width: 0, height: 3},
        shadowOpacity: 0.06,
        shadowRadius: 10,
        elevation: 3
    },
    cardTitleRow: {flexDirection: 'row', alignItems: 'center', gap: 10, marginBottom: 4},
    cardTitleIcon: {
        width: 34,
        height: 34,
        borderRadius: 10,
        backgroundColor: C.accentSoft,
        justifyContent: 'center',
        alignItems: 'center'
    },
    cardTitle: {fontSize: 17, fontWeight: '800', color: C.text, flex: 1},
    cardSub: {fontSize: 12, color: C.muted, marginBottom: 18, marginLeft: 44},
    docCountPill: {backgroundColor: C.accentSoft, paddingHorizontal: 10, paddingVertical: 4, borderRadius: 20},
    docCountText: {fontSize: 12, color: C.accent, fontWeight: '700'},

    docRow: {
        flexDirection: 'row',
        alignItems: 'center',
        padding: 14,
        borderRadius: 14,
        marginBottom: 10,
        backgroundColor: C.bg,
        borderWidth: 1,
        borderColor: C.border
    },
    docRowDone: {backgroundColor: '#F0FDF4', borderColor: C.green + '40'},
    docIcon: {width: 42, height: 42, borderRadius: 12, justifyContent: 'center', alignItems: 'center', marginRight: 12},
    docInfo: {flex: 1},
    docTitleRow: {flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 3},
    docTitle: {fontSize: 14, fontWeight: '700', color: C.text},
    reqBadge: {
        fontSize: 10,
        color: C.amber,
        fontWeight: '700',
        backgroundColor: C.amberSoft,
        paddingHorizontal: 7,
        paddingVertical: 2,
        borderRadius: 8
    },
    docSubtitle: {fontSize: 12, color: C.muted},
    docFileName: {fontSize: 12, color: C.green, fontWeight: '500'},
    docActionBtn: {
        width: 36,
        height: 36,
        borderRadius: 10,
        backgroundColor: C.accentSoft,
        justifyContent: 'center',
        alignItems: 'center'
    },
    docActionBtnChange: {backgroundColor: C.roseSoft},

    submitWrap: {marginTop: 4},
    submitBtn: {
        flexDirection: 'row',
        justifyContent: 'center',
        alignItems: 'center',
        gap: 10,
        backgroundColor: C.navy,
        borderRadius: 18,
        paddingVertical: 18,
        shadowColor: C.navy,
        shadowOffset: {width: 0, height: 6},
        shadowOpacity: 0.28,
        shadowRadius: 12,
        elevation: 8,
        marginBottom: 14
    },
    submitDisabled: {backgroundColor: '#94A3B8', shadowOpacity: 0},
    submitText: {color: '#fff', fontSize: 16, fontWeight: '700'},
    submitNote: {textAlign: 'center', fontSize: 12, color: C.muted, lineHeight: 18},
});