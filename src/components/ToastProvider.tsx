// ToastProvider.tsx
// Place in: src/components/ToastProvider.tsx

import React, { createContext, useContext, useRef, useState, useCallback } from 'react';
import {
    View,
    Text,
    StyleSheet,
    Animated,
    TouchableOpacity,
    Platform,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

// ─── Types ────────────────────────────────────────────────────────────────────

type ToastType = 'success' | 'error' | 'warning' | 'info';

interface Toast {
    id: string;
    type: ToastType;
    title: string;
    message?: string;
}

interface ToastContextValue {
    success: (title: string, message?: string) => void;
    error: (title: string, message?: string) => void;
    warning: (title: string, message?: string) => void;
    info: (title: string, message?: string) => void;
}

// ─── Context ──────────────────────────────────────────────────────────────────

const ToastContext = createContext<ToastContextValue | null>(null);

// ─── Config ───────────────────────────────────────────────────────────────────

const TOAST_CONFIG: Record<ToastType, { bg: string; border: string; icon: string; iconColor: string }> = {
    success: {
        bg: '#f0fdf4',
        border: '#22c55e',
        icon: 'checkmark-circle',
        iconColor: '#16a34a',
    },
    error: {
        bg: '#fef2f2',
        border: '#ef4444',
        icon: 'close-circle',
        iconColor: '#dc2626',
    },
    warning: {
        bg: '#fffbeb',
        border: '#f59e0b',
        icon: 'warning',
        iconColor: '#d97706',
    },
    info: {
        bg: '#eff6ff',
        border: '#3b82f6',
        icon: 'information-circle',
        iconColor: '#2563eb',
    },
};

const DURATIONS: Record<ToastType, number> = {
    success: 3500,
    info: 3500,
    warning: 4500,
    error: 5500,
};

// ─── Single Toast Item ────────────────────────────────────────────────────────

interface ToastItemProps {
    toast: Toast;
    onDismiss: (id: string) => void;
}

function ToastItem({ toast, onDismiss }: ToastItemProps) {
    const translateY = useRef(new Animated.Value(-80)).current;
    const opacity = useRef(new Animated.Value(0)).current;
    const config = TOAST_CONFIG[toast.type];

    React.useEffect(() => {
        // Slide in
        Animated.parallel([
            Animated.spring(translateY, {
                toValue: 0,
                useNativeDriver: true,
                tension: 80,
                friction: 10,
            }),
            Animated.timing(opacity, {
                toValue: 1,
                duration: 200,
                useNativeDriver: true,
            }),
        ]).start();

        // Auto dismiss
        const timer = setTimeout(() => {
            dismiss();
        }, DURATIONS[toast.type]);

        return () => clearTimeout(timer);
    }, []);

    const dismiss = () => {
        Animated.parallel([
            Animated.timing(translateY, {
                toValue: -80,
                duration: 250,
                useNativeDriver: true,
            }),
            Animated.timing(opacity, {
                toValue: 0,
                duration: 250,
                useNativeDriver: true,
            }),
        ]).start(() => onDismiss(toast.id));
    };

    return (
        <Animated.View
            style={[
                styles.toastContainer,
                {
                    backgroundColor: config.bg,
                    borderLeftColor: config.border,
                    transform: [{ translateY }],
                    opacity,
                },
            ]}
        >
            <Ionicons
                name={config.icon as any}
                size={22}
                color={config.iconColor}
                style={styles.toastIcon}
            />
            <View style={styles.toastTextContainer}>
                <Text style={[styles.toastTitle, { color: config.iconColor }]} numberOfLines={1}>
                    {toast.title}
                </Text>
                {toast.message ? (
                    <Text style={styles.toastMessage} numberOfLines={2}>
                        {toast.message}
                    </Text>
                ) : null}
            </View>
            <TouchableOpacity onPress={dismiss} hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}>
                <Ionicons name="close" size={18} color="#94a3b8" />
            </TouchableOpacity>
        </Animated.View>
    );
}

// ─── Provider ─────────────────────────────────────────────────────────────────

export function ToastProvider({ children }: { children: React.ReactNode }) {
    const [toasts, setToasts] = useState<Toast[]>([]);
    const insets = useSafeAreaInsets();

    const show = useCallback((type: ToastType, title: string, message?: string) => {
        const id = `${Date.now()}-${Math.random()}`;
        setToasts(prev => {
            // Cap at 3 stacked toasts
            const trimmed = prev.length >= 3 ? prev.slice(1) : prev;
            return [...trimmed, { id, type, title, message }];
        });
    }, []);

    const dismiss = useCallback((id: string) => {
        setToasts(prev => prev.filter(t => t.id !== id));
    }, []);

    const value: ToastContextValue = {
        success: (title, message) => show('success', title, message),
        error: (title, message) => show('error', title, message),
        warning: (title, message) => show('warning', title, message),
        info: (title, message) => show('info', title, message),
    };

    return (
        <ToastContext.Provider value={value}>
            {children}
            <View
                style={[
                    styles.toastStack,
                    { top: (insets?.top ?? 0) + 12 },
                ]}
                pointerEvents="box-none"
            >
                {toasts.map(toast => (
                    <ToastItem key={toast.id} toast={toast} onDismiss={dismiss} />
                ))}
            </View>
        </ToastContext.Provider>
    );
}

// ─── Hook ─────────────────────────────────────────────────────────────────────

export function useToast(): ToastContextValue {
    const ctx = useContext(ToastContext);
    if (!ctx) throw new Error('useToast must be used inside <ToastProvider>');
    return ctx;
}

// ─── Styles ───────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
    toastStack: {
        position: 'absolute',
        left: 16,
        right: 16,
        zIndex: 9999,
        gap: 8,
    },
    toastContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingVertical: 14,
        paddingHorizontal: 16,
        borderRadius: 14,
        borderLeftWidth: 4,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.12,
        shadowRadius: 12,
        elevation: 8,
        marginBottom: 0,
    },
    toastIcon: {
        marginRight: 12,
        flexShrink: 0,
    },
    toastTextContainer: {
        flex: 1,
    },
    toastTitle: {
        fontSize: 14,
        fontWeight: '700',
        marginBottom: 2,
    },
    toastMessage: {
        fontSize: 13,
        color: '#475569',
        lineHeight: 18,
    },
});