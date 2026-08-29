import 'package:flutter/material.dart';
import 'package:google_fonts/google_fonts.dart';
import 'package:provider/provider.dart';

import '../models/models.dart';
import '../providers/app_state.dart';
import '../services/treatment_pdf_service.dart';
import '../theme/skinlink_theme.dart';

class GuidanceScreen extends StatefulWidget {
  const GuidanceScreen({super.key, required this.caseId});

  final String caseId;

  @override
  State<GuidanceScreen> createState() => _GuidanceScreenState();
}

class _GuidanceScreenState extends State<GuidanceScreen> {
  DermCase? _case;
  bool _pdfLoading = false;

  @override
  void initState() {
    super.initState();
    _load();
  }

  Future<void> _load() async {
    final state = context.read<AppState>();
    try {
      _case = await state.api.getCase(widget.caseId);
    } catch (_) {
      _case = state.caseById(widget.caseId);
    }
    if (mounted) setState(() {});
  }

  Future<void> _generatePdf({required bool share}) async {
    final dermCase = _case;
    final plan = dermCase?.treatmentPlan;
    if (dermCase == null || plan == null) return;

    setState(() => _pdfLoading = true);
    final state = context.read<AppState>();
    final patient = state.patientById(dermCase.patientId);

    try {
      if (share) {
        await TreatmentPdfService.sharePdf(
          dermCase: dermCase,
          plan: plan,
          patient: patient,
          tenant: state.tenant,
          specialistName: 'Dermatology Specialist',
        );
      } else {
        await TreatmentPdfService.previewAndShare(
          dermCase: dermCase,
          plan: plan,
          patient: patient,
          tenant: state.tenant,
          specialistName: 'Dermatology Specialist',
        );
      }
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(
            content: Text(share ? 'Treatment PDF ready to share' : 'Treatment PDF generated'),
            backgroundColor: SkinLinkColors.success,
          ),
        );
      }
    } catch (e) {
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          const SnackBar(
            content: Text('Could not generate treatment PDF. Please try again or check connection.'),
            backgroundColor: SkinLinkColors.destructive,
          ),
        );
      }
    } finally {
      if (mounted) setState(() => _pdfLoading = false);
    }
  }

  @override
  Widget build(BuildContext context) {
    final plan = _case?.treatmentPlan;
    final patient = _case != null ? context.watch<AppState>().patientById(_case!.patientId) : null;

    return Scaffold(
      backgroundColor: SkinLinkColors.background,
      appBar: AppBar(
        backgroundColor: SkinLinkColors.primary,
        elevation: 0,
        title: Text(
          'Specialist Guidance',
          style: GoogleFonts.manrope(
            fontSize: 18,
            fontWeight: FontWeight.w800,
            color: Colors.white,
          ),
        ),
        centerTitle: true,
        actions: [
          if (plan != null)
            IconButton(
              icon: _pdfLoading
                  ? const SizedBox(width: 20, height: 20, child: CircularProgressIndicator(strokeWidth: 2, color: Colors.white))
                  : const Icon(Icons.picture_as_pdf_outlined, color: Colors.white),
              tooltip: 'Generate patient PDF',
              onPressed: _pdfLoading ? null : () => _generatePdf(share: false),
            ),
        ],
      ),
      body: plan == null
          ? const Center(child: Text('No guidance available yet'))
          : ListView(
              padding: const EdgeInsets.all(16),
              children: [
                Container(
                  padding: const EdgeInsets.all(16),
                  decoration: BoxDecoration(
                    color: SkinLinkColors.success.withValues(alpha: 0.1),
                    borderRadius: BorderRadius.circular(12),
                    border: Border.all(color: SkinLinkColors.success.withValues(alpha: 0.3)),
                  ),
                  child: Row(
                    children: [
                      Icon(Icons.check_circle, color: SkinLinkColors.success, size: 28),
                      const SizedBox(width: 12),
                      Expanded(
                        child: Column(
                          crossAxisAlignment: CrossAxisAlignment.start,
                          children: [
                            Text('Response received from specialist', style: Theme.of(context).textTheme.titleMedium),
                            Text(
                              _case?.ref ?? '',
                              style: Theme.of(context).textTheme.bodySmall?.copyWith(color: SkinLinkColors.textMuted),
                            ),
                          ],
                        ),
                      ),
                    ],
                  ),
                ),
                const SizedBox(height: 16),
                if (_case != null && _case!.hasSpecialistFollowUpFeedback) ...[
                  Container(
                    padding: const EdgeInsets.all(14),
                    decoration: BoxDecoration(
                      color: const Color(0xFFF0FDF4),
                      borderRadius: BorderRadius.circular(12),
                      border: Border.all(color: const Color(0xFF86EFAC), width: 1.5),
                    ),
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        Row(
                          children: [
                            const Icon(Icons.medical_services, color: Color(0xFF15803D), size: 22),
                            const SizedBox(width: 8),
                            Text(
                              'Specialist Follow-Up Feedback',
                              style: GoogleFonts.manrope(
                                fontSize: 15,
                                fontWeight: FontWeight.w800,
                                color: const Color(0xFF14532D),
                              ),
                            ),
                          ],
                        ),
                        const SizedBox(height: 6),
                        Container(
                          padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 3),
                          decoration: BoxDecoration(
                            color: SkinLinkColors.tealLight,
                            borderRadius: BorderRadius.circular(4),
                          ),
                          child: Text(
                            'ACTION: ${(_case!.specialistFollowUpAction ?? "continue").toUpperCase()}',
                            style: GoogleFonts.inter(fontSize: 10.5, fontWeight: FontWeight.w700, color: SkinLinkColors.primaryDark),
                          ),
                        ),
                        const SizedBox(height: 8),
                        Text(
                          _case!.specialistFollowUpFeedback!,
                          style: GoogleFonts.inter(fontSize: 13, color: SkinLinkColors.textPrimary, height: 1.4),
                        ),
                      ],
                    ),
                  ),
                  const SizedBox(height: 16),
                ],
                _pdfPromoCard(context),
                const SizedBox(height: 20),
                Text('Assessment', style: Theme.of(context).textTheme.titleMedium),
                const SizedBox(height: 8),
                Container(
                  width: double.infinity,
                  padding: const EdgeInsets.all(16),
                  decoration: BoxDecoration(
                    border: Border.all(color: SkinLinkColors.primary, width: 1.5),
                    borderRadius: BorderRadius.circular(12),
                  ),
                  child: Text(
                    plan['diagnosis'] as String? ?? '—',
                    style: Theme.of(context).textTheme.titleLarge?.copyWith(color: SkinLinkColors.primary),
                  ),
                ),
                const SizedBox(height: 20),
                Text('Treatment plan', style: Theme.of(context).textTheme.titleMedium),
                const SizedBox(height: 12),
                ...((plan['medications'] as List?) ?? []).map((m) {
                  final med = m as Map<String, dynamic>;
                  return _planItem(
                    Icons.medication_outlined,
                    med['name'] as String? ?? '',
                    med['instructions'] as String? ?? '',
                  );
                }),
                if ((plan['avoidTriggers'] as List?)?.isNotEmpty ?? false)
                  _planItem(
                    Icons.warning_amber_outlined,
                    'Avoid triggers',
                    (plan['avoidTriggers'] as List).join(', '),
                  ),
                if ((plan['patientEducation'] as List?)?.isNotEmpty ?? false) ...[
                  const SizedBox(height: 16),
                  Text('Patient education', style: Theme.of(context).textTheme.titleMedium),
                  const SizedBox(height: 8),
                  ...((plan['patientEducation'] as List).map((e) => Padding(
                        padding: const EdgeInsets.only(bottom: 4),
                        child: Row(
                          crossAxisAlignment: CrossAxisAlignment.start,
                          children: [
                            const Text('• '),
                            Expanded(child: Text(e.toString())),
                          ],
                        ),
                      ))),
                ],
                if (plan['followUpDays'] != null) ...[
                  const SizedBox(height: 16),
                  Container(
                    padding: const EdgeInsets.all(16),
                    decoration: BoxDecoration(
                      gradient: LinearGradient(
                        colors: [SkinLinkColors.primaryDark, SkinLinkColors.primary],
                      ),
                      borderRadius: BorderRadius.circular(12),
                    ),
                    child: Row(
                      children: [
                        Expanded(
                          child: Column(
                            crossAxisAlignment: CrossAxisAlignment.start,
                            children: [
                              const Text('Follow-up', style: TextStyle(color: Colors.white, fontWeight: FontWeight.w600)),
                              Text(
                                'Return in ${plan['followUpDays']} days or sooner if worsening',
                                style: TextStyle(color: Colors.white.withValues(alpha: 0.85), fontSize: 13),
                              ),
                            ],
                          ),
                        ),
                        Container(
                          padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 8),
                          decoration: BoxDecoration(
                            color: Colors.white,
                            borderRadius: BorderRadius.circular(8),
                          ),
                          child: Text(
                            '${plan['followUpDays']}d',
                            style: const TextStyle(color: SkinLinkColors.primary, fontWeight: FontWeight.bold, fontSize: 18),
                          ),
                        ),
                      ],
                    ),
                  ),
                ],
                if (plan['notes'] != null) ...[
                  const SizedBox(height: 16),
                  Container(
                    padding: const EdgeInsets.all(12),
                    decoration: BoxDecoration(
                      color: SkinLinkColors.background,
                      borderRadius: BorderRadius.circular(10),
                    ),
                    child: Text(plan['notes'] as String, style: Theme.of(context).textTheme.bodySmall),
                  ),
                ],
                if (patient != null) ...[
                  const SizedBox(height: 20),
                  Text('Patient', style: Theme.of(context).textTheme.titleMedium),
                  const SizedBox(height: 8),
                  Text('${patient.fullName} · ${patient.age}/${patient.gender[0]} · ${patient.village}'),
                ],
                const SizedBox(height: 24),
                ElevatedButton.icon(
                  onPressed: _pdfLoading ? null : () => _generatePdf(share: false),
                  icon: const Icon(Icons.print_outlined),
                  label: const Text('Print patient handout (PDF)'),
                ),
                const SizedBox(height: 10),
                OutlinedButton.icon(
                  onPressed: _pdfLoading ? null : () => _generatePdf(share: true),
                  icon: const Icon(Icons.share_outlined),
                  label: const Text('Share PDF with patient'),
                ),
                const SizedBox(height: 10),
                ElevatedButton(
                  onPressed: () => Navigator.of(context).pop(),
                  style: ElevatedButton.styleFrom(backgroundColor: SkinLinkColors.teal),
                  child: const Text('Acknowledge'),
                ),
              ],
            ),
    );
  }

  Widget _pdfPromoCard(BuildContext context) {
    return Container(
      padding: const EdgeInsets.all(14),
      decoration: BoxDecoration(
        gradient: LinearGradient(
          begin: Alignment.topLeft,
          end: Alignment.bottomRight,
          colors: [
            SkinLinkColors.primary.withValues(alpha: 0.08),
            SkinLinkColors.navy.withValues(alpha: 0.05),
          ],
        ),
        borderRadius: BorderRadius.circular(12),
        border: Border.all(color: SkinLinkColors.primary.withValues(alpha: 0.2)),
      ),
      child: Row(
        children: [
          Container(
            width: 48,
            height: 48,
            decoration: BoxDecoration(
              color: SkinLinkColors.primary.withValues(alpha: 0.12),
              borderRadius: BorderRadius.circular(10),
            ),
            child: const Icon(Icons.description_outlined, color: SkinLinkColors.primary),
          ),
          const SizedBox(width: 12),
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text('Patient treatment document', style: Theme.of(context).textTheme.titleSmall),
                Text(
                  'Generate a branded PDF handout to print and give to ${context.read<AppState>().patientById(_case!.patientId)?.fullName ?? 'the patient'}.',
                  style: Theme.of(context).textTheme.bodySmall?.copyWith(color: SkinLinkColors.textMuted),
                ),
              ],
            ),
          ),
        ],
      ),
    );
  }

  Widget _planItem(IconData icon, String title, String subtitle) {
    return Padding(
      padding: const EdgeInsets.only(bottom: 12),
      child: Row(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Container(
            width: 40,
            height: 40,
            decoration: BoxDecoration(
              color: SkinLinkColors.primary.withValues(alpha: 0.1),
              borderRadius: BorderRadius.circular(10),
            ),
            child: Icon(icon, color: SkinLinkColors.primary, size: 20),
          ),
          const SizedBox(width: 12),
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(title, style: const TextStyle(fontWeight: FontWeight.w600)),
                if (subtitle.isNotEmpty)
                  Text(subtitle, style: const TextStyle(color: SkinLinkColors.textMuted, fontSize: 13)),
              ],
            ),
          ),
        ],
      ),
    );
  }
}
