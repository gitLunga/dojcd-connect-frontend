import React, { useMemo } from "react";
import { View, StyleSheet, useWindowDimensions, ScrollView } from "react-native";
import { screenSize, responsive } from "../utils/Responsive";

interface ResponsiveGridProps {
    children: React.ReactNode;
    columns?: number | { phone: number; tablet: number; desktop: number };
    spacing?: number | "none" | "sm" | "md" | "lg" | "xl";
    itemMinWidth?: number;
    maxWidth?: number | "100%";
    align?: "start" | "center" | "end" | "space-between";
    scrollable?: boolean;
    style?: any;
}

export const ResponsiveGrid: React.FC<ResponsiveGridProps> = ({
                                                                  children,
                                                                  columns = { phone: 1, tablet: 2, desktop: 3 },
                                                                  spacing = "md",
                                                                  itemMinWidth = 280,
                                                                  maxWidth = "100%",
                                                                  align = "center",
                                                                  scrollable = false,
                                                                  style,
                                                              }) => {
    const { width: windowWidth } = useWindowDimensions();

    // Determine spacing value
    const getSpacingValue = () => {
        if (typeof spacing === "number") return spacing;
        switch (spacing) {
            case "none": return 0;
            case "sm": return responsive.spacing.sm;
            case "md": return responsive.spacing.md;
            case "lg": return responsive.spacing.lg;
            case "xl": return responsive.spacing.xl;
            default: return responsive.spacing.md;
        }
    };

    // Determine column count based on device
    const getColumnCount = () => {
        if (typeof columns === "number") {
            // Dynamic column adjustment
            if (screenSize.isDesktop) return Math.max(columns, 3);
            if (screenSize.isTablet) return Math.max(columns, 2);
            return Math.max(columns, 1);
        } else {
            return screenSize.isDesktop
                ? columns.desktop
                : screenSize.isTablet
                    ? columns.tablet
                    : columns.phone;
        }
    };

    const spacingValue = getSpacingValue();
    const columnCount = getColumnCount();

    // Calculate item width
    const { itemWidth, actualColumns } = useMemo(() => {
        const containerWidth = Math.min(
            windowWidth - (responsive.layout.contentPadding?.horizontal ?? 0) * 2
            ,
            typeof maxWidth === "number" ? maxWidth : windowWidth
        );

        // For single column, take full width
        if (columnCount === 1) {
            return {
                itemWidth: containerWidth,
                actualColumns: 1,
            };
        }

        // Calculate optimal columns based on minimum width
        const availableWidth = containerWidth - spacingValue * (columnCount - 1);
        const calculatedItemWidth = availableWidth / columnCount;

        // Adjust columns if items would be too small
        let finalColumns = columnCount;
        if (calculatedItemWidth < itemMinWidth && columnCount > 1) {
            finalColumns = Math.max(
                1,
                Math.floor((containerWidth + spacingValue) / (itemMinWidth + spacingValue))
            );
        }

        const finalItemWidth = finalColumns === 1
            ? containerWidth
            : (containerWidth - spacingValue * (finalColumns - 1)) / finalColumns;

        return {
            itemWidth: finalItemWidth,
            actualColumns: finalColumns,
        };
    }, [windowWidth, columnCount, spacingValue, itemMinWidth, maxWidth]);

    // Container style based on alignment
    const containerStyle = useMemo(() => {
        const baseStyle = {
            gap: spacingValue,
            justifyContent: align === "space-between" ? "space-between" : "flex-start",
        };

        return [styles.container, baseStyle];
    }, [spacingValue, align]);

    // Item style
    const itemStyle = useMemo(() => {
        const style: any = {
            width: itemWidth,
            minWidth: itemMinWidth,
            flexGrow: actualColumns === 1 ? 1 : 0,
            flexShrink: 1,
        };

        // Add numeric maxWidth only when there are multiple columns
        if (actualColumns > 1) {
            style.maxWidth = itemWidth;
        }

        return style;
    }, [itemWidth, itemMinWidth, actualColumns]);



    const content = (
        <View style={[containerStyle, style]}>
            {React.Children.map(children, (child, index) => (
                <View key={index} style={itemStyle}>
                    {child}
                </View>
            ))}
        </View>
    );

    if (scrollable && screenSize.isPhone) {
        return (
            <ScrollView
                horizontal
                showsHorizontalScrollIndicator={false}
                style={styles.scrollContainer}
            >
                {content}
            </ScrollView>
        );
    }

    return content;
};

const styles = StyleSheet.create({
    container: {
        flexDirection: "row",
        flexWrap: "wrap",
        width: "100%",
    },
    scrollContainer: {
        width: "100%",
    },
});