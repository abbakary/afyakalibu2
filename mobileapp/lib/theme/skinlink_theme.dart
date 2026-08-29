import 'package:flutter/material.dart';
import 'package:google_fonts/google_fonts.dart';

class SkinLinkColors {
  // Primary Teal Palette (Headers, AppBars, Brand)
  static const primary = Color(0xFF0A7079);
  static const primaryDark = Color(0xFF07545B);
  static const primaryLight = Color(0xFF0E7A86);
  static const teal = Color(0xFF0D9488);
  static const tealDark = Color(0xFF065F60);
  static const tealLight = Color(0xFFEBF5F8);
  static const tealBorder = Color(0xFFB4E4EA);

  // Vibrant Orange / Coral Palette (Buttons, Alerts, Highlights)
  static const orange = Color(0xFFFF7A1A);
  static const orangeDark = Color(0xFFEA580C);
  static const orangeLight = Color(0xFFFFF3EB);
  static const orangeBadge = Color(0xFFFF6B2C);

  // Neutral Surface & Background
  static const background = Color(0xFFF1F5F9);
  static const surface = Colors.white;
  static const cardBorder = Color(0xFFE2E8F0);
  static const border = Color(0xFFE2E8F0);
  static const inputBg = Color(0xFFF8FAFC);
  static const textPrimary = Color(0xFF1E293B);
  static const textMuted = Color(0xFF64748B);
  static const textLight = Color(0xFF94A3B8);
  static const navy = Color(0xFF07545B);

  // Status & Feedback Colors
  static const success = Color(0xFF16A34A);
  static const successLight = Color(0xFFDCFCE7);
  static const warning = Color(0xFFF59E0B);
  static const warningLight = Color(0xFFFEF3C7);
  static const destructive = Color(0xFFEF4444);
  static const danger = Color(0xFFEF4444);

  // Gradients
  static const headerGradient = LinearGradient(
    begin: Alignment.topCenter,
    end: Alignment.bottomCenter,
    colors: [Color(0xFF07545B), Color(0xFF0E7A86)],
  );

  static const orangeGradient = LinearGradient(
    begin: Alignment.centerLeft,
    end: Alignment.centerRight,
    colors: [Color(0xFFFF7A1A), Color(0xFFEA580C)],
  );

  static const buttonGradient = LinearGradient(
    begin: Alignment.centerLeft,
    end: Alignment.centerRight,
    colors: [Color(0xFFFF7A1A), Color(0xFFEA580C)],
  );
}

ThemeData buildSkinLinkTheme() {
  final base = ThemeData(
    useMaterial3: true,
    colorScheme: ColorScheme.fromSeed(
      seedColor: SkinLinkColors.primary,
      primary: SkinLinkColors.primary,
      secondary: SkinLinkColors.orange,
      surface: SkinLinkColors.surface,
      onPrimary: Colors.white,
    ),
    scaffoldBackgroundColor: SkinLinkColors.background,
  );

  return base.copyWith(
    textTheme: GoogleFonts.interTextTheme(base.textTheme).copyWith(
      headlineMedium: GoogleFonts.manrope(
        fontWeight: FontWeight.w700,
        color: SkinLinkColors.textPrimary,
        fontSize: 24,
      ),
      headlineSmall: GoogleFonts.manrope(
        fontWeight: FontWeight.w700,
        color: SkinLinkColors.textPrimary,
        fontSize: 20,
      ),
      titleLarge: GoogleFonts.manrope(
        fontWeight: FontWeight.w700,
        color: SkinLinkColors.textPrimary,
        fontSize: 18,
      ),
      titleMedium: GoogleFonts.manrope(
        fontWeight: FontWeight.w600,
        color: SkinLinkColors.textPrimary,
        fontSize: 16,
      ),
      titleSmall: GoogleFonts.manrope(
        fontWeight: FontWeight.w600,
        color: SkinLinkColors.textPrimary,
        fontSize: 14,
      ),
      bodyLarge: GoogleFonts.inter(
        color: SkinLinkColors.textPrimary,
        fontSize: 15,
      ),
      bodyMedium: GoogleFonts.inter(
        color: SkinLinkColors.textPrimary,
        fontSize: 14,
      ),
      bodySmall: GoogleFonts.inter(
        color: SkinLinkColors.textMuted,
        fontSize: 12,
      ),
      labelLarge: GoogleFonts.inter(
        fontWeight: FontWeight.w600,
        fontSize: 14,
      ),
    ),
    appBarTheme: AppBarTheme(
      backgroundColor: SkinLinkColors.primary,
      foregroundColor: Colors.white,
      elevation: 0,
      centerTitle: true,
      iconTheme: const IconThemeData(color: Colors.white),
      actionsIconTheme: const IconThemeData(color: Colors.white),
      titleTextStyle: GoogleFonts.manrope(
        fontSize: 18,
        fontWeight: FontWeight.w700,
        color: Colors.white,
        letterSpacing: 0.2,
      ),
    ),
    elevatedButtonTheme: ElevatedButtonThemeData(
      style: ElevatedButton.styleFrom(
        backgroundColor: SkinLinkColors.orange,
        foregroundColor: Colors.white,
        minimumSize: const Size(double.infinity, 48),
        shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(10)),
        elevation: 0,
        textStyle: GoogleFonts.inter(fontWeight: FontWeight.w700, fontSize: 15),
      ),
    ),
    outlinedButtonTheme: OutlinedButtonThemeData(
      style: OutlinedButton.styleFrom(
        foregroundColor: SkinLinkColors.primary,
        minimumSize: const Size(double.infinity, 48),
        shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(10)),
        side: const BorderSide(color: SkinLinkColors.primary, width: 1.5),
        textStyle: GoogleFonts.inter(fontWeight: FontWeight.w600, fontSize: 15),
      ),
    ),
    inputDecorationTheme: InputDecorationTheme(
      filled: true,
      fillColor: SkinLinkColors.inputBg,
      contentPadding: const EdgeInsets.symmetric(horizontal: 14, vertical: 12),
      border: OutlineInputBorder(
        borderRadius: BorderRadius.circular(8),
        borderSide: const BorderSide(color: SkinLinkColors.cardBorder),
      ),
      enabledBorder: OutlineInputBorder(
        borderRadius: BorderRadius.circular(8),
        borderSide: const BorderSide(color: SkinLinkColors.cardBorder),
      ),
      focusedBorder: OutlineInputBorder(
        borderRadius: BorderRadius.circular(8),
        borderSide: const BorderSide(color: SkinLinkColors.primary, width: 1.8),
      ),
      hintStyle: GoogleFonts.inter(
        color: SkinLinkColors.textLight,
        fontSize: 13,
        fontWeight: FontWeight.w400,
      ),
      labelStyle: GoogleFonts.inter(
        color: SkinLinkColors.textPrimary,
        fontSize: 13,
        fontWeight: FontWeight.w600,
      ),
    ),
    cardTheme: CardThemeData(
      color: SkinLinkColors.surface,
      elevation: 0,
      margin: EdgeInsets.zero,
      shape: RoundedRectangleBorder(
        borderRadius: BorderRadius.circular(12),
        side: const BorderSide(color: SkinLinkColors.cardBorder),
      ),
    ),
    bottomNavigationBarTheme: const BottomNavigationBarThemeData(
      backgroundColor: SkinLinkColors.surface,
      selectedItemColor: SkinLinkColors.primary,
      unselectedItemColor: SkinLinkColors.textMuted,
      type: BottomNavigationBarType.fixed,
      elevation: 8,
      selectedLabelStyle: TextStyle(fontWeight: FontWeight.w600, fontSize: 12),
      unselectedLabelStyle: TextStyle(fontWeight: FontWeight.w500, fontSize: 12),
    ),
    checkboxTheme: CheckboxThemeData(
      shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(4)),
      fillColor: WidgetStateProperty.resolveWith(
        (s) => s.contains(WidgetState.selected) ? SkinLinkColors.primary : null,
      ),
    ),
  );
}
