import 'package:flutter/material.dart';
import 'package:google_fonts/google_fonts.dart';
import 'package:provider/provider.dart';

import '../providers/app_state.dart';
import '../theme/skinlink_theme.dart';
import '../widgets/skinlink_widgets.dart';
import 'case_detail_screen.dart';
import 'follow_up_list_screen.dart';
import 'new_referral_screen.dart';
import 'patients_screen.dart';
import 'referrals_screen.dart';
import 'more_screen.dart';

class DashboardScreen extends StatefulWidget {
  const DashboardScreen({super.key});

  @override
  State<DashboardScreen> createState() => _DashboardScreenState();
}

class _DashboardScreenState extends State<DashboardScreen> {
  final GlobalKey<ScaffoldState> _scaffoldKey = GlobalKey<ScaffoldState>();

  @override
  void initState() {
    super.initState();
    WidgetsBinding.instance.addPostFrameCallback((_) {
      context.read<AppState>().refreshAll();
    });
  }

  @override
  Widget build(BuildContext context) {
    final user = context.select((AppState s) => s.user);
    final stats = context.select((AppState s) => s.dashboard);
    final online = context.select((AppState s) => s.online);
    final tenant = context.select((AppState s) => s.tenant);
    final localDrafts = context.select((AppState s) => s.localDrafts);
    final cases = context.select((AppState s) => s.cases);
    final patients = context.select((AppState s) => s.patients);
    final followUps = context.select((AppState s) => s.followUps);
    final pendingDrafts = localDrafts.where((d) => d['pendingSync'] == true).length;

    final newCount = stats?.newCount ?? cases.where((c) => c.status == 'new').length;
    final inReviewCount = stats?.awaitingReview ?? cases.where((c) => c.status == 'in_review').length;
    final guidanceReadyCount = stats?.guidanceReady ?? cases.where((c) => c.hasGuidance).length;
    final dueFollowUpsCount = stats?.dueFollowUps ?? followUps.where((f) => f.status != 'completed').length;

    // Greeting formatted for rural clinic healthcare workers / clinical officers
    final workerName = user?.name != null && user!.name.isNotEmpty
        ? user.name
        : 'Clinical Officer';

    final casesList = (stats?.recentCases != null && stats!.recentCases.isNotEmpty)
        ? stats.recentCases
        : cases;

    return Scaffold(
      key: _scaffoldKey,
      backgroundColor: SkinLinkColors.background,
      appBar: AppBar(
        backgroundColor: SkinLinkColors.primary,
        elevation: 0,
        leading: IconButton(
          icon: const Icon(Icons.menu, color: Colors.white, size: 24),
          onPressed: () {
            _scaffoldKey.currentState?.openDrawer();
          },
        ),
        title: Text(
          'SkinLink Clinic',
          style: GoogleFonts.manrope(
            fontSize: 20,
            fontWeight: FontWeight.w800,
            color: Colors.white,
            letterSpacing: -0.3,
          ),
        ),
        centerTitle: true,
        actions: [
          IconButton(
            icon: const Icon(Icons.settings_outlined, color: Colors.white, size: 22),
            onPressed: () {
              Navigator.of(context).push(
                MaterialPageRoute(builder: (_) => const MoreScreen()),
              );
            },
          ),
        ],
      ),
      drawer: _buildDrawer(context),
      body: RefreshIndicator(
        onRefresh: () => context.read<AppState>().refreshAll(),
        color: SkinLinkColors.primary,
        child: ListView(
          padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 14),
          children: [
            // 1. Welcome Greeting Banner & Facility info
            Row(
              mainAxisAlignment: MainAxisAlignment.spaceBetween,
              crossAxisAlignment: CrossAxisAlignment.center,
              children: [
                Expanded(
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Text(
                        'Welcome, $workerName',
                        style: GoogleFonts.manrope(
                          fontSize: 18,
                          fontWeight: FontWeight.w800,
                          color: SkinLinkColors.textPrimary,
                        ),
                      ),
                      const SizedBox(height: 2),
                      Text(
                        'Rural Tele-Dermatology Station',
                        style: GoogleFonts.inter(
                          fontSize: 12,
                          color: SkinLinkColors.textMuted,
                        ),
                      ),
                    ],
                  ),
                ),
                if (tenant != null)
                  Container(
                    padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 4),
                    decoration: BoxDecoration(
                      color: SkinLinkColors.primary.withValues(alpha: 0.08),
                      borderRadius: BorderRadius.circular(6),
                      border: Border.all(color: SkinLinkColors.primary.withValues(alpha: 0.2)),
                    ),
                    child: Text(
                      tenant.name,
                      style: GoogleFonts.inter(
                        fontSize: 11,
                        fontWeight: FontWeight.w600,
                        color: SkinLinkColors.primary,
                      ),
                    ),
                  ),
              ],
            ),
            const SizedBox(height: 12),

            // 2. Offline / Online Synchronisation Banner (Doc Concept 3 & 4)
            SyncBanner(online: online, pendingDrafts: pendingDrafts),
            const SizedBox(height: 14),

            // 3. Four Core Referral Status Metric Cards
            Row(
              children: [
                MetricPill(
                  label: 'New Referrals',
                  value: '$newCount',
                  backgroundColor: SkinLinkColors.orangeBadge,
                  icon: Icons.upload_file_outlined,
                  onTap: () => Navigator.of(context).push(
                    MaterialPageRoute(builder: (_) => const ReferralsScreen()),
                  ),
                ),
                const SizedBox(width: 8),
                MetricPill(
                  label: 'In Review',
                  value: '$inReviewCount',
                  backgroundColor: SkinLinkColors.teal,
                  icon: Icons.access_time,
                  onTap: () => Navigator.of(context).push(
                    MaterialPageRoute(builder: (_) => const ReferralsScreen()),
                  ),
                ),
                const SizedBox(width: 8),
                MetricPill(
                  label: 'Guidance Ready',
                  value: '$guidanceReadyCount',
                  backgroundColor: const Color(0xFF16A34A),
                  icon: Icons.check_circle_outline,
                  onTap: () => Navigator.of(context).push(
                    MaterialPageRoute(builder: (_) => const ReferralsScreen()),
                  ),
                ),
              ],
            ),
            const SizedBox(height: 16),

            // 4. Quick Action Shortcuts (Figure 2 in doc)
            Text(
              'Clinical Actions',
              style: GoogleFonts.manrope(
                fontSize: 15,
                fontWeight: FontWeight.w700,
                color: SkinLinkColors.textPrimary,
              ),
            ),
            const SizedBox(height: 10),
            Row(
              children: [
                Expanded(
                  child: _quickActionButton(
                    context,
                    icon: Icons.add_photo_alternate_outlined,
                    label: 'New Referral',
                    color: SkinLinkColors.primary,
                    onTap: () => Navigator.of(context).push(
                      MaterialPageRoute(builder: (_) => const NewReferralScreen()),
                    ),
                  ),
                ),
                const SizedBox(width: 10),
                Expanded(
                  child: _quickActionButton(
                    context,
                    icon: Icons.event_note_outlined,
                    label: 'Due Follow-Ups ($dueFollowUpsCount)',
                    color: SkinLinkColors.tealDark,
                    onTap: () => Navigator.of(context).push(
                      MaterialPageRoute(builder: (_) => const FollowUpListScreen()),
                    ),
                  ),
                ),
                const SizedBox(width: 10),
                Expanded(
                  child: _quickActionButton(
                    context,
                    icon: Icons.people_outline,
                    label: 'Patients (${patients.length})',
                    color: SkinLinkColors.orangeBadge,
                    onTap: () => Navigator.of(context).push(
                      MaterialPageRoute(builder: (_) => const PatientsScreen()),
                    ),
                  ),
                ),
              ],
            ),
            const SizedBox(height: 20),

            // 5. Rates / Operational Performance
            Text(
              'Referral Efficiency & Quality',
              style: GoogleFonts.manrope(
                fontSize: 15,
                fontWeight: FontWeight.w700,
                color: SkinLinkColors.textPrimary,
              ),
            ),
            const SizedBox(height: 10),
            Builder(builder: (_) {
              // Compute metrics from real case data
              final allCases = cases;
              final total = allCases.length;
              final guidanceCount = allCases.where((c) => c.hasGuidance).length;
              final guidancePct = total > 0 ? ((guidanceCount / total) * 100).round() : 0;
              final goodImgCount = allCases.where((c) => c.images.isNotEmpty).length;
              final imgPct = total > 0 ? ((goodImgCount / total) * 100).round() : 0;
              return Column(
                children: [
                  Row(
                    children: [
                      Expanded(
                        child: RateMetricCard(
                          icon: Icons.access_time_filled,
                          iconColor: SkinLinkColors.orangeBadge,
                          iconBgColor: SkinLinkColors.orangeLight,
                          value: '< 4 hrs',
                          label: 'Urgent SLA Target',
                        ),
                      ),
                      const SizedBox(width: 10),
                      Expanded(
                        child: RateMetricCard(
                          icon: Icons.speed,
                          iconColor: SkinLinkColors.teal,
                          iconBgColor: SkinLinkColors.tealLight,
                          value: '< 24 hrs',
                          label: 'Routine SLA Target',
                        ),
                      ),
                    ],
                  ),
                  const SizedBox(height: 10),
                  Row(
                    children: [
                      Expanded(
                        child: RateMetricCard(
                          icon: Icons.medical_services_outlined,
                          iconColor: const Color(0xFF16A34A),
                          iconBgColor: const Color(0xFFDCFCE7),
                          value: '$guidancePct%',
                          label: 'Guidance Sent',
                        ),
                      ),
                      const SizedBox(width: 10),
                      Expanded(
                        child: RateMetricCard(
                          icon: Icons.camera_alt_outlined,
                          iconColor: SkinLinkColors.primary,
                          iconBgColor: SkinLinkColors.tealLight,
                          value: '$imgPct%',
                          label: 'With Images',
                        ),
                      ),
                    ],
                  ),
                ],
              );
            }),
            const SizedBox(height: 22),

            // 6. Referral Queue Section
            Row(
              mainAxisAlignment: MainAxisAlignment.spaceBetween,
              children: [
                Text(
                  'Active Referral Queue',
                  style: GoogleFonts.manrope(
                    fontSize: 15,
                    fontWeight: FontWeight.w700,
                    color: SkinLinkColors.textPrimary,
                  ),
                ),
                InkWell(
                  onTap: () => Navigator.of(context).push(
                    MaterialPageRoute(builder: (_) => const NewReferralScreen()),
                  ),
                  child: Container(
                    padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 4),
                    decoration: BoxDecoration(
                      color: SkinLinkColors.primary.withValues(alpha: 0.1),
                      borderRadius: BorderRadius.circular(6),
                    ),
                    child: Row(
                      mainAxisSize: MainAxisSize.min,
                      children: [
                        const Icon(Icons.add, size: 14, color: SkinLinkColors.primary),
                        const SizedBox(width: 4),
                        Text(
                          'New Referral',
                          style: GoogleFonts.inter(
                            fontSize: 12,
                            fontWeight: FontWeight.w700,
                            color: SkinLinkColors.primary,
                          ),
                        ),
                      ],
                    ),
                  ),
                ),
              ],
            ),
            const SizedBox(height: 10),

            // 7. Recent Referral Case Cards
            if (casesList.isNotEmpty) ...[
              ...casesList.map((c) {
                final appState = context.read<AppState>();
                final patient = appState.patientById(c.patientId);
                final patientName = patient?.fullName ?? 'Patient';
                final hasGuidance = c.hasGuidance;
                final isWaiting = c.status == 'new' || c.status == 'draft';

                final statusStr = hasGuidance
                    ? 'Guidance Ready · ${c.treatmentPlan?['diagnosis'] ?? 'Reviewed'}'
                    : isWaiting
                        ? 'Waiting for Specialist · ${c.primaryConcern}'
                        : 'In Review · ${c.suspectedCondition}';

                final statusColor = hasGuidance
                    ? const Color(0xFF16A34A)
                    : isWaiting
                        ? SkinLinkColors.orangeBadge
                        : SkinLinkColors.teal;

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
              }),
            ] else ...[
              Center(
                child: Padding(
                  padding: const EdgeInsets.symmetric(vertical: 24),
                  child: Column(
                    children: [
                      Icon(Icons.inbox_outlined, size: 48, color: SkinLinkColors.textMuted.withValues(alpha: 0.4)),
                      const SizedBox(height: 10),
                      Text(
                        'No active referrals',
                        style: GoogleFonts.manrope(
                          fontSize: 15,
                          fontWeight: FontWeight.w700,
                          color: SkinLinkColors.textPrimary,
                        ),
                      ),
                      const SizedBox(height: 4),
                      Text(
                        'Tap "New Referral" to submit your first tele-dermatology case.',
                        style: GoogleFonts.inter(fontSize: 12.5, color: SkinLinkColors.textMuted),
                        textAlign: TextAlign.center,
                      ),
                    ],
                  ),
                ),
              ),
            ],

            const SizedBox(height: 16),
          ],
        ),
      ),
    );
  }

  Widget _quickActionButton(
    BuildContext context, {
    required IconData icon,
    required String label,
    required Color color,
    required VoidCallback onTap,
  }) {
    return InkWell(
      onTap: onTap,
      borderRadius: BorderRadius.circular(10),
      child: Container(
        padding: const EdgeInsets.symmetric(vertical: 12, horizontal: 8),
        decoration: BoxDecoration(
          color: Colors.white,
          borderRadius: BorderRadius.circular(10),
          border: Border.all(color: SkinLinkColors.cardBorder),
        ),
        child: Column(
          mainAxisSize: MainAxisSize.min,
          children: [
            Icon(icon, color: color, size: 22),
            const SizedBox(height: 6),
            Text(
              label,
              textAlign: TextAlign.center,
              style: GoogleFonts.inter(
                fontSize: 11,
                fontWeight: FontWeight.w600,
                color: SkinLinkColors.textPrimary,
              ),
              maxLines: 1,
              overflow: TextOverflow.ellipsis,
            ),
          ],
        ),
      ),
    );
  }

  Widget _buildDrawer(BuildContext context) {
    final user = context.read<AppState>().user;
    return Drawer(
      child: SafeArea(
        child: Column(
          children: [
            Container(
              width: double.infinity,
              padding: const EdgeInsets.all(20),
              decoration: const BoxDecoration(
                gradient: SkinLinkColors.headerGradient,
              ),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  const Text(
                    'SkinLink',
                    style: TextStyle(
                      fontSize: 22,
                      fontWeight: FontWeight.bold,
                      color: Colors.white,
                    ),
                  ),
                  const SizedBox(height: 4),
                  Text(
                    user?.name ?? 'Village Clinic Officer',
                    style: const TextStyle(fontSize: 14, color: Colors.white70),
                  ),
                ],
              ),
            ),
            ListTile(
              leading: const Icon(Icons.dashboard_outlined, color: SkinLinkColors.primary),
              title: const Text('Dashboard'),
              onTap: () => Navigator.pop(context),
            ),
            ListTile(
              leading: const Icon(Icons.add_circle_outline, color: SkinLinkColors.orange),
              title: const Text('New Referral'),
              onTap: () {
                Navigator.pop(context);
                Navigator.of(context).push(MaterialPageRoute(builder: (_) => const NewReferralScreen()));
              },
            ),
            ListTile(
              leading: const Icon(Icons.calendar_today_outlined, color: SkinLinkColors.teal),
              title: const Text('Follow-Up Schedule'),
              onTap: () {
                Navigator.pop(context);
                Navigator.of(context).push(MaterialPageRoute(builder: (_) => const FollowUpListScreen()));
              },
            ),
            ListTile(
              leading: const Icon(Icons.people_outline, color: SkinLinkColors.primaryDark),
              title: const Text('Registered Patients'),
              onTap: () {
                Navigator.pop(context);
                Navigator.of(context).push(MaterialPageRoute(builder: (_) => const PatientsScreen()));
              },
            ),
            ListTile(
              leading: const Icon(Icons.settings_outlined, color: SkinLinkColors.textMuted),
              title: const Text('Settings & Info'),
              onTap: () {
                Navigator.pop(context);
                Navigator.of(context).push(MaterialPageRoute(builder: (_) => const MoreScreen()));
              },
            ),
          ],
        ),
      ),
    );
  }
}
