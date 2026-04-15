import React, {useState, useEffect} from 'react';
import {
    View, Text, StyleSheet, FlatList, TouchableOpacity,
    Alert, ActivityIndicator, TextInput, RefreshControl
} from 'react-native';
import {Ionicons} from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import {deviceAPI} from '../../services/api';
import {StackNavigationProp} from '@react-navigation/stack';
import {RootStackParamList} from '../../navigation/AppNavigator';
import {useNavigation} from '@react-navigation/native';
import {useToast} from '../../components/ToastProvider';

type NavigationProp = StackNavigationProp<RootStackParamList, 'DeviceCatalog'>;

const C = {
    navy: '#0F1F3D', accent: '#1E4FD8', accentSoft: '#EBF0FF',
    surface: '#FFFFFF', bg: '#F4F6FA', border: '#E2E8F2',
    text: '#0F1F3D', muted: '#64748B', mutedLight: '#94A3B8',
    green: '#059669', greenSoft: '#D1FAE5',
    amber: '#D97706', amberSoft: '#FEF3C7',
    rose: '#DC2626', roseSoft: '#FEE2E2',
};

interface Device {
    device_id: number;
    device_name: string;
    model: string;
    manufacturer: string;
    plan_name: string;
    plan_details: string;
    monthly_cost: number;
    contract_duration_months: number;
    status: string;
}

export default function DeviceCatalogScreen() {
    const toast = useToast();
    const navigation = useNavigation<NavigationProp>();

    const [devices, setDevices] = useState<Device[]>([]);
    const [filtered, setFiltered] = useState<Device[]>([]);
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);
    const [search, setSearch] = useState('');
    const [user, setUser] = useState<any>(null);
    const [isEligible, setIsEligible] = useState(false);
    const [searchFocused, setSearchFocused] = useState(false);

    useEffect(() => {
        init();
    }, []);
    useEffect(() => {
        filterDevices();
    }, [search, devices]);

    const init = async () => {
        try {
            const ud = await AsyncStorage.getItem('user');
            if (ud) {
                const u = JSON.parse(ud);
                setUser(u);
                const er = await deviceAPI.checkEligibility(u.client_user_id);
                setIsEligible(er.data.eligible);
                if (er.data.eligible) {
                    const dr = await deviceAPI.getAvailableDevices();
                    setDevices(dr.data?.data?.devices ?? []);
                }
            }
        } catch {
            toast.error('Failed to Load', 'Could not load devices. Please try again.');
        } finally {
            setLoading(false);
        }
    };

    const filterDevices = () => {
        if (!search.trim()) {
            setFiltered(devices);
            return;
        }
        const q = search.toLowerCase();
        setFiltered(devices.filter(d =>
            d.device_name.toLowerCase().includes(q) ||
            d.model.toLowerCase().includes(q) ||
            d.manufacturer.toLowerCase().includes(q) ||
            d.plan_name.toLowerCase().includes(q)
        ));
    };

    const onRefresh = async () => {
        setRefreshing(true);
        await init();
        setRefreshing(false);
    };

    const handleApply = (deviceId: number) => {
        if (!user?.client_user_id) {
            toast.error('Error', 'User not found.');
            return;
        }
        Alert.alert('Confirm Application', 'Submit your application for this device?', [
            {text: 'Cancel', style: 'cancel'},
            {
                text: 'Apply', onPress: async () => {
                    try {
                        const r = await deviceAPI.submitApplication(user.client_user_id, deviceId);
                        if (r.data.success) {
                            toast.success('Applied!', r.data.message || 'Your application is now pending review.');
                            setTimeout(() => navigation.navigate('MyApplications'), 1200);
                        } else {
                            toast.error('Failed', r.data.message);
                        }
                    } catch (error: any) {
                        const s = error.response?.status;
                        const m = error.response?.data?.message;
                        if (s === 409) toast.warning('Already Applied', m || 'You already have an active application for this device.');
                        else if (s === 422) toast.error('Not Eligible', m || 'You are not currently eligible to apply.');
                        else toast.error('Failed', m || error.message);
                    }
                }
            },
        ]);
    };

    const renderDevice = ({item}: { item: Device }) => (
        <View style={s.card}>
            {/* Card header */}
            <View style={s.cardHeader}>
                <View style={s.deviceIconWrap}>
                    <Ionicons name="phone-portrait-outline" size={22} color={C.accent}/>
                </View>
                <View style={{flex: 1}}>
                    <Text style={s.deviceName}>{item.device_name}</Text>
                    <Text style={s.deviceMake}>{item.manufacturer}</Text>
                </View>
                <View style={s.pricePill}>
                    <Text style={s.priceAmount}>R{item.monthly_cost}</Text>
                    <Text style={s.priceUnit}>/mo</Text>
                </View>
            </View>

            {/* Model tag + plan */}
            <View style={s.tagsRow}>
                <View style={s.tag}><Text style={s.tagText}>{item.model}</Text></View>
                <View style={[s.tag, {backgroundColor: C.accentSoft}]}><Text
                    style={[s.tagText, {color: C.accent}]}>{item.plan_name}</Text></View>
                <View style={s.tag}><Ionicons name="calendar-outline" size={11} color={C.muted}/><Text
                    style={s.tagText}> {item.contract_duration_months}mo</Text></View>
            </View>

            {/* Plan details */}
            <Text style={s.planDetail} numberOfLines={3}>{item.plan_details}</Text>

            {/* Divider + apply */}
            <View style={s.cardFooter}>
                <View style={s.footerLeft}>
                    <Text style={s.footerLabel}>Contract total</Text>
                    <Text style={s.footerValue}>R{item.monthly_cost * item.contract_duration_months}</Text>
                </View>
                <TouchableOpacity style={s.applyBtn} onPress={() => handleApply(item.device_id)}>
                    <Text style={s.applyBtnText}>Apply Now</Text>
                    <Ionicons name="arrow-forward" size={15} color="#fff"/>
                </TouchableOpacity>
            </View>
        </View>
    );

    if (loading) {
        return (
            <View style={s.loadingScreen}>
                <ActivityIndicator size="large" color={C.accent}/>
                <Text style={s.loadingText}>Loading devices…</Text>
            </View>
        );
    }

    if (!isEligible) {
        return (
            <View style={s.gateScreen}>
                <View style={s.gateIcon}><Ionicons name="alert-circle-outline" size={40} color={C.amber}/></View>
                <Text style={s.gateTitle}>Not Yet Eligible</Text>
                <Text style={s.gateSub}>Your account must be verified before you can browse and apply for
                    devices.</Text>
                <TouchableOpacity style={s.gateBtn} onPress={() => navigation.goBack()}>
                    <Text style={s.gateBtnText}>Back to Dashboard</Text>
                </TouchableOpacity>
            </View>
        );
    }

    return (
        <View style={s.root}>
            {/* ── Top bar ─────────────────────────────────────────────── */}
            <View style={s.topBar}>
                <View style={s.topBarHeader}>
                    <View>
                        <Text style={s.pageTitle}>Device Catalogue</Text>
                        <Text
                            style={s.pageSub}>{filtered.length} device{filtered.length !== 1 ? 's' : ''} available</Text>
                    </View>
                </View>
                {/* Search */}
                <View style={[s.searchBar, searchFocused && s.searchBarFocused]}>
                    <Ionicons name="search-outline" size={18} color={searchFocused ? C.accent : C.muted}/>
                    <TextInput
                        style={s.searchInput}
                        placeholder="Search by name, model or plan…"
                        placeholderTextColor={C.mutedLight}
                        value={search}
                        onChangeText={setSearch}
                        onFocus={() => setSearchFocused(true)}
                        onBlur={() => setSearchFocused(false)}
                        returnKeyType="search"
                    />
                    {search.length > 0 && (
                        <TouchableOpacity onPress={() => setSearch('')} hitSlop={8}>
                            <Ionicons name="close-circle" size={18} color={C.mutedLight}/>
                        </TouchableOpacity>
                    )}
                </View>
            </View>

            <FlatList
                data={filtered}
                renderItem={renderDevice}
                keyExtractor={i => i.device_id.toString()}
                refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={C.accent}/>}
                contentContainerStyle={s.list}
                showsVerticalScrollIndicator={false}
                ListEmptyComponent={
                    <View style={s.empty}>
                        <View style={s.emptyIcon}><Ionicons name="search-outline" size={32}
                                                            color={C.mutedLight}/></View>
                        <Text style={s.emptyTitle}>{search ? 'No results' : 'No devices available'}</Text>
                        <Text
                            style={s.emptySub}>{search ? `No devices match "${search}"` : 'Check back later for available devices'}</Text>
                        {search && (
                            <TouchableOpacity style={s.clearSearchBtn} onPress={() => setSearch('')}>
                                <Text style={s.clearSearchText}>Clear search</Text>
                            </TouchableOpacity>
                        )}
                    </View>
                }
            />
        </View>
    );
}

const s = StyleSheet.create({
    root: {flex: 1, backgroundColor: C.bg},
    loadingScreen: {flex: 1, backgroundColor: C.bg, justifyContent: 'center', alignItems: 'center'},
    loadingText: {marginTop: 14, fontSize: 15, color: C.muted, fontWeight: '500'},
    gateScreen: {flex: 1, backgroundColor: C.bg, justifyContent: 'center', alignItems: 'center', padding: 40},
    gateIcon: {
        width: 72,
        height: 72,
        borderRadius: 20,
        backgroundColor: C.amberSoft,
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: 20
    },
    gateTitle: {fontSize: 22, fontWeight: '800', color: C.text, marginBottom: 10},
    gateSub: {fontSize: 14, color: C.muted, textAlign: 'center', lineHeight: 22, marginBottom: 28},
    gateBtn: {backgroundColor: C.navy, paddingHorizontal: 24, paddingVertical: 13, borderRadius: 14},
    gateBtnText: {color: '#fff', fontWeight: '700', fontSize: 14},

    topBar: {
        backgroundColor: C.surface,
        borderBottomWidth: 1,
        borderBottomColor: C.border,
        paddingTop: 20,
        paddingHorizontal: 16,
        paddingBottom: 16
    },
    topBarHeader: {marginBottom: 14},
    pageTitle: {fontSize: 22, fontWeight: '800', color: C.text},
    pageSub: {fontSize: 13, color: C.muted, marginTop: 2},
    searchBar: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 10,
        backgroundColor: C.bg,
        borderWidth: 1.5,
        borderColor: C.border,
        borderRadius: 14,
        paddingHorizontal: 14,
        paddingVertical: 11
    },
    searchBarFocused: {borderColor: C.accent, backgroundColor: '#FAFBFF'},
    searchInput: {flex: 1, fontSize: 15, color: C.text},

    list: {padding: 16},

    card: {
        backgroundColor: C.surface,
        borderRadius: 20,
        padding: 18,
        marginBottom: 14,
        borderWidth: 1,
        borderColor: C.border,
        shadowColor: C.navy,
        shadowOffset: {width: 0, height: 3},
        shadowOpacity: 0.07,
        shadowRadius: 10,
        elevation: 4
    },
    cardHeader: {flexDirection: 'row', alignItems: 'center', marginBottom: 14, gap: 12},
    deviceIconWrap: {
        width: 44,
        height: 44,
        borderRadius: 13,
        backgroundColor: C.accentSoft,
        justifyContent: 'center',
        alignItems: 'center'
    },
    deviceName: {fontSize: 17, fontWeight: '800', color: C.text},
    deviceMake: {fontSize: 12, color: C.muted, marginTop: 2},
    pricePill: {
        backgroundColor: C.greenSoft,
        paddingHorizontal: 12,
        paddingVertical: 7,
        borderRadius: 12,
        alignItems: 'center'
    },
    priceAmount: {fontSize: 17, fontWeight: '800', color: C.green},
    priceUnit: {fontSize: 10, color: C.green, fontWeight: '600'},
    tagsRow: {flexDirection: 'row', flexWrap: 'wrap', gap: 7, marginBottom: 12},
    tag: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: C.bg,
        borderWidth: 1,
        borderColor: C.border,
        paddingHorizontal: 10,
        paddingVertical: 5,
        borderRadius: 10
    },
    tagText: {fontSize: 11, color: C.muted, fontWeight: '500'},
    planDetail: {fontSize: 13, color: C.muted, lineHeight: 20, marginBottom: 16},
    cardFooter: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingTop: 14,
        borderTopWidth: 1,
        borderTopColor: C.border
    },
    footerLeft: {},
    footerLabel: {fontSize: 10, color: C.mutedLight, fontWeight: '600', letterSpacing: 0.5, marginBottom: 2},
    footerValue: {fontSize: 15, fontWeight: '800', color: C.text},
    applyBtn: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: C.navy,
        paddingHorizontal: 18,
        paddingVertical: 11,
        borderRadius: 14,
        gap: 7,
        shadowColor: C.navy,
        shadowOffset: {width: 0, height: 4},
        shadowOpacity: 0.25,
        shadowRadius: 8,
        elevation: 5
    },
    applyBtnText: {color: '#fff', fontSize: 14, fontWeight: '700'},

    empty: {alignItems: 'center', paddingVertical: 60, paddingHorizontal: 40},
    emptyIcon: {
        width: 68,
        height: 68,
        borderRadius: 18,
        backgroundColor: C.surface,
        borderWidth: 1,
        borderColor: C.border,
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: 18
    },
    emptyTitle: {fontSize: 18, fontWeight: '800', color: C.text, marginBottom: 6},
    emptySub: {fontSize: 14, color: C.muted, textAlign: 'center', lineHeight: 20, marginBottom: 20},
    clearSearchBtn: {backgroundColor: C.accentSoft, paddingHorizontal: 18, paddingVertical: 10, borderRadius: 20},
    clearSearchText: {fontSize: 13, color: C.accent, fontWeight: '700'},
});