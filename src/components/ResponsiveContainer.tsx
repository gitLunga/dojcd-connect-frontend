import React from "react";
import { View, StyleSheet, ScrollView, useWindowDimensions } from "react-native";
import { responsive, screenSize } from "../utils/Responsive";

interface ResponsiveContainerProps {
    children: React.ReactNode;
    fullWidth?: boolean;
    centered?: boolean;
    scrollable?: boolean;
    safeArea?: boolean;
    style?: any;
}

export const ResponsiveContainer: React.FC<ResponsiveContainerProps> = ({
                                                                            children,
                                                                            fullWidth = false,
                                                                            centered = false,
                                                                            scrollable = false,
                                                                            safeArea = true,
                                                                            style,
                                                                        }) => {
    const containerStyle = [
        styles.container,
        {
            maxWidth: fullWidth ? "100%" : responsive.layout.maxContentWidth,
            paddingHorizontal: responsive.layout.contentPadding.horizontal,
            paddingVertical: safeArea ? responsive.layout.contentPadding.vertical : 0,
            alignItems: centered ? "center" : "stretch",
        },
        style,
    ];

    const content = <View style={containerStyle}>{children}</View>;

    if (scrollable) {
        return (
            <ScrollView
                contentContainerStyle={styles.scrollContent}
                showsVerticalScrollIndicator={screenSize.isDesktop}
            >
                {content}
            </ScrollView>
        );
    }

    return content;
};

const styles = StyleSheet.create({
    container: {
        width: "100%",
        marginHorizontal: "auto",
    },
    scrollContent: {
        flexGrow: 1,
    },
});