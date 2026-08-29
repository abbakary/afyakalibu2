import 'dart:io';

import 'package:flutter/foundation.dart';
import 'package:flutter/material.dart';
import 'package:google_fonts/google_fonts.dart';
import 'package:image_picker/image_picker.dart';
import 'package:provider/provider.dart';
import 'package:uuid/uuid.dart';

import '../models/models.dart';
import '../providers/app_state.dart';
import '../theme/skinlink_theme.dart';
import '../widgets/skinlink_widgets.dart';
import 'submission_success_screen.dart';

const _angles = ['Overview', 'Close-up', 'Macro', 'Scale reference'];
const _stepLabels = ['Patient Info', 'Photos', 'Clinical Details', 'Submit'];

class NewReferralScreen extends StatefulWidget {
  const NewReferralScreen({super.key, this.draftId});

  final String? draftId;

  @override
  State<NewReferralScreen> createState() => _NewReferralScreenState();
}

class _NewReferralScreenState extends State<NewReferralScreen> {
  int _step = 0;
  late String _draftId;

  // Patient Info (Step 0) — sub-section navigation within the patient step
  int _patientSection = 0; // 0=demographics, 1=location/contact, 2=medical history, 3=consent

  // ── Mode ──────────────────────────────────────────────────────────────────
  String _mode = 'new';
  String? _existingPatientId;

  // ── Section 0: Demographics ───────────────────────────────────────────────
  final _fullName = TextEditingController();
  final _age = TextEditingController();
  String _ageRange = '25 - 35';
  String _gender = 'Female';
  String _preferredLanguage = '';

  // ── Section 1: Location & contact ─────────────────────────────────────────
  final _village = TextEditingController();
  final _district = TextEditingController();
  String _selectedRegion = 'Arusha';
  final _country = TextEditingController(text: 'Tanzania');
  final _phone = TextEditingController();
  final _alternatePhone = TextEditingController();

  // ── Section 2: Medical history ────────────────────────────────────────────
  final _medicalHistory = TextEditingController();
  final _allergies = TextEditingController();
  final _currentMedications = TextEditingController();
  final _chronicConditions = TextEditingController();

  // ── Section 3: Consent ────────────────────────────────────────────────────
  bool _consentForPhotography = false;
  bool _consentForRemoteReview = false;
  bool _consentForStorage = false;
  final _consentWitness = TextEditingController();

  bool get _consentObtained =>
      _consentForPhotography && _consentForRemoteReview && _consentForStorage;

  // Images (Step 1)
  final List<Map<String, dynamic>> _images = [];
  final Map<int, Map<String, dynamic>> _imageQuality = {};
  final _picker = ImagePicker();

  // Clinical (Step 2)
  final _concern = TextEditingController();
  final _clinicalNotes = TextEditingController();
  final _duration = TextEditingController();
  final _suspected = TextEditingController();
  final _bodySite = TextEditingController();
  final _prevTreatment = TextEditingController();
  String _priority = 'routine';
  bool _redFlag = false;

  // ── Step 3: Review + Specialist selection ────────────────────────────────
  List<Specialist> _specialists = [];
  bool _loadingSpecialists = false;
  String? _selectedSpecialistId; // null = auto-assign

  Future<void> _loadSpecialists() async {
    if (_specialists.isNotEmpty) return; // already loaded
    setState(() => _loadingSpecialists = true);
    try {
      final list = await context.read<AppState>().api.getSpecialists();
      if (mounted) setState(() => _specialists = list);
    } catch (_) {
      // Non-fatal — auto-assign will be used if specialist list unavailable
    } finally {
      if (mounted) setState(() => _loadingSpecialists = false);
    }
  }
  final _ageRanges = const ['0 - 12', '13 - 24', '25 - 35', '36 - 50', '51 - 65', '65+'];
  final _locationsList = const [
    'Arusha', 'Mwanza', 'Kilimanjaro', 'Dar es Salaam',
    'Dodoma', 'Tanga', 'Mbeya', 'Morogoro', 'Iringa', 'Mtwara',
  ];
  final _languageOptions = const ['Swahili', 'English'];

  @override
  void initState() {
    super.initState();
    _draftId = widget.draftId ?? const Uuid().v4();
    _loadDraft();
  }

  void _loadDraft() {
    if (widget.draftId == null) return;
    final drafts = context.read<AppState>().localDrafts;
    final draft = drafts.cast<Map<String, dynamic>?>().firstWhere(
          (d) => d!['id'] == widget.draftId,
          orElse: () => null,
        );
    if (draft == null) return;
    setState(() {
      _step = draft['step'] as int? ?? 0;
      final patient = draft['patient'] as Map<String, dynamic>?;
      if (patient != null) {
        _mode = patient['mode'] as String? ?? 'new';
        _existingPatientId = patient['existingId'] as String?;
        _fullName.text = patient['fullName'] as String? ?? '';
        _age.text = '${patient['age'] ?? ''}';
        _ageRange = patient['ageRange'] as String? ?? '25 - 35';
        _gender = patient['gender'] as String? ?? 'Female';
        _preferredLanguage = patient['preferredLanguage'] as String? ?? '';
        _village.text = patient['village'] as String? ?? '';
        _district.text = patient['district'] as String? ?? '';
        _selectedRegion = patient['region'] as String? ?? 'Arusha';
        _country.text = patient['country'] as String? ?? 'Tanzania';
        _phone.text = patient['phone'] as String? ?? '';
        _alternatePhone.text = patient['alternatePhone'] as String? ?? '';
        _medicalHistory.text = patient['medicalHistory'] as String? ?? '';
        _allergies.text = patient['allergies'] as String? ?? '';
        _currentMedications.text = patient['currentMedications'] as String? ?? '';
        _chronicConditions.text = patient['chronicConditions'] as String? ?? '';
        _consentForPhotography = patient['consentForPhotography'] as bool? ?? false;
        _consentForRemoteReview = patient['consentForRemoteReview'] as bool? ?? false;
        _consentForStorage = patient['consentForStorage'] as bool? ?? false;
        _consentWitness.text = patient['consentWitness'] as String? ?? '';
      }
      _images.clear();
      _images.addAll((draft['images'] as List?)?.cast<Map<String, dynamic>>() ?? []);
      final clinical = draft['clinical'] as Map<String, dynamic>?;
      if (clinical != null) {
        _concern.text = clinical['primaryConcern'] as String? ?? '';
        _clinicalNotes.text = clinical['clinicalInfo'] as String? ?? '';
        _duration.text = '${clinical['durationDays'] ?? ''}';
        _suspected.text = clinical['suspectedCondition'] as String? ?? '';
        _bodySite.text = clinical['bodySite'] as String? ?? '';
        _prevTreatment.text = clinical['previousTreatment'] as String? ?? '';
        _priority = clinical['priority'] as String? ?? 'routine';
        _redFlag = clinical['redFlags'] != null && (clinical['redFlags'] as List).isNotEmpty;
      }
    });
  }

  @override
  void dispose() {
    _fullName.dispose();
    _age.dispose();
    _village.dispose();
    _district.dispose();
    _country.dispose();
    _phone.dispose();
    _alternatePhone.dispose();
    _medicalHistory.dispose();
    _allergies.dispose();
    _currentMedications.dispose();
    _chronicConditions.dispose();
    _consentWitness.dispose();
    _concern.dispose();
    _clinicalNotes.dispose();
    _duration.dispose();
    _suspected.dispose();
    _bodySite.dispose();
    _prevTreatment.dispose();
    super.dispose();
  }

  bool get _patientValid =>
      _mode == 'existing'
          ? _existingPatientId != null
          : _fullName.text.trim().isNotEmpty && _consentObtained;

  bool get _clinicalValid => _concern.text.trim().isNotEmpty;

  /// True if any image has finished quality check and requires a retake.
  bool get _hasRetakeRequired => _imageQuality.values.any(
        (q) => q['checking'] != true && q['retake_required'] == true,
      );

  /// True if any quality check is still running.
  bool get _isCheckingQuality => _imageQuality.values.any(
        (q) => q['checking'] == true,
      );

  bool get _canNext {
    if (_step == 0) return _patientValid;
    // Images step: must have images, no retake required, no check in progress
    if (_step == 1) return _images.isNotEmpty && !_hasRetakeRequired && !_isCheckingQuality;
    if (_step == 2) return _clinicalValid;
    return true;
  }

  Map<String, dynamic> _buildDraft() => {
        'id': _draftId,
        'step': _step,
        'patient': {
          'mode': _mode,
          'existingId': _existingPatientId,
          'fullName': _fullName.text.trim(),
          'age': int.tryParse(_age.text) ?? 28,
          'ageRange': _ageRange,
          'gender': _gender,
          'preferredLanguage': _preferredLanguage,
          'village': _village.text.trim(),
          'district': _district.text.trim(),
          'region': _selectedRegion,
          'country': _country.text.trim(),
          'phone': _phone.text.trim(),
          'alternatePhone': _alternatePhone.text.trim(),
          'medicalHistory': _medicalHistory.text.trim(),
          'allergies': _allergies.text.trim(),
          'currentMedications': _currentMedications.text.trim(),
          'chronicConditions': _chronicConditions.text.trim(),
          'consentForPhotography': _consentForPhotography,
          'consentForRemoteReview': _consentForRemoteReview,
          'consentForStorage': _consentForStorage,
          'consentWitness': _consentWitness.text.trim(),
        },
        'images': _images,
        'clinical': {
          'primaryConcern': _concern.text.trim(),
          'clinicalInfo': _clinicalNotes.text.trim(),
          'durationDays': int.tryParse(_duration.text) ?? 7,
          'suspectedCondition': _suspected.text.trim(),
          'bodySite': _bodySite.text.trim(),
          'previousTreatment': _prevTreatment.text.trim(),
          'priority': _priority,
          'redFlags': _redFlag ? ['Clinical red flag reported'] : [],
        },
      };

  Future<void> _saveDraft() async {
    await context.read<AppState>().saveLocalDraft(_buildDraft());
    if (mounted) {
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(
          content: Text('Draft saved locally'),
          backgroundColor: SkinLinkColors.primary,
        ),
      );
    }
  }

  Future<void> _captureImage(ImageSource source) async {
    final file = await _picker.pickImage(source: source, imageQuality: 85);
    if (file == null) return;
    if (!mounted) return;
    final state = context.read<AppState>();
    final bytes = await file.readAsBytes();
    String url = file.path;

    // Upload immediately so we have a server URL for the quality check
    if (state.online) {
      try {
        url = await state.api.uploadImage(file);
      } catch (_) {}
    }

    final angle = _angles[_images.length % _angles.length];
    final newIndex = _images.length;

    setState(() {
      _images.add({
        'url': url,
        'localPath': file.path,
        'bytes': bytes,
        'angle': angle,
      });
      // Mark as checking while the quality call is in flight
      _imageQuality[newIndex] = {'checking': true};
    });

    // Run AI image-quality check in the background
    if (state.online && url.startsWith('http')) {
      try {
        final quality = await state.api.checkImageQuality(url, angle: angle);
        if (!mounted) return;
        setState(() {
          _imageQuality[newIndex] = {
            'checking': false,
            'rating': quality['image_quality']?['rating'] ?? quality['rating'] ?? 'acceptable',
            'score': quality['image_quality']?['score'] ?? quality['score'] ?? 0,
            'issues': (quality['image_quality']?['issues'] ?? quality['issues'] ?? <dynamic>[])
                .cast<String>(),
            'retake_required': quality['retake_required'] == true,
          };
        });

        // Show a SnackBar for retake warnings
        final q = _imageQuality[newIndex];
        if (q != null && q['retake_required'] == true && mounted) {
          final issues = (q['issues'] as List<String>?) ?? [];
          ScaffoldMessenger.of(context).showSnackBar(
            SnackBar(
              backgroundColor: const Color(0xFFEF4444),
              content: Row(
                children: [
                  const Icon(Icons.warning_amber_rounded, color: Colors.white, size: 18),
                  const SizedBox(width: 8),
                  Expanded(
                    child: Text(
                      issues.isNotEmpty
                          ? 'Image ${newIndex + 1}: ${issues.first}'
                          : 'Image ${newIndex + 1}: Poor quality — consider retaking',
                      style: const TextStyle(color: Colors.white, fontSize: 13),
                    ),
                  ),
                ],
              ),
              duration: const Duration(seconds: 4),
            ),
          );
        }
      } catch (e) {
        if (mounted) {
          setState(() => _imageQuality[newIndex] = {'checking': false});
          ScaffoldMessenger.of(context).showSnackBar(
            SnackBar(
              backgroundColor: const Color(0xFFEF4444),
              content: Text('AI quality check failed: $e'),
              duration: const Duration(seconds: 4),
            ),
          );
        }
      }
    } else {
      // Offline — clear the checking flag immediately
      if (mounted) setState(() => _imageQuality[newIndex] = {'checking': false});
    }
  }

  Future<void> _submit() async {
    final state = context.read<AppState>();
    final region = state.tenant?.region ?? _selectedRegion;
    final consentDate = DateTime.now().toIso8601String().substring(0, 10);
    final witness = _consentWitness.text.trim().isNotEmpty
        ? _consentWitness.text.trim()
        : (state.user?.name ?? 'Clinician');

    final ageVal = int.tryParse(_age.text) ?? 28;
    final durVal = int.tryParse(_duration.text) ?? 7;

    final payload = <String, dynamic>{
      'draftId': _draftId,
      // Pass selected specialist (null = auto-assign on backend)
      if (_selectedSpecialistId != null) 'specialistId': _selectedSpecialistId,
      'clinical': {
        'primaryConcern': _concern.text.trim().isEmpty ? 'Skin condition' : _concern.text.trim(),
        'clinicalInfo': _clinicalNotes.text.trim().isEmpty ? _concern.text.trim() : _clinicalNotes.text.trim(),
        'durationDays': durVal,
        'suspectedCondition': _suspected.text.trim().isEmpty ? 'Awaiting specialist review' : _suspected.text.trim(),
        'bodySite': _bodySite.text.trim(),
        'previousTreatment': _prevTreatment.text.trim(),
        'priority': _priority,
        'redFlags': _redFlag ? ['Clinical red flag reported'] : [],
      },
      'images': _images.asMap().entries.map((e) {
        final idx = e.key;
        final img = e.value;
        final q = _imageQuality[idx];
        // Use actual AI quality check result if available
        final rating = (q != null && q['checking'] != true)
            ? (q['rating'] as String? ?? 'acceptable')
            : 'acceptable';
        final score = (q != null && q['checking'] != true)
            ? (q['score'] as int? ?? 75)
            : 75;
        return {
          'url': img['url'],
          'angle': img['angle'],
          'quality': rating,
          'qualityScore': score,
        };
      }).toList(),
    };

    if (_mode == 'existing') {
      payload['patientId'] = _existingPatientId;
    } else {
      payload['patient'] = {
        'fullName': _fullName.text.trim().isEmpty ? 'Patient' : _fullName.text.trim(),
        'age': ageVal,
        'gender': _gender,
        'preferredLanguage': _preferredLanguage.isEmpty ? null : _preferredLanguage,
        'village': _village.text.trim().isEmpty ? _selectedRegion : _village.text.trim(),
        'district': _district.text.trim().isEmpty ? null : _district.text.trim(),
        'region': region,
        'country': _country.text.trim().isEmpty ? null : _country.text.trim(),
        'phone': _phone.text.trim().isEmpty ? null : _phone.text.trim(),
        'alternatePhone': _alternatePhone.text.trim().isEmpty ? null : _alternatePhone.text.trim(),
        'medicalHistory': _medicalHistory.text.trim().isEmpty ? null : _medicalHistory.text.trim(),
        'allergies': _allergies.text.trim().isEmpty ? null : _allergies.text.trim(),
        'currentMedications': _currentMedications.text.trim().isEmpty ? null : _currentMedications.text.trim(),
        'chronicConditions': _chronicConditions.text.trim().isEmpty ? null : _chronicConditions.text.trim(),
        'consentObtained': _consentObtained,
        'consentForPhotography': _consentForPhotography,
        'consentForRemoteReview': _consentForRemoteReview,
        'consentForStorage': _consentForStorage,
        'consentDate': consentDate,
        'consentWitness': witness,
      };
    }

    if (!state.online) {
      payload['pendingSync'] = true;
      payload['step'] = _step;
      payload['patient'] = payload['patient'] ?? {'existingId': _existingPatientId};
      await state.saveLocalDraft({..._buildDraft(), 'pendingSync': true});
      if (!mounted) return;
      Navigator.of(context).pushReplacement(
        MaterialPageRoute(
          builder: (_) => SubmissionSuccessScreen(
            ref: 'DRAFT-${_draftId.substring(0, 8).toUpperCase()}',
            offline: true,
          ),
        ),
      );
      return;
    }

    final result = await state.submitReferral(payload);
    if (!mounted) return;
    if (result != null) {
      Navigator.of(context).pushReplacement(
        MaterialPageRoute(
          builder: (_) => SubmissionSuccessScreen(ref: result.ref, offline: false, caseId: result.id),
        ),
      );
    } else {
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(
          content: Text(state.error ?? 'Submission failed'),
          backgroundColor: SkinLinkColors.destructive,
        ),
      );
    }
  }

  @override
  Widget build(BuildContext context) {
    final patients = context.watch<AppState>().patients;

    return Scaffold(
      backgroundColor: SkinLinkColors.background,
      appBar: AppBar(
        backgroundColor: SkinLinkColors.primary,
        elevation: 0,
        leading: IconButton(
          icon: const Icon(Icons.arrow_back_ios_new, color: Colors.white, size: 20),
          onPressed: () {
            if (_step > 0) {
              setState(() => _step--);
            } else {
              Navigator.of(context).pop();
            }
          },
        ),
        title: Text(
          'New Referral',
          style: GoogleFonts.manrope(
            fontSize: 18,
            fontWeight: FontWeight.w800,
            color: Colors.white,
          ),
        ),
        centerTitle: true,
        actions: [
          TextButton(
            onPressed: _saveDraft,
            child: Text(
              'Save Draft',
              style: GoogleFonts.inter(
                fontSize: 12.5,
                fontWeight: FontWeight.w600,
                color: Colors.white.withValues(alpha: 0.9),
              ),
            ),
          ),
        ],
      ),
      body: Column(
        children: [
          // 4-Step Horizontal Pill Stepper Bar
          Container(
            color: Colors.white,
            padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 12),
            child: StepProgressIndicator(
              currentStep: _step,
              steps: _stepLabels,
              onStepTapped: (i) {
                if (i <= _step || _canNext) {
                  setState(() => _step = i);
                }
              },
            ),
          ),

          // Main Step Form Body
          Expanded(
            child: SingleChildScrollView(
              padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 16),
              child: _step == 0
                  ? _patientStep(patients)
                  : _step == 1
                      ? _imagesStep()
                      : _step == 2
                          ? _clinicalStep()
                          : _reviewStep(),
            ),
          ),

          // Bottom Action Row (Back & Next)
          _navBar(),
        ],
      ),
    );
  }

  // STEP 0: PATIENT INFO — 4 sub-sections with internal navigation
  Widget _patientStep(List<Patient> patients) {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.stretch,
      children: [
        // Mode selector
        if (_patientSection == 0) ...[
          Container(
            padding: const EdgeInsets.all(4),
            decoration: BoxDecoration(
              color: SkinLinkColors.background,
              borderRadius: BorderRadius.circular(10),
            ),
            child: Row(
              children: [
                _modeTab('New Patient', 'new'),
                _modeTab('Existing', 'existing'),
              ],
            ),
          ),
          const SizedBox(height: 14),
        ],

        if (_mode == 'existing') ...[
          _sectionCard(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.stretch,
              children: [
                _fieldLabel('Select Patient'),
                const SizedBox(height: 8),
                DropdownButtonFormField<String>(
                  value: _existingPatientId,
                  decoration: const InputDecoration(hintText: 'Choose existing patient'),
                  items: patients
                      .map((p) => DropdownMenuItem<String>(
                            value: p.id,
                            child: Text('${p.fullName} · ${p.code}'),
                          ))
                      .toList(),
                  onChanged: (v) => setState(() => _existingPatientId = v),
                ),
              ],
            ),
          ),
        ] else ...[
          // Sub-section tab pills
          _patientSectionTabs(),
          const SizedBox(height: 14),

          // Section content
          _sectionCard(child: _patientSectionContent()),
        ],
      ],
    );
  }

  Widget _modeTab(String label, String value) {
    final active = _mode == value;
    return Expanded(
      child: InkWell(
        onTap: () => setState(() => _mode = value),
        borderRadius: BorderRadius.circular(8),
        child: Container(
          padding: const EdgeInsets.symmetric(vertical: 9),
          decoration: BoxDecoration(
            color: active ? Colors.white : Colors.transparent,
            borderRadius: BorderRadius.circular(8),
            boxShadow: active
                ? [BoxShadow(color: Colors.black.withValues(alpha: 0.06), blurRadius: 4, offset: const Offset(0, 1))]
                : null,
          ),
          alignment: Alignment.center,
          child: Text(
            label,
            style: GoogleFonts.inter(
              fontSize: 13,
              fontWeight: active ? FontWeight.w700 : FontWeight.w500,
              color: active ? SkinLinkColors.primary : SkinLinkColors.textMuted,
            ),
          ),
        ),
      ),
    );
  }

  Widget _patientSectionTabs() {
    const sections = ['Demographics', 'Location', 'History', 'Consent'];
    final icons = [Icons.person_outline, Icons.location_on_outlined, Icons.medical_services_outlined, Icons.shield_outlined];
    return SingleChildScrollView(
      scrollDirection: Axis.horizontal,
      child: Row(
        children: List.generate(sections.length, (i) {
          final active = _patientSection == i;
          final done = i < _patientSection;
          return Padding(
            padding: const EdgeInsets.only(right: 8),
            child: InkWell(
              onTap: () => setState(() => _patientSection = i),
              borderRadius: BorderRadius.circular(20),
              child: Container(
                padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 6),
                decoration: BoxDecoration(
                  color: active
                      ? SkinLinkColors.primary
                      : done
                          ? SkinLinkColors.tealLight
                          : SkinLinkColors.background,
                  borderRadius: BorderRadius.circular(20),
                  border: Border.all(
                    color: active
                        ? SkinLinkColors.primary
                        : done
                            ? SkinLinkColors.tealBorder
                            : SkinLinkColors.cardBorder,
                  ),
                ),
                child: Row(
                  mainAxisSize: MainAxisSize.min,
                  children: [
                    Icon(
                      done ? Icons.check : icons[i],
                      size: 13,
                      color: active
                          ? Colors.white
                          : done
                              ? SkinLinkColors.primary
                              : SkinLinkColors.textMuted,
                    ),
                    const SizedBox(width: 5),
                    Text(
                      sections[i],
                      style: GoogleFonts.inter(
                        fontSize: 12,
                        fontWeight: active || done ? FontWeight.w700 : FontWeight.w500,
                        color: active
                            ? Colors.white
                            : done
                                ? SkinLinkColors.primary
                                : SkinLinkColors.textMuted,
                      ),
                    ),
                  ],
                ),
              ),
            ),
          );
        }),
      ),
    );
  }

  Widget _patientSectionContent() {
    switch (_patientSection) {
      case 0:
        return _demographicsSection();
      case 1:
        return _locationSection();
      case 2:
        return _medicalHistorySection();
      case 3:
        return _consentSection();
      default:
        return const SizedBox.shrink();
    }
  }

  // ── Section 0: Demographics ─────────────────────────────────────────────
  Widget _demographicsSection() {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.stretch,
      children: [
        _sectionHeading('Patient Demographics', Icons.person_outline),
        const SizedBox(height: 14),
        _fieldLabel('Full name *'),
        const SizedBox(height: 6),
        TextField(
          controller: _fullName,
          textCapitalization: TextCapitalization.words,
          decoration: const InputDecoration(hintText: 'e.g. Fatuma Kweka'),
        ),
        const SizedBox(height: 14),
        Row(
          children: [
            Expanded(
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  _fieldLabel('Gender *'),
                  const SizedBox(height: 6),
                  DropdownButtonFormField<String>(
                    value: _gender,
                    decoration: const InputDecoration(),
                    items: ['Female', 'Male', 'Other']
                        .map((g) => DropdownMenuItem(value: g, child: Text(g, style: GoogleFonts.inter(fontSize: 13))))
                        .toList(),
                    onChanged: (v) => setState(() => _gender = v ?? 'Female'),
                  ),
                ],
              ),
            ),
            const SizedBox(width: 12),
            Expanded(
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  _fieldLabel('Age range *'),
                  const SizedBox(height: 6),
                  DropdownButtonFormField<String>(
                    value: _ageRange,
                    decoration: const InputDecoration(),
                    items: _ageRanges
                        .map((a) => DropdownMenuItem(value: a, child: Text(a, style: GoogleFonts.inter(fontSize: 13))))
                        .toList(),
                    onChanged: (v) {
                      if (v != null) {
                        setState(() {
                          _ageRange = v;
                          _age.text = v.split(' - ').first.trim();
                        });
                      }
                    },
                  ),
                ],
              ),
            ),
          ],
        ),
        const SizedBox(height: 14),
        _fieldLabel('Preferred language'),
        const SizedBox(height: 6),
        DropdownButtonFormField<String>(
          value: _preferredLanguage.isEmpty ? null : _preferredLanguage,
          decoration: const InputDecoration(hintText: 'Select language…'),
          items: _languageOptions
              .map((l) => DropdownMenuItem(value: l, child: Text(l, style: GoogleFonts.inter(fontSize: 13))))
              .toList(),
          onChanged: (v) => setState(() => _preferredLanguage = v ?? ''),
        ),
        const SizedBox(height: 16),
        _sectionNextBtn('Continue to Location →', () => setState(() => _patientSection = 1)),
      ],
    );
  }

  // ── Section 1: Location & contact ───────────────────────────────────────
  Widget _locationSection() {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.stretch,
      children: [
        _sectionHeading('Location & Contact', Icons.location_on_outlined),
        const SizedBox(height: 14),
        _fieldLabel('Village / locality *'),
        const SizedBox(height: 6),
        TextField(
          controller: _village,
          textCapitalization: TextCapitalization.words,
          decoration: const InputDecoration(hintText: 'e.g. Mbuyuni'),
        ),
        const SizedBox(height: 14),
        _fieldLabel('District'),
        const SizedBox(height: 6),
        TextField(
          controller: _district,
          textCapitalization: TextCapitalization.words,
          decoration: const InputDecoration(hintText: 'e.g. Nyamagana'),
        ),
        const SizedBox(height: 14),
        Row(
          children: [
            Expanded(
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  _fieldLabel('Region'),
                  const SizedBox(height: 6),
                  DropdownButtonFormField<String>(
                    value: _selectedRegion,
                    decoration: const InputDecoration(),
                    items: _locationsList
                        .map((l) => DropdownMenuItem(value: l, child: Text(l, style: GoogleFonts.inter(fontSize: 13))))
                        .toList(),
                    onChanged: (v) => setState(() => _selectedRegion = v ?? _selectedRegion),
                  ),
                ],
              ),
            ),
            const SizedBox(width: 12),
            Expanded(
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  _fieldLabel('Country'),
                  const SizedBox(height: 6),
                  TextField(
                    controller: _country,
                    decoration: const InputDecoration(hintText: 'Tanzania'),
                  ),
                ],
              ),
            ),
          ],
        ),
        const SizedBox(height: 14),
        _fieldLabel('Primary phone'),
        const SizedBox(height: 6),
        TextField(
          controller: _phone,
          keyboardType: TextInputType.phone,
          decoration: const InputDecoration(hintText: '+255 7XX XXX XXX'),
        ),
        const SizedBox(height: 14),
        _fieldLabel('Alternate phone'),
        const SizedBox(height: 6),
        TextField(
          controller: _alternatePhone,
          keyboardType: TextInputType.phone,
          decoration: const InputDecoration(hintText: '+255 7XX XXX XXX'),
        ),
        const SizedBox(height: 16),
        _sectionNextBtn('Continue to Medical History →', () => setState(() => _patientSection = 2)),
      ],
    );
  }

  // ── Section 2: Medical history ───────────────────────────────────────────
  Widget _medicalHistorySection() {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.stretch,
      children: [
        _sectionHeading('Medical History', Icons.medical_services_outlined),
        Container(
          margin: const EdgeInsets.only(top: 8, bottom: 14),
          padding: const EdgeInsets.all(10),
          decoration: BoxDecoration(
            color: SkinLinkColors.tealLight,
            borderRadius: BorderRadius.circular(8),
            border: Border.all(color: SkinLinkColors.tealBorder),
          ),
          child: Text(
            'Record what the patient or carer reports. This helps the specialist give safer, more accurate guidance.',
            style: GoogleFonts.inter(fontSize: 12, color: SkinLinkColors.primaryDark),
          ),
        ),
        _fieldLabel('Chronic conditions'),
        const SizedBox(height: 6),
        TextField(
          controller: _chronicConditions,
          decoration: const InputDecoration(hintText: 'e.g. Diabetes, Hypertension, HIV, Asthma'),
        ),
        const SizedBox(height: 14),
        _fieldLabel('Known allergies'),
        const SizedBox(height: 6),
        TextField(
          controller: _allergies,
          maxLines: 2,
          decoration: const InputDecoration(
            hintText: 'Drug allergies, food, topical products — include type of reaction if known',
          ),
        ),
        const SizedBox(height: 14),
        _fieldLabel('Current medications'),
        const SizedBox(height: 6),
        TextField(
          controller: _currentMedications,
          maxLines: 2,
          decoration: const InputDecoration(hintText: 'Name, dose and frequency…'),
        ),
        const SizedBox(height: 14),
        _fieldLabel('Past medical history'),
        const SizedBox(height: 6),
        TextField(
          controller: _medicalHistory,
          maxLines: 3,
          decoration: const InputDecoration(hintText: 'Previous hospitalisations, surgeries, family history…'),
        ),
        const SizedBox(height: 16),
        _sectionNextBtn('Continue to Consent →', () => setState(() => _patientSection = 3)),
      ],
    );
  }

  // ── Section 3: Consent ───────────────────────────────────────────────────
  Widget _consentSection() {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.stretch,
      children: [
        _sectionHeading('Patient Consent', Icons.shield_outlined),
        Container(
          margin: const EdgeInsets.only(top: 8, bottom: 14),
          padding: const EdgeInsets.all(10),
          decoration: BoxDecoration(
            color: SkinLinkColors.tealLight,
            borderRadius: BorderRadius.circular(8),
            border: Border.all(color: SkinLinkColors.tealBorder),
          ),
          child: Text(
            'All three items must be confirmed. Explain each to the patient in their preferred language before proceeding.',
            style: GoogleFonts.inter(fontSize: 12, color: SkinLinkColors.primaryDark),
          ),
        ),
        _consentItem(
          value: _consentForPhotography,
          title: 'Clinical photography',
          description: 'The patient consents to photos of the affected skin area for clinical assessment. Images will not include unnecessary identifiable features.',
          onChanged: (v) => setState(() => _consentForPhotography = v),
        ),
        const SizedBox(height: 10),
        _consentItem(
          value: _consentForRemoteReview,
          title: 'Remote specialist review',
          description: 'The patient consents to images and health information being sent securely to an authorised dermatology specialist for remote guidance.',
          onChanged: (v) => setState(() => _consentForRemoteReview = v),
        ),
        const SizedBox(height: 10),
        _consentItem(
          value: _consentForStorage,
          title: 'Secure storage',
          description: 'The patient consents to data being stored securely in SkinLink in accordance with the organisation\'s data-governance policy.',
          onChanged: (v) => setState(() => _consentForStorage = v),
        ),
        const SizedBox(height: 14),
        _fieldLabel('Witnessed by (leave blank to use your name)'),
        const SizedBox(height: 6),
        TextField(
          controller: _consentWitness,
          decoration: InputDecoration(
            hintText: context.read<AppState>().user?.name ?? 'Clinician name',
          ),
        ),
        const SizedBox(height: 10),
        Container(
          padding: const EdgeInsets.all(10),
          decoration: BoxDecoration(
            color: SkinLinkColors.background,
            borderRadius: BorderRadius.circular(8),
            border: Border.all(color: SkinLinkColors.cardBorder),
          ),
          child: Row(
            children: [
              const Icon(Icons.calendar_today_outlined, size: 14, color: SkinLinkColors.textMuted),
              const SizedBox(width: 6),
              Text(
                'Consent date: ${DateTime.now().toIso8601String().substring(0, 10)}',
                style: GoogleFonts.inter(fontSize: 12, color: SkinLinkColors.textMuted),
              ),
            ],
          ),
        ),
        if (_consentObtained) ...[
          const SizedBox(height: 12),
          Container(
            padding: const EdgeInsets.all(12),
            decoration: BoxDecoration(
              color: SkinLinkColors.successLight,
              borderRadius: BorderRadius.circular(8),
              border: Border.all(color: SkinLinkColors.success.withValues(alpha: 0.4)),
            ),
            child: Row(
              children: [
                const Icon(Icons.verified_user_outlined, color: SkinLinkColors.success, size: 18),
                const SizedBox(width: 8),
                Expanded(
                  child: Text(
                    'All consent items confirmed — patient registration can proceed.',
                    style: GoogleFonts.inter(fontSize: 12, fontWeight: FontWeight.w600, color: SkinLinkColors.success),
                  ),
                ),
              ],
            ),
          ),
        ] else ...[
          const SizedBox(height: 12),
          Container(
            padding: const EdgeInsets.all(10),
            decoration: BoxDecoration(
              color: SkinLinkColors.warningLight,
              borderRadius: BorderRadius.circular(8),
              border: Border.all(color: SkinLinkColors.warning.withValues(alpha: 0.4)),
            ),
            child: Text(
              'All three consent items must be confirmed to continue.',
              style: GoogleFonts.inter(fontSize: 12, fontWeight: FontWeight.w600, color: SkinLinkColors.warning),
            ),
          ),
        ],
      ],
    );
  }

  Widget _consentItem({
    required bool value,
    required String title,
    required String description,
    required ValueChanged<bool> onChanged,
  }) {
    return InkWell(
      onTap: () => onChanged(!value),
      borderRadius: BorderRadius.circular(10),
      child: Container(
        padding: const EdgeInsets.all(12),
        decoration: BoxDecoration(
          color: value ? SkinLinkColors.successLight : Colors.white,
          borderRadius: BorderRadius.circular(10),
          border: Border.all(
            color: value ? SkinLinkColors.success.withValues(alpha: 0.5) : SkinLinkColors.cardBorder,
            width: value ? 1.5 : 1,
          ),
        ),
        child: Row(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Checkbox(
              value: value,
              activeColor: SkinLinkColors.success,
              onChanged: (v) => onChanged(v ?? false),
              visualDensity: VisualDensity.compact,
              materialTapTargetSize: MaterialTapTargetSize.shrinkWrap,
            ),
            const SizedBox(width: 8),
            Expanded(
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Text(
                    title,
                    style: GoogleFonts.inter(
                      fontSize: 13.5,
                      fontWeight: FontWeight.w700,
                      color: SkinLinkColors.textPrimary,
                    ),
                  ),
                  const SizedBox(height: 3),
                  Text(
                    description,
                    style: GoogleFonts.inter(
                      fontSize: 11.5,
                      color: SkinLinkColors.textMuted,
                      height: 1.4,
                    ),
                  ),
                ],
              ),
            ),
          ],
        ),
      ),
    );
  }

  // ── Shared helpers ───────────────────────────────────────────────────────

  Widget _sectionCard({required Widget child}) {
    return Container(
      padding: const EdgeInsets.all(16),
      decoration: BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.circular(16),
        border: Border.all(color: SkinLinkColors.cardBorder),
        boxShadow: [
          BoxShadow(
            color: Colors.black.withValues(alpha: 0.03),
            blurRadius: 10,
            offset: const Offset(0, 3),
          ),
        ],
      ),
      child: child,
    );
  }

  Widget _sectionHeading(String title, IconData icon) {
    return Row(
      children: [
        Icon(icon, size: 18, color: SkinLinkColors.primary),
        const SizedBox(width: 8),
        Text(
          title,
          style: GoogleFonts.manrope(
            fontSize: 15,
            fontWeight: FontWeight.w700,
            color: SkinLinkColors.textPrimary,
          ),
        ),
      ],
    );
  }

  Widget _sectionNextBtn(String label, VoidCallback onTap) {
    return GestureDetector(
      onTap: onTap,
      child: Container(
        padding: const EdgeInsets.symmetric(vertical: 11),
        decoration: BoxDecoration(
          color: SkinLinkColors.tealLight,
          borderRadius: BorderRadius.circular(8),
          border: Border.all(color: SkinLinkColors.tealBorder),
        ),
        alignment: Alignment.center,
        child: Text(
          label,
          style: GoogleFonts.inter(
            fontSize: 13,
            fontWeight: FontWeight.w700,
            color: SkinLinkColors.primary,
          ),
        ),
      ),
    );
  }

  // STEP 2: PHOTOS CAPTURE
  Widget _imagesStep() {
    return Container(
      padding: const EdgeInsets.all(16),
      decoration: BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.circular(16),
        border: Border.all(color: SkinLinkColors.cardBorder),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.stretch,
        children: [
          Container(
            padding: const EdgeInsets.all(12),
            decoration: BoxDecoration(
              color: SkinLinkColors.tealLight,
              borderRadius: BorderRadius.circular(10),
              border: Border.all(color: SkinLinkColors.tealBorder),
            ),
            child: Row(
              children: [
                const Icon(Icons.photo_camera_outlined, color: SkinLinkColors.primary, size: 20),
                const SizedBox(width: 10),
                Expanded(
                  child: Text(
                    'Capture 2 or more well-lit clinical photos (overview & close-up).',
                    style: GoogleFonts.inter(
                      fontSize: 12.5,
                      fontWeight: FontWeight.w500,
                      color: SkinLinkColors.primaryDark,
                    ),
                  ),
                ),
              ],
            ),
          ),
          const SizedBox(height: 16),

          // Main Photo Preview (last added)
          if (_images.isNotEmpty)
            Stack(
              children: [
                ClipRRect(
                  borderRadius: BorderRadius.circular(12),
                  child: AspectRatio(
                    aspectRatio: 4 / 3,
                    child: _buildImagePreview(_images.last),
                  ),
                ),
                // Quality badge on the main preview
                Positioned(
                  top: 8,
                  right: 8,
                  child: _buildQualityBadge(_imageQuality[_images.length - 1]),
                ),
              ],
            )
          else
            Container(
              height: 180,
              decoration: BoxDecoration(
                color: SkinLinkColors.background,
                borderRadius: BorderRadius.circular(12),
                border: Border.all(color: SkinLinkColors.cardBorder),
              ),
              child: Column(
                mainAxisAlignment: MainAxisAlignment.center,
                children: [
                  const Icon(Icons.add_a_photo_outlined, size: 44, color: SkinLinkColors.primary),
                  const SizedBox(height: 8),
                  Text(
                    'No photos added yet',
                    style: GoogleFonts.inter(fontSize: 13, fontWeight: FontWeight.w600, color: SkinLinkColors.textMuted),
                  ),
                ],
              ),
            ),
          const SizedBox(height: 16),

          // Thumbnail row
          SizedBox(
            height: 84,
            child: ListView(
              scrollDirection: Axis.horizontal,
              children: [
                _thumbActionBtn(Icons.camera_alt, 'Camera', () => _captureImage(ImageSource.camera)),
                const SizedBox(width: 8),
                _thumbActionBtn(Icons.photo_library_outlined, 'Gallery', () => _captureImage(ImageSource.gallery)),
                ..._images.asMap().entries.map((e) {
                  final idx = e.key;
                  final img = e.value;
                  final q = _imageQuality[idx];
                  return Padding(
                    padding: const EdgeInsets.only(left: 8),
                    child: Stack(
                      clipBehavior: Clip.none,
                      children: [
                        ClipRRect(
                          borderRadius: BorderRadius.circular(8),
                          child: _buildImagePreview(img, width: 74, height: 74),
                        ),
                        // Quality badge on thumbnail
                        Positioned(
                          bottom: -4,
                          left: 0,
                          right: 0,
                          child: _buildQualityBadge(q, compact: true),
                        ),
                        Positioned(
                          right: 3,
                          top: 3,
                          child: GestureDetector(
                            onTap: () => setState(() {
                              _images.removeAt(idx);
                              // Rebuild quality map with shifted keys
                              final newMap = <int, Map<String, dynamic>>{};
                              _imageQuality.forEach((k, v) {
                                if (k < idx) newMap[k] = v;
                                if (k > idx) newMap[k - 1] = v;
                              });
                              _imageQuality
                                ..clear()
                                ..addAll(newMap);
                            }),
                            child: Container(
                              padding: const EdgeInsets.all(2),
                              decoration: const BoxDecoration(color: Colors.black54, shape: BoxShape.circle),
                              child: const Icon(Icons.close, size: 14, color: Colors.white),
                            ),
                          ),
                        ),
                      ],
                    ),
                  );
                }),
              ],
            ),
          ),

          // Quality summary
          if (_imageQuality.values.any((q) => q['checking'] == true)) ...[
            const SizedBox(height: 12),
            Row(
              children: [
                const SizedBox(
                  width: 14,
                  height: 14,
                  child: CircularProgressIndicator(strokeWidth: 2, color: SkinLinkColors.primary),
                ),
                const SizedBox(width: 8),
                Text(
                  'Checking image quality…',
                  style: GoogleFonts.inter(fontSize: 12, color: SkinLinkColors.textMuted),
                ),
              ],
            ),
          ] else if (_imageQuality.values.any((q) => q['retake_required'] == true)) ...[
            const SizedBox(height: 12),
            Container(
              padding: const EdgeInsets.all(10),
              decoration: BoxDecoration(
                color: const Color(0xFFFEF2F2),
                borderRadius: BorderRadius.circular(8),
                border: Border.all(color: const Color(0xFFFECACA)),
              ),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Row(
                    children: [
                      const Icon(Icons.warning_amber_rounded, color: Color(0xFFEF4444), size: 16),
                      const SizedBox(width: 6),
                      Text(
                        'Quality issues detected — retake recommended',
                        style: GoogleFonts.inter(fontSize: 12.5, fontWeight: FontWeight.w700, color: const Color(0xFFB91C1C)),
                      ),
                    ],
                  ),
                  ..._imageQuality.entries
                      .where((e) => e.value['retake_required'] == true)
                      .map((e) {
                    final issues = (e.value['issues'] as List<String>?) ?? [];
                    return Padding(
                      padding: const EdgeInsets.only(top: 4),
                      child: Text(
                        '• Image ${e.key + 1}: ${issues.isNotEmpty ? issues.first : "Poor quality"}',
                        style: GoogleFonts.inter(fontSize: 11.5, color: const Color(0xFF991B1B)),
                      ),
                    );
                  }),
                ],
              ),
            ),
          ] else if (_images.isNotEmpty && _imageQuality.values.every((q) => q['checking'] != true && q['retake_required'] != true)) ...[
            const SizedBox(height: 12),
            Row(
              children: [
                const Icon(Icons.check_circle, color: Color(0xFF16A34A), size: 16),
                const SizedBox(width: 6),
                Text(
                  'All images passed quality check',
                  style: GoogleFonts.inter(fontSize: 12, color: const Color(0xFF15803D), fontWeight: FontWeight.w600),
                ),
              ],
            ),
          ],

          // Hard block banner — shown when any image requires a retake
          if (_hasRetakeRequired) ...[
            const SizedBox(height: 12),
            Container(
              padding: const EdgeInsets.all(12),
              decoration: BoxDecoration(
                color: const Color(0xFFFEF2F2),
                borderRadius: BorderRadius.circular(8),
                border: Border.all(color: const Color(0xFFFCA5A5)),
              ),
              child: Row(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  const Icon(Icons.block, color: Color(0xFFDC2626), size: 18),
                  const SizedBox(width: 8),
                  Expanded(
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        Text(
                          'Retake required — cannot continue',
                          style: GoogleFonts.inter(
                            fontSize: 13,
                            fontWeight: FontWeight.w700,
                            color: const Color(0xFFB91C1C),
                          ),
                        ),
                        const SizedBox(height: 3),
                        Text(
                          'Remove the poor-quality images and capture new clear, well-lit photos before proceeding.',
                          style: GoogleFonts.inter(
                            fontSize: 11.5,
                            color: const Color(0xFF991B1B),
                            height: 1.4,
                          ),
                        ),
                      ],
                    ),
                  ),
                ],
              ),
            ),
          ],

          // Checking in progress message
          if (_isCheckingQuality && !_hasRetakeRequired) ...[
            const SizedBox(height: 12),
            Row(
              children: [
                const SizedBox(
                  width: 14,
                  height: 14,
                  child: CircularProgressIndicator(strokeWidth: 2, color: SkinLinkColors.primary),
                ),
                const SizedBox(width: 8),
                Text(
                  'Checking image quality — please wait…',
                  style: GoogleFonts.inter(fontSize: 12, color: SkinLinkColors.textMuted),
                ),
              ],
            ),
          ],
        ],
      ),
    );
  }

  Widget _buildQualityBadge(Map<String, dynamic>? q, {bool compact = false}) {
    if (q == null) return const SizedBox.shrink();
    if (q['checking'] == true) {
      return Container(
        padding: compact
            ? const EdgeInsets.symmetric(horizontal: 4, vertical: 2)
            : const EdgeInsets.symmetric(horizontal: 8, vertical: 4),
        decoration: BoxDecoration(
          color: Colors.black54,
          borderRadius: BorderRadius.circular(compact ? 4 : 6),
        ),
        child: Row(
          mainAxisSize: MainAxisSize.min,
          children: [
            SizedBox(
              width: 10,
              height: 10,
              child: CircularProgressIndicator(
                strokeWidth: 1.5,
                color: Colors.white.withValues(alpha: 0.85),
              ),
            ),
            if (!compact) ...[
              const SizedBox(width: 4),
              Text('Checking…', style: GoogleFonts.inter(fontSize: 10, color: Colors.white)),
            ],
          ],
        ),
      );
    }
    final retake = q['retake_required'] == true;
    final score = q['score'] as int? ?? 0;
    final Color bg = retake
        ? const Color(0xFFEF4444)
        : score >= 80
            ? const Color(0xFF16A34A)
            : const Color(0xFFF59E0B);
    final IconData icon = retake ? Icons.cancel : Icons.check_circle;
    final String label = compact
        ? (retake ? '✗' : '$score')
        : (retake ? 'Retake' : '$score/100');

    return Container(
      padding: compact
          ? const EdgeInsets.symmetric(horizontal: 4, vertical: 2)
          : const EdgeInsets.symmetric(horizontal: 8, vertical: 4),
      decoration: BoxDecoration(
        color: bg,
        borderRadius: BorderRadius.circular(compact ? 4 : 6),
      ),
      child: Row(
        mainAxisSize: MainAxisSize.min,
        children: [
          Icon(icon, size: compact ? 10 : 13, color: Colors.white),
          const SizedBox(width: 3),
          Text(
            label,
            style: GoogleFonts.inter(
              fontSize: compact ? 10 : 11,
              fontWeight: FontWeight.w700,
              color: Colors.white,
            ),
          ),
        ],
      ),
    );
  }

  // STEP 3: CLINICAL ASSESSMENT
  Widget _clinicalStep() {
    return Container(
      padding: const EdgeInsets.all(16),
      decoration: BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.circular(16),
        border: Border.all(color: SkinLinkColors.cardBorder),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.stretch,
        children: [
          _fieldLabel('Primary Complaint / Concern'),
          const SizedBox(height: 6),
          TextField(controller: _concern, decoration: const InputDecoration(hintText: 'Facial rash and redness')),
          const SizedBox(height: 14),

          _fieldLabel('Body Site / Distribution'),
          const SizedBox(height: 6),
          TextField(controller: _bodySite, decoration: const InputDecoration(hintText: 'Face / Cheeks')),
          const SizedBox(height: 14),

          Row(
            children: [
              Expanded(
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    _fieldLabel('Duration (days)'),
                    const SizedBox(height: 6),
                    TextField(
                      controller: _duration,
                      keyboardType: TextInputType.number,
                      decoration: const InputDecoration(hintText: '7'),
                    ),
                  ],
                ),
              ),
              const SizedBox(width: 12),
              Expanded(
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    _fieldLabel('Urgency'),
                    const SizedBox(height: 6),
                    DropdownButtonFormField<String>(
                      initialValue: _priority,
                      decoration: const InputDecoration(),
                      items: const [
                        DropdownMenuItem(value: 'routine', child: Text('Routine')),
                        DropdownMenuItem(value: 'urgent', child: Text('Urgent')),
                        DropdownMenuItem(value: 'emergency', child: Text('Emergency')),
                      ],
                      onChanged: (v) => setState(() => _priority = v ?? 'routine'),
                    ),
                  ],
                ),
              ),
            ],
          ),
          const SizedBox(height: 14),

          _fieldLabel('Suspected Condition'),
          const SizedBox(height: 6),
          TextField(controller: _suspected, decoration: const InputDecoration(hintText: 'Contact Dermatitis')),
          const SizedBox(height: 14),

          _fieldLabel('Previous Treatments Tried'),
          const SizedBox(height: 6),
          TextField(controller: _prevTreatment, decoration: const InputDecoration(hintText: 'None / Over-the-counter cream')),
          const SizedBox(height: 14),

          _fieldLabel('Additional Clinical Notes'),
          const SizedBox(height: 6),
          TextField(
            controller: _clinicalNotes,
            maxLines: 3,
            decoration: const InputDecoration(hintText: 'Patient reports itching for 1 week...'),
          ),
          const SizedBox(height: 14),

          SwitchListTile(
            contentPadding: EdgeInsets.zero,
            title: Text('Clinical Red Flag Present', style: GoogleFonts.inter(fontWeight: FontWeight.w600, fontSize: 13.5)),
            subtitle: Text('Fast-tracks urgent specialist review (< 4 hrs SLA)', style: GoogleFonts.inter(fontSize: 11.5, color: SkinLinkColors.textMuted)),
            value: _redFlag,
            activeTrackColor: SkinLinkColors.orangeBadge,
            onChanged: (v) => setState(() {
              _redFlag = v;
              if (v) _priority = 'urgent';
            }),
          ),
        ],
      ),
    );
  }

  // STEP 3: REVIEW + SPECIALIST SELECTION
  Widget _reviewStep() {
    final state = context.read<AppState>();
    final region = state.tenant?.region ?? _selectedRegion;

    return Column(
      crossAxisAlignment: CrossAxisAlignment.stretch,
      children: [
        // ── Specialist selection card ──────────────────────────────────────
        _sectionCard(
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.stretch,
            children: [
              _sectionHeading('Send to specialist', Icons.person_search_outlined),
              const SizedBox(height: 4),
              Text(
                'Choose a specialist directly, or leave on Auto-assign and the system will route to the least-loaded available specialist.',
                style: GoogleFonts.inter(fontSize: 12, color: SkinLinkColors.textMuted, height: 1.4),
              ),
              const SizedBox(height: 12),

              if (_loadingSpecialists)
                const Center(
                  child: Padding(
                    padding: EdgeInsets.symmetric(vertical: 16),
                    child: CircularProgressIndicator(strokeWidth: 2, color: SkinLinkColors.primary),
                  ),
                )
              else ...[
                // Auto-assign tile (always first)
                _specialistTile(
                  id: null,
                  name: 'Auto-assign',
                  subtitle: 'System will route to the least-loaded free specialist',
                  avatarColor: SkinLinkColors.primary,
                  initials: 'AI',
                  openCases: null,
                  isBusy: false,
                  isSelected: _selectedSpecialistId == null,
                  onTap: () => setState(() => _selectedSpecialistId = null),
                ),
                const SizedBox(height: 8),

                if (_specialists.isEmpty)
                  Container(
                    padding: const EdgeInsets.all(12),
                    decoration: BoxDecoration(
                      color: SkinLinkColors.background,
                      borderRadius: BorderRadius.circular(8),
                      border: Border.all(color: SkinLinkColors.cardBorder),
                    ),
                    child: Row(
                      children: [
                        const Icon(Icons.info_outline, size: 16, color: SkinLinkColors.textMuted),
                        const SizedBox(width: 8),
                        Expanded(
                          child: Text(
                            'No active specialists found for this organisation.',
                            style: GoogleFonts.inter(fontSize: 12, color: SkinLinkColors.textMuted),
                          ),
                        ),
                      ],
                    ),
                  )
                else
                  ..._specialists.map((s) => Padding(
                    padding: const EdgeInsets.only(bottom: 8),
                    child: _specialistTile(
                      id: s.id,
                      name: s.name,
                      subtitle: [s.displayRole, if (s.specialty?.isNotEmpty == true) s.specialty!].join(' · '),
                      avatarColor: Color(
                        int.parse(s.avatarColor.replaceFirst('#', '0xFF')),
                      ),
                      initials: s.initials,
                      openCases: s.openCases,
                      isBusy: s.isBusy,
                      isSelected: _selectedSpecialistId == s.id,
                      onTap: () => setState(() => _selectedSpecialistId = s.id),
                    ),
                  )),
              ],
            ],
          ),
        ),

        const SizedBox(height: 14),

        // ── Referral summary card ──────────────────────────────────────────
        _sectionCard(
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.stretch,
            children: [
              _sectionHeading('Referral summary', Icons.summarize_outlined),
              const SizedBox(height: 12),
              _reviewRow('Patient', _mode == 'existing'
                  ? (state.patientById(_existingPatientId ?? '')?.fullName ?? 'Selected Patient')
                  : '${_fullName.text} ($_gender, $_ageRange)'),
              _reviewRow('Location', '${_village.text.isEmpty ? _selectedRegion : _village.text}, $region'),
              if (_preferredLanguage.isNotEmpty) _reviewRow('Language', _preferredLanguage),
              _reviewRow('Chief complaint', _concern.text),
              _reviewRow('Duration', '${_duration.text} days'),
              if (_suspected.text.isNotEmpty) _reviewRow('Suspected', _suspected.text),
              if (_bodySite.text.isNotEmpty) _reviewRow('Body site', _bodySite.text),
              _reviewRow('Urgency', _priority.toUpperCase()),
              _reviewRow('Photos', '${_images.length} photo${_images.length == 1 ? '' : 's'} attached'),
              _reviewRow('Consent', _consentObtained ? '✓ All 3 items confirmed' : '⚠ Incomplete'),
              if (_allergies.text.isNotEmpty) _reviewRow('Allergies', _allergies.text, highlight: true),
              _reviewRow(
                'Routing to',
                _selectedSpecialistId == null
                    ? 'Auto-assign (least-loaded specialist)'
                    : _specialists.firstWhere((s) => s.id == _selectedSpecialistId,
                        orElse: () => Specialist(
                          id: '', name: 'Selected specialist',
                          avatarColor: '#1f7a8c', openCases: 0, isBusy: false,
                        )).name,
              ),
              const SizedBox(height: 12),
              if (_images.isNotEmpty)
                Wrap(
                  spacing: 8,
                  runSpacing: 8,
                  children: _images.map((img) => ClipRRect(
                    borderRadius: BorderRadius.circular(8),
                    child: _buildImagePreview(img, width: 56, height: 56),
                  )).toList(),
                ),
              const SizedBox(height: 12),
              Container(
                padding: const EdgeInsets.all(10),
                decoration: BoxDecoration(
                  color: SkinLinkColors.tealLight,
                  borderRadius: BorderRadius.circular(8),
                  border: Border.all(color: SkinLinkColors.tealBorder),
                ),
                child: Text(
                  'A unique case reference will be generated and routed to the selected specialist immediately.',
                  style: GoogleFonts.inter(fontSize: 12, color: SkinLinkColors.primaryDark),
                ),
              ),
            ],
          ),
        ),
      ],
    );
  }

  Widget _specialistTile({
    required String? id,
    required String name,
    required String subtitle,
    required Color avatarColor,
    required String initials,
    required int? openCases,
    required bool isBusy,
    required bool isSelected,
    required VoidCallback onTap,
  }) {
    return InkWell(
      onTap: onTap,
      borderRadius: BorderRadius.circular(10),
      child: AnimatedContainer(
        duration: const Duration(milliseconds: 150),
        padding: const EdgeInsets.all(12),
        decoration: BoxDecoration(
          color: isSelected ? SkinLinkColors.tealLight : Colors.white,
          borderRadius: BorderRadius.circular(10),
          border: Border.all(
            color: isSelected ? SkinLinkColors.primary : SkinLinkColors.cardBorder,
            width: isSelected ? 1.5 : 1,
          ),
        ),
        child: Row(
          children: [
            // Avatar
            Container(
              width: 40,
              height: 40,
              decoration: BoxDecoration(
                color: avatarColor,
                borderRadius: BorderRadius.circular(20),
              ),
              alignment: Alignment.center,
              child: Text(
                initials,
                style: GoogleFonts.manrope(
                  fontSize: 13,
                  fontWeight: FontWeight.w700,
                  color: Colors.white,
                ),
              ),
            ),
            const SizedBox(width: 12),

            // Name + role
            Expanded(
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Text(
                    name,
                    style: GoogleFonts.inter(
                      fontSize: 13.5,
                      fontWeight: FontWeight.w700,
                      color: SkinLinkColors.textPrimary,
                    ),
                  ),
                  const SizedBox(height: 2),
                  Text(
                    subtitle,
                    style: GoogleFonts.inter(
                      fontSize: 11.5,
                      color: SkinLinkColors.textMuted,
                    ),
                    maxLines: 1,
                    overflow: TextOverflow.ellipsis,
                  ),
                ],
              ),
            ),

            const SizedBox(width: 8),

            // Status + open cases badge
            Column(
              crossAxisAlignment: CrossAxisAlignment.end,
              children: [
                if (openCases != null)
                  Container(
                    padding: const EdgeInsets.symmetric(horizontal: 7, vertical: 3),
                    decoration: BoxDecoration(
                      color: isBusy
                          ? const Color(0xFFFEF3C7)
                          : const Color(0xFFDCFCE7),
                      borderRadius: BorderRadius.circular(20),
                    ),
                    child: Text(
                      isBusy ? 'Busy' : openCases == 0 ? 'Free' : '$openCases open',
                      style: GoogleFonts.inter(
                        fontSize: 10.5,
                        fontWeight: FontWeight.w700,
                        color: isBusy
                            ? const Color(0xFF92400E)
                            : const Color(0xFF15803D),
                      ),
                    ),
                  ),
                const SizedBox(height: 4),
                // Selected indicator
                Container(
                  width: 18,
                  height: 18,
                  decoration: BoxDecoration(
                    shape: BoxShape.circle,
                    color: isSelected ? SkinLinkColors.primary : Colors.transparent,
                    border: Border.all(
                      color: isSelected ? SkinLinkColors.primary : SkinLinkColors.cardBorder,
                      width: 1.5,
                    ),
                  ),
                  child: isSelected
                      ? const Icon(Icons.check, size: 11, color: Colors.white)
                      : null,
                ),
              ],
            ),
          ],
        ),
      ),
    );
  }

  Widget _reviewRow(String label, String value, {bool highlight = false}) {
    return Padding(
      padding: const EdgeInsets.only(bottom: 8),
      child: Row(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          SizedBox(
            width: 110,
            child: Text(
              label,
              style: GoogleFonts.inter(
                fontSize: 12,
                color: SkinLinkColors.textMuted,
                fontWeight: FontWeight.w500,
              ),
            ),
          ),
          Expanded(
            child: Text(
              value,
              style: GoogleFonts.inter(
                fontSize: 13,
                fontWeight: FontWeight.w600,
                color: highlight ? const Color(0xFFB91C1C) : SkinLinkColors.textPrimary,
              ),
            ),
          ),
        ],
      ),
    );
  }

  Widget _thumbActionBtn(IconData icon, String label, VoidCallback onTap) {
    return InkWell(
      onTap: onTap,
      borderRadius: BorderRadius.circular(8),
      child: Container(
        width: 74,
        height: 74,
        decoration: BoxDecoration(
          border: Border.all(color: SkinLinkColors.primary, width: 1.5),
          borderRadius: BorderRadius.circular(8),
          color: SkinLinkColors.primary.withValues(alpha: 0.05),
        ),
        child: Column(
          mainAxisAlignment: MainAxisAlignment.center,
          children: [
            Icon(icon, color: SkinLinkColors.primary, size: 22),
            const SizedBox(height: 2),
            Text(label, style: GoogleFonts.inter(fontSize: 11, fontWeight: FontWeight.w600, color: SkinLinkColors.primary)),
          ],
        ),
      ),
    );
  }

  Widget _fieldLabel(String text) {
    return Text(
      text,
      style: GoogleFonts.inter(
        fontSize: 13,
        fontWeight: FontWeight.w700,
        color: SkinLinkColors.textPrimary,
      ),
    );
  }

  // BOTTOM ACTION BUTTONS: "Back" & "Next" MATCHING PROTOTYPE EXACTLY
  Widget _navBar() {
    final isLastStep = _step == 3;

    // Hint shown below the Next button when blocked on images step
    String? blockHint;
    if (_step == 1) {
      if (_isCheckingQuality) {
        blockHint = 'Waiting for quality checks…';
      } else if (_hasRetakeRequired) {
        blockHint = 'Remove poor-quality images to continue';
      } else if (_images.isEmpty) {
        blockHint = 'Add at least one image to continue';
      }
    }

    return Container(
      padding: const EdgeInsets.fromLTRB(16, 10, 16, 14),
      decoration: const BoxDecoration(
        color: Colors.white,
        border: Border(top: BorderSide(color: SkinLinkColors.cardBorder)),
      ),
      child: Column(
        mainAxisSize: MainAxisSize.min,
        children: [
          Row(
            children: [
              // "Back" Button
              Expanded(
                child: Container(
                  height: 48,
                  decoration: BoxDecoration(
                    color: Colors.white,
                    borderRadius: BorderRadius.circular(10),
                    border: Border.all(color: const Color(0xFFCBD5E1), width: 1.2),
                  ),
                  child: Material(
                    color: Colors.transparent,
                    child: InkWell(
                      onTap: () {
                        if (_step > 0) {
                          setState(() => _step--);
                        } else {
                          Navigator.of(context).pop();
                        }
                      },
                      borderRadius: BorderRadius.circular(10),
                      child: Center(
                        child: Text(
                          'Back',
                          style: GoogleFonts.inter(
                            fontSize: 15,
                            fontWeight: FontWeight.w600,
                            color: SkinLinkColors.textPrimary,
                          ),
                        ),
                      ),
                    ),
                  ),
                ),
              ),
              const SizedBox(width: 12),
              // "Next" / "Submit" Button
              Expanded(
                child: SkinLinkGradientButton(
                  text: isLastStep ? 'Submit' : 'Next',
                  onPressed: _canNext
                      ? () {
                          if (_step < 3) {
                            setState(() => _step++);
                            // Pre-fetch specialists when reaching the review step
                            if (_step + 1 == 3) _loadSpecialists();
                          } else {
                            _submit();
                          }
                        }
                      : null,
                ),
              ),
            ],
          ),
          if (blockHint != null) ...[
            const SizedBox(height: 6),
            Text(
              blockHint,
              style: GoogleFonts.inter(
                fontSize: 11.5,
                color: _hasRetakeRequired ? const Color(0xFFDC2626) : SkinLinkColors.textMuted,
                fontWeight: FontWeight.w600,
              ),
              textAlign: TextAlign.center,
            ),
          ],
        ],
      ),
    );
  }

  Widget _buildImagePreview(Map<String, dynamic> img, {double? width, double? height, BoxFit fit = BoxFit.cover}) {
    if (img['bytes'] != null) {
      return Image.memory(
        img['bytes'] as Uint8List,
        width: width,
        height: height,
        fit: fit,
      );
    }
    final path = (img['localPath'] ?? img['url'] ?? '') as String;
    if (kIsWeb || path.startsWith('http://') || path.startsWith('https://') || path.startsWith('blob:')) {
      return Image.network(
        path,
        width: width,
        height: height,
        fit: fit,
        errorBuilder: (context, error, stackTrace) => Container(
          width: width,
          height: height,
          color: Colors.grey.shade200,
          child: const Icon(Icons.broken_image, color: Colors.grey),
        ),
      );
    }
    return Image.file(
      File(path),
      width: width,
      height: height,
      fit: fit,
      errorBuilder: (context, error, stackTrace) => Container(
        width: width,
        height: height,
        color: Colors.grey.shade200,
        child: const Icon(Icons.broken_image, color: Colors.grey),
      ),
    );
  }
}

