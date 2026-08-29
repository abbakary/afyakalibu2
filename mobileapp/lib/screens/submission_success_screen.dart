import 'package:flutter/material.dart';
import 'package:google_fonts/google_fonts.dart';

import '../theme/skinlink_theme.dart';
import '../widgets/skinlink_widgets.dart';
import 'case_detail_screen.dart';
import 'home_shell.dart';

class SubmissionSuccessScreen extends StatelessWidget {
  const SubmissionSuccessScreen({
    super.key,
    required this.ref,
    required this.offline,
    this.caseId,
  });

  final String ref;
  final bool offline;
  final String? caseId;

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: SkinLinkColors.background,
      body: SafeArea(
        child: Padding(
          padding: const EdgeInsets.all(24),
          child: Column(
            mainAxisAlignment: MainAxisAlignment.center,
            children: [
              const SizedBox(height: 32),
              Container(
                width: 84,
                height: 84,
                decoration: BoxDecoration(
                  color: SkinLinkColors.successLight,
                  shape: BoxShape.circle,
                  border: Border.all(color: SkinLinkColors.success.withValues(alpha: 0.3), width: 2),
                ),
                child: Icon(
                  offline ? Icons.cloud_off : Icons.check_circle,
                  size: 48,
                  color: SkinLinkColors.success,
                ),
              ),
              const SizedBox(height: 24),
              Text(
                offline ? 'Saved as Local Draft' : 'Referral Submitted',
                style: GoogleFonts.manrope(
                  fontSize: 22,
                  fontWeight: FontWeight.w800,
                  color: SkinLinkColors.textPrimary,
                ),
                textAlign: TextAlign.center,
              ),
              const SizedBox(height: 8),
              Text(
                offline
                    ? 'Your referral has been saved locally and will automatically sync when network connectivity returns.'
                    : 'Secure submission confirmed. The case has been routed to the specialist queue.',
                textAlign: TextAlign.center,
                style: GoogleFonts.inter(fontSize: 13.5, color: SkinLinkColors.textMuted, height: 1.4),
              ),
              const SizedBox(height: 28),
              Container(
                width: double.infinity,
                padding: const EdgeInsets.all(18),
                decoration: BoxDecoration(
                  color: Colors.white,
                  borderRadius: BorderRadius.circular(16),
                  border: Border.all(color: SkinLinkColors.cardBorder),
                  boxShadow: [
                    BoxShadow(
                      color: Colors.black.withValues(alpha: 0.03),
                      blurRadius: 10,
                      offset: const Offset(0, 4),
                    ),
                  ],
                ),
                child: Column(
                  children: [
                    _row('Case Number', ref),
                    const Divider(color: SkinLinkColors.cardBorder, height: 20),
                    _row('Status', offline ? 'Draft (Offline)' : 'Submitted / In Queue'),
                    const Divider(color: SkinLinkColors.cardBorder, height: 20),
                    _row('Expected Response', offline ? 'Pending Sync' : '24–48 hours'),
                  ],
                ),
              ),
              const Spacer(),
              SkinLinkGradientButton(
                text: caseId != null ? 'View Case Review' : 'Back to Dashboard',
                onPressed: () {
                  if (caseId != null) {
                    Navigator.of(context).pushAndRemoveUntil(
                      MaterialPageRoute(builder: (_) => CaseDetailScreen(caseId: caseId!)),
                      (r) => r.isFirst,
                    );
                  } else {
                    Navigator.of(context).pushAndRemoveUntil(
                      MaterialPageRoute(builder: (_) => const HomeShell()),
                      (r) => false,
                    );
                  }
                },
              ),
              const SizedBox(height: 16),
            ],
          ),
        ),
      ),
    );
  }

  Widget _row(String label, String value) {
    return Row(
      mainAxisAlignment: MainAxisAlignment.spaceBetween,
      children: [
        Text(label, style: GoogleFonts.inter(color: SkinLinkColors.textMuted, fontSize: 13, fontWeight: FontWeight.w500)),
        Text(value, style: GoogleFonts.inter(fontWeight: FontWeight.w700, fontSize: 13.5, color: SkinLinkColors.textPrimary)),
      ],
    );
  }
}

