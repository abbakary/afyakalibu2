import 'package:flutter/material.dart';
import 'package:google_fonts/google_fonts.dart';
import 'package:provider/provider.dart';

import '../providers/app_state.dart';
import '../theme/skinlink_theme.dart';
import '../widgets/skinlink_widgets.dart';
import 'case_detail_screen.dart';
import 'new_referral_screen.dart';

class ReferralsScreen extends StatelessWidget {
  const ReferralsScreen({super.key});

  @override
  Widget build(BuildContext context) {
    final cases = context.select((AppState s) => s.cases);

    return Scaffold(
      backgroundColor: SkinLinkColors.background,
      appBar: AppBar(
        backgroundColor: SkinLinkColors.primary,
        elevation: 0,
        title: Text(
          'Referrals',
          style: GoogleFonts.manrope(
            fontSize: 18,
            fontWeight: FontWeight.w800,
            color: Colors.white,
          ),
        ),
        centerTitle: true,
        actions: [
          IconButton(
            icon: const Icon(Icons.add, color: Colors.white),
            onPressed: () => Navigator.of(context).push(
              MaterialPageRoute(builder: (_) => const NewReferralScreen()),
            ),
          ),
        ],
      ),
      body: cases.isEmpty
          ? Center(
              child: Column(
                mainAxisAlignment: MainAxisAlignment.center,
                children: [
                  Icon(Icons.inbox_outlined, size: 48, color: SkinLinkColors.textMuted.withValues(alpha: 0.5)),
                  const SizedBox(height: 12),
                  Text(
                    'No active referrals',
                    style: GoogleFonts.manrope(fontSize: 16, fontWeight: FontWeight.w700, color: SkinLinkColors.textPrimary),
                  ),
                  const SizedBox(height: 6),
                  Text(
                    'Tap "New Case" to submit your first tele-dermatology referral.',
                    style: GoogleFonts.inter(fontSize: 13, color: SkinLinkColors.textMuted),
                    textAlign: TextAlign.center,
                  ),
                  const SizedBox(height: 16),
                  Padding(
                    padding: const EdgeInsets.symmetric(horizontal: 32),
                    child: SkinLinkGradientButton(
                      text: 'Create New Referral',
                      onPressed: () => Navigator.of(context).push(
                        MaterialPageRoute(builder: (_) => const NewReferralScreen()),
                      ),
                    ),
                  ),
                ],
              ),
            )
          : ListView.builder(
              padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 14),
              itemCount: cases.length,
              itemBuilder: (_, i) {
                final c = cases[i];
                final appState = context.read<AppState>();
                final patient = appState.patientById(c.patientId);
                final patientName = patient?.fullName ?? 'Patient';
                final isWaiting = c.status == 'new' || c.status == 'draft';
                final statusStr = isWaiting
                    ? 'Waiting for Review · ${c.primaryConcern.isNotEmpty ? c.primaryConcern : 'Pending Review'}'
                    : '${statusLabel(c.status)} · ${c.suspectedCondition.isNotEmpty ? c.suspectedCondition : 'Clinical Case'}';
                final statusColor = isWaiting ? SkinLinkColors.orangeBadge : SkinLinkColors.teal;
                final imgUrl = c.images.isNotEmpty ? (c.images.first['url'] as String?) : null;

                return ReferralQueueCard(
                  patientName: patientName,
                  statusText: statusStr,
                  statusColor: statusColor,
                  imageUrl: imgUrl,
                  onTap: () => Navigator.of(context).push(
                    MaterialPageRoute(builder: (_) => CaseDetailScreen(caseId: c.id)),
                  ),
                );
              },
            ),
    );
  }
}

