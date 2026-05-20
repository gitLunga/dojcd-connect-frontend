// screens/Client/NotificationsScreen.tsx
// React Native version of the web NotificationsScreen.
// - Lists all notifications with unread indicator
// - Tapping an unread notification opens a Modal popup and marks it read
// - Delete button uses ConfirmDialog
// - Mark all read button
// - Pull-to-refresh

import React, { useState, useEffect } from 'react';
import {
    View, Text, StyleSheet, FlatList, Pressable,
    ActivityIndicator, RefreshControl, Modal,
    TouchableWithoutFeedback,
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';
import { RootStackParamList } from '../../navigation/AppNavigator';
import { notificationAPI } from '../../services/api';
import { useToast } from '../../components/ToastProvider';
import ConfirmDialog, { DialogConfig } from '../../components/ConfirmDialog';
import DrawerLayout from '../../components/DrawerLayout';

type NavigationProp = StackNavigationProp<RootStackParamList, 'Notifications'>;

const C = {
    navy:       '#0F1F3D',
    accent:     '#1E4FD8',
    accentSoft: '#EBF0FF',
    surface:    '#FFFFFF',
    bg:         '#F4F6FA',
    border:     '#E2E8F2',
    text:       '#0F1F3D',
    muted:      '#64748B',
    mutedLight: '#94A3B8',
    green:      '#059669',
    greenSoft:  '#D1FAE5',
    amber:      '#D97706',
    amberSoft:  '#FEF3C7',
    rose:       '#DC2626',
    roseSoft:   '#FEE2E2',
    slateSoft:  '#F1F5F9',
};

interface Notification {
    notification_id: number;
    title:           string;
    message:         string;
    is_read:         boolean;
    created_at:      string;
}



function formatTime(d: string): string {
    const diff = Date.now() - new Date(d).getTime();
    const m  = Math.floor(diff / 60000);
    const h  = Math.floor(diff / 3600000);
    const dy = Math.floor(diff / 86400000);
    if (m < 1)  return 'Just now';
    if (m < 60) return `${m}m ago`;
    if (h < 24) return `${h}h ago`;
    if (dy < 7) return `${dy}d ago`;
    return new Date(d).toLocaleDateString('en-ZA', { day: 'numeric', month: 'short', year: 'numeric' });
}

// ── Notification detail popup ─────────────────────────────────────────────────
function NotificationPopup({ notif, onClose }: { notif: Notification | null; onClose: () => void }) {
    if (!notif) return null;
    return (
        <Modal visible transparent animationType="fade" statusBarTranslucent onRequestClose={onClose}>
            <TouchableWithoutFeedback onPress={onClose}>
                <View style={ps.backdrop}>
                    <TouchableWithoutFeedback>
                        <View style={ps.dialog}>
                            {/* Close */}
                            <Pressable style={ps.closeBtn} onPress={onClose} hitSlop={8}>
                                <Ionicons name="close" size={18} color={C.mutedLight} />
                            </Pressable>

                            {/* Icon */}
                            <View style={ps.iconCircle}>
                                <Ionicons name="notifications-outline" size={26} color={C.accent} />
                            </View>

                            {/* Title & time */}
                            <Text style={ps.title}>{notif.title}</Text>
                            <Text style={ps.time}>{formatTime(notif.created_at)}</Text>

                            {/* Message box */}
                            <View style={ps.msgBox}>
                                <Text style={ps.msg}>{notif.message}</Text>
                            </View>

                            {/* Read note */}
                            <View style={ps.readNote}>
                                <Ionicons name="checkmark-circle-outline" size={14} color={C.green} />
                                <Text style={ps.readNoteText}>This notification has been marked as read</Text>
                            </View>

                            {/* Close button */}
                            <Pressable
                                style={({ pressed }) => [ps.closeFullBtn, pressed && { opacity: 0.85 }]}
                                onPress={onClose}
                            >
                                <Text style={ps.closeFullBtnText}>Close</Text>
                            </Pressable>
                        </View>
                    </TouchableWithoutFeedback>
                </View>
            </TouchableWithoutFeedback>
        </Modal>
    );
}

const ps = StyleSheet.create({
    backdrop:      { flex: 1, backgroundColor: 'rgba(15,31,61,0.55)', justifyContent: 'center', alignItems: 'center', paddingHorizontal: 24 },
    dialog:        { backgroundColor: C.surface, borderRadius: 20, padding: 28, width: '100%', maxWidth: 440, alignItems: 'center', shadowColor: '#000', shadowOffset: { width: 0, height: 12 }, shadowOpacity: 0.2, shadowRadius: 24, elevation: 16 },
    closeBtn:      { position: 'absolute', top: 14, right: 14, width: 28, height: 28, borderRadius: 8, backgroundColor: C.bg, borderWidth: 1, borderColor: C.border, justifyContent: 'center', alignItems: 'center' },
    iconCircle:    { width: 60, height: 60, borderRadius: 18, backgroundColor: C.accentSoft, justifyContent: 'center', alignItems: 'center', marginBottom: 16 },
    title:         { fontSize: 18, fontWeight: '800', color: C.text, textAlign: 'center', marginBottom: 4 },
    time:          { fontSize: 12, color: C.mutedLight, marginBottom: 16 },
    msgBox:        { backgroundColor: C.bg, borderRadius: 12, paddingHorizontal: 16, paddingVertical: 14, width: '100%', marginBottom: 14, borderWidth: 1, borderColor: C.border },
    msg:           { fontSize: 14, color: C.muted, lineHeight: 22 },
    readNote:      { flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 20 },
    readNoteText:  { fontSize: 12, color: C.green, fontWeight: '600' },
    closeFullBtn:  { backgroundColor: C.navy, borderRadius: 12, paddingVertical: 13, width: '100%', alignItems: 'center' },
    closeFullBtnText: { fontSize: 14, fontWeight: '700', color: '#fff' },
});

// ── Main screen ───────────────────────────────────────────────────────────────
export default function NotificationsScreen() {
    const toast      = useToast();
    const navigation = useNavigation<NavigationProp>();

    const [notifications, setNotifications] = useState<Notification[]>([]);
    const [loading,        setLoading]       = useState(true);
    const [refreshing,     setRefreshing]    = useState(false);
    const [user,           setUser]          = useState<any>(null);
    const [openNotif,      setOpenNotif]     = useState<Notification | null>(null);
    const [dialog,         setDialog]        = useState<DialogConfig | null>(null);

    useEffect(() => { init(); }, []);

    const init = async () => {
        const ud = await AsyncStorage.getItem('user');
        if (!ud) { navigation.reset({ index: 0, routes: [{ name: 'Login' }] }); return; }
        const u = JSON.parse(ud);
        setUser(u);
        await fetchNotifications(u.client_user_id);
        setLoading(false);
    };

    const fetchNotifications = async (id: number) => {
        try {
            const r = await notificationAPI.getUserNotifications(id, 'Client');
            if (r.data.success) {
                // Mirror web — handle all possible response shapes
                const raw = r.data.data ?? r.data.notifications ?? r.data ?? [];
                setNotifications(Array.isArray(raw) ? raw : []);
            }
        } catch {
            toast.error('Error', 'Could not load notifications.');
        }
    };

    const onRefresh = async () => {
        setRefreshing(true);
        if (user) await fetchNotifications(user.client_user_id);
        setRefreshing(false);
    };

    // Tap a notification: open popup, mark as read
    const handleTapNotif = async (notif: Notification) => {
        setOpenNotif(notif);
        if (!notif.is_read && user) {
            try {
                await notificationAPI.markAsRead(notif.notification_id, user.client_user_id, 'Client');
                setNotifications(prev =>
                    prev.map(n => n.notification_id === notif.notification_id ? { ...n, is_read: true } : n)
                );
            } catch { /* silent */ }
        }
    };

    const handleMarkAllRead = async () => {
        if (!user) return;
        try {
            const r = await notificationAPI.markAllAsRead(user.client_user_id, 'Client');
            if (r.data.success) {
                setNotifications(prev => prev.map(n => ({ ...n, is_read: true })));
                toast.success('Done', 'All notifications marked as read.');
            }
        } catch { toast.error('Error', 'Failed to mark all as read.'); }
    };

    const handleDelete = (nid: number) => {
        setDialog({
            title:       'Delete Notification',
            message:     'Remove this notification? This action cannot be undone.',
            confirmText: 'Delete',
            variant:     'delete',
            onConfirm:   async () => {
                try {
                    const r = await notificationAPI.deleteNotification(nid, user.client_user_id, 'Client');
                    if (r.data.success) {
                        setNotifications(prev => prev.filter(n => n.notification_id !== nid));
                        toast.success('Deleted', 'Notification removed.');
                    }
                } catch { toast.error('Error', 'Failed to delete notification.'); }
            },
        });
    };

    const unread = notifications.filter(n => !n.is_read).length;

    // ── Notification card ──────────────────────────────────────────────────
    const renderItem = ({ item: notif }: { item: Notification }) => (
        <View style={[s.card, !notif.is_read && s.cardUnread]}>
            {/* Unread left bar */}
            {!notif.is_read && <View style={s.unreadBar} />}

            {/* Tap area */}
            <Pressable
                style={({ pressed }) => [s.cardInner, pressed && { opacity: 0.88 }]}
                onPress={() => handleTapNotif(notif)}
            >
                {/* Icon */}
                <View style={[s.notifIco, { backgroundColor: notif.is_read ? C.slateSoft : C.accentSoft }]}>
                    <Ionicons
                        name="notifications-outline"
                        size={16}
                        color={notif.is_read ? C.muted : C.accent}
                    />
                </View>

                {/* Content */}
                <View style={s.cardContent}>
                    <View style={s.cardTop}>
                        <Text
                            style={[s.cardTitle, { fontWeight: notif.is_read ? '600' : '800' }]}
                            numberOfLines={1}
                        >
                            {notif.title}
                        </Text>
                        {!notif.is_read && (
                            <View style={s.newPill}>
                                <Text style={s.newPillText}>New</Text>
                            </View>
                        )}
                    </View>
                    <Text style={s.cardMsg} numberOfLines={2}>{notif.message}</Text>
                    <View style={s.cardTimeRow}>
                        <Ionicons name="time-outline" size={11} color={C.mutedLight} />
                        <Text style={s.cardTimeText}>{formatTime(notif.created_at)}</Text>
                    </View>
                </View>
            </Pressable>

            {/* Delete */}
            <Pressable
                style={({ pressed }) => [s.deleteBtn, pressed && { opacity: 0.7 }]}
                onPress={() => handleDelete(notif.notification_id)}
                hitSlop={6}
            >
                <Ionicons name="trash-outline" size={16} color={C.mutedLight} />
            </Pressable>
        </View>
    );

    // ── Loading ────────────────────────────────────────────────────────────
    if (loading) {
        return (
            <DrawerLayout>
                <View style={s.loadingWrap}>
                    <ActivityIndicator size="large" color={C.accent} />
                </View>
            </DrawerLayout>
        );
    }

    // ── Render ─────────────────────────────────────────────────────────────
    return (
        <DrawerLayout>
            <View style={s.root}>
                {/* Header */}
                <View style={s.header}>
                    <View style={s.headerLeft}>
                        <Pressable style={s.backBtn} onPress={() => navigation.goBack()} hitSlop={8}>
                            <Ionicons name="arrow-back" size={20} color={C.text} />
                        </Pressable>
                        <View style={s.headerIcon}>
                            <Ionicons name="notifications-outline" size={20} color={C.accent} />
                        </View>
                        <View>
                            <Text style={s.headerTitle}>Notifications</Text>
                            <Text style={s.headerSub}>
                                {unread > 0 ? `${unread} unread notification${unread !== 1 ? 's' : ''}` : 'All caught up'}
                            </Text>
                        </View>
                    </View>

                    {unread > 0 && (
                        <Pressable
                            style={({ pressed }) => [s.markAllBtn, pressed && { opacity: 0.8 }]}
                            onPress={handleMarkAllRead}
                        >
                            <Ionicons name="checkmark-done-outline" size={15} color={C.accent} />
                            <Text style={s.markAllText}>Mark all read</Text>
                        </Pressable>
                    )}
                </View>

                {/* List */}
                <FlatList
                    data={notifications}
                    keyExtractor={n => String(n.notification_id)}
                    renderItem={renderItem}
                    contentContainerStyle={notifications.length === 0 ? s.emptyContainer : s.listContent}
                    showsVerticalScrollIndicator={false}
                    refreshControl={
                        <RefreshControl
                            refreshing={refreshing}
                            onRefresh={onRefresh}
                            tintColor={C.accent}
                            colors={[C.accent]}
                        />
                    }
                    ListEmptyComponent={
                        <View style={s.empty}>
                            <View style={s.emptyIco}>
                                <Ionicons name="notifications-outline" size={32} color={C.mutedLight} />
                            </View>
                            <Text style={s.emptyTitle}>No notifications yet</Text>
                            <Text style={s.emptySub}>
                                You'll be notified here when your application status changes.
                            </Text>
                        </View>
                    }
                />

                {/* Notification popup modal */}
                <NotificationPopup notif={openNotif} onClose={() => setOpenNotif(null)} />

                {/* Delete confirm dialog */}
                <ConfirmDialog config={dialog} onClose={() => setDialog(null)} />
            </View>
        </DrawerLayout>
    );
}

const s = StyleSheet.create({
    root:        { flex: 1, backgroundColor: C.bg },
    loadingWrap: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: C.bg },

    header: {
        backgroundColor: C.surface,
        borderBottomWidth: 1, borderBottomColor: C.border,
        paddingHorizontal: 16, paddingVertical: 14,
        flexDirection: 'row', alignItems: 'center',
        justifyContent: 'space-between',
    },
    headerLeft:  { flexDirection: 'row', alignItems: 'center', gap: 10, flex: 1 },
    backBtn:     { width: 36, height: 36, borderRadius: 10, backgroundColor: C.bg, borderWidth: 1, borderColor: C.border, justifyContent: 'center', alignItems: 'center' },
    headerIcon:  { width: 40, height: 40, borderRadius: 12, backgroundColor: C.accentSoft, justifyContent: 'center', alignItems: 'center' },
    headerTitle: { fontSize: 17, fontWeight: '800', color: C.text },
    headerSub:   { fontSize: 11, color: C.muted, marginTop: 1 },

    markAllBtn:  { flexDirection: 'row', alignItems: 'center', gap: 5, backgroundColor: C.accentSoft, paddingHorizontal: 12, paddingVertical: 7, borderRadius: 20 },
    markAllText: { fontSize: 12, color: C.accent, fontWeight: '700' },

    listContent:   { padding: 16, paddingBottom: 32, gap: 8 },
    emptyContainer:{ flexGrow: 1 },

    // Notification card
    card: {
        backgroundColor: C.surface,
        borderRadius: 14, borderWidth: 1, borderColor: C.border,
        flexDirection: 'row', alignItems: 'stretch',
        overflow: 'hidden', marginBottom: 8,
    },
    cardUnread: { backgroundColor: '#F5F8FF', borderColor: `${C.accent}40` },
    unreadBar:  { width: 4, backgroundColor: C.accent },
    cardInner:  { flex: 1, flexDirection: 'row', alignItems: 'flex-start', gap: 12, padding: 14 },

    notifIco: { width: 36, height: 36, borderRadius: 10, justifyContent: 'center', alignItems: 'center', flexShrink: 0 },

    cardContent: { flex: 1 },
    cardTop:     { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 4 },
    cardTitle:   { fontSize: 14, color: C.text, flex: 1 },
    newPill:     { backgroundColor: C.accentSoft, paddingHorizontal: 7, paddingVertical: 2, borderRadius: 10 },
    newPillText: { fontSize: 10, fontWeight: '700', color: C.accent },
    cardMsg:     { fontSize: 13, color: C.muted, lineHeight: 19, marginBottom: 6 },
    cardTimeRow: { flexDirection: 'row', alignItems: 'center', gap: 4 },
    cardTimeText:{ fontSize: 11, color: C.mutedLight },

    deleteBtn: { paddingHorizontal: 14, justifyContent: 'center', borderLeftWidth: 1, borderLeftColor: C.border },

    // Empty state
    empty:      { flex: 1, alignItems: 'center', justifyContent: 'center', paddingVertical: 72, paddingHorizontal: 24 },
    emptyIco:   { width: 68, height: 68, borderRadius: 20, backgroundColor: C.surface, borderWidth: 1, borderColor: C.border, justifyContent: 'center', alignItems: 'center', marginBottom: 18 },
    emptyTitle: { fontSize: 17, fontWeight: '800', color: C.text, marginBottom: 8 },
    emptySub:   { fontSize: 13, color: C.muted, textAlign: 'center', lineHeight: 20, maxWidth: 300 },
});