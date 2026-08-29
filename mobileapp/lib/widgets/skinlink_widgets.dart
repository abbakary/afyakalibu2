import 'package:flutter/material.dart';
import 'package:google_fonts/google_fonts.dart';

import '../theme/skinlink_theme.dart';

// Brand Logo & Header
class SkinLinkLogo extends StatelessWidget {
  const SkinLinkLogo({
    super.key,
    this.size = 32,
    this.light = false,
    this.showSubtitle = false,
    this.subtitleText = 'Connecting Clinics to Specialists',
  });

  final double size;
  final bool light;
  final bool showSubtitle;
  final String subtitleText;

  @override
  Widget build(BuildContext context) {
    final fg = light ? Colors.white : SkinLinkColors.textPrimary;
    final subFg = light ? Colors.white.withValues(alpha: 0.85) : SkinLinkColors.textMuted;

    return Column(
      mainAxisSize: MainAxisSize.min,
      children: [
        Text(
          'SkinLink',
          style: GoogleFonts.manrope(
            fontSize: size,
            fontWeight: FontWeight.w800,
            color: fg,
            letterSpacing: -0.5,
          ),
        ),
        if (showSubtitle) ...[
          const SizedBox(height: 4),
          Text(
            subtitleText,
            style: GoogleFonts.inter(
              fontSize: 13,
              fontWeight: FontWeight.w400,
              color: subFg,
            ),
            textAlign: TextAlign.center,
          ),
        ],
      ],
    );
  }
}

// Gradient Primary Button (Orange linear gradient)
class SkinLinkGradientButton extends StatelessWidget {
  const SkinLinkGradientButton({
    super.key,
    required this.text,
    required this.onPressed,
    this.loading = false,
    this.icon,
    this.height = 48,
    this.gradient,
    this.borderRadius = 10,
  });

  final String text;
  final VoidCallback? onPressed;
  final bool loading;
  final Widget? icon;
  final double height;
  final Gradient? gradient;
  final double borderRadius;

  @override
  Widget build(BuildContext context) {
    final effectiveGradient = gradient ?? SkinLinkColors.orangeGradient;
    final isEnabled = onPressed != null && !loading;

    return Container(
      height: height,
      decoration: BoxDecoration(
        gradient: isEnabled ? effectiveGradient : null,
        color: isEnabled ? null : SkinLinkColors.cardBorder,
        borderRadius: BorderRadius.circular(borderRadius),
        boxShadow: isEnabled
            ? [
                BoxShadow(
                  color: (effectiveGradient.colors.first).withValues(alpha: 0.3),
                  blurRadius: 8,
                  offset: const Offset(0, 3),
                ),
              ]
            : null,
      ),
      child: Material(
        color: Colors.transparent,
        child: InkWell(
          onTap: isEnabled ? onPressed : null,
          borderRadius: BorderRadius.circular(borderRadius),
          child: Center(
            child: loading
                ? const SizedBox(
                    width: 22,
                    height: 22,
                    child: CircularProgressIndicator(
                      strokeWidth: 2.5,
                      color: Colors.white,
                    ),
                  )
                : Row(
                    mainAxisAlignment: MainAxisAlignment.center,
                    mainAxisSize: MainAxisSize.min,
                    children: [
                      if (icon != null) ...[icon!, const SizedBox(width: 8)],
                      Text(
                        text,
                        style: GoogleFonts.inter(
                          fontSize: 15,
                          fontWeight: FontWeight.w700,
                          color: isEnabled ? Colors.white : SkinLinkColors.textLight,
                        ),
                      ),
                    ],
                  ),
          ),
        ),
      ),
    );
  }
}

// Outlined Secondary Button (White background, primary teal border)
class SkinLinkOutlinedButton extends StatelessWidget {
  const SkinLinkOutlinedButton({
    super.key,
    required this.text,
    required this.onPressed,
    this.height = 48,
    this.borderColor,
    this.textColor,
    this.borderRadius = 10,
  });

  final String text;
  final VoidCallback? onPressed;
  final double height;
  final Color? borderColor;
  final Color? textColor;
  final double borderRadius;

  @override
  Widget build(BuildContext context) {
    final effectiveBorder = borderColor ?? SkinLinkColors.primary;
    final effectiveText = textColor ?? SkinLinkColors.primary;

    return Container(
      height: height,
      decoration: BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.circular(borderRadius),
        border: Border.all(color: effectiveBorder, width: 1.5),
      ),
      child: Material(
        color: Colors.transparent,
        child: InkWell(
          onTap: onPressed,
          borderRadius: BorderRadius.circular(borderRadius),
          child: Center(
            child: Text(
              text,
              style: GoogleFonts.inter(
                fontSize: 15,
                fontWeight: FontWeight.w600,
                color: effectiveText,
              ),
            ),
          ),
        ),
      ),
    );
  }
}

// Status Metric Pill for Dashboard Top Summary Row
class MetricPill extends StatelessWidget {
  const MetricPill({
    super.key,
    required this.label,
    required this.value,
    required this.backgroundColor,
    this.icon = Icons.visibility_outlined,
    this.onTap,
  });

  final String label;
  final String value;
  final Color backgroundColor;
  final IconData icon;
  final VoidCallback? onTap;

  @override
  Widget build(BuildContext context) {
    return Expanded(
      child: InkWell(
        onTap: onTap,
        borderRadius: BorderRadius.circular(12),
        child: Container(
          padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 10),
          decoration: BoxDecoration(
            color: backgroundColor,
            borderRadius: BorderRadius.circular(12),
            boxShadow: [
              BoxShadow(
                color: backgroundColor.withValues(alpha: 0.28),
                blurRadius: 6,
                offset: const Offset(0, 2),
              ),
            ],
          ),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            mainAxisSize: MainAxisSize.min,
            children: [
              Text(
                label,
                style: GoogleFonts.inter(
                  color: Colors.white.withValues(alpha: 0.9),
                  fontSize: 10.5,
                  fontWeight: FontWeight.w600,
                ),
                maxLines: 1,
                overflow: TextOverflow.ellipsis,
              ),
              const SizedBox(height: 4),
              Row(
                mainAxisAlignment: MainAxisAlignment.spaceBetween,
                crossAxisAlignment: CrossAxisAlignment.center,
                children: [
                  Text(
                    value,
                    style: GoogleFonts.manrope(
                      color: Colors.white,
                      fontSize: 22,
                      fontWeight: FontWeight.w800,
                    ),
                  ),
                  Container(
                    width: 20,
                    height: 20,
                    decoration: BoxDecoration(
                      color: Colors.white.withValues(alpha: 0.2),
                      shape: BoxShape.circle,
                    ),
                    child: Icon(icon, color: Colors.white, size: 12),
                  ),
                ],
              ),
            ],
          ),
        ),
      ),
    );
  }
}

// 2x2 Grid Card for Rates / Status of Queue
class RateMetricCard extends StatelessWidget {
  const RateMetricCard({
    super.key,
    required this.icon,
    required this.iconColor,
    required this.iconBgColor,
    required this.value,
    required this.label,
  });

  final IconData icon;
  final Color iconColor;
  final Color iconBgColor;
  final String value;
  final String label;

  @override
  Widget build(BuildContext context) {
    return Container(
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
        crossAxisAlignment: CrossAxisAlignment.center,
        children: [
          Container(
            width: 38,
            height: 38,
            decoration: BoxDecoration(
              color: iconBgColor,
              shape: BoxShape.circle,
            ),
            child: Icon(icon, color: iconColor, size: 20),
          ),
          const SizedBox(width: 10),
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              mainAxisSize: MainAxisSize.min,
              children: [
                Text(
                  value,
                  style: GoogleFonts.manrope(
                    fontSize: 16,
                    fontWeight: FontWeight.w800,
                    color: SkinLinkColors.textPrimary,
                  ),
                ),
                const SizedBox(height: 2),
                Text(
                  label,
                  style: GoogleFonts.inter(
                    fontSize: 10.5,
                    fontWeight: FontWeight.w500,
                    color: SkinLinkColors.textMuted,
                  ),
                  maxLines: 1,
                  overflow: TextOverflow.ellipsis,
                ),
              ],
            ),
          ),
        ],
      ),
    );
  }
}

// Patient Referral Queue Item Card
class ReferralQueueCard extends StatelessWidget {
  const ReferralQueueCard({
    super.key,
    required this.patientName,
    required this.statusText,
    this.statusColor = SkinLinkColors.orangeBadge,
    this.avatarText,
    this.imageUrl,
    required this.onTap,
  });

  final String patientName;
  final String statusText;
  final Color statusColor;
  final String? avatarText;
  final String? imageUrl;
  final VoidCallback onTap;

  @override
  Widget build(BuildContext context) {
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
      child: Material(
        color: Colors.transparent,
        child: InkWell(
          onTap: onTap,
          borderRadius: BorderRadius.circular(12),
          child: Padding(
            padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 10),
            child: Row(
              children: [
                CircleAvatar(
                  radius: 20,
                  backgroundColor: SkinLinkColors.tealLight,
                  backgroundImage: imageUrl != null && imageUrl!.startsWith('http')
                      ? NetworkImage(imageUrl!)
                      : null,
                  child: imageUrl == null || !imageUrl!.startsWith('http')
                      ? Text(
                          avatarText ?? (patientName.isNotEmpty ? patientName[0] : 'P'),
                          style: GoogleFonts.manrope(
                            fontWeight: FontWeight.w700,
                            color: SkinLinkColors.primary,
                            fontSize: 14,
                          ),
                        )
                      : null,
                ),
                const SizedBox(width: 12),
                Expanded(
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    mainAxisSize: MainAxisSize.min,
                    children: [
                      Text(
                        patientName,
                        style: GoogleFonts.manrope(
                          fontSize: 14.5,
                          fontWeight: FontWeight.w700,
                          color: SkinLinkColors.textPrimary,
                        ),
                      ),
                      const SizedBox(height: 2),
                      Text(
                        statusText,
                        style: GoogleFonts.inter(
                          fontSize: 11.5,
                          fontWeight: FontWeight.w500,
                          color: statusColor,
                        ),
                        maxLines: 1,
                        overflow: TextOverflow.ellipsis,
                      ),
                    ],
                  ),
                ),
                const Icon(
                  Icons.chevron_right,
                  color: SkinLinkColors.primary,
                  size: 22,
                ),
              ],
            ),
          ),
        ),
      ),
    );
  }
}

// 4-Step Horizontal Stepper for New Referral Wizard
class StepProgressIndicator extends StatelessWidget {
  const StepProgressIndicator({
    super.key,
    required this.currentStep,
    required this.steps,
    this.onStepTapped,
  });

  final int currentStep;
  final List<String> steps;
  final ValueChanged<int>? onStepTapped;

  @override
  Widget build(BuildContext context) {
    return SingleChildScrollView(
      scrollDirection: Axis.horizontal,
      child: Row(
        children: List.generate(steps.length, (i) {
          final isActive = i == currentStep;
          final isPast = i < currentStep;

          return Padding(
            padding: const EdgeInsets.only(right: 6),
            child: InkWell(
              onTap: onStepTapped != null ? () => onStepTapped!(i) : null,
              borderRadius: BorderRadius.circular(20),
              child: Container(
                padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 5),
                decoration: BoxDecoration(
                  color: isActive
                      ? SkinLinkColors.primary
                      : isPast
                          ? SkinLinkColors.orangeBadge
                          : SkinLinkColors.surface,
                  borderRadius: BorderRadius.circular(20),
                  border: Border.all(
                    color: isActive
                        ? SkinLinkColors.primary
                        : isPast
                            ? SkinLinkColors.orangeBadge
                            : SkinLinkColors.cardBorder,
                  ),
                ),
                child: Row(
                  mainAxisSize: MainAxisSize.min,
                  children: [
                    if (isPast)
                      const Icon(Icons.check, size: 12, color: Colors.white)
                    else if (isActive)
                      const Icon(Icons.circle, size: 8, color: Colors.white)
                    else
                      Text(
                        '${i + 1}. ',
                        style: GoogleFonts.inter(
                          fontSize: 11,
                          fontWeight: FontWeight.w600,
                          color: SkinLinkColors.textMuted,
                        ),
                      ),
                    const SizedBox(width: 4),
                    Text(
                      steps[i],
                      style: GoogleFonts.inter(
                        fontSize: 11,
                        fontWeight: isActive || isPast ? FontWeight.w700 : FontWeight.w500,
                        color: isActive || isPast ? Colors.white : SkinLinkColors.textMuted,
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
}

// Diagnosis Highlight Box
class DiagnosisBox extends StatelessWidget {
  const DiagnosisBox({super.key, required this.diagnosis});

  final String diagnosis;

  @override
  Widget build(BuildContext context) {
    return Container(
      width: double.infinity,
      padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 12),
      decoration: BoxDecoration(
        color: SkinLinkColors.tealLight,
        borderRadius: BorderRadius.circular(8),
        border: Border.all(color: SkinLinkColors.tealBorder),
      ),
      child: Text(
        diagnosis,
        style: GoogleFonts.inter(
          fontSize: 13.5,
          fontWeight: FontWeight.w600,
          color: SkinLinkColors.primaryDark,
        ),
      ),
    );
  }
}

// Treatment Plan Checklist Item (with green bullets)
class TreatmentChecklistItem extends StatelessWidget {
  const TreatmentChecklistItem({super.key, required this.text});

  final String text;

  @override
  Widget build(BuildContext context) {
    return Padding(
      padding: const EdgeInsets.only(bottom: 8),
      child: Row(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Container(
            margin: const EdgeInsets.only(top: 4),
            width: 8,
            height: 8,
            decoration: const BoxDecoration(
              color: SkinLinkColors.success,
              shape: BoxShape.circle,
            ),
          ),
          const SizedBox(width: 10),
          Expanded(
            child: Text(
              text,
              style: GoogleFonts.inter(
                fontSize: 13.5,
                fontWeight: FontWeight.w500,
                color: SkinLinkColors.textPrimary,
                height: 1.3,
              ),
            ),
          ),
        ],
      ),
    );
  }
}

// Sync Banner
class SyncBanner extends StatelessWidget {
  const SyncBanner({super.key, required this.online, this.pendingDrafts = 0});

  final bool online;
  final int pendingDrafts;

  @override
  Widget build(BuildContext context) {
    if (online && pendingDrafts == 0) {
      return Container(
        padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 6),
        decoration: BoxDecoration(
          color: SkinLinkColors.successLight,
          borderRadius: BorderRadius.circular(8),
          border: Border.all(color: SkinLinkColors.success.withValues(alpha: 0.3)),
        ),
        child: Row(
          children: [
            const Icon(Icons.cloud_done_outlined, size: 14, color: SkinLinkColors.success),
            const SizedBox(width: 6),
            Text(
              'Synchronised & Online',
              style: GoogleFonts.inter(fontSize: 11, fontWeight: FontWeight.w600, color: SkinLinkColors.success),
            ),
          ],
        ),
      );
    }
    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 6),
      decoration: BoxDecoration(
        color: SkinLinkColors.warningLight,
        borderRadius: BorderRadius.circular(8),
        border: Border.all(color: SkinLinkColors.warning.withValues(alpha: 0.3)),
      ),
      child: Row(
        children: [
          const Icon(Icons.cloud_off_outlined, size: 14, color: SkinLinkColors.warning),
          const SizedBox(width: 6),
          Expanded(
            child: Text(
              online
                  ? '$pendingDrafts draft(s) pending sync'
                  : 'Offline mode — referrals saved locally',
              style: GoogleFonts.inter(fontSize: 11, fontWeight: FontWeight.w600, color: SkinLinkColors.warning),
            ),
          ),
        ],
      ),
    );
  }
}

String timeAgo(String iso) {
  try {
    final diff = DateTime.now().difference(DateTime.parse(iso));
    if (diff.inMinutes < 1) return 'just now';
    if (diff.inHours < 1) return '${diff.inMinutes}m ago';
    if (diff.inDays < 1) return '${diff.inHours}h ago';
    if (diff.inDays < 30) return '${diff.inDays}d ago';
    return '${(diff.inDays / 30).round()}mo ago';
  } catch (_) {
    return 'recently';
  }
}

String statusLabel(String status) {
  switch (status) {
    case 'new':
      return 'Waiting for Review';
    case 'in_review':
      return 'In Review';
    case 'reviewed':
      return 'Guidance Ready';
    case 'follow_up':
      return 'Follow-up';
    case 'closed':
      return 'Completed';
    default:
      return status;
  }
}

