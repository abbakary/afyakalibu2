import 'package:flutter/material.dart';
import 'package:google_fonts/google_fonts.dart';
import 'package:provider/provider.dart';

import '../providers/app_state.dart';
import '../theme/skinlink_theme.dart';
import '../widgets/skinlink_widgets.dart';
import 'home_shell.dart';

class LoginScreen extends StatefulWidget {
  const LoginScreen({super.key});

  @override
  State<LoginScreen> createState() => _LoginScreenState();
}

class _LoginScreenState extends State<LoginScreen> {
  final _email = TextEditingController(text: 'neema@mwanzahealth.org');
  final _password = TextEditingController(text: 'clinic123');
  bool _obscure = true;

  @override
  void dispose() {
    _email.dispose();
    _password.dispose();
    super.dispose();
  }

  Future<void> _signIn() async {
    final state = context.read<AppState>();
    final ok = await state.login(_email.text.trim(), _password.text);
    if (!mounted) return;
    if (ok) {
      Navigator.of(context).pushReplacement(
        MaterialPageRoute(builder: (_) => const HomeShell()),
      );
    } else {
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(
          content: Text(state.error ?? 'Sign in failed. Check credentials.'),
          backgroundColor: SkinLinkColors.destructive,
        ),
      );
    }
  }

  void _showSignUpInfo() {
    showModalBottomSheet(
      context: context,
      shape: const RoundedRectangleBorder(
        borderRadius: BorderRadius.vertical(top: Radius.circular(20)),
      ),
      builder: (ctx) => Padding(
        padding: const EdgeInsets.all(24),
        child: Column(
          mainAxisSize: MainAxisSize.min,
          crossAxisAlignment: CrossAxisAlignment.stretch,
          children: [
            Text(
              'Clinic Registration',
              style: Theme.of(ctx).textTheme.titleLarge,
              textAlign: TextAlign.center,
            ),
            const SizedBox(height: 12),
            Text(
              'SkinLink is currently available to verified community health workers and clinic partners. To request access for your health facility, please contact your regional coordinator or administrator.',
              style: Theme.of(ctx).textTheme.bodyMedium?.copyWith(color: SkinLinkColors.textMuted, height: 1.4),
              textAlign: TextAlign.center,
            ),
            const SizedBox(height: 20),
            SkinLinkGradientButton(
              text: 'Got it',
              onPressed: () => Navigator.pop(ctx),
            ),
          ],
        ),
      ),
    );
  }

  void _showForgotPasswordInfo() {
    showModalBottomSheet(
      context: context,
      shape: const RoundedRectangleBorder(
        borderRadius: BorderRadius.vertical(top: Radius.circular(20)),
      ),
      builder: (ctx) => Padding(
        padding: const EdgeInsets.all(24),
        child: Column(
          mainAxisSize: MainAxisSize.min,
          crossAxisAlignment: CrossAxisAlignment.stretch,
          children: [
            Text(
              'Reset Password',
              style: Theme.of(ctx).textTheme.titleLarge,
              textAlign: TextAlign.center,
            ),
            const SizedBox(height: 12),
            Text(
              'Password reset instructions will be coordinated through your clinic administrator. You can also use demo credentials: neema@mwanzahealth.org / clinic123.',
              style: Theme.of(ctx).textTheme.bodyMedium?.copyWith(color: SkinLinkColors.textMuted, height: 1.4),
              textAlign: TextAlign.center,
            ),
            const SizedBox(height: 20),
            SkinLinkGradientButton(
              text: 'Close',
              onPressed: () => Navigator.pop(ctx),
            ),
          ],
        ),
      ),
    );
  }

  @override
  Widget build(BuildContext context) {
    final loading = context.select((AppState s) => s.loading);

    return Scaffold(
      backgroundColor: SkinLinkColors.background,
      body: Stack(
        children: [
          // Top Teal Gradient Header
          Container(
            height: MediaQuery.of(context).size.height * 0.42,
            width: double.infinity,
            decoration: const BoxDecoration(
              gradient: SkinLinkColors.headerGradient,
            ),
            child: SafeArea(
              child: Column(
                children: [
                  const SizedBox(height: 36),
                  Text(
                    'SkinLink',
                    style: GoogleFonts.manrope(
                      fontSize: 34,
                      fontWeight: FontWeight.w800,
                      color: Colors.white,
                      letterSpacing: -0.5,
                    ),
                  ),
                  const SizedBox(height: 4),
                  Text(
                    'Connecting Clinics to Specialists',
                    style: GoogleFonts.inter(
                      fontSize: 13.5,
                      fontWeight: FontWeight.w400,
                      color: Colors.white.withValues(alpha: 0.9),
                    ),
                  ),
                ],
              ),
            ),
          ),

          // Main Scrollable Body
          SafeArea(
            child: SingleChildScrollView(
              padding: const EdgeInsets.symmetric(horizontal: 20),
              child: Column(
                children: [
                  SizedBox(height: MediaQuery.of(context).size.height * 0.22),
                  // Floating White Card
                  Container(
                    padding: const EdgeInsets.symmetric(horizontal: 20, vertical: 24),
                    decoration: BoxDecoration(
                      color: Colors.white,
                      borderRadius: BorderRadius.circular(20),
                      border: Border.all(color: SkinLinkColors.cardBorder),
                      boxShadow: [
                        BoxShadow(
                          color: Colors.black.withValues(alpha: 0.08),
                          blurRadius: 20,
                          offset: const Offset(0, 8),
                        ),
                      ],
                    ),
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.stretch,
                      children: [
                        // Email Label & Input
                        Text(
                          'Email',
                          style: GoogleFonts.inter(
                            fontSize: 13.5,
                            fontWeight: FontWeight.w700,
                            color: SkinLinkColors.textPrimary,
                          ),
                        ),
                        const SizedBox(height: 6),
                        TextField(
                          controller: _email,
                          keyboardType: TextInputType.emailAddress,
                          style: GoogleFonts.inter(fontSize: 14, color: SkinLinkColors.textPrimary),
                          decoration: InputDecoration(
                            hintText: 'Enter your email',
                            prefixIcon: const Icon(Icons.email_outlined, size: 20, color: SkinLinkColors.textMuted),
                          ),
                        ),
                        const SizedBox(height: 18),

                        // Password Label & Input
                        Text(
                          'Password',
                          style: GoogleFonts.inter(
                            fontSize: 13.5,
                            fontWeight: FontWeight.w700,
                            color: SkinLinkColors.textPrimary,
                          ),
                        ),
                        const SizedBox(height: 6),
                        TextField(
                          controller: _password,
                          obscureText: _obscure,
                          style: GoogleFonts.inter(fontSize: 14, color: SkinLinkColors.textPrimary),
                          decoration: InputDecoration(
                            hintText: 'Enter your password',
                            prefixIcon: const Icon(Icons.lock_outline, size: 20, color: SkinLinkColors.textMuted),
                            suffixIcon: IconButton(
                              icon: Icon(
                                _obscure ? Icons.visibility_off_outlined : Icons.visibility_outlined,
                                size: 20,
                                color: SkinLinkColors.textMuted,
                              ),
                              onPressed: () => setState(() => _obscure = !_obscure),
                            ),
                          ),
                        ),
                        const SizedBox(height: 20),

                        // Orange Gradient Login Button
                        SkinLinkGradientButton(
                          text: 'Login',
                          loading: loading,
                          onPressed: loading ? null : _signIn,
                        ),
                        const SizedBox(height: 12),

                        // Forgot Password Link
                        Center(
                          child: TextButton(
                            onPressed: _showForgotPasswordInfo,
                            style: TextButton.styleFrom(
                              padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 6),
                              minimumSize: Size.zero,
                            ),
                            child: Text(
                              'Forgot Password?',
                              style: GoogleFonts.inter(
                                fontSize: 13,
                                fontWeight: FontWeight.w600,
                                color: SkinLinkColors.textPrimary,
                              ),
                            ),
                          ),
                        ),
                        const SizedBox(height: 8),

                        // Divider Line
                        const Divider(color: SkinLinkColors.cardBorder, height: 1),
                        const SizedBox(height: 16),

                        // Outlined Sign Up Button
                        SkinLinkOutlinedButton(
                          text: 'Sign Up',
                          onPressed: _showSignUpInfo,
                        ),
                      ],
                    ),
                  ),

                  const SizedBox(height: 20),
                  // Bottom Helper Text
                  Text(
                    'Demo Account: neema@mwanzahealth.org / clinic123',
                    textAlign: TextAlign.center,
                    style: GoogleFonts.inter(
                      fontSize: 12,
                      fontWeight: FontWeight.w500,
                      color: SkinLinkColors.textMuted,
                    ),
                  ),
                  const SizedBox(height: 24),
                ],
              ),
            ),
          ),
        ],
      ),
    );
  }
}

