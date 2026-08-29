import 'package:flutter/material.dart';
import 'package:google_fonts/google_fonts.dart';
import 'package:provider/provider.dart';

import '../providers/app_state.dart';
import '../theme/skinlink_theme.dart';
import '../widgets/skinlink_widgets.dart';
import 'follow_up_list_screen.dart';
import 'login_screen.dart';
import 'new_referral_screen.dart';

class MoreScreen extends StatelessWidget {
  const MoreScreen({super.key});

  @override
  Widget build(BuildContext context) {
    final online = context.select((AppState s) => s.online);
    final localDrafts = context.select((AppState s) => s.localDrafts);
    final pendingDrafts = localDrafts.where((d) => d['pendingSync'] == true).length;

    return Scaffold(
      backgroundColor: SkinLinkColors.background,
      appBar: AppBar(
        backgroundColor: SkinLinkColors.primary,
        elevation: 0,
        title: Text(
          'More & Settings',
          style: GoogleFonts.manrope(
            fontSize: 18,
            fontWeight: FontWeight.w800,
            color: Colors.white,
          ),
        ),
        centerTitle: true,
      ),
      body: ListView(
        padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 14),
        children: [
          SyncBanner(
            online: online,
            pendingDrafts: pendingDrafts,
          ),
          const SizedBox(height: 16),
          if (localDrafts.isNotEmpty) ...[
            Text('Saved Drafts', style: GoogleFonts.manrope(fontSize: 15, fontWeight: FontWeight.w700, color: SkinLinkColors.textPrimary)),
            const SizedBox(height: 8),
            ...localDrafts.map((d) => Container(
                  margin: const EdgeInsets.only(bottom: 8),
                  decoration: BoxDecoration(
                    color: Colors.white,
                    borderRadius: BorderRadius.circular(12),
                    border: Border.all(color: SkinLinkColors.cardBorder),
                  ),
                  child: ListTile(
                    leading: const Icon(Icons.drafts_outlined, color: SkinLinkColors.orangeBadge),
                    title: Text('Draft ${(d['id'] as String).substring(0, 8)}', style: GoogleFonts.inter(fontWeight: FontWeight.w600)),
                    subtitle: Text('Step ${(d['step'] as int? ?? 0) + 1} of 4', style: GoogleFonts.inter(fontSize: 12, color: SkinLinkColors.textMuted)),
                    trailing: const Icon(Icons.chevron_right, color: SkinLinkColors.primary),
                    onTap: () => Navigator.of(context).push(
                      MaterialPageRoute(builder: (_) => NewReferralScreen(draftId: d['id'] as String)),
                    ),
                  ),
                )),
            const SizedBox(height: 16),
          ],
          _tile(Icons.calendar_today_outlined, 'Follow-up Schedules', () {
            Navigator.of(context).push(MaterialPageRoute(builder: (_) => const FollowUpListScreen()));
          }),
          _tile(Icons.menu_book_outlined, 'Clinical Protocols & Guidelines', () {}),
          _tile(Icons.shield_outlined, 'Privacy, Encryption & Patient Consent', () {}),
          _tile(Icons.help_outline, 'Tele-dermatology Training Guide', () {}),
          const SizedBox(height: 12),
          const Divider(height: 24, color: SkinLinkColors.cardBorder),
          const SizedBox(height: 12),
          _tile(Icons.logout, 'Sign Out', () async {
            await context.read<AppState>().logout();
            if (context.mounted) {
              Navigator.of(context).pushAndRemoveUntil(
                MaterialPageRoute(builder: (_) => const LoginScreen()),
                (r) => false,
              );
            }
          }, destructive: true),
          const SizedBox(height: 24),
          Text(
            'SkinLink Village Clinic App v1.0\nConnecting Clinics to Specialists',
            textAlign: TextAlign.center,
            style: GoogleFonts.inter(fontSize: 12, color: SkinLinkColors.textMuted, height: 1.4),
          ),
        ],
      ),
    );
  }

  Widget _tile(IconData icon, String label, VoidCallback onTap, {bool destructive = false}) {
    return Container(
      margin: const EdgeInsets.only(bottom: 8),
      decoration: BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.circular(12),
        border: Border.all(color: SkinLinkColors.cardBorder),
        boxShadow: [
          BoxShadow(
            color: Colors.black.withValues(alpha: 0.02),
            blurRadius: 4,
            offset: const Offset(0, 1),
          ),
        ],
      ),
      child: ListTile(
        leading: Icon(icon, color: destructive ? SkinLinkColors.destructive : SkinLinkColors.primary),
        title: Text(
          label,
          style: GoogleFonts.inter(
            fontSize: 14,
            fontWeight: FontWeight.w600,
            color: destructive ? SkinLinkColors.destructive : SkinLinkColors.textPrimary,
          ),
        ),
        trailing: const Icon(Icons.chevron_right, size: 20, color: SkinLinkColors.textMuted),
        onTap: onTap,
      ),
    );
  }
}

