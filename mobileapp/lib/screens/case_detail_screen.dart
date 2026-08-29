import 'package:flutter/material.dart';
import 'package:google_fonts/google_fonts.dart';
import 'package:provider/provider.dart';

import '../models/models.dart';
import '../providers/app_state.dart';
import '../theme/skinlink_theme.dart';
import '../widgets/skinlink_widgets.dart';
import 'guidance_screen.dart';
import 'follow_up_record_screen.dart';

class CaseDetailScreen extends StatefulWidget {
  const CaseDetailScreen({super.key, required this.caseId});

  final String caseId;

  @override
  State<CaseDetailScreen> createState() => _CaseDetailScreenState();
}

class _CaseDetailScreenState extends State<CaseDetailScreen> {
  DermCase? _case;
  bool _loading = true;
  bool _aiLoading = false;
  final _noteController = TextEditingController();

  @override
  void initState() {
    super.initState();
    _load();
  }

  @override
  void dispose() {
    _noteController.dispose();
    super.dispose();
  }

  Future<void> _load() async {
    final state = context.read<AppState>();
    try {
      _case = await state.api.getCase(widget.caseId);
    } catch (_) {
      _case = state.cases.cast<DermCase?>().firstWhere(
            (c) => c?.id == widget.caseId,
            orElse: () => null,
          );
    }
    if (mounted) setState(() => _loading = false);
  }

  Future<void> _addNoteDialog() async {
    _noteController.clear();
    await showDialog(
      context: context,
      builder: (ctx) => AlertDialog(
        title: Text(
          'Add Clarification Note',
          style: GoogleFonts.manrope(fontWeight: FontWeight.w700, fontSize: 16),
        ),
        content: Column(
          mainAxisSize: MainAxisSize.min,
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Text(
              'Send additional clinical details or answer a question from the reviewing specialist.',
              style: GoogleFonts.inter(fontSize: 12.5, color: SkinLinkColors.textMuted),
            ),
            const SizedBox(height: 12),
            TextField(
              controller: _noteController,
              maxLines: 3,
              decoration: const InputDecoration(
                hintText: 'e.g. Patient returned with worsening redness on day 3...',
                border: OutlineInputBorder(),
              ),
            ),
          ],
        ),
        actions: [
          TextButton(
            onPressed: () => Navigator.of(ctx).pop(),
            child: const Text('Cancel'),
          ),
          ElevatedButton(
            onPressed: () async {
              final text = _noteController.text.trim();
              if (text.isEmpty) return;
              Navigator.of(ctx).pop();
              final state = context.read<AppState>();
              try {
                final updated = await state.api.addCaseNote(widget.caseId, text);
                if (mounted) setState(() => _case = updated);
                if (mounted) {
                  ScaffoldMessenger.of(context).showSnackBar(
                    const SnackBar(
                      content: Text('Note sent to specialist'),
                      backgroundColor: SkinLinkColors.primary,
                    ),
                  );
                }
              } catch (_) {
                if (mounted) {
                  ScaffoldMessenger.of(context).showSnackBar(
                    const SnackBar(
                      content: Text('Failed to send clarification note. Please check your connection.'),
                      backgroundColor: SkinLinkColors.destructive,
                    ),
                  );
                }
              }
            },
            child: const Text('Send Note'),
          ),
        ],
      ),
    );
  }

  Future<void> _runAiAssessment() async {
    if (_case == null) return;
    final state = context.read<AppState>();
    if (!state.online) {
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(content: Text('AI analysis requires an internet connection.')),
      );
      return;
    }
    setState(() => _aiLoading = true);
    try {
      final result = await state.api.runSkinAssessment(_case!);
      if (!mounted) return;
      final updated = DermCase.fromJson({
        'id': _case!.id,
        'ref': _case!.ref,
        'patientId': _case!.patientId,
        'primaryConcern': _case!.primaryConcern,
        'clinicalInfo': _case!.clinicalInfo,
        'durationDays': _case!.durationDays,
        'suspectedCondition': _case!.suspectedCondition,
        'status': _case!.status,
        'priority': _case!.priority,
        'images': _case!.images,
        'treatmentPlan': _case!.treatmentPlan,
        'followUpReport': _case!.followUpReport,
        'createdAt': _case!.createdAt,
        'updatedAt': DateTime.now().toIso8601String(),
        'bodySite': _case!.bodySite,
        'ai': result,
      });
      setState(() => _case = updated);
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(
          content: Text('AI analysis complete — review below.'),
          backgroundColor: SkinLinkColors.primary,
        ),
      );
    } catch (e) {
      if (!mounted) return;
      // Parse the error to show a friendly message — never show raw JSON to the user
      String friendly;
      final raw = e.toString();
      if (raw.contains('quota_exceeded') || raw.contains('RESOURCE_EXHAUSTED') || raw.contains('429') || raw.contains('quota exceeded')) {
        friendly = 'AI daily quota reached. The free tier limit has been hit. Please try again tomorrow or contact your administrator to upgrade your plan.';
      } else if (raw.contains('invalid_key') || raw.contains('UNAUTHENTICATED') || raw.contains('API key')) {
        friendly = 'AI service configuration error. Please contact your system administrator.';
      } else if (raw.contains('permission_denied') || raw.contains('PERMISSION_DENIED') || raw.contains('billing')) {
        friendly = 'AI service billing issue. Please contact your system administrator.';
      } else if (raw.contains('model_not_found') || raw.contains('NOT_FOUND')) {
        friendly = 'AI model not available. Please contact your system administrator.';
      } else if (raw.contains('timeout') || raw.contains('timed out')) {
        friendly = 'AI analysis timed out. Please check your connection and try again.';
      } else if (raw.contains('image_unavailable') || raw.contains('Image not found')) {
        friendly = 'One or more images could not be loaded for analysis. Please ensure images were uploaded successfully.';
      } else if (raw.contains('not_configured') || raw.contains('not configured')) {
        friendly = 'AI service is not configured on this server. Contact your administrator.';
      } else if (raw.contains('image_quality_failed')) {
        friendly = 'Image quality check did not pass. Please retake images before requesting AI analysis.';
      } else {
        friendly = 'AI analysis could not be completed. Please try again. If the problem persists, contact support.';
      }
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(
          content: Row(
            children: [
              const Icon(Icons.warning_amber_rounded, color: Colors.white, size: 18),
              const SizedBox(width: 8),
              Expanded(
                child: Text(
                  friendly,
                  style: const TextStyle(color: Colors.white, fontSize: 13),
                ),
              ),
            ],
          ),
          backgroundColor: const Color(0xFFB45309),
          duration: const Duration(seconds: 6),
          behavior: SnackBarBehavior.floating,
        ),
      );
    } finally {
      if (mounted) setState(() => _aiLoading = false);
    }
  }

  @override
  Widget build(BuildContext context) {
    final state = context.watch<AppState>();
    final patient = _case != null ? state.patientById(_case!.patientId) : null;

    final patientName = patient?.fullName ?? (_case != null ? 'Patient' : 'Unknown Patient');
    final diagnosis = (_case?.suspectedCondition.isNotEmpty ?? false)
        ? _case!.suspectedCondition
        : 'Under Evaluation';
    final submittedTime = _case != null ? timeAgo(_case!.createdAt) : 'Recently';
    final hasGuidance = _case != null && _case!.hasGuidance;

    final List<String> treatmentItems = (hasGuidance &&
            _case!.treatmentPlan!['instructions'] != null)
        ? List<String>.from(_case!.treatmentPlan!['instructions'] as List)
        : (hasGuidance && _case!.treatmentPlan!['medications'] != null)
            ? (_case!.treatmentPlan!['medications'] as List)
                .map((m) => '${m['name']} — ${m['instructions'] ?? ''}')
                .toList()
            : [];

    return Scaffold(
      backgroundColor: SkinLinkColors.background,
      appBar: AppBar(
        backgroundColor: SkinLinkColors.primary,
        elevation: 0,
        leading: IconButton(
          icon: const Icon(Icons.arrow_back_ios_new, color: Colors.white, size: 20),
          onPressed: () => Navigator.of(context).pop(),
        ),
        title: Text(
          'Referral Case Details',
          style: GoogleFonts.manrope(
            fontSize: 18,
            fontWeight: FontWeight.w800,
            color: Colors.white,
          ),
        ),
        centerTitle: true,
        actions: [
          if (hasGuidance)
            IconButton(
              icon: const Icon(Icons.picture_as_pdf_outlined, color: Colors.white, size: 22),
              tooltip: 'Patient Treatment Handout',
              onPressed: () {
                Navigator.of(context).push(
                  MaterialPageRoute(builder: (_) => GuidanceScreen(caseId: _case!.id)),
                );
              },
            ),
        ],
      ),
      body: _loading
          ? const Center(child: CircularProgressIndicator(color: SkinLinkColors.primary))
          : ListView(
              padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 14),
              children: [
                // 1. Patient Header Card
                Container(
                  padding: const EdgeInsets.all(14),
                  decoration: BoxDecoration(
                    color: Colors.white,
                    borderRadius: BorderRadius.circular(14),
                    border: Border.all(color: SkinLinkColors.cardBorder),
                    boxShadow: [
                      BoxShadow(
                        color: Colors.black.withValues(alpha: 0.04),
                        blurRadius: 8,
                        offset: const Offset(0, 2),
                      ),
                    ],
                  ),
                  child: Row(
                    children: [
                      CircleAvatar(
                        radius: 26,
                        backgroundColor: SkinLinkColors.tealLight,
                        child: Text(
                          patientName.isNotEmpty ? patientName[0] : 'P',
                          style: GoogleFonts.manrope(
                            fontSize: 20,
                            fontWeight: FontWeight.w800,
                            color: SkinLinkColors.primary,
                          ),
                        ),
                      ),
                      const SizedBox(width: 12),
                      Expanded(
                        child: Column(
                          crossAxisAlignment: CrossAxisAlignment.start,
                          children: [
                            Row(
                              children: [
                                Expanded(
                                  child: Text(
                                    patientName,
                                    style: GoogleFonts.manrope(
                                      fontSize: 16.5,
                                      fontWeight: FontWeight.w800,
                                      color: SkinLinkColors.textPrimary,
                                    ),
                                    maxLines: 1,
                                    overflow: TextOverflow.ellipsis,
                                  ),
                                ),
                                if (_case != null)
                                  Container(
                                    padding: const EdgeInsets.symmetric(horizontal: 6, vertical: 2),
                                    decoration: BoxDecoration(
                                      color: _case!.priority == 'urgent' || _case!.priority == 'emergency'
                                          ? SkinLinkColors.orangeLight
                                          : SkinLinkColors.tealLight,
                                      borderRadius: BorderRadius.circular(4),
                                    ),
                                    child: Text(
                                      _case!.priority.toUpperCase(),
                                      style: GoogleFonts.inter(
                                        fontSize: 10,
                                        fontWeight: FontWeight.w700,
                                        color: _case!.priority == 'urgent' || _case!.priority == 'emergency'
                                            ? SkinLinkColors.orangeBadge
                                            : SkinLinkColors.primaryDark,
                                      ),
                                    ),
                                  ),
                              ],
                            ),
                            const SizedBox(height: 2),
                            Text(
                              patient != null
                                  ? '${patient.code} · ${patient.age} yrs / ${patient.gender} · ${patient.village}'
                                  : (_case != null ? _case!.ref : ''),
                              style: GoogleFonts.inter(
                                fontSize: 12,
                                fontWeight: FontWeight.w500,
                                color: SkinLinkColors.textMuted,
                              ),
                            ),
                            const SizedBox(height: 2),
                            Text(
                              'Submitted: $submittedTime · ${_case?.ref ?? ""}',
                              style: GoogleFonts.inter(
                                fontSize: 11,
                                color: SkinLinkColors.textLight,
                              ),
                            ),
                          ],
                        ),
                      ),
                    ],
                  ),
                ),
                const SizedBox(height: 14),

                // 2. Status Milestone Tracker (Figure 1 & 5 Clinical Workflow)
                _buildMilestonesCard(_case?.status ?? 'new', hasGuidance),
                const SizedBox(height: 14),

                // 3. Specialist Response to Follow-Up (if specialist responded)
                if (_case != null && _case!.hasSpecialistFollowUpFeedback) ...[
                  _buildSpecialistResponseCard(context, _case!),
                  const SizedBox(height: 14),
                ],

                // 4. Worker/Nurse Follow-Up Report Recorded (if submitted by worker)
                if (_case != null && _case!.hasFollowUpReport) ...[
                  _buildFollowUpReportCard(context, _case!),
                  const SizedBox(height: 14),
                ],

                // 5. Specialist Guidance Banner / Review Awaiting Notice
                if (hasGuidance)
                  _buildGuidanceReceivedCard(context, _case!)
                else
                  _buildAwaitingReviewCard(context, _case),
                const SizedBox(height: 14),

                // 4. Clinical Photos Section
                Text(
                  'Clinical Lesion Photos',
                  style: GoogleFonts.manrope(
                    fontSize: 15.5,
                    fontWeight: FontWeight.w700,
                    color: SkinLinkColors.textPrimary,
                  ),
                ),
                const SizedBox(height: 8),
                if (_case != null && _case!.images.isNotEmpty)
                  SizedBox(
                    height: 130,
                    child: ListView.separated(
                      scrollDirection: Axis.horizontal,
                      itemCount: _case!.images.length,
                      separatorBuilder: (context, index) => const SizedBox(width: 10),
                      itemBuilder: (ctx, idx) {
                        final img = _case!.images[idx];
                        final rawUrl = (img['url'] ?? img['localPath'] ?? '') as String;
                        final url = state.formatImageUrl(rawUrl);
                        final angle = (img['angle'] ?? 'Lesion') as String;
                        return Container(
                          width: 130,
                          decoration: BoxDecoration(
                            borderRadius: BorderRadius.circular(12),
                            border: Border.all(color: SkinLinkColors.cardBorder),
                          ),
                          child: ClipRRect(
                            borderRadius: BorderRadius.circular(12),
                            child: Stack(
                              children: [
                                Positioned.fill(
                                  child: Image.network(
                                    url,
                                    fit: BoxFit.cover,
                                    errorBuilder: (context, error, stackTrace) => _buildPlaceholderPhoto(label: angle),
                                  ),
                                ),
                                Positioned(
                                  bottom: 4,
                                  left: 4,
                                  child: Container(
                                    padding: const EdgeInsets.symmetric(horizontal: 6, vertical: 2),
                                    decoration: BoxDecoration(
                                      color: Colors.black87,
                                      borderRadius: BorderRadius.circular(4),
                                    ),
                                    child: Text(
                                      angle,
                                      style: GoogleFonts.inter(
                                        fontSize: 10,
                                        fontWeight: FontWeight.w600,
                                        color: Colors.white,
                                      ),
                                    ),
                                  ),
                                ),
                              ],
                            ),
                          ),
                        );
                      },
                    ),
                  )
                else
                  Row(
                    children: [
                      Expanded(child: _buildPlaceholderPhoto(label: 'Overview Angle')),
                      const SizedBox(width: 10),
                      Expanded(child: _buildPlaceholderPhoto(label: 'Close-up Angle')),
                    ],
                  ),
                const SizedBox(height: 18),

                // 5. AI Assessment Panel
                _buildAiAssessmentCard(context, _case),
                const SizedBox(height: 18),

                // 6. Clinical Assessment Checklist Summary
                Text(
                  'Structured Clinical Assessment',
                  style: GoogleFonts.manrope(
                    fontSize: 15.5,
                    fontWeight: FontWeight.w700,
                    color: SkinLinkColors.textPrimary,
                  ),
                ),
                const SizedBox(height: 8),
                Container(
                  padding: const EdgeInsets.all(14),
                  decoration: BoxDecoration(
                    color: Colors.white,
                    borderRadius: BorderRadius.circular(12),
                    border: Border.all(color: SkinLinkColors.cardBorder),
                  ),
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      _detailRow('Primary Concern', _case?.primaryConcern ?? 'Not specified'),
                      const Divider(height: 16),
                      _detailRow('Duration', _case != null ? '${_case!.durationDays} days' : 'Not specified'),
                      const Divider(height: 16),
                      _detailRow('Suspected by Clinic', diagnosis),
                      if (_case?.bodySite != null) ...[
                        const Divider(height: 16),
                        _detailRow('Body Site', _case!.bodySite!),
                      ],
                      if (_case?.clinicalInfo != null && _case!.clinicalInfo.isNotEmpty) ...[
                        const Divider(height: 16),
                        _detailRow('Clinical Notes', _case!.clinicalInfo),
                      ],
                    ],
                  ),
                ),
                const SizedBox(height: 18),

                // 6. Actionable Guidance & Follow-Up Section
                if (hasGuidance) ...[
                  Text(
                    'Prescribed Treatment Regimen',
                    style: GoogleFonts.manrope(
                      fontSize: 15.5,
                      fontWeight: FontWeight.w700,
                      color: SkinLinkColors.textPrimary,
                    ),
                  ),
                  const SizedBox(height: 8),
                  Container(
                    padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 12),
                    decoration: BoxDecoration(
                      color: Colors.white,
                      borderRadius: BorderRadius.circular(12),
                      border: Border.all(color: SkinLinkColors.cardBorder),
                    ),
                    child: Column(
                      children: treatmentItems.isNotEmpty
                          ? treatmentItems.map((item) => TreatmentChecklistItem(text: item)).toList()
                          : [
                              Padding(
                                padding: const EdgeInsets.all(8.0),
                                child: Text(
                                  'See specialist guidance for detailed treatment instructions.',
                                  style: GoogleFonts.inter(fontSize: 13, color: SkinLinkColors.textMuted),
                                ),
                              ),
                            ],
                    ),
                  ),
                  const SizedBox(height: 14),
                  Row(
                    children: [
                      Expanded(
                        child: OutlinedButton.icon(
                          onPressed: () => Navigator.of(context).push(
                            MaterialPageRoute(builder: (_) => GuidanceScreen(caseId: _case!.id)),
                          ),
                          icon: const Icon(Icons.description_outlined, size: 18),
                          label: const Text('Patient Handout'),
                        ),
                      ),
                      const SizedBox(width: 10),
                      Expanded(
                        child: ElevatedButton.icon(
                          style: ElevatedButton.styleFrom(backgroundColor: SkinLinkColors.teal),
                          onPressed: () => Navigator.of(context).push(
                            MaterialPageRoute(builder: (_) => FollowUpRecordScreen(caseId: _case!.id)),
                          ),
                          icon: const Icon(Icons.assignment_turned_in_outlined, size: 18),
                          label: const Text('Record Follow-Up'),
                        ),
                      ),
                    ],
                  ),
                ],
                const SizedBox(height: 24),
              ],
            ),
      // Bottom Action Bar: Clear clinic worker actions
      bottomNavigationBar: Container(
        padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 12),
        decoration: const BoxDecoration(
          color: Colors.white,
          border: Border(top: BorderSide(color: SkinLinkColors.cardBorder)),
        ),
        child: SafeArea(
          child: hasGuidance
              ? SkinLinkGradientButton(
                  text: 'View Specialist Guidance & Handout',
                  onPressed: () {
                    if (_case != null) {
                      Navigator.of(context).push(
                        MaterialPageRoute(builder: (_) => GuidanceScreen(caseId: _case!.id)),
                      );
                    }
                  },
                )
              : Row(
                  children: [
                    Expanded(
                      child: OutlinedButton.icon(
                        onPressed: _addNoteDialog,
                        icon: const Icon(Icons.chat_bubble_outline, size: 18),
                        label: const Text('Add Clarification Note'),
                      ),
                    ),
                    const SizedBox(width: 10),
                    Expanded(
                      child: ElevatedButton.icon(
                        style: ElevatedButton.styleFrom(backgroundColor: SkinLinkColors.primary),
                        onPressed: () => Navigator.of(context).pop(),
                        icon: const Icon(Icons.arrow_back, size: 18),
                        label: const Text('Back to Queue'),
                      ),
                    ),
                  ],
                ),
        ),
      ),
    );
  }

  Widget _buildAiAssessmentCard(BuildContext context, DermCase? dermCase) {
    final ai = dermCase?.ai;
    final hasAi = ai != null && ai.isNotEmpty;

    // Normalise backend shape → display values
    String? urgencyLabel;
    Color urgencyColor = SkinLinkColors.primary;
    List<String> conditions = [];
    List<String> observations = [];
    List<String> redFlags = [];
    List<String> missingInfo = [];
    int? qualityScore;
    String? qualityRating;
    List<String> qualityIssues = [];
    String? confidence;
    String? modelLabel;

    if (hasAi) {
      final urgency = ai['urgency'] as String? ?? 'routine';
      if (urgency == 'emergency' || urgency == 'emergent') {
        urgencyLabel = 'EMERGENCY';
        urgencyColor = const Color(0xFFDC2626);
      } else if (urgency == 'urgent' || urgency == 'prompt') {
        urgencyLabel = 'URGENT';
        urgencyColor = SkinLinkColors.orangeBadge;
      } else {
        urgencyLabel = 'ROUTINE';
        urgencyColor = const Color(0xFF0369A1);
      }

      final conds = ai['possible_conditions'] as List? ?? [];
      conditions = conds
          .take(3)
          .map((c) {
            final name = (c as Map)['condition'] as String? ?? '';
            final likelihood = c['likelihood'] as String? ?? '';
            final prob = c['probability'];
            final probStr = prob != null ? ' ($prob%)' : '';
            return '$name$probStr · $likelihood';
          })
          .toList();

      observations = (ai['observations'] as List? ?? []).cast<String>();
      redFlags = (ai['detected_red_flags'] as List? ?? []).cast<String>();
      missingInfo = (ai['missing_information'] as List? ?? []).cast<String>();
      confidence = ai['confidence'] as String?;
      modelLabel = ai['model'] as String?;

      final iq = ai['image_quality'] as Map<String, dynamic>?;
      if (iq != null) {
        qualityScore = iq['score'] as int?;
        qualityRating = iq['rating'] as String?;
        qualityIssues = (iq['issues'] as List? ?? []).cast<String>();
      }
    }

    return Container(
      decoration: BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.circular(14),
        border: Border.all(
          color: hasAi && urgencyLabel == 'EMERGENCY'
              ? const Color(0xFFFCA5A5)
              : hasAi && urgencyLabel == 'URGENT'
                  ? const Color(0xFFFDBA74)
                  : SkinLinkColors.cardBorder,
        ),
        boxShadow: [
          BoxShadow(
            color: Colors.black.withValues(alpha: 0.03),
            blurRadius: 8,
            offset: const Offset(0, 2),
          ),
        ],
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.stretch,
        children: [
          // Header
          Container(
            padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 12),
            decoration: BoxDecoration(
              color: SkinLinkColors.primary.withValues(alpha: 0.07),
              borderRadius: const BorderRadius.vertical(top: Radius.circular(13)),
            ),
            child: Row(
              children: [
                Container(
                  padding: const EdgeInsets.all(7),
                  decoration: BoxDecoration(
                    color: SkinLinkColors.primary.withValues(alpha: 0.15),
                    borderRadius: BorderRadius.circular(8),
                  ),
                  child: const Icon(Icons.auto_awesome, color: SkinLinkColors.primary, size: 18),
                ),
                const SizedBox(width: 10),
                Expanded(
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Text(
                        'AI-Assist Assessment',
                        style: GoogleFonts.manrope(
                          fontSize: 14.5,
                          fontWeight: FontWeight.w800,
                          color: SkinLinkColors.textPrimary,
                        ),
                      ),
                      Text(
                        'Decision support · not a diagnosis',
                        style: GoogleFonts.inter(fontSize: 11, color: SkinLinkColors.textMuted),
                      ),
                    ],
                  ),
                ),
                Container(
                  padding: const EdgeInsets.symmetric(horizontal: 7, vertical: 3),
                  decoration: BoxDecoration(
                    color: SkinLinkColors.primary.withValues(alpha: 0.15),
                    borderRadius: BorderRadius.circular(5),
                  ),
                  child: Text(
                    'BETA',
                    style: GoogleFonts.inter(
                      fontSize: 9,
                      fontWeight: FontWeight.w800,
                      color: SkinLinkColors.primary,
                      letterSpacing: 0.8,
                    ),
                  ),
                ),
              ],
            ),
          ),

          Padding(
            padding: const EdgeInsets.all(14),
            child: _aiLoading
                ? const Center(
                    child: Padding(
                      padding: EdgeInsets.symmetric(vertical: 20),
                      child: Column(
                        children: [
                          CircularProgressIndicator(color: SkinLinkColors.primary),
                          SizedBox(height: 10),
                          Text('Analysing images and clinical data…'),
                        ],
                      ),
                    ),
                  )
                : !hasAi
                    ? Column(
                        children: [
                          Text(
                            'No AI analysis yet for this case.',
                            style: GoogleFonts.inter(fontSize: 13, color: SkinLinkColors.textMuted),
                            textAlign: TextAlign.center,
                          ),
                          const SizedBox(height: 12),
                          SizedBox(
                            width: double.infinity,
                            child: ElevatedButton.icon(
                              style: ElevatedButton.styleFrom(
                                backgroundColor: SkinLinkColors.primary,
                                padding: const EdgeInsets.symmetric(vertical: 11),
                              ),
                              onPressed: _runAiAssessment,
                              icon: const Icon(Icons.auto_awesome, size: 17, color: Colors.white),
                              label: Text(
                                'Run AI Analysis',
                                style: GoogleFonts.inter(fontWeight: FontWeight.w700, color: Colors.white),
                              ),
                            ),
                          ),
                        ],
                      )
                    : Column(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: [
                          // Urgency row
                          Row(
                            children: [
                              Text(
                                'Suggested urgency:',
                                style: GoogleFonts.inter(fontSize: 12, color: SkinLinkColors.textMuted),
                              ),
                              const SizedBox(width: 8),
                              Container(
                                padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 3),
                                decoration: BoxDecoration(
                                  color: urgencyColor.withValues(alpha: 0.12),
                                  borderRadius: BorderRadius.circular(5),
                                  border: Border.all(color: urgencyColor.withValues(alpha: 0.3)),
                                ),
                                child: Text(
                                  urgencyLabel ?? 'ROUTINE',
                                  style: GoogleFonts.inter(
                                    fontSize: 11,
                                    fontWeight: FontWeight.w800,
                                    color: urgencyColor,
                                    letterSpacing: 0.5,
                                  ),
                                ),
                              ),
                              if (confidence != null) ...[
                                const SizedBox(width: 8),
                                Text(
                                  '${confidence!.toUpperCase()} confidence',
                                  style: GoogleFonts.inter(fontSize: 11, color: SkinLinkColors.textMuted),
                                ),
                              ],
                            ],
                          ),
                          const SizedBox(height: 12),

                          // Image quality row
                          if (qualityScore != null) ...[
                            _aiSectionLabel('Image Quality'),
                            const SizedBox(height: 6),
                            Row(
                              children: [
                                Expanded(
                                  child: ClipRRect(
                                    borderRadius: BorderRadius.circular(4),
                                    child: LinearProgressIndicator(
                                      value: qualityScore! / 100,
                                      minHeight: 6,
                                      backgroundColor: Colors.grey.shade200,
                                      valueColor: AlwaysStoppedAnimation<Color>(
                                        qualityScore! >= 80
                                            ? const Color(0xFF16A34A)
                                            : qualityScore! >= 60
                                                ? SkinLinkColors.orangeBadge
                                                : const Color(0xFFDC2626),
                                      ),
                                    ),
                                  ),
                                ),
                                const SizedBox(width: 8),
                                Text(
                                  '$qualityScore/100',
                                  style: GoogleFonts.inter(
                                    fontSize: 12,
                                    fontWeight: FontWeight.w700,
                                    color: SkinLinkColors.textPrimary,
                                  ),
                                ),
                                if (qualityRating != null) ...[
                                  const SizedBox(width: 6),
                                  Text(
                                    '(${qualityRating!})',
                                    style: GoogleFonts.inter(fontSize: 11, color: SkinLinkColors.textMuted),
                                  ),
                                ],
                              ],
                            ),
                            if (qualityIssues.isNotEmpty) ...[
                              const SizedBox(height: 4),
                              ...qualityIssues.map(
                                (issue) => Padding(
                                  padding: const EdgeInsets.only(top: 2),
                                  child: Row(
                                    crossAxisAlignment: CrossAxisAlignment.start,
                                    children: [
                                      const Icon(Icons.warning_amber_rounded, size: 13, color: SkinLinkColors.orangeBadge),
                                      const SizedBox(width: 4),
                                      Expanded(
                                        child: Text(
                                          issue,
                                          style: GoogleFonts.inter(fontSize: 11.5, color: SkinLinkColors.textMuted),
                                        ),
                                      ),
                                    ],
                                  ),
                                ),
                              ),
                            ],
                            const SizedBox(height: 12),
                          ],

                          // Differential diagnosis
                          if (conditions.isNotEmpty) ...[
                            _aiSectionLabel('Possible Conditions'),
                            const SizedBox(height: 6),
                            ...conditions.asMap().entries.map(
                              (e) => Padding(
                                padding: const EdgeInsets.only(bottom: 5),
                                child: Row(
                                  crossAxisAlignment: CrossAxisAlignment.start,
                                  children: [
                                    Text(
                                      '${e.key + 1}.',
                                      style: GoogleFonts.inter(
                                        fontSize: 12,
                                        fontWeight: FontWeight.w600,
                                        color: SkinLinkColors.textMuted,
                                      ),
                                    ),
                                    const SizedBox(width: 6),
                                    Expanded(
                                      child: Text(
                                        e.value,
                                        style: GoogleFonts.inter(
                                          fontSize: 13,
                                          fontWeight: FontWeight.w500,
                                          color: SkinLinkColors.textPrimary,
                                        ),
                                      ),
                                    ),
                                  ],
                                ),
                              ),
                            ),
                            const SizedBox(height: 12),
                          ],

                          // Key observations
                          if (observations.isNotEmpty) ...[
                            _aiSectionLabel('Key Observations'),
                            const SizedBox(height: 6),
                            Wrap(
                              spacing: 6,
                              runSpacing: 6,
                              children: observations
                                  .take(5)
                                  .map(
                                    (obs) => Container(
                                      padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 4),
                                      decoration: BoxDecoration(
                                        color: SkinLinkColors.tealLight,
                                        borderRadius: BorderRadius.circular(6),
                                        border: Border.all(color: SkinLinkColors.tealBorder),
                                      ),
                                      child: Text(
                                        obs,
                                        style: GoogleFonts.inter(
                                          fontSize: 11.5,
                                          color: SkinLinkColors.primaryDark,
                                          fontWeight: FontWeight.w500,
                                        ),
                                      ),
                                    ),
                                  )
                                  .toList(),
                            ),
                            const SizedBox(height: 12),
                          ],

                          // Red flags
                          if (redFlags.isNotEmpty) ...[
                            Container(
                              padding: const EdgeInsets.all(10),
                              decoration: BoxDecoration(
                                color: const Color(0xFFFFF7ED),
                                borderRadius: BorderRadius.circular(8),
                                border: Border.all(color: const Color(0xFFFED7AA)),
                              ),
                              child: Column(
                                crossAxisAlignment: CrossAxisAlignment.start,
                                children: [
                                  Row(
                                    children: [
                                      const Icon(Icons.flag_rounded, size: 15, color: Color(0xFFC2410C)),
                                      const SizedBox(width: 5),
                                      Text(
                                        'Red Flags Detected',
                                        style: GoogleFonts.inter(
                                          fontSize: 12.5,
                                          fontWeight: FontWeight.w700,
                                          color: const Color(0xFFC2410C),
                                        ),
                                      ),
                                    ],
                                  ),
                                  ...redFlags.map(
                                    (f) => Padding(
                                      padding: const EdgeInsets.only(top: 4),
                                      child: Text(
                                        '• $f',
                                        style: GoogleFonts.inter(fontSize: 12, color: const Color(0xFF9A3412)),
                                      ),
                                    ),
                                  ),
                                ],
                              ),
                            ),
                            const SizedBox(height: 12),
                          ],

                          // Missing information
                          if (missingInfo.isNotEmpty) ...[
                            _aiSectionLabel('Missing Information'),
                            const SizedBox(height: 4),
                            ...missingInfo.map(
                              (m) => Padding(
                                padding: const EdgeInsets.only(bottom: 3),
                                child: Row(
                                  children: [
                                    const Icon(Icons.info_outline, size: 13, color: SkinLinkColors.textMuted),
                                    const SizedBox(width: 5),
                                    Expanded(
                                      child: Text(
                                        m,
                                        style: GoogleFonts.inter(fontSize: 11.5, color: SkinLinkColors.textMuted),
                                      ),
                                    ),
                                  ],
                                ),
                              ),
                            ),
                            const SizedBox(height: 10),
                          ],

                          // Disclaimer + re-run
                          const Divider(height: 16),
                          Row(
                            children: [
                              Expanded(
                                child: Text(
                                  modelLabel != null
                                      ? 'Generated by $modelLabel. Specialist must confirm.'
                                      : 'AI assistance only · specialist confirmation required.',
                                  style: GoogleFonts.inter(fontSize: 10.5, color: SkinLinkColors.textLight),
                                ),
                              ),
                              TextButton.icon(
                                onPressed: _aiLoading ? null : _runAiAssessment,
                                icon: const Icon(Icons.refresh, size: 14),
                                label: Text(
                                  'Re-run',
                                  style: GoogleFonts.inter(fontSize: 12, fontWeight: FontWeight.w600),
                                ),
                                style: TextButton.styleFrom(
                                  foregroundColor: SkinLinkColors.primary,
                                  padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 4),
                                  tapTargetSize: MaterialTapTargetSize.shrinkWrap,
                                ),
                              ),
                            ],
                          ),
                        ],
                      ),
          ),
        ],
      ),
    );
  }

  Widget _aiSectionLabel(String text) {
    return Text(
      text,
      style: GoogleFonts.inter(
        fontSize: 11.5,
        fontWeight: FontWeight.w700,
        color: SkinLinkColors.textMuted,
        letterSpacing: 0.3,
      ),
    );
  }

  Widget _buildMilestonesCard(String status, bool hasGuidance) {
    int currentStep = 1;
    if (status == 'in_review') currentStep = 2;
    if (hasGuidance || status == 'reviewed') currentStep = 3;
    if (status == 'follow_up' || status == 'closed') currentStep = 4;

    return Container(
      padding: const EdgeInsets.all(14),
      decoration: BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.circular(14),
        border: Border.all(color: SkinLinkColors.cardBorder),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Text(
            'Referral Status Milestones',
            style: GoogleFonts.manrope(fontSize: 14, fontWeight: FontWeight.w700, color: SkinLinkColors.textPrimary),
          ),
          const SizedBox(height: 12),
          Row(
            children: [
              _milestoneStep(1, 'Submitted', currentStep >= 1, isCurrent: currentStep == 1),
              _milestoneLine(currentStep >= 2),
              _milestoneStep(2, 'In Review', currentStep >= 2, isCurrent: currentStep == 2),
              _milestoneLine(currentStep >= 3),
              _milestoneStep(3, 'Guidance', currentStep >= 3, isCurrent: currentStep == 3),
              _milestoneLine(currentStep >= 4),
              _milestoneStep(4, 'Follow-Up', currentStep >= 4, isCurrent: currentStep == 4),
            ],
          ),
        ],
      ),
    );
  }

  Widget _milestoneStep(int num, String label, bool isDone, {bool isCurrent = false}) {
    return Column(
      mainAxisSize: MainAxisSize.min,
      children: [
        Container(
          width: 26,
          height: 26,
          decoration: BoxDecoration(
            shape: BoxShape.circle,
            color: isDone ? SkinLinkColors.primary : Colors.grey.shade200,
            border: isCurrent ? Border.all(color: SkinLinkColors.orangeBadge, width: 2) : null,
          ),
          child: Center(
            child: isDone
                ? const Icon(Icons.check, size: 14, color: Colors.white)
                : Text('$num', style: TextStyle(fontSize: 11, color: Colors.grey.shade600, fontWeight: FontWeight.w600)),
          ),
        ),
        const SizedBox(height: 4),
        Text(
          label,
          style: GoogleFonts.inter(
            fontSize: 10,
            fontWeight: isCurrent ? FontWeight.w700 : FontWeight.w500,
            color: isCurrent ? SkinLinkColors.primaryDark : SkinLinkColors.textMuted,
          ),
        ),
      ],
    );
  }

  Widget _milestoneLine(bool isDone) {
    return Expanded(
      child: Container(
        height: 2,
        margin: const EdgeInsets.only(bottom: 14),
        color: isDone ? SkinLinkColors.primary : Colors.grey.shade300,
      ),
    );
  }

  Widget _buildGuidanceReceivedCard(BuildContext context, DermCase dermCase) {
    final diagnosis = dermCase.treatmentPlan?['diagnosis'] ?? 'Dermatitis';
    return Container(
      padding: const EdgeInsets.all(14),
      decoration: BoxDecoration(
        color: const Color(0xFFF0FDF4),
        borderRadius: BorderRadius.circular(12),
        border: Border.all(color: const Color(0xFFBBF7D0)),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Row(
            children: [
              const Icon(Icons.check_circle, color: Color(0xFF16A34A), size: 20),
              const SizedBox(width: 8),
              Text(
                'Specialist Guidance Ready',
                style: GoogleFonts.manrope(
                  fontSize: 14,
                  fontWeight: FontWeight.w800,
                  color: const Color(0xFF15803D),
                ),
              ),
            ],
          ),
          const SizedBox(height: 8),
          Text(
            'Specialist Diagnosis: $diagnosis',
            style: GoogleFonts.inter(fontSize: 13, fontWeight: FontWeight.w700, color: SkinLinkColors.textPrimary),
          ),
          const SizedBox(height: 4),
          Text(
            'The reviewing dermatologist has provided diagnostic guidance, treatment plan, and follow-up advice.',
            style: GoogleFonts.inter(fontSize: 12, color: SkinLinkColors.textMuted),
          ),
        ],
      ),
    );
  }

  Widget _buildAwaitingReviewCard(BuildContext context, DermCase? dermCase) {
    final isUrgent = dermCase?.priority == 'urgent' || dermCase?.priority == 'emergency';
    return Container(
      padding: const EdgeInsets.all(14),
      decoration: BoxDecoration(
        color: isUrgent ? const Color(0xFFFFF7ED) : const Color(0xFFF0F9FF),
        borderRadius: BorderRadius.circular(12),
        border: Border.all(color: isUrgent ? const Color(0xFFFED7AA) : const Color(0xFFBAE6FD)),
      ),
      child: Row(
        children: [
          Icon(
            isUrgent ? Icons.error_outline : Icons.access_time_rounded,
            color: isUrgent ? SkinLinkColors.orangeBadge : SkinLinkColors.primary,
            size: 24,
          ),
          const SizedBox(width: 12),
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(
                  isUrgent ? 'Urgent Queue — Specialist Alerted' : 'Awaiting Specialist Review',
                  style: GoogleFonts.manrope(
                    fontSize: 13.5,
                    fontWeight: FontWeight.w700,
                    color: isUrgent ? const Color(0xFFC2410C) : const Color(0xFF0369A1),
                  ),
                ),
                const SizedBox(height: 2),
                Text(
                  isUrgent
                    ? 'Target response: < 4 hours. Specialists at referral hospital have been notified.'
                    : 'Target response: < 24 hours. Routine queue assignment.',
                  style: GoogleFonts.inter(fontSize: 11.5, color: SkinLinkColors.textMuted),
                ),
              ],
            ),
          ),
        ],
      ),
    );
  }

  Widget _detailRow(String label, String value) {
    return Row(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        SizedBox(
          width: 110,
          child: Text(
            label,
            style: GoogleFonts.inter(fontSize: 12.5, fontWeight: FontWeight.w600, color: SkinLinkColors.textMuted),
          ),
        ),
        Expanded(
          child: Text(
            value,
            style: GoogleFonts.inter(fontSize: 13, fontWeight: FontWeight.w500, color: SkinLinkColors.textPrimary),
          ),
        ),
      ],
    );
  }

  Widget _buildPlaceholderPhoto({String label = 'Clinical Lesion Photo'}) {
    return Container(
      height: 130,
      decoration: BoxDecoration(
        color: const Color(0xFF334155),
        borderRadius: BorderRadius.circular(12),
      ),
      child: Center(
        child: Column(
          mainAxisAlignment: MainAxisAlignment.center,
          children: [
            const Icon(Icons.camera_alt_outlined, color: Colors.white70, size: 28),
            const SizedBox(height: 4),
            Text(
              label,
              style: GoogleFonts.inter(fontSize: 11, fontWeight: FontWeight.w600, color: Colors.white70),
            ),
          ],
        ),
      ),
    );
  }

  Widget _buildFollowUpReportCard(BuildContext context, DermCase dermCase) {
    final report = dermCase.followUpReport!;
    final state = context.watch<AppState>();
    final responseStr = report['response'] as String? ?? 'recorded';
    final adherenceStr = report['adherence'] as String? ?? 'full';
    final symptomsStr = report['symptoms'] as String? ?? '';
    final notesStr = report['notes'] as String? ?? '';
    final photoUrl = report['progressPhotoUrl'] as String?;
    final worsening = report['worsening'] == true;
    final submittedAt = report['submittedAt'] as String?;
    final submittedByName = report['submittedByName'] as String? ?? 'Clinical Worker';
    final hasFeedback = dermCase.hasSpecialistFollowUpFeedback;

    return Container(
      padding: const EdgeInsets.all(14),
      decoration: BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.circular(14),
        border: Border.all(color: worsening ? SkinLinkColors.orangeBadge : SkinLinkColors.cardBorder, width: worsening ? 1.5 : 1),
        boxShadow: [
          BoxShadow(
            color: Colors.black.withValues(alpha: 0.03),
            blurRadius: 6,
            offset: const Offset(0, 2),
          ),
        ],
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Row(
            children: [
              Container(
                padding: const EdgeInsets.all(8),
                decoration: BoxDecoration(
                  color: SkinLinkColors.teal.withValues(alpha: 0.1),
                  borderRadius: BorderRadius.circular(8),
                ),
                child: const Icon(Icons.assignment_turned_in, color: SkinLinkColors.teal, size: 20),
              ),
              const SizedBox(width: 10),
              Expanded(
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Text(
                      'Worker Follow-Up Report Recorded',
                      style: GoogleFonts.manrope(
                        fontSize: 14.5,
                        fontWeight: FontWeight.w800,
                        color: SkinLinkColors.textPrimary,
                      ),
                    ),
                    Text(
                      'Submitted by $submittedByName · ${submittedAt != null ? timeAgo(submittedAt) : "Recently"}',
                      style: GoogleFonts.inter(fontSize: 11.5, color: SkinLinkColors.textMuted),
                    ),
                  ],
                ),
              ),
              Container(
                padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 3),
                decoration: BoxDecoration(
                  color: hasFeedback ? SkinLinkColors.successLight : SkinLinkColors.warningLight,
                  borderRadius: BorderRadius.circular(6),
                ),
                child: Text(
                  hasFeedback ? 'SPECIALIST REVIEWED' : 'SENT TO SPECIALIST',
                  style: GoogleFonts.inter(
                    fontSize: 10,
                    fontWeight: FontWeight.w700,
                    color: hasFeedback ? SkinLinkColors.success : SkinLinkColors.warning,
                  ),
                ),
              ),
            ],
          ),
          if (worsening) ...[
            const SizedBox(height: 10),
            Container(
              padding: const EdgeInsets.all(8),
              decoration: BoxDecoration(
                color: SkinLinkColors.orangeLight,
                borderRadius: BorderRadius.circular(8),
                border: Border.all(color: SkinLinkColors.orangeBadge.withValues(alpha: 0.4)),
              ),
              child: Row(
                children: [
                  const Icon(Icons.warning_amber_rounded, color: SkinLinkColors.orangeBadge, size: 18),
                  const SizedBox(width: 6),
                  Expanded(
                    child: Text(
                      'Deterioration / Worsening Flagged for Urgent Re-Triage',
                      style: GoogleFonts.inter(fontSize: 11.5, fontWeight: FontWeight.w700, color: SkinLinkColors.orangeBadge),
                    ),
                  ),
                ],
              ),
            ),
          ],
          const SizedBox(height: 12),
          Row(
            children: [
              Expanded(
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Text('Patient Response', style: GoogleFonts.inter(fontSize: 11, color: SkinLinkColors.textMuted)),
                    const SizedBox(height: 2),
                    Text(
                      responseStr.toUpperCase(),
                      style: GoogleFonts.inter(fontSize: 12.5, fontWeight: FontWeight.w700, color: SkinLinkColors.textPrimary),
                    ),
                  ],
                ),
              ),
              Expanded(
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Text('Adherence Level', style: GoogleFonts.inter(fontSize: 11, color: SkinLinkColors.textMuted)),
                    const SizedBox(height: 2),
                    Text(
                      adherenceStr.toUpperCase(),
                      style: GoogleFonts.inter(fontSize: 12.5, fontWeight: FontWeight.w700, color: SkinLinkColors.textPrimary),
                    ),
                  ],
                ),
              ),
            ],
          ),
          if (symptomsStr.isNotEmpty) ...[
            const SizedBox(height: 10),
            Text('Reported Symptoms:', style: GoogleFonts.inter(fontSize: 11, fontWeight: FontWeight.w600, color: SkinLinkColors.textMuted)),
            const SizedBox(height: 2),
            Text(symptomsStr, style: GoogleFonts.inter(fontSize: 12.5, color: SkinLinkColors.textPrimary)),
          ],
          if (notesStr.isNotEmpty) ...[
            const SizedBox(height: 6),
            Text('Worker Notes: $notesStr', style: GoogleFonts.inter(fontSize: 12, fontStyle: FontStyle.italic, color: SkinLinkColors.textMuted)),
          ],
          if (photoUrl != null && photoUrl.isNotEmpty) ...[
            const SizedBox(height: 12),
            Text('Follow-Up Progress Photo:', style: GoogleFonts.inter(fontSize: 11, fontWeight: FontWeight.w600, color: SkinLinkColors.textMuted)),
            const SizedBox(height: 6),
            ClipRRect(
              borderRadius: BorderRadius.circular(8),
              child: Image.network(
                state.formatImageUrl(photoUrl),
                height: 120,
                width: 160,
                fit: BoxFit.cover,
                errorBuilder: (ctx, err, st) => Container(
                  height: 60,
                  width: 160,
                  color: Colors.grey.shade200,
                  child: const Center(child: Icon(Icons.broken_image, color: Colors.grey)),
                ),
              ),
            ),
          ],
        ],
      ),
    );
  }

  Widget _buildSpecialistResponseCard(BuildContext context, DermCase dermCase) {
    final feedback = dermCase.specialistFollowUpFeedback ?? '';
    final action = dermCase.specialistFollowUpAction ?? 'continue';
    final respondedAt = dermCase.specialistFollowUpRespondedAt;

    String actionLabel = 'Continue Current Regimen';
    Color actionBg = SkinLinkColors.tealLight;
    Color actionColor = SkinLinkColors.primaryDark;
    IconData actionIcon = Icons.check_circle_outline;

    if (action == 'discharge') {
      actionLabel = 'Discharge / Cleared';
      actionBg = SkinLinkColors.successLight;
      actionColor = SkinLinkColors.success;
      actionIcon = Icons.task_alt;
    } else if (action == 'adjust_regimen') {
      actionLabel = 'Adjust Treatment Regimen';
      actionBg = const Color(0xFFEFF6FF);
      actionColor = const Color(0xFF1D4ED8);
      actionIcon = Icons.tune;
    } else if (action == 'escalate') {
      actionLabel = 'Escalate for In-Person Specialist Visit';
      actionBg = SkinLinkColors.orangeLight;
      actionColor = SkinLinkColors.orangeBadge;
      actionIcon = Icons.warning_amber_rounded;
    }

    return Container(
      padding: const EdgeInsets.all(14),
      decoration: BoxDecoration(
        color: const Color(0xFFF0FDF4),
        borderRadius: BorderRadius.circular(14),
        border: Border.all(color: const Color(0xFF86EFAC), width: 1.5),
        boxShadow: [
          BoxShadow(
            color: const Color(0xFF16A34A).withValues(alpha: 0.05),
            blurRadius: 8,
            offset: const Offset(0, 2),
          ),
        ],
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Row(
            children: [
              Container(
                padding: const EdgeInsets.all(8),
                decoration: BoxDecoration(
                  color: const Color(0xFF16A34A).withValues(alpha: 0.15),
                  borderRadius: BorderRadius.circular(8),
                ),
                child: const Icon(Icons.medical_services_outlined, color: Color(0xFF15803D), size: 20),
              ),
              const SizedBox(width: 10),
              Expanded(
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Text(
                      'Specialist Response to Follow-Up',
                      style: GoogleFonts.manrope(
                        fontSize: 15,
                        fontWeight: FontWeight.w800,
                        color: const Color(0xFF14532D),
                      ),
                    ),
                    if (respondedAt != null)
                      Text(
                        'Received ${timeAgo(respondedAt)}',
                        style: GoogleFonts.inter(fontSize: 11.5, color: const Color(0xFF166534)),
                      ),
                  ],
                ),
              ),
            ],
          ),
          const SizedBox(height: 12),
          Container(
            padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 5),
            decoration: BoxDecoration(
              color: actionBg,
              borderRadius: BorderRadius.circular(6),
            ),
            child: Row(
              mainAxisSize: MainAxisSize.min,
              children: [
                Icon(actionIcon, size: 16, color: actionColor),
                const SizedBox(width: 6),
                Text(
                  actionLabel.toUpperCase(),
                  style: GoogleFonts.inter(fontSize: 11, fontWeight: FontWeight.w800, color: actionColor),
                ),
              ],
            ),
          ),
          const SizedBox(height: 10),
          Text(
            'Specialist Clinical Instructions & Feedback:',
            style: GoogleFonts.inter(fontSize: 11.5, fontWeight: FontWeight.w700, color: const Color(0xFF14532D)),
          ),
          const SizedBox(height: 4),
          Text(
            feedback,
            style: GoogleFonts.inter(
              fontSize: 13,
              height: 1.4,
              fontWeight: FontWeight.w500,
              color: SkinLinkColors.textPrimary,
            ),
          ),
        ],
      ),
    );
  }
}
