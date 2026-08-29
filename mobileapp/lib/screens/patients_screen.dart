import 'package:flutter/material.dart';
import 'package:google_fonts/google_fonts.dart';
import 'package:provider/provider.dart';

import '../providers/app_state.dart';
import '../theme/skinlink_theme.dart';
import 'new_referral_screen.dart';

class PatientsScreen extends StatelessWidget {
  const PatientsScreen({super.key});

  @override
  Widget build(BuildContext context) {
    final patients = context.select((AppState s) => s.patients);

    return Scaffold(
      backgroundColor: SkinLinkColors.background,
      appBar: AppBar(
        backgroundColor: SkinLinkColors.primary,
        elevation: 0,
        title: Text(
          'Patients Directory',
          style: GoogleFonts.manrope(
            fontSize: 18,
            fontWeight: FontWeight.w800,
            color: Colors.white,
          ),
        ),
        centerTitle: true,
      ),
      body: patients.isEmpty
          ? Center(
              child: Column(
                mainAxisAlignment: MainAxisAlignment.center,
                children: [
                  Icon(Icons.people_outline, size: 48, color: SkinLinkColors.textMuted.withValues(alpha: 0.5)),
                  const SizedBox(height: 12),
                  Text(
                    'No registered patients yet',
                    style: GoogleFonts.manrope(fontSize: 16, fontWeight: FontWeight.w700, color: SkinLinkColors.textPrimary),
                  ),
                  const SizedBox(height: 6),
                  Text(
                    'Patients are registered when creating a new referral.',
                    style: GoogleFonts.inter(fontSize: 13, color: SkinLinkColors.textMuted),
                  ),
                ],
              ),
            )
          : ListView.builder(
              padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 14),
              itemCount: patients.length,
              itemBuilder: (_, i) {
                final p = patients[i];
                return Container(
                  margin: const EdgeInsets.only(bottom: 10),
                  padding: const EdgeInsets.all(12),
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
                  child: Row(
                    children: [
                      CircleAvatar(
                        radius: 22,
                        backgroundColor: SkinLinkColors.tealLight,
                        child: Text(
                          p.fullName.isNotEmpty ? p.fullName[0] : 'P',
                          style: GoogleFonts.manrope(
                            color: SkinLinkColors.primary,
                            fontWeight: FontWeight.w800,
                            fontSize: 16,
                          ),
                        ),
                      ),
                      const SizedBox(width: 12),
                      Expanded(
                        child: Column(
                          crossAxisAlignment: CrossAxisAlignment.start,
                          children: [
                            Text(
                              p.fullName,
                              style: GoogleFonts.manrope(
                                fontSize: 14.5,
                                fontWeight: FontWeight.w700,
                                color: SkinLinkColors.textPrimary,
                              ),
                            ),
                            const SizedBox(height: 2),
                            Text(
                              '${p.code} · ${p.village}, ${p.region} · ${p.age} yrs / ${p.gender}',
                              style: GoogleFonts.inter(
                                fontSize: 11.5,
                                color: SkinLinkColors.textMuted,
                              ),
                            ),
                          ],
                        ),
                      ),
                      IconButton(
                        icon: const Icon(Icons.add_circle_outline, color: SkinLinkColors.orangeBadge, size: 22),
                        tooltip: 'New referral for patient',
                        onPressed: () {
                          Navigator.of(context).push(
                            MaterialPageRoute(builder: (_) => const NewReferralScreen()),
                          );
                        },
                      ),
                    ],
                  ),
                );
              },
            ),
    );
  }
}

