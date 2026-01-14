import { Dimensions, Platform, PixelRatio, type ScaledSize } from "react-native";

const { width, height }: ScaledSize = Dimensions.get("window");

// Guideline sizes for different device categories
const guidelineBaseWidth: number = 375;
const guidelineBaseHeight: number = 812;

// Breakpoints for responsive design
export const breakpoints = {
    xs: 320,   // Small phones
    sm: 375,   // Medium phones
    md: 768,   // Tablets
    lg: 1024,  // Small desktops/laptops
    xl: 1280,  // Large desktops
    "2xl": 1536, // Extra large desktops
};

// Enhanced screen size classification
export const screenSize = {
    // Width-based classification
    isExtraSmall: width < breakpoints.xs,
    isSmall: width >= breakpoints.xs && width < breakpoints.sm,
    isMedium: width >= breakpoints.sm && width < breakpoints.md,
    isLarge: width >= breakpoints.md && width < breakpoints.lg,
    isExtraLarge: width >= breakpoints.lg && width < breakpoints.xl,
    isXXLarge: width >= breakpoints.xl,

    // Device type classification
    isPhone: width < breakpoints.md,
    isTablet: width >= breakpoints.md && width < breakpoints.lg,
    isDesktop: width >= breakpoints.lg,

    // Height considerations
    isTall: height > 800,
    isShort: height < 600,

    // Platform detection
    isIOS: Platform.OS === "ios",
    isAndroid: Platform.OS === "android",
    isWeb: Platform.OS === "web",

    // Current width and height
    width,
    height,
    aspectRatio: width / height,
};

// Responsive scale function with breakpoints
export const scale = (size: number): number => {
    const scaleFactor = width / guidelineBaseWidth;
    const scaledSize = size * scaleFactor;

    // Ensure minimum and maximum sizes
    const minSize = size * 0.8; // Don't scale below 80%
    const maxSize = size * 1.5; // Don't scale above 150%

    return PixelRatio.roundToNearestPixel(
        Math.max(minSize, Math.min(scaledSize, maxSize))
    );
};

// Enhanced vertical scale
export const verticalScale = (size: number): number => {
    const scaleFactor = height / guidelineBaseHeight;
    const scaledSize = size * scaleFactor;

    const minSize = size * 0.8;
    const maxSize = size * 1.5;

    return PixelRatio.roundToNearestPixel(
        Math.max(minSize, Math.min(scaledSize, maxSize))
    );
};

// Enhanced moderate scale with dynamic factor
export const moderateScale = (size: number, factor = 0.5): number => {
    const scaledSize = scale(size);
    return size + (scaledSize - size) * factor;
};

// Breakpoint-based responsive values
export const responsive = {
    // Font scaling with breakpoints
    fontSize: {
        xs: scale(10),
        sm: scale(12),
        base: screenSize.isDesktop ? 16 : scale(14),
        lg: screenSize.isDesktop ? 18 : scale(16),
        xl: screenSize.isDesktop ? 20 : scale(18),
        "2xl": screenSize.isDesktop ? 24 : scale(20),
        "3xl": screenSize.isDesktop ? 30 : scale(24),
        "4xl": screenSize.isDesktop ? 36 : scale(30),
        "5xl": screenSize.isDesktop ? 48 : scale(36),

        // Dynamic font size based on screen width
        dynamic: (baseSize: number) => {
            if (screenSize.isDesktop) return baseSize * 1.25;
            if (screenSize.isTablet) return baseSize * 1.1;
            return scale(baseSize);
        },
    },

    // Spacing scale
    spacing: {
        xs: screenSize.isDesktop ? 6 : scale(4),
        sm: screenSize.isDesktop ? 10 : scale(8),
        md: screenSize.isDesktop ? 16 : scale(12),
        lg: screenSize.isDesktop ? 24 : scale(16),
        xl: screenSize.isDesktop ? 32 : scale(24),
        "2xl": screenSize.isDesktop ? 48 : scale(32),
        "3xl": screenSize.isDesktop ? 64 : scale(48),
        "4xl": screenSize.isDesktop ? 96 : scale(64),

        // Dynamic spacing
        dynamic: (baseSpacing: number) => {
            if (screenSize.isDesktop) return baseSpacing * 1.5;
            if (screenSize.isTablet) return baseSpacing * 1.25;
            return scale(baseSpacing);
        },
    },

    // Layout configurations
    layout: {
        maxContentWidth: screenSize.isDesktop ? 1200 :
            screenSize.isTablet ? 800 :
                "100%",

        contentPadding: {
            horizontal: Platform.select({
                ios: screenSize.isDesktop ? 48 : screenSize.isTablet ? 32 : 16,
                android: screenSize.isDesktop ? 48 : screenSize.isTablet ? 32 : 16,
                web: screenSize.isDesktop ? 64 : screenSize.isTablet ? 48 : 24,
            }),
            vertical: Platform.select({
                ios: screenSize.isDesktop ? 32 : screenSize.isTablet ? 24 : 16,
                android: screenSize.isDesktop ? 32 : screenSize.isTablet ? 24 : 16,
                web: screenSize.isDesktop ? 48 : screenSize.isTablet ? 32 : 16,
            }),
        },

        sectionSpacing: screenSize.isDesktop ? 96 :
            screenSize.isTablet ? 64 :
                48,
    },

    // Responsive grid configuration
    grid: {
        columns: () => {
            if (screenSize.isDesktop) return 12;
            if (screenSize.isTablet) return 8;
            return 4;
        },
        gutter: screenSize.isDesktop ? 32 :
            screenSize.isTablet ? 24 :
                16,
    },
};

// Platform-specific styles
export const platformStyle = Platform.select({
    ios: {
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: screenSize.isDesktop ? 6 : 4,
    },
    android: {
        elevation: screenSize.isDesktop ? 6 : 4,
    },
    web: {
        boxShadow: screenSize.isDesktop
            ? "0 4px 20px rgba(0, 0, 0, 0.1)"
            : "0 2px 8px rgba(0, 0, 0, 0.1)",
        cursor: "pointer",
        transition: "all 0.3s ease",
    },
});

// Platform-specific fonts
export const platformFont = Platform.select({
    ios: {
        fontFamily: "-apple-system, BlinkMacSystemFont, 'SF Pro Display', sans-serif",
        letterSpacing: -0.2,
    },
    android: {
        fontFamily: "'Roboto', 'Noto Sans', sans-serif",
    },
    web: {
        fontFamily: "system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif",
        WebkitFontSmoothing: "antialiased",
        MozOsxFontSmoothing: "grayscale",
    },
});

// Media query helper for web
export const mediaQuery = {
    minWidth: (breakpoint: number) => `@media (min-width: ${breakpoint}px)`,
    maxWidth: (breakpoint: number) => `@media (max-width: ${breakpoint}px)`,
    between: (min: number, max: number) =>
        `@media (min-width: ${min}px) and (max-width: ${max}px)`,
};

// Hook-like utilities
export const useResponsiveValue = <T>(
    phoneValue: T,
    tabletValue: T,
    desktopValue: T
): T => {
    if (screenSize.isDesktop) return desktopValue;
    if (screenSize.isTablet) return tabletValue;
    return phoneValue;
};

export default {
    scale,
    verticalScale,
    moderateScale,
    responsive,
    screenSize,
    breakpoints,
    platformStyle,
    platformFont,
    mediaQuery,
    useResponsiveValue,
    width,
    height,
};