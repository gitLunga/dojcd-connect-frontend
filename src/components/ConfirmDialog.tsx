// components/ConfirmDialog.tsx
// React Native version of web ConfirmDialog.
// Replaces ALL Alert.alert() / window.confirm() calls across the app.
//
// Usage:
//   const [dialog, setDialog] = useState<DialogConfig | null>(null);
//   setDialog({ title, message, confirmText, cancelText, variant, onConfirm, details });
//   <ConfirmDialog config={dialog} onClose={() => setDialog(null)} />

import React from 'react';
import {
    Modal,
    View,
    Text,
    Pressable,
    StyleSheet,
    TouchableWithoutFeedback,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';

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
    rose:       '#DC2626',
    roseSoft:   '#FEE2E2',
    amber:      '#D97706',
    amberSoft:  '#FEF3C7',
};

type Variant = 'danger' | 'success' | 'delete' | 'logout' | 'default';

export interface DialogConfig {
    title?:       string;
    message?:     string;
    confirmText?: string;
    cancelText?:  string;
    variant?:     Variant;
    details?:     string;
    onConfirm?:   () => void;
}

interface Props {
    config:  DialogConfig | null;
    onClose: () => void;
}

type IoniconName =
    | 'alert-circle-outline'
    | 'checkmark-circle-outline'
    | 'trash-outline'
    | 'log-out-outline';

const ICON_MAP: Record<Variant, IoniconName> = {
    danger:  'alert-circle-outline',
    success: 'checkmark-circle-outline',
    delete:  'trash-outline',
    logout:  'log-out-outline',
    default: 'alert-circle-outline',
};

const COLOR_MAP: Record<Variant, { bg: string; icon: string; btn: string }> = {
    danger:  { bg: C.roseSoft,   icon: C.rose,   btn: C.rose   },
    success: { bg: C.greenSoft,  icon: C.green,  btn: C.green  },
    delete:  { bg: C.roseSoft,   icon: C.rose,   btn: C.rose   },
    logout:  { bg: C.amberSoft,  icon: C.amber,  btn: C.navy   },
    default: { bg: C.accentSoft, icon: C.accent, btn: C.accent },
};

export default function ConfirmDialog({ config, onClose }: Props) {
    if (!config) return null;

    const {
        title       = 'Are you sure?',
        message     = '',
        confirmText = 'Confirm',
        cancelText  = 'Cancel',
        variant     = 'default',
        details,
        onConfirm,
    } = config;

    const resolvedVariant: Variant = (variant as Variant) in ICON_MAP ? (variant as Variant) : 'default';
    const iconName = ICON_MAP[resolvedVariant];
    const colors   = COLOR_MAP[resolvedVariant];

    const handleConfirm = () => {
        onConfirm?.();
        onClose();
    };

    return (
        <Modal
            visible
            transparent
            animationType="fade"
            statusBarTranslucent
            onRequestClose={onClose}
        >
            <TouchableWithoutFeedback onPress={onClose}>
                <View style={s.backdrop}>
                    {/* Stop press propagation so tapping the dialog itself doesn't close it */}
                    <TouchableWithoutFeedback>
                        <View style={s.dialog}>

                            {/* Close X */}
                            <Pressable style={s.closeBtn} onPress={onClose} hitSlop={8}>
                                <Ionicons name="close" size={18} color={C.mutedLight} />
                            </Pressable>

                            {/* Icon circle */}
                            <View style={[s.iconCircle, { backgroundColor: colors.bg }]}>
                                <Ionicons name={iconName} size={28} color={colors.icon} />
                            </View>

                            {/* Title */}
                            <Text style={s.title}>{title}</Text>

                            {/* Message */}
                            {!!message && <Text style={s.message}>{message}</Text>}

                            {/* Details box */}
                            {!!details && (
                                <View style={s.detailBox}>
                                    <Text style={s.detailText}>{details}</Text>
                                </View>
                            )}

                            {/* Buttons */}
                            <View style={s.actions}>
                                <Pressable
                                    style={({ pressed }) => [s.cancelBtn, pressed && { opacity: 0.75 }]}
                                    onPress={onClose}
                                >
                                    <Text style={s.cancelText}>{cancelText}</Text>
                                </Pressable>

                                <Pressable
                                    style={({ pressed }) => [
                                        s.confirmBtn,
                                        { backgroundColor: colors.btn },
                                        pressed && { opacity: 0.85 },
                                    ]}
                                    onPress={handleConfirm}
                                >
                                    <Text style={s.confirmText}>{confirmText}</Text>
                                </Pressable>
                            </View>

                        </View>
                    </TouchableWithoutFeedback>
                </View>
            </TouchableWithoutFeedback>
        </Modal>
    );
}

const s = StyleSheet.create({
    backdrop: {
        flex: 1,
        backgroundColor: 'rgba(15,31,61,0.55)',
        justifyContent: 'center',
        alignItems: 'center',
        paddingHorizontal: 24,
    },
    dialog: {
        backgroundColor: C.surface,
        borderRadius: 20,
        padding: 28,
        width: '100%',
        maxWidth: 420,
        alignItems: 'center',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 12 },
        shadowOpacity: 0.2,
        shadowRadius: 24,
        elevation: 16,
    },
    closeBtn: {
        position: 'absolute',
        top: 14,
        right: 14,
        width: 28,
        height: 28,
        borderRadius: 8,
        backgroundColor: C.bg,
        borderWidth: 1,
        borderColor: C.border,
        justifyContent: 'center',
        alignItems: 'center',
    },
    iconCircle: {
        width: 64,
        height: 64,
        borderRadius: 20,
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: 18,
    },
    title: {
        fontSize: 20,
        fontWeight: '800',
        color: C.text,
        textAlign: 'center',
        marginBottom: 8,
    },
    message: {
        fontSize: 14,
        color: C.muted,
        textAlign: 'center',
        lineHeight: 22,
        marginBottom: 16,
        maxWidth: 300,
    },
    detailBox: {
        backgroundColor: C.bg,
        borderRadius: 12,
        paddingHorizontal: 14,
        paddingVertical: 10,
        marginBottom: 16,
        borderWidth: 1,
        borderColor: C.border,
        width: '100%',
    },
    detailText: {
        fontSize: 13,
        color: C.muted,
        lineHeight: 20,
    },
    actions: {
        flexDirection: 'row',
        gap: 10,
        width: '100%',
        marginTop: 4,
    },
    cancelBtn: {
        flex: 1,
        paddingVertical: 13,
        borderRadius: 12,
        borderWidth: 1.5,
        borderColor: C.border,
        backgroundColor: C.surface,
        alignItems: 'center',
    },
    cancelText: {
        fontSize: 14,
        fontWeight: '700',
        color: C.text,
    },
    confirmBtn: {
        flex: 1,
        paddingVertical: 13,
        borderRadius: 12,
        alignItems: 'center',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.18,
        shadowRadius: 8,
        elevation: 4,
    },
    confirmText: {
        fontSize: 14,
        fontWeight: '700',
        color: '#fff',
    },
});