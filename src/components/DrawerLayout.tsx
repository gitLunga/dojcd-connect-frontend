// components/DrawerLayout.tsx
// React Native equivalent of the web SidebarLayout.
// Usage: Wrap any authenticated screen with <DrawerLayout>...</DrawerLayout>

import React, { useState, useEffect, useRef } from 'react';
import {
    View,
    Text,
    StyleSheet,
    TouchableOpacity,
    Pressable,
    Animated,
    Dimensions,
    ScrollView,
} from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { useNavigation, useRoute } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { notificationAPI } from '../services/api';
import ConfirmDialog, { DialogConfig } from './ConfirmDialog';

const { width: SCREEN_WIDTH } = Dimensions.get('window');
const DRAWER_WIDTH = Math.min(280, SCREEN_WIDTH * 0.78);

const C = {
    navy:      '#0F1F3D',
    accent:    '#1E4FD8',
    surface:   '#FFFFFF',
    bg:        '#F4F6FA',
    border:    '#E2E8F2',
    muted:     '#64748B',
    mutedLight:'#94A3B8',
    green:     '#059669',
    amber:     '#D97706',
};

// ── Nav items ──────────────────────────────────────────────────────────────
const NAV_ITEMS = [
    { key: 'dashboard',     label: 'Dashboard',    screen: 'DOJCDDashboard',  icon: 'grid-outline'           as const, activeIcon: 'grid'           as const, isBell: false },
    { key: 'devices',       label: 'Devices',       screen: 'DeviceCatalog',   icon: 'phone-portrait-outline' as const, activeIcon: 'phone-portrait' as const, isBell: false },
    { key: 'applications',  label: 'Applications',  screen: 'MyApplications',  icon: 'document-text-outline'  as const, activeIcon: 'document-text'  as const, isBell: false },
    { key: 'notifications', label: 'Notifications', screen: 'Notifications',   icon: 'notifications-outline'  as const, activeIcon: 'notifications'  as const, isBell: true  },
    { key: 'profile',       label: 'Profile',       screen: 'CompleteProfile', icon: 'person-outline'         as const, activeIcon: 'person'         as const, isBell: false },
];

interface Props {
    children: React.ReactNode;
}

const DrawerLayout: React.FC<Props> = ({ children }) => {
    const navigation   = useNavigation<any>();
    const route        = useRoute();
    const insets       = useSafeAreaInsets();

    const [user,        setUser]        = useState<any>(null);
    const [unreadCount, setUnreadCount] = useState<number>(0);
    const [drawerOpen,  setDrawerOpen]  = useState<boolean>(false);
    const [dialog,      setDialog]      = useState<DialogConfig | null>(null);

    const drawerAnim   = useRef(new Animated.Value(-DRAWER_WIDTH)).current;
    const backdropAnim = useRef(new Animated.Value(0)).current;

    useEffect(() => {
        (async () => {
            try {
                const ud = await AsyncStorage.getItem('user');
                if (!ud) return;
                const u = JSON.parse(ud);
                setUser(u);
                if (u.client_user_id) {
                    const r = await notificationAPI.getUnreadCount(u.client_user_id, 'Client');
                    if (r?.data?.success) setUnreadCount(r.data.unreadCount || 0);
                }
            } catch { /* silent */ }
        })();
    }, [route.name]);

    const openDrawer = () => {
        setDrawerOpen(true);
        Animated.parallel([
            Animated.timing(drawerAnim,   { toValue: 0, duration: 260, useNativeDriver: true }),
            Animated.timing(backdropAnim, { toValue: 1, duration: 260, useNativeDriver: true }),
        ]).start();
    };

    const closeDrawer = (cb?: () => void) => {
        Animated.parallel([
            Animated.timing(drawerAnim,   { toValue: -DRAWER_WIDTH, duration: 220, useNativeDriver: true }),
            Animated.timing(backdropAnim, { toValue: 0,             duration: 220, useNativeDriver: true }),
        ]).start(() => { setDrawerOpen(false); if (cb) cb(); });
    };

    const handleNav = (screen: string) => {
        closeDrawer(() => navigation.navigate(screen));
    };

    const handleLogoutRequest = () => {
        closeDrawer();
        setTimeout(() => {
            setDialog({
                title:       'Sign Out',
                message:     'Are you sure you want to sign out of DOJCD Connect?',
                confirmText: 'Yes, Sign Out',
                cancelText:  'Stay',
                variant:     'logout',
                onConfirm:   doLogout,
            });
        }, 260);
    };

    const doLogout = async () => {
        await AsyncStorage.removeItem('user');
        await AsyncStorage.removeItem('profile_skipped');
        navigation.reset({ index: 0, routes: [{ name: 'Login' }] });
    };

    const activeScreen = String(route.name);
    const activeKey    = (NAV_ITEMS.find(n => n.screen === activeScreen) || NAV_ITEMS[0]).key;

    const avatarInitial = user
        ? String(user.first_name?.[0] || user.email?.[0] || 'U').toUpperCase()
        : 'U';

    const renderDrawer = () => (
        <View style={s.drawerInner}>
            {/* Brand */}
            <View style={s.brand}>
                <View style={s.brandIcon}>
                    <Text style={s.brandEmoji}>{'⚖️'}</Text>
                </View>
                <View>
                    <Text style={s.brandTitle}>DOJCD</Text>
                    <Text style={s.brandSub}>Connect Portal</Text>
                </View>
            </View>

            {/* User card */}
            {user != null ? (
                <View style={s.userCard}>
                    <View style={s.userAvatar}>
                        <Text style={s.userAvatarText}>{avatarInitial}</Text>
                        <View style={s.userDot} />
                    </View>
                    <View style={s.userInfo}>
                        <Text style={s.userName} numberOfLines={1}>
                            {String(user.first_name || '')} {String(user.last_name || '')}
                        </Text>
                        <Text style={s.userRole}>
                            {String(user.registration_status || 'Client').replace('_', ' ')}
                        </Text>
                    </View>
                </View>
            ) : null}

            {/* Menu label */}
            <Text style={s.navSection}>{'MENU'}</Text>

            {/* Nav items */}
            <ScrollView style={s.navScroll} showsVerticalScrollIndicator={false}>
                {NAV_ITEMS.map(item => {
                    const active = activeKey === item.key;
                    const badge  = item.isBell && unreadCount > 0;
                    return (
                        <TouchableOpacity
                            key={item.key}
                            style={active ? [s.navBtn, s.navBtnActive] : s.navBtn}
                            onPress={() => handleNav(item.screen)}
                            activeOpacity={0.8}
                        >
                            <View style={s.navIconWrap}>
                                <Ionicons
                                    name={active ? item.activeIcon : item.icon}
                                    size={18}
                                    color={active ? '#fff' : C.mutedLight}
                                />
                                {badge ? (
                                    <View style={s.navBadge}>
                                        <Text style={s.navBadgeText}>
                                            {unreadCount > 9 ? '9+' : String(unreadCount)}
                                        </Text>
                                    </View>
                                ) : null}
                            </View>
                            <Text style={active ? [s.navLabel, s.navLabelActive] : s.navLabel}>
                                {item.label}
                            </Text>
                            {badge && !active ? (
                                <View style={s.countPill}>
                                    <Text style={s.countPillText}>{String(unreadCount)}</Text>
                                </View>
                            ) : null}
                            {active ? (
                                <Ionicons name="chevron-forward" size={14} color="rgba(255,255,255,0.5)" />
                            ) : null}
                        </TouchableOpacity>
                    );
                })}
            </ScrollView>

            {/* Logout */}
            <View style={s.logoutWrap}>
                <TouchableOpacity style={s.logoutBtn} onPress={handleLogoutRequest} activeOpacity={0.8}>
                    <Ionicons name="log-out-outline" size={18} color="rgba(220,38,38,0.8)" />
                    <Text style={s.logoutText}>{'Sign Out'}</Text>
                </TouchableOpacity>
            </View>
        </View>
    );

    return (
        <View style={s.root}>

            {/* Top bar */}
            <View style={[s.topBar, { paddingTop: insets.top }]}>
                <TouchableOpacity style={s.topIconBtn} onPress={openDrawer}>
                    <Ionicons name="menu-outline" size={24} color="#fff" />
                </TouchableOpacity>
                <View style={s.topBrand}>
                    <Text style={s.topBrandEmoji}>{'⚖️'}</Text>
                    <Text style={s.topBrandText}>{'DOJCD Connect'}</Text>
                </View>
                <TouchableOpacity
                    style={s.topIconBtn}
                    onPress={() => navigation.navigate('Notifications')}
                >
                    <Ionicons name="notifications-outline" size={22} color="#fff" />
                    {unreadCount > 0 ? (
                        <View style={s.topBadge}>
                            <Text style={s.topBadgeText}>
                                {unreadCount > 9 ? '9+' : String(unreadCount)}
                            </Text>
                        </View>
                    ) : null}
                </TouchableOpacity>
            </View>

            {/* Screen content */}
            <View style={s.content}>{children}</View>

            {/* Bottom tab bar */}
            <View style={[s.tabBar, { paddingBottom: insets.bottom }]}>
                {NAV_ITEMS.map(item => {
                    const active = activeKey === item.key;
                    const badge  = item.isBell && unreadCount > 0;
                    return (
                        <TouchableOpacity
                            key={item.key}
                            style={s.tabItem}
                            onPress={() => navigation.navigate(item.screen)}
                            activeOpacity={0.7}
                        >
                            <View style={active ? [s.tabIconWrap, s.tabIconWrapActive] : s.tabIconWrap}>
                                <View>
                                    <Ionicons
                                        name={active ? item.activeIcon : item.icon}
                                        size={20}
                                        color={active ? '#fff' : C.mutedLight}
                                    />
                                    {badge ? (
                                        <View style={s.tabBadge}>
                                            <Text style={s.tabBadgeText}>
                                                {unreadCount > 9 ? '9+' : String(unreadCount)}
                                            </Text>
                                        </View>
                                    ) : null}
                                </View>
                            </View>
                            <Text style={active ? [s.tabLabel, s.tabLabelActive] : s.tabLabel}>
                                {item.label}
                            </Text>
                        </TouchableOpacity>
                    );
                })}
            </View>

            {/* Slide-in drawer */}
            {drawerOpen ? (
                <>
                    <Animated.View style={[s.backdrop, { opacity: backdropAnim }]}>
                        <Pressable style={StyleSheet.absoluteFill} onPress={() => closeDrawer()} />
                    </Animated.View>

                    <Animated.View
                        style={[
                            s.drawer,
                            { width: DRAWER_WIDTH, transform: [{ translateX: drawerAnim }] },
                        ]}
                    >
                        <TouchableOpacity
                            style={[s.drawerCloseBtn, { top: insets.top + 12 }]}
                            onPress={() => closeDrawer()}
                            hitSlop={8}
                        >
                            <Ionicons name="close" size={20} color={C.mutedLight} />
                        </TouchableOpacity>

                        <SafeAreaView style={s.drawerSafeArea} edges={['top', 'bottom']}>
                            {renderDrawer()}
                        </SafeAreaView>
                    </Animated.View>
                </>
            ) : null}

            {/* Logout confirm dialog */}
            <ConfirmDialog config={dialog} onClose={() => setDialog(null)} />
        </View>
    );
};

export default DrawerLayout;

const s = StyleSheet.create({
    root: { flex: 1, backgroundColor: C.bg },

    topBar:        { backgroundColor: C.navy, flexDirection: 'row', alignItems: 'center', paddingHorizontal: 16, paddingBottom: 12, gap: 12, elevation: 4, shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.2, shadowRadius: 4 },
    topIconBtn:    { width: 40, height: 40, justifyContent: 'center', alignItems: 'center' },
    topBrand:      { flex: 1, flexDirection: 'row', alignItems: 'center', gap: 8 },
    topBrandEmoji: { fontSize: 17 },
    topBrandText:  { fontSize: 16, fontWeight: '800', color: '#fff', letterSpacing: 0.2 },
    topBadge:      { position: 'absolute', top: 2, right: 2, minWidth: 16, height: 16, borderRadius: 8, backgroundColor: '#EF4444', justifyContent: 'center', alignItems: 'center', paddingHorizontal: 3, borderWidth: 2, borderColor: C.navy },
    topBadgeText:  { fontSize: 9, fontWeight: '800', color: '#fff' },

    content: { flex: 1 },

    tabBar:           { backgroundColor: C.surface, flexDirection: 'row', borderTopWidth: 1, borderTopColor: C.border, paddingTop: 8, elevation: 8, shadowColor: '#000', shadowOffset: { width: 0, height: -2 }, shadowOpacity: 0.08, shadowRadius: 8 },
    tabItem:          { flex: 1, alignItems: 'center', gap: 4 },
    tabIconWrap:      { width: 36, height: 28, borderRadius: 10, justifyContent: 'center', alignItems: 'center' },
    tabIconWrapActive:{ backgroundColor: C.navy },
    tabLabel:         { fontSize: 9, color: C.mutedLight, fontWeight: '600', letterSpacing: 0.2 },
    tabLabelActive:   { color: C.navy, fontWeight: '700' },
    tabBadge:         { position: 'absolute', top: -4, right: -6, minWidth: 14, height: 14, borderRadius: 7, backgroundColor: '#EF4444', justifyContent: 'center', alignItems: 'center', paddingHorizontal: 2 },
    tabBadgeText:     { fontSize: 8, fontWeight: '800', color: '#fff' },

    backdrop:       { ...StyleSheet.absoluteFillObject, backgroundColor: 'rgba(15,31,61,0.55)', zIndex: 100 },
    drawer:         { position: 'absolute', top: 0, left: 0, bottom: 0, backgroundColor: C.navy, zIndex: 200, elevation: 16, shadowColor: '#000', shadowOffset: { width: 4, height: 0 }, shadowOpacity: 0.35, shadowRadius: 16 },
    drawerSafeArea: { flex: 1 },
    drawerCloseBtn: { position: 'absolute', right: 10, zIndex: 10, width: 30, height: 30, borderRadius: 8, backgroundColor: 'rgba(255,255,255,0.08)', justifyContent: 'center', alignItems: 'center' },
    drawerInner:    { flex: 1, paddingTop: 8 },

    brand:      { flexDirection: 'row', alignItems: 'center', gap: 10, padding: 18, paddingTop: 14, borderBottomWidth: 1, borderBottomColor: 'rgba(255,255,255,0.07)' },
    brandIcon:  { width: 38, height: 38, borderRadius: 11, backgroundColor: 'rgba(255,255,255,0.08)', borderWidth: 1, borderColor: 'rgba(255,255,255,0.12)', justifyContent: 'center', alignItems: 'center' },
    brandEmoji: { fontSize: 20 },
    brandTitle: { fontSize: 15, fontWeight: '800', color: '#fff', letterSpacing: 0.4 },
    brandSub:   { fontSize: 9, fontWeight: '600', color: 'rgba(255,255,255,0.35)', letterSpacing: 0.5, marginTop: 1 },

    userCard:      { flexDirection: 'row', alignItems: 'center', gap: 10, padding: 14, backgroundColor: 'rgba(255,255,255,0.04)', borderBottomWidth: 1, borderBottomColor: 'rgba(255,255,255,0.07)' },
    userAvatar:    { width: 38, height: 38, borderRadius: 11, backgroundColor: C.accent, justifyContent: 'center', alignItems: 'center', flexShrink: 0 },
    userAvatarText:{ fontSize: 14, fontWeight: '800', color: '#fff' },
    userDot:       { position: 'absolute', bottom: -2, right: -2, width: 10, height: 10, borderRadius: 5, backgroundColor: C.green, borderWidth: 2, borderColor: C.navy },
    userInfo:      { flex: 1 },
    userName:      { fontSize: 13, fontWeight: '700', color: '#fff' },
    userRole:      { fontSize: 10, color: 'rgba(255,255,255,0.38)', marginTop: 1 },

    navScroll:     { flex: 1 },
    navSection:    { fontSize: 9, fontWeight: '700', letterSpacing: 1.3, color: 'rgba(255,255,255,0.28)', paddingHorizontal: 16, paddingTop: 14, paddingBottom: 5 },
    navBtn:        { flexDirection: 'row', alignItems: 'center', gap: 11, marginHorizontal: 10, paddingHorizontal: 12, paddingVertical: 11, borderRadius: 10, marginBottom: 2 },
    navBtnActive:  { backgroundColor: C.accent },
    navIconWrap:   { width: 22, alignItems: 'center' },
    navLabel:      { fontSize: 13, fontWeight: '600', color: C.mutedLight, flex: 1 },
    navLabelActive:{ color: '#fff' },
    navBadge:      { position: 'absolute', top: -5, right: -8, minWidth: 15, height: 15, borderRadius: 8, backgroundColor: '#EF4444', justifyContent: 'center', alignItems: 'center', paddingHorizontal: 3 },
    navBadgeText:  { fontSize: 9, fontWeight: '800', color: '#fff' },
    countPill:     { backgroundColor: '#EF4444', paddingHorizontal: 6, paddingVertical: 2, borderRadius: 10 },
    countPillText: { fontSize: 10, fontWeight: '800', color: '#fff' },

    logoutWrap: { padding: 10, borderTopWidth: 1, borderTopColor: 'rgba(255,255,255,0.07)' },
    logoutBtn:  { flexDirection: 'row', alignItems: 'center', gap: 11, paddingHorizontal: 12, paddingVertical: 11, borderRadius: 10, backgroundColor: 'rgba(220,38,38,0.08)' },
    logoutText: { fontSize: 13, fontWeight: '600', color: 'rgba(220,38,38,0.8)' },
});