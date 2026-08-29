import 'dart:typed_data';

import 'package:intl/intl.dart';
import 'package:pdf/pdf.dart';
import 'package:pdf/widgets.dart' as pw;
import 'package:printing/printing.dart';

import '../models/models.dart';

/// Generates a branded, printable patient treatment handout matching the
/// user reference PDF booking/handout template layout — suitable for handing
/// to patients at village clinics across Tanzania and printing on any device.
class TreatmentPdfService {
  // Brand color palette matching user reference PDF
  static const _navyHeader = PdfColor.fromInt(0xFF0078D4); // Vibrant Blue
  static const _navyDark = PdfColor.fromInt(0xFF0C2340);
  static const _primary = PdfColor.fromInt(0xFF1F7A8C);
  static const _successGreen = PdfColor.fromInt(0xFF0C6B58);
  static const _successBg = PdfColor.fromInt(0xFFECFDF5);
  static const _successBorder = PdfColor.fromInt(0xFFA7F3D0);
  static const _amberAccent = PdfColor.fromInt(0xFFF59E0B);
  static const _pillBg = PdfColor.fromInt(0xFFE0F2FE);
  static const _pillText = PdfColor.fromInt(0xFF0369A1);
  static const _muted = PdfColor.fromInt(0xFF64748B);
  static const _border = PdfColor.fromInt(0xFFE2E8F0);
  static const _surface = PdfColor.fromInt(0xFFF8FAFC);

  static Future<Uint8List> generate({
    required DermCase dermCase,
    required Map<String, dynamic> plan,
    Patient? patient,
    Tenant? tenant,
    String? specialistName,
  }) async {
    final regular = await PdfGoogleFonts.interRegular();
    final medium = await PdfGoogleFonts.interMedium();
    final bold = await PdfGoogleFonts.interBold();
    final heading = await PdfGoogleFonts.manropeBold();

    final createdAt = plan['createdAt'] as String?;
    final dateStr = createdAt != null
        ? DateFormat('yyyy.MM.dd | hh:mm a').format(DateTime.parse(createdAt))
        : DateFormat('yyyy.MM.dd | hh:mm a').format(DateTime.now());

    final langStr = (plan['language'] as String? ??
            plan['preferredLanguage'] as String? ??
            patient?.preferredLanguage ??
            'Swahili')
        .toString()
        .toLowerCase();

    final isSwahili = langStr.contains('swahili') || langStr == 'sw' || langStr.contains('swah');

    final rawDiagnosis = plan['diagnosis'] as String? ?? 'Specialist assessment';
    final swDiagnosis = plan['diagnosisSwahili'] as String?;
    final diagnosis = (isSwahili && swDiagnosis != null && swDiagnosis.isNotEmpty)
        ? '$swDiagnosis ($rawDiagnosis)'
        : rawDiagnosis;

    final rawEducation = (plan['patientEducation'] as List?)?.cast<String>() ?? [];
    final swEducation = (plan['patientEducationSwahili'] as List?)?.cast<String>() ?? [];
    final education = isSwahili && swEducation.isNotEmpty ? swEducation : rawEducation;

    final avoidTriggers = (plan['avoidTriggers'] as List?)?.cast<String>() ?? [];
    final followUpDays = plan['followUpDays'] as int? ?? 14;

    final rawNotes = plan['notes'] as String?;
    final swNotes = plan['notesSwahili'] as String?;
    final notes = isSwahili && swNotes != null && swNotes.isNotEmpty ? swNotes : rawNotes;

    final medications = (plan['medications'] as List?)?.cast<Map<String, dynamic>>() ?? [];

    final doc = pw.Document(
      title: 'SkinLink Treatment — ${dermCase.ref}',
      author: 'SkinLink',
      subject: 'Dermatology treatment guidance',
    );

    // MultiPage with individual bounded widgets preventing layout & height exceptions
    doc.addPage(
      pw.MultiPage(
        pageFormat: PdfPageFormat.a4,
        maxPages: 10,
        margin: const pw.EdgeInsets.all(24),
        build: (context) => [
          // 1. TOP HEADER BANNER (Full Width Blue Header matching Reference PDF)
          _buildHeaderBanner(heading, bold, patient, tenant, isSwahili: isSwahili),
          pw.SizedBox(height: 12),

          // 2. GREETING BANNER (Green Badge Box "You're all set, Patient!")
          _buildGreetingBanner(heading, medium, bold, dateStr, specialistName, patient, isSwahili: isSwahili),
          pw.SizedBox(height: 14),

          // 3. CASE & PATIENT DETAILS TABLE (Blue Top Bar Table matching Reference PDF)
          _buildDetailsTable(heading, bold, regular, dermCase, patient, tenant, dateStr, specialistName, isSwahili: isSwahili),
          pw.SizedBox(height: 12),

          // 4. DATA SOURCES / CLINICAL TAGS (Horizontal Badges matching Reference PDF)
          _buildClinicalPills(bold, medium, dermCase, isSwahili: isSwahili),
          pw.SizedBox(height: 12),

          // 5. GOALS & CHALLENGES / DIAGNOSIS & PRESCRIPTION CARD (Amber Left Accent Bar)
          _buildTreatmentCard(heading, medium, regular, bold, diagnosis, medications, education, avoidTriggers, notes, isSwahili: isSwahili),
          pw.SizedBox(height: 14),

          // 6. HOW TO COMPLETE BOOKING / CLINIC INSTRUCTIONS (Green Instructions Box)
          _buildInstructionsBox(heading, medium, regular, followUpDays, specialistName, isSwahili: isSwahili),
          pw.SizedBox(height: 14),

          // 7. FOOTER DISCLAIMER
          _buildFooter(regular, medium, tenant, dermCase.ref, isSwahili: isSwahili),
        ],
      ),
    );

    return doc.save();
  }

  /// 1. TOP HEADER BANNER: Blue header matching reference screenshot exactly
  static pw.Widget _buildHeaderBanner(pw.Font heading, pw.Font bold, Patient? patient, Tenant? tenant, {bool isSwahili = false}) {
    final name = patient?.fullName ?? 'Patient';
    return pw.Container(
      width: double.infinity,
      padding: const pw.EdgeInsets.symmetric(horizontal: 20, vertical: 16),
      decoration: pw.BoxDecoration(
        color: _navyHeader,
        borderRadius: pw.BorderRadius.circular(6),
      ),
      child: pw.Row(
        mainAxisAlignment: pw.MainAxisAlignment.spaceBetween,
        children: [
          pw.Column(
            crossAxisAlignment: pw.CrossAxisAlignment.start,
            children: [
              pw.Text(
                name,
                style: pw.TextStyle(font: heading, fontSize: 18, color: PdfColors.white),
              ),
              pw.SizedBox(height: 2),
              pw.Text(
                isSwahili
                    ? 'Mwongozo wa Matibabu ya Ngozi · SkinLink Tele-Dermatology'
                    : 'Tele-Dermatology Specialist Assessment & Treatment Plan',
                style: pw.TextStyle(font: bold, fontSize: 8.5, color: PdfColor.fromInt(0xFFBAE6FD)),
              ),
            ],
          ),
          // Logo / Brand box
          pw.Container(
            padding: const pw.EdgeInsets.all(6),
            decoration: pw.BoxDecoration(
              color: PdfColors.white,
              borderRadius: pw.BorderRadius.circular(4),
            ),
            child: pw.Text(
              'SkinLink',
              style: pw.TextStyle(font: heading, fontSize: 10, color: _navyHeader),
            ),
          ),
        ],
      ),
    );
  }

  /// 2. GREETING BANNER: Green success card "You're all set, Patient!"
  static pw.Widget _buildGreetingBanner(pw.Font heading, pw.Font medium, pw.Font bold, String dateStr, String? specialistName, Patient? patient, {bool isSwahili = false}) {
    final spec = specialistName ?? 'Dermatology Specialist';
    return pw.Container(
      width: double.infinity,
      padding: const pw.EdgeInsets.symmetric(horizontal: 16, vertical: 12),
      decoration: pw.BoxDecoration(
        color: _successBg,
        borderRadius: pw.BorderRadius.circular(6),
        border: pw.Border.all(color: _successBorder, width: 1),
      ),
      child: pw.Column(
        crossAxisAlignment: pw.CrossAxisAlignment.start,
        children: [
          pw.Container(
            padding: const pw.EdgeInsets.symmetric(horizontal: 8, vertical: 3),
            decoration: pw.BoxDecoration(
              color: _successGreen,
              borderRadius: pw.BorderRadius.circular(4),
            ),
            child: pw.Text(
              isSwahili ? 'TAARIFA TAYARI' : 'RESPONSE CONFIRMED',
              style: pw.TextStyle(font: bold, fontSize: 7, color: PdfColors.white),
            ),
          ),
          pw.SizedBox(height: 6),
          pw.Text(
            isSwahili ? 'Jibu lako liko tayari, ${patient?.fullName ?? "Mgonjwa"}!' : "You're all set, ${patient?.fullName ?? 'Patient'}!",
            style: pw.TextStyle(font: heading, fontSize: 14, color: _successGreen),
          ),
          pw.SizedBox(height: 2),
          pw.Text(
            isSwahili
                ? 'Ombi lako la ushauri wa afya ya ngozi limekaguliwa na $spec. Tafadhali fuata maelekezo haya.'
                : 'Your consultation request has been reviewed and prepared by $spec. Please follow the guidance below.',
            style: pw.TextStyle(font: medium, fontSize: 8.5, color: PdfColor.fromInt(0xFF166534)),
          ),
        ],
      ),
    );
  }

  /// 3. CASE & PATIENT DETAILS TABLE: Blue Header Bar Table matching Reference PDF
  static pw.Widget _buildDetailsTable(pw.Font heading, pw.Font bold, pw.Font regular, DermCase dermCase, Patient? patient, Tenant? tenant, String dateStr, String? specialistName, {bool isSwahili = false}) {
    final items = [
      {'label': isSwahili ? 'Aina ya Huduma' : 'Meeting Type', 'val': 'Tele-Dermatology Review'},
      {'label': isSwahili ? 'Tarehe na Muda' : 'Date & Time', 'val': dateStr},
      {'label': isSwahili ? 'Mgonjwa (Attention)' : 'Attention', 'val': '${patient?.fullName ?? "Patient"} (${patient != null ? "${patient.age}/${patient.gender}" : "—"})'},
      {'label': isSwahili ? 'Zahanati / Kituo' : 'Work Email / Facility', 'val': tenant?.name ?? 'Village Health Dispensary'},
      {'label': isSwahili ? 'Mkoa / Mahali' : 'Organization', 'val': patient != null ? '${patient.village}, ${patient.region}' : tenant?.region ?? 'Tanzania'},
      {'label': isSwahili ? 'Namba ya Kumbukumbu' : 'Reference ID', 'val': dermCase.ref},
    ];

    return pw.Container(
      width: double.infinity,
      decoration: pw.BoxDecoration(
        color: PdfColors.white,
        borderRadius: pw.BorderRadius.circular(6),
        border: pw.Border.all(color: _border, width: 1),
      ),
      child: pw.Column(
        crossAxisAlignment: pw.CrossAxisAlignment.start,
        children: [
          // Blue Title Bar
          pw.Container(
            width: double.infinity,
            padding: const pw.EdgeInsets.symmetric(horizontal: 12, vertical: 8),
            decoration: const pw.BoxDecoration(
              color: _navyHeader,
              borderRadius: pw.BorderRadius.only(
                topLeft: pw.Radius.circular(5),
                topRight: pw.Radius.circular(5),
              ),
            ),
            child: pw.Text(
              isSwahili ? 'TAARIFA ZA USHAURI (SESSION DETAILS)' : 'SESSION & CASE DETAILS',
              style: pw.TextStyle(font: heading, fontSize: 8.5, color: PdfColors.white),
            ),
          ),
          // Key-Value Rows
          ...items.asMap().entries.map((e) {
            final idx = e.key;
            final item = e.value;
            final bg = idx % 2 == 0 ? PdfColors.white : _surface;
            return pw.Container(
              width: double.infinity,
              padding: const pw.EdgeInsets.symmetric(horizontal: 12, vertical: 6),
              color: bg,
              child: pw.Row(
                children: [
                  pw.SizedBox(
                    width: 140,
                    child: pw.Text(
                      item['label']!,
                      style: pw.TextStyle(font: bold, fontSize: 8, color: _muted),
                    ),
                  ),
                  pw.Expanded(
                    child: pw.Text(
                      item['val']!,
                      style: pw.TextStyle(font: regular, fontSize: 8.5, color: _navyDark),
                    ),
                  ),
                ],
              ),
            );
          }),
        ],
      ),
    );
  }

  /// 4. DATA SOURCES / CLINICAL TAGS (Pill badges row)
  static pw.Widget _buildClinicalPills(pw.Font bold, pw.Font medium, DermCase dermCase, {bool isSwahili = false}) {
    final pills = [
      'Tele-Dermatology',
      dermCase.priority.toUpperCase(),
      isSwahili ? 'Kiswahili' : 'English',
      isSwahili ? 'Iliyo hakikiwa' : 'Specialist Verified',
    ];

    return pw.Column(
      crossAxisAlignment: pw.CrossAxisAlignment.start,
      children: [
        pw.Text(
          isSwahili ? 'VIPENGELE VYA TIBA (CLINICAL TAGS)' : 'DATA SOURCES & CLINICAL TAGS',
          style: pw.TextStyle(font: bold, fontSize: 7.5, color: _navyHeader),
        ),
        pw.SizedBox(height: 4),
        pw.Wrap(
          spacing: 6,
          runSpacing: 4,
          children: pills.map((p) => pw.Container(
            padding: const pw.EdgeInsets.symmetric(horizontal: 8, vertical: 3),
            decoration: pw.BoxDecoration(
              color: _pillBg,
              borderRadius: pw.BorderRadius.circular(3),
              border: pw.Border.all(color: PdfColor.fromInt(0xFFBAE6FD), width: 0.8),
            ),
            child: pw.Text(
              p,
              style: pw.TextStyle(font: medium, fontSize: 7.5, color: _pillText),
            ),
          )).toList(),
        ),
      ],
    );
  }

  /// 5. GOALS & CHALLENGES / DIAGNOSIS & PRESCRIPTION CARD (Amber Left Accent Bar)
  static pw.Widget _buildTreatmentCard(
    pw.Font heading,
    pw.Font medium,
    pw.Font regular,
    pw.Font bold,
    String diagnosis,
    List<Map<String, dynamic>> medications,
    List<String> education,
    List<String> avoidTriggers,
    String? notes, {
    bool isSwahili = false,
  }) {
    return pw.Container(
      width: double.infinity,
      decoration: pw.BoxDecoration(
        color: PdfColors.white,
        borderRadius: pw.BorderRadius.circular(6),
        border: const pw.Border(
          left: pw.BorderSide(color: _amberAccent, width: 4.5),
          top: pw.BorderSide(color: _border, width: 1),
          right: pw.BorderSide(color: _border, width: 1),
          bottom: pw.BorderSide(color: _border, width: 1),
        ),
      ),
      padding: const pw.EdgeInsets.all(12),
      child: pw.Column(
        crossAxisAlignment: pw.CrossAxisAlignment.start,
        children: [
          pw.Text(
            isSwahili ? 'UCHUNGUZI NA DAWA (DIAGNOSIS & PRESCRIPTION)' : 'SPECIALIST ASSESSMENT & TREATMENT PLAN',
            style: pw.TextStyle(font: heading, fontSize: 8.5, color: _navyDark),
          ),
          pw.SizedBox(height: 6),
          // Confirmed Diagnosis Text
          pw.Text(
            diagnosis,
            style: pw.TextStyle(font: bold, fontSize: 11, color: _primary),
          ),
          pw.SizedBox(height: 8),

          // Medications list
          if (medications.isNotEmpty) ...[
            pw.Text(
              isSwahili ? 'Dawa Zilizoelekezwa:' : 'Prescribed Medications:',
              style: pw.TextStyle(font: bold, fontSize: 8, color: _muted),
            ),
            pw.SizedBox(height: 4),
            ...medications.asMap().entries.map((e) {
              final idx = e.key + 1;
              final name = e.value['name'] as String? ?? 'Medication';
              final instr = isSwahili && e.value['instructionsSwahili'] != null && (e.value['instructionsSwahili'] as String).isNotEmpty
                  ? e.value['instructionsSwahili'] as String
                  : e.value['instructions'] as String? ?? '';
              return pw.Padding(
                padding: const pw.EdgeInsets.only(bottom: 4),
                child: pw.Text(
                  '$idx. $name — $instr',
                  style: pw.TextStyle(font: regular, fontSize: 8.5, color: _navyDark),
                ),
              );
            }),
            pw.SizedBox(height: 6),
          ],

          // Avoid Triggers
          if (avoidTriggers.isNotEmpty) ...[
            pw.Text(
              isSwahili ? 'Vitu vya kuepuka: ${avoidTriggers.join(" · ")}' : 'Avoid Triggers: ${avoidTriggers.join(" · ")}',
              style: pw.TextStyle(font: medium, fontSize: 8, color: PdfColor.fromInt(0xFFB91C1C)),
            ),
            pw.SizedBox(height: 6),
          ],

          // Patient Education Bullets
          if (education.isNotEmpty) ...[
            pw.Text(
              isSwahili ? 'Elimu kwa Mgonjwa:' : 'Patient Care Advice:',
              style: pw.TextStyle(font: bold, fontSize: 8, color: _muted),
            ),
            pw.SizedBox(height: 3),
            ...education.map((e) => pw.Padding(
              padding: const pw.EdgeInsets.only(bottom: 2),
              child: pw.Text('• $e', style: pw.TextStyle(font: regular, fontSize: 8, color: _navyDark)),
            )),
          ],

          if (notes != null && notes.isNotEmpty) ...[
            pw.SizedBox(height: 4),
            pw.Text(
              'Note: $notes',
              style: pw.TextStyle(font: regular, fontSize: 8, color: _muted),
            ),
          ],
        ],
      ),
    );
  }

  /// 6. HOW TO COMPLETE BOOKING / CLINIC INSTRUCTIONS CARD: Light Green instructions box matching Reference PDF
  static pw.Widget _buildInstructionsBox(pw.Font heading, pw.Font medium, pw.Font regular, int followUpDays, String? specialistName, {bool isSwahili = false}) {
    return pw.Container(
      width: double.infinity,
      padding: const pw.EdgeInsets.all(12),
      decoration: pw.BoxDecoration(
        color: _successBg,
        borderRadius: pw.BorderRadius.circular(6),
        border: pw.Border.all(color: _successBorder, width: 1),
      ),
      child: pw.Column(
        crossAxisAlignment: pw.CrossAxisAlignment.start,
        children: [
          pw.Text(
            isSwahili ? 'Jinsi ya kukamilisha matibabu yako:' : 'How to complete your care & follow-up:',
            style: pw.TextStyle(font: heading, fontSize: 9, color: _successGreen),
          ),
          pw.SizedBox(height: 6),
          pw.Text(
            isSwahili
                ? '1. Dawa na maelekezo yako yamethibitishwa moja kwa moja na Daktari Bingwa wa ngozi.'
                : '1. Your treatment details and dosage instructions are directly verified by specialist.',
            style: pw.TextStyle(font: regular, fontSize: 8, color: PdfColor.fromInt(0xFF166534)),
          ),
          pw.SizedBox(height: 3),
          pw.Text(
            isSwahili
                ? '2. Hifadhi mwongozo huu (PDF) kama risiti yako rasmi ya matibabu zahanati.'
                : '2. Keep this PDF as your official clinic treatment and prescription receipt.',
            style: pw.TextStyle(font: regular, fontSize: 8, color: PdfColor.fromInt(0xFF166534)),
          ),
          pw.SizedBox(height: 3),
          pw.Text(
            isSwahili
                ? '3. Rudi zahanati baada ya siku $followUpDays kwa ajili ya uchunguzi wa maendeleo, au mapema ikiwa dalili zitazidi.'
                : '3. Return to clinic in $followUpDays days for follow-up review, or sooner if symptoms worsen.',
            style: pw.TextStyle(font: regular, fontSize: 8, color: PdfColor.fromInt(0xFF166534)),
          ),
        ],
      ),
    );
  }

  /// 7. FOOTER DISCLAIMER
  static pw.Widget _buildFooter(pw.Font regular, pw.Font medium, Tenant? tenant, String ref, {bool isSwahili = false}) {
    return pw.Column(
      crossAxisAlignment: pw.CrossAxisAlignment.start,
      children: [
        pw.Divider(color: _border, thickness: 0.5),
        pw.SizedBox(height: 4),
        pw.Row(
          mainAxisAlignment: pw.MainAxisAlignment.spaceBetween,
          children: [
            pw.Text(
              tenant?.name ?? 'SkinLink Tele-Dermatology Network',
              style: pw.TextStyle(font: medium, fontSize: 7.5, color: _navyDark),
            ),
            pw.Text(
              'Ref: $ref',
              style: pw.TextStyle(font: medium, fontSize: 7.5, color: _primary),
            ),
          ],
        ),
        pw.SizedBox(height: 2),
        pw.Center(
          child: pw.Text(
            isSwahili
                ? 'Hati hii ina taarifa za siri za afya. Itunze kwa usalama na umpe daktari wako pekee.'
                : 'Confidential health document generated by SkinLink Tele-Dermatology Platform.',
            style: pw.TextStyle(font: regular, fontSize: 7, color: _muted),
            textAlign: pw.TextAlign.center,
          ),
        ),
      ],
    );
  }

  /// Preview PDF in-app print/share dialog on Android, iOS, Web & Edge.
  static Future<void> previewAndShare({
    required DermCase dermCase,
    required Map<String, dynamic> plan,
    Patient? patient,
    Tenant? tenant,
    String? specialistName,
  }) async {
    final bytes = await generate(
      dermCase: dermCase,
      plan: plan,
      patient: patient,
      tenant: tenant,
      specialistName: specialistName,
    );
    await Printing.layoutPdf(
      onLayout: (PdfPageFormat format) async => bytes,
      name: 'SkinLink_Treatment_${dermCase.ref}.pdf',
    );
  }

  /// Share PDF via system share sheet (WhatsApp, email, save to files).
  static Future<void> sharePdf({
    required DermCase dermCase,
    required Map<String, dynamic> plan,
    Patient? patient,
    Tenant? tenant,
    String? specialistName,
  }) async {
    final bytes = await generate(
      dermCase: dermCase,
      plan: plan,
      patient: patient,
      tenant: tenant,
      specialistName: specialistName,
    );
    await Printing.sharePdf(
      bytes: bytes,
      filename: 'SkinLink_Treatment_${dermCase.ref}.pdf',
    );
  }
}
