import 'package:flutter/foundation.dart';
import 'package:flutter/material.dart';
import 'package:google_fonts/google_fonts.dart';
import 'package:image_picker/image_picker.dart';
import 'package:provider/provider.dart';

import '../models/models.dart';
import '../providers/app_state.dart';
import '../theme/skinlink_theme.dart';
import '../widgets/skinlink_widgets.dart';

class FollowUpRecordScreen extends StatefulWidget {
  const FollowUpRecordScreen({super.key, required this.caseId});

  final String caseId;

  @override
  State<FollowUpRecordScreen> createState() => _FollowUpRecordScreenState();
}

class _FollowUpRecordScreenState extends State<FollowUpRecordScreen> {
  final _outcome = TextEditingController();
  final _symptoms = TextEditingController();
  String _adherence = 'full';
  String _response = 'improved';
  bool _worsening = false;
  bool _submitting = false;
  XFile? _progressPhoto;
  Uint8List? _progressBytes;
  final _picker = ImagePicker();

  @override
  void dispose() {
    _outcome.dispose();
    _symptoms.dispose();
    super.dispose();
  }

  Future<void> _pickPhoto(ImageSource source) async {
    try {
      final file = await _picker.pickImage(source: source, imageQuality: 85);
      if (file != null) {
        final bytes = await file.readAsBytes();
        setState(() {
          _progressPhoto = file;
          _progressBytes = bytes;
        });
      }
    } catch (e) {
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(content: Text('Could not open camera/gallery: $e')),
        );
      }
    }
  }

  Future<void> _submit() async {
    final state = context.read<AppState>();
    setState(() => _submitting = true);

    try {
      String? progressUrl;
      if (_progressPhoto != null) {
        try {
          progressUrl = await state.api.uploadImage(_progressPhoto!);
        } catch (_) {
          progressUrl = null; // offline / no server — skip photo upload
        }
      }

      final report = {
        'id': 'fur_${DateTime.now().millisecondsSinceEpoch}',
        'caseId': widget.caseId,
        'response': _response,
        'adherence': _adherence,
        'symptoms': _symptoms.text.trim().isNotEmpty
            ? _symptoms.text.trim()
            : 'Patient reported symptomatic change.',
        'notes': _outcome.text.trim(),
        'progressPhotoUrl': progressUrl,
        'worsening': _worsening,
        'submittedAt': DateTime.now().toIso8601String(),
        'submittedByName': state.user?.name ?? 'Clinical Officer',
      };

      // 1. Attempt to update case via API; if offline, update local state directly
      try {
        await state.api.updateCase(widget.caseId, {
          'status': 'follow_up',
          'followUpReport': report,
        });
      } catch (_) {
        // Offline: save follow-up report locally in AppState
        state.updateLocalCase(widget.caseId, {
          'status': 'follow_up',
          'followUpReport': report,
        });
      }

      // 2. Find and update corresponding FollowUp record if present
      FollowUp? followUp;
      for (final f in state.followUps) {
        if (f.caseId == widget.caseId) {
          followUp = f;
          break;
        }
      }

      final summaryOutcome =
          'Response: $_response | Adherence: $_adherence\n${_symptoms.text.trim()}${_worsening ? '\n⚠ RED FLAG: Deterioration flagged for urgent specialist re-triage' : ''}';

      if (followUp != null) {
        try {
          await state.api.updateFollowUp(followUp.id, {
            'status': 'completed',
            'outcome': summaryOutcome,
            'followUpReport': report,
          });
        } catch (_) {
          // Offline: save locally
          state.updateLocalFollowUp(followUp.id, {
            'status': 'completed',
            'outcome': summaryOutcome,
          });
        }
      }

      await state.refreshAll();

      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(
            content: Text(_worsening
                ? 'Follow-up sent & escalated to specialist urgently'
                : 'Follow-up progress submitted to specialist!'),
            backgroundColor:
                _worsening ? SkinLinkColors.orangeBadge : SkinLinkColors.success,
          ),
        );
        Navigator.of(context).pop();
      }
    } catch (e) {
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(content: Text('Error saving follow-up: $e')),
        );
      }
    } finally {
      if (mounted) setState(() => _submitting = false);
    }
  }

  @override
  Widget build(BuildContext context) {
    final state = context.watch<AppState>();
    final dermCase = state.cases.cast<DermCase?>().firstWhere(
          (c) => c?.id == widget.caseId,
          orElse: () => null,
        );
    final patient = dermCase != null ? state.patientById(dermCase.patientId) : null;
    final baselineImg = dermCase != null && dermCase.images.isNotEmpty
        ? (dermCase.images.first['url'] ?? dermCase.images.first['localPath']) as String?
        : null;

    final diagnosis = dermCase?.treatmentPlan?['diagnosis'] ??
        dermCase?.suspectedCondition ??
        'Under Evaluation';

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
          'Clinical Follow-Up Review',
          style: GoogleFonts.manrope(
            fontSize: 18,
            fontWeight: FontWeight.w800,
            color: Colors.white,
          ),
        ),
        centerTitle: true,
      ),
      body: ListView(
        padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 16),
        children: [
          // 1. Patient & Case Header
          Container(
            padding: const EdgeInsets.all(14),
            decoration: BoxDecoration(
              color: Colors.white,
              borderRadius: BorderRadius.circular(14),
              border: Border.all(color: SkinLinkColors.cardBorder),
            ),
            child: Row(
              children: [
                CircleAvatar(
                  radius: 22,
                  backgroundColor: SkinLinkColors.tealLight,
                  child: Text(
                    patient?.fullName.isNotEmpty == true ? patient!.fullName[0] : 'P',
                    style: GoogleFonts.manrope(
                      fontWeight: FontWeight.bold,
                      color: SkinLinkColors.primary,
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
                        patient?.fullName ?? 'Patient Record',
                        style: GoogleFonts.manrope(
                          fontWeight: FontWeight.w800,
                          fontSize: 15,
                          color: SkinLinkColors.textPrimary,
                        ),
                      ),
                      const SizedBox(height: 2),
                      Text(
                        'Diagnosis: $diagnosis',
                        style: GoogleFonts.inter(
                          fontSize: 12,
                          color: SkinLinkColors.primaryDark,
                          fontWeight: FontWeight.w600,
                        ),
                      ),
                    ],
                  ),
                ),
              ],
            ),
          ),
          const SizedBox(height: 14),

          // 2. Visual Progress Comparison (Baseline vs Progress)
          Container(
            padding: const EdgeInsets.all(14),
            decoration: BoxDecoration(
              color: Colors.white,
              borderRadius: BorderRadius.circular(14),
              border: Border.all(color: SkinLinkColors.cardBorder),
            ),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Row(
                  mainAxisAlignment: MainAxisAlignment.spaceBetween,
                  children: [
                    Text(
                      'Visual Progress Comparison',
                      style: GoogleFonts.manrope(
                        fontSize: 14,
                        fontWeight: FontWeight.w700,
                        color: SkinLinkColors.textPrimary,
                      ),
                    ),
                    Container(
                      padding: const EdgeInsets.symmetric(horizontal: 7, vertical: 2),
                      decoration: BoxDecoration(
                        color: SkinLinkColors.tealLight,
                        borderRadius: BorderRadius.circular(4),
                      ),
                      child: Text(
                        'Side-by-Side',
                        style: GoogleFonts.inter(
                          fontSize: 10,
                          fontWeight: FontWeight.bold,
                          color: SkinLinkColors.primary,
                        ),
                      ),
                    ),
                  ],
                ),
                const SizedBox(height: 10),
                Row(
                  children: [
                    // Baseline Photo (Day 0)
                    Expanded(
                      child: Column(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: [
                          Text(
                            'Baseline (Day 0)',
                            style: GoogleFonts.inter(
                              fontSize: 11,
                              fontWeight: FontWeight.w600,
                              color: SkinLinkColors.textMuted,
                            ),
                          ),
                          const SizedBox(height: 4),
                          Container(
                            height: 120,
                            decoration: BoxDecoration(
                              color: const Color(0xFF1E293B),
                              borderRadius: BorderRadius.circular(10),
                              border: Border.all(color: SkinLinkColors.cardBorder),
                            ),
                            child: ClipRRect(
                              borderRadius: BorderRadius.circular(10),
                              child: _buildBaselineImage(baselineImg),
                            ),
                          ),
                        ],
                      ),
                    ),
                    const SizedBox(width: 10),

                    // Progress Photo (Day 7/14)
                    Expanded(
                      child: Column(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: [
                          Text(
                            'Progress Photo (Today)',
                            style: GoogleFonts.inter(
                              fontSize: 11,
                              fontWeight: FontWeight.w600,
                              color: SkinLinkColors.textMuted,
                            ),
                          ),
                          const SizedBox(height: 4),
                          InkWell(
                            onTap: () => _pickPhoto(ImageSource.camera),
                            borderRadius: BorderRadius.circular(10),
                            child: Container(
                              height: 120,
                              decoration: BoxDecoration(
                                color: SkinLinkColors.primary.withValues(alpha: 0.05),
                                borderRadius: BorderRadius.circular(10),
                                border: Border.all(
                                  color: SkinLinkColors.primary.withValues(alpha: 0.35),
                                ),
                              ),
                              child: _progressBytes != null
                                  ? Stack(
                                      fit: StackFit.expand,
                                      children: [
                                        ClipRRect(
                                          borderRadius: BorderRadius.circular(10),
                                          child: Image.memory(
                                            _progressBytes!,
                                            fit: BoxFit.cover,
                                          ),
                                        ),
                                        Positioned(
                                          bottom: 6,
                                          right: 6,
                                          child: Container(
                                            padding: const EdgeInsets.all(4),
                                            decoration: BoxDecoration(
                                              color: Colors.black.withValues(alpha: 0.6),
                                              shape: BoxShape.circle,
                                            ),
                                            child: const Icon(
                                              Icons.refresh,
                                              size: 14,
                                              color: Colors.white,
                                            ),
                                          ),
                                        ),
                                      ],
                                    )
                                  : Column(
                                      mainAxisAlignment: MainAxisAlignment.center,
                                      children: [
                                        const Icon(
                                          Icons.camera_alt_outlined,
                                          color: SkinLinkColors.primary,
                                          size: 26,
                                        ),
                                        const SizedBox(height: 4),
                                        Text(
                                          'Take Photo',
                                          style: GoogleFonts.inter(
                                            fontSize: 11,
                                            fontWeight: FontWeight.w700,
                                            color: SkinLinkColors.primary,
                                          ),
                                        ),
                                        Text(
                                          'or tap gallery',
                                          style: GoogleFonts.inter(
                                            fontSize: 9.5,
                                            color: SkinLinkColors.textMuted,
                                          ),
                                        ),
                                      ],
                                    ),
                            ),
                          ),
                        ],
                      ),
                    ),
                  ],
                ),
              ],
            ),
          ),
          const SizedBox(height: 14),

          // 3. Clinical Response & Adherence Form
          Container(
            padding: const EdgeInsets.all(16),
            decoration: BoxDecoration(
              color: Colors.white,
              borderRadius: BorderRadius.circular(16),
              border: Border.all(color: SkinLinkColors.cardBorder),
            ),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.stretch,
              children: [
                Text(
                  'Treatment Response & Adherence',
                  style: GoogleFonts.manrope(
                    fontSize: 15,
                    fontWeight: FontWeight.w700,
                    color: SkinLinkColors.textPrimary,
                  ),
                ),
                const SizedBox(height: 12),

                // Lesion change dropdown
                DropdownButtonFormField<String>(
                  initialValue: _response,
                  decoration: const InputDecoration(
                    labelText: 'Lesion / Clinical Change',
                    border: OutlineInputBorder(),
                  ),
                  items: const [
                    DropdownMenuItem(value: 'resolved', child: Text('Completely Resolved (Cleared)')),
                    DropdownMenuItem(value: 'improved', child: Text('Substantially Improved (>50%)')),
                    DropdownMenuItem(value: 'mild_improvement', child: Text('Mild Improvement (<50%)')),
                    DropdownMenuItem(value: 'unchanged', child: Text('Unchanged / No Visible Change')),
                    DropdownMenuItem(value: 'worsened', child: Text('Condition Worsened (Alert)')),
                  ],
                  onChanged: (v) {
                    setState(() {
                      _response = v ?? 'improved';
                      if (_response == 'worsened') _worsening = true;
                    });
                  },
                ),
                const SizedBox(height: 12),

                // Treatment adherence dropdown
                DropdownButtonFormField<String>(
                  initialValue: _adherence,
                  decoration: const InputDecoration(
                    labelText: 'Treatment Adherence',
                    border: OutlineInputBorder(),
                  ),
                  items: const [
                    DropdownMenuItem(value: 'full', child: Text('Full Adherence (taken as directed)')),
                    DropdownMenuItem(value: 'partial', child: Text('Partial Adherence (missed doses)')),
                    DropdownMenuItem(value: 'stopped_adverse', child: Text('Stopped: Side effects / reaction')),
                    DropdownMenuItem(value: 'stopped_stock', child: Text('Stopped: Medication out of stock')),
                  ],
                  onChanged: (v) => setState(() => _adherence = v ?? 'full'),
                ),
                const SizedBox(height: 12),

                // Symptoms TextField
                TextField(
                  controller: _symptoms,
                  maxLines: 2,
                  decoration: const InputDecoration(
                    labelText: 'Current Symptoms (Itching, pain, redness)',
                    hintText: 'e.g. Itching stopped, redness reduced significantly...',
                    border: OutlineInputBorder(),
                  ),
                ),
                const SizedBox(height: 14),

                // Worsening / Escalation switch
                Container(
                  padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 4),
                  decoration: BoxDecoration(
                    color: _worsening ? const Color(0xFFFFF7ED) : Colors.transparent,
                    borderRadius: BorderRadius.circular(8),
                    border: Border.all(
                      color: _worsening ? const Color(0xFFFED7AA) : Colors.transparent,
                    ),
                  ),
                  child: SwitchListTile(
                    contentPadding: EdgeInsets.zero,
                    title: Text(
                      'Flag for Urgent Specialist Re-Evaluation',
                      style: GoogleFonts.inter(
                        fontWeight: FontWeight.w700,
                        fontSize: 13,
                        color: _worsening ? const Color(0xFF9A3412) : SkinLinkColors.textPrimary,
                      ),
                    ),
                    subtitle: Text(
                      'Patient condition worsened or had adverse reaction',
                      style: GoogleFonts.inter(
                        fontSize: 11,
                        color: SkinLinkColors.textMuted,
                      ),
                    ),
                    value: _worsening,
                    activeTrackColor: SkinLinkColors.orangeBadge,
                    onChanged: (v) => setState(() => _worsening = v),
                  ),
                ),
                const SizedBox(height: 12),

                // Additional Notes
                TextField(
                  controller: _outcome,
                  maxLines: 2,
                  decoration: const InputDecoration(
                    labelText: 'Follow-Up Action & Notes',
                    hintText: 'e.g. Dispensed next week moisturizer, reinforced compliance...',
                    border: OutlineInputBorder(),
                  ),
                ),
                const SizedBox(height: 20),

                // Submit to specialist button
                SkinLinkGradientButton(
                  text: _submitting
                      ? 'Submitting to Specialist...'
                      : _worsening
                          ? 'Submit & Escalate to Specialist'
                          : 'Submit Follow-Up to Specialist',
                  onPressed: _submitting ? () {} : _submit,
                ),
              ],
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildBaselineImage(String? rawUrl) {
    final state = context.read<AppState>();
    final url = state.formatImageUrl(rawUrl);
    if (url.isEmpty) {
      return _buildImagePlaceholder('Day 0 Baseline');
    }
    return Image.network(
      url,
      fit: BoxFit.cover,
      width: double.infinity,
      errorBuilder: (context, error, stackTrace) => _buildImagePlaceholder('Day 0 Baseline'),
    );
  }

  Widget _buildImagePlaceholder(String label) {
    return Container(
      color: const Color(0xFF1E293B),
      child: Center(
        child: Column(
          mainAxisAlignment: MainAxisAlignment.center,
          children: [
            const Icon(Icons.photo_outlined, color: Colors.white70, size: 26),
            const SizedBox(height: 4),
            Text(
              label,
              style: GoogleFonts.inter(
                fontSize: 10.5,
                fontWeight: FontWeight.w600,
                color: Colors.white70,
              ),
              textAlign: TextAlign.center,
            ),
          ],
        ),
      ),
    );
  }
}
