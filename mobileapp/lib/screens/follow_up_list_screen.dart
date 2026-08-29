import 'package:flutter/material.dart';
import 'package:google_fonts/google_fonts.dart';
import 'package:provider/provider.dart';

import '../providers/app_state.dart';
import '../theme/skinlink_theme.dart';
import 'case_detail_screen.dart';

class FollowUpListScreen extends StatelessWidget {
  const FollowUpListScreen({super.key});

  @override
  Widget build(BuildContext context) {
    final state = context.watch<AppState>();
    final followUps = state.followUps;

    return Scaffold(
      backgroundColor: SkinLinkColors.background,
      appBar: AppBar(
        backgroundColor: SkinLinkColors.primary,
        elevation: 0,
        title: Text(
          'Follow-Up Schedules',
          style: GoogleFonts.manrope(
            fontSize: 18,
            fontWeight: FontWeight.w800,
            color: Colors.white,
          ),
        ),
        centerTitle: true,
      ),
      body: followUps.isEmpty
          ? Center(
              child: Column(
                mainAxisAlignment: MainAxisAlignment.center,
                children: [
                  Icon(Icons.event_available_outlined, size: 48, color: SkinLinkColors.textMuted.withValues(alpha: 0.5)),
                  const SizedBox(height: 12),
                  Text(
                    'No pending follow-ups',
                    style: GoogleFonts.manrope(fontSize: 16, fontWeight: FontWeight.w700, color: SkinLinkColors.textPrimary),
                  ),
                  const SizedBox(height: 6),
                  Text(
                    'Patient follow-up reviews will appear here when due.',
                    style: GoogleFonts.inter(fontSize: 13, color: SkinLinkColors.textMuted),
                  ),
                ],
              ),
            )
          : ListView.builder(
              padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 14),
              itemCount: followUps.length,
              itemBuilder: (_, i) {
                final f = followUps[i];
                final dermCase = state.caseById(f.caseId);
                final hasFeedback = dermCase?.hasSpecialistFollowUpFeedback ?? false;
                final hasReport = dermCase?.hasFollowUpReport ?? false;

                String badgeText = f.status.toUpperCase();
                Color badgeBg = SkinLinkColors.warningLight;
                Color badgeColor = SkinLinkColors.warning;

                if (hasFeedback) {
                  badgeText = 'SPECIALIST RESPONDED';
                  badgeBg = SkinLinkColors.successLight;
                  badgeColor = SkinLinkColors.success;
                } else if (hasReport) {
                  badgeText = 'AWAITING REVIEW';
                  badgeBg = const Color(0xFFEFF6FF);
                  badgeColor = const Color(0xFF1D4ED8);
                } else if (f.status == 'due' || f.status == 'overdue') {
                  badgeText = f.status.toUpperCase();
                  badgeBg = SkinLinkColors.warningLight;
                  badgeColor = SkinLinkColors.warning;
                }

                String subtitleText = '${f.caseRef} · ${f.purpose}';
                if (hasFeedback && dermCase?.specialistFollowUpFeedback != null) {
                  subtitleText = 'Specialist: ${dermCase!.specialistFollowUpFeedback}';
                } else if (f.outcome != null && f.outcome!.isNotEmpty) {
                  subtitleText = f.outcome!.split('\n').first;
                }

                return Container(
                  margin: const EdgeInsets.only(bottom: 10),
                  decoration: BoxDecoration(
                    color: Colors.white,
                    borderRadius: BorderRadius.circular(12),
                    border: Border.all(color: SkinLinkColors.cardBorder),
                    boxShadow: [
                      BoxShadow(
                        color: Colors.black.withValues(alpha: 0.03),
                        blurRadius: 6,
                        offset: const Offset(0, 2),
                      ),
                    ],
                  ),
                  child: ListTile(
                    onTap: () => Navigator.of(context).push(
                      MaterialPageRoute(builder: (_) => CaseDetailScreen(caseId: f.caseId)),
                    ),
                    title: Text(
                      f.patientName,
                      style: GoogleFonts.manrope(fontWeight: FontWeight.w700, fontSize: 14.5),
                    ),
                    subtitle: Text(
                      subtitleText,
                      style: GoogleFonts.inter(fontSize: 12, color: SkinLinkColors.textMuted),
                      maxLines: 2,
                      overflow: TextOverflow.ellipsis,
                    ),
                    trailing: Container(
                      padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 4),
                      decoration: BoxDecoration(
                        color: badgeBg,
                        borderRadius: BorderRadius.circular(12),
                        border: Border.all(
                          color: badgeColor.withValues(alpha: 0.3),
                        ),
                      ),
                      child: Text(
                        badgeText,
                        style: GoogleFonts.inter(
                          fontSize: 10,
                          color: badgeColor,
                          fontWeight: FontWeight.w700,
                        ),
                      ),
                    ),
                  ),
                );
              },
            ),
    );
  }
}

