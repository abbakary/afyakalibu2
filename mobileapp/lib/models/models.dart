class User {
  final String id;
  final String? tenantId;
  final String name;
  final String email;
  final String role;
  final String? title;

  User({
    required this.id,
    this.tenantId,
    required this.name,
    required this.email,
    required this.role,
    this.title,
  });

  factory User.fromJson(Map<String, dynamic> j) => User(
        id: j['id'] as String,
        tenantId: j['tenantId'] as String?,
        name: j['name'] as String,
        email: j['email'] as String,
        role: j['role'] as String,
        title: j['title'] as String?,
      );

  String get firstName => name.replaceAll(RegExp(r'^Dr\.\s*'), '').split(' ').first;
}

class Specialist {
  final String id;
  final String name;
  final String? title;
  final String? specialty;
  final String avatarColor;
  final int openCases;
  final bool isBusy;

  Specialist({
    required this.id,
    required this.name,
    this.title,
    this.specialty,
    required this.avatarColor,
    required this.openCases,
    required this.isBusy,
  });

  factory Specialist.fromJson(Map<String, dynamic> j) => Specialist(
        id: j['id'] as String,
        name: j['name'] as String,
        title: j['title'] as String?,
        specialty: j['specialty'] as String?,
        avatarColor: j['avatarColor'] as String? ?? '#1f7a8c',
        openCases: j['openCases'] as int? ?? 0,
        isBusy: j['isBusy'] as bool? ?? false,
      );

  String get initials {
    final parts = name.split(' ').where((p) => p.isNotEmpty).toList();
    if (parts.length >= 2) return '${parts.first[0]}${parts.last[0]}'.toUpperCase();
    return parts.isNotEmpty ? parts.first[0].toUpperCase() : '?';
  }

  String get displayRole => title?.isNotEmpty == true ? title! : 'Specialist';
}

class Tenant {
  final String id;
  final String name;
  final String region;
  final String country;
  final String primaryColor;

  Tenant({
    required this.id,
    required this.name,
    required this.region,
    required this.country,
    required this.primaryColor,
  });

  factory Tenant.fromJson(Map<String, dynamic> j) => Tenant(
        id: j['id'] as String,
        name: j['name'] as String,
        region: j['region'] as String,
        country: j['country'] as String,
        primaryColor: j['primaryColor'] as String? ?? '#1f7a8c',
      );
}

class Patient {
  final String id;
  final String code;
  final String fullName;
  final int age;
  final String gender;
  final String village;
  final String region;
  final String? district;
  final String? country;
  final String? phone;
  final String? alternatePhone;
  final String? preferredLanguage;
  // Medical history
  final String? medicalHistory;
  final String? allergies;
  final String? currentMedications;
  final String? chronicConditions;
  final String? notes;
  // Consent
  final bool consentObtained;
  final bool consentForPhotography;
  final bool consentForRemoteReview;
  final bool consentForStorage;
  final String? consentDate;
  final String? consentWitness;

  Patient({
    required this.id,
    required this.code,
    required this.fullName,
    required this.age,
    required this.gender,
    required this.village,
    required this.region,
    this.district,
    this.country,
    this.phone,
    this.alternatePhone,
    this.preferredLanguage,
    this.medicalHistory,
    this.allergies,
    this.currentMedications,
    this.chronicConditions,
    this.notes,
    required this.consentObtained,
    this.consentForPhotography = false,
    this.consentForRemoteReview = false,
    this.consentForStorage = false,
    this.consentDate,
    this.consentWitness,
  });

  factory Patient.fromJson(Map<String, dynamic> j) => Patient(
        id: j['id'] as String,
        code: j['code'] as String,
        fullName: j['fullName'] as String,
        age: j['age'] as int,
        gender: j['gender'] as String,
        village: j['village'] as String,
        region: j['region'] as String,
        district: j['district'] as String?,
        country: j['country'] as String?,
        phone: j['phone'] as String?,
        alternatePhone: j['alternatePhone'] as String?,
        preferredLanguage: j['preferredLanguage'] as String?,
        medicalHistory: j['medicalHistory'] as String?,
        allergies: j['allergies'] as String?,
        currentMedications: j['currentMedications'] as String?,
        chronicConditions: j['chronicConditions'] as String?,
        notes: j['notes'] as String?,
        consentObtained: j['consentObtained'] as bool? ?? false,
        consentForPhotography: j['consentForPhotography'] as bool? ?? false,
        consentForRemoteReview: j['consentForRemoteReview'] as bool? ?? false,
        consentForStorage: j['consentForStorage'] as bool? ?? false,
        consentDate: j['consentDate'] as String?,
        consentWitness: j['consentWitness'] as String?,
      );

  /// Checks whether all three consent items are confirmed.
  bool get fullConsentGranted =>
      consentForPhotography && consentForRemoteReview && consentForStorage;
}

class LesionImage {
  final String url;
  final String angle;
  final String? localPath;

  LesionImage({required this.url, required this.angle, this.localPath});

  Map<String, dynamic> toJson() => {'url': url, 'angle': angle};
}

class DermCase {
  final String id;
  final String ref;
  final String patientId;
  final String primaryConcern;
  final String clinicalInfo;
  final int durationDays;
  final String suspectedCondition;
  final String status;
  final String priority;
  final List<Map<String, dynamic>> images;
  final Map<String, dynamic>? treatmentPlan;
  final Map<String, dynamic>? followUpReport;
  final String createdAt;
  final String updatedAt;
  final String? bodySite;
  /// Raw AI assessment from the backend (possible_conditions, urgency, etc.)
  final Map<String, dynamic>? ai;

  DermCase({
    required this.id,
    required this.ref,
    required this.patientId,
    required this.primaryConcern,
    required this.clinicalInfo,
    required this.durationDays,
    required this.suspectedCondition,
    required this.status,
    required this.priority,
    required this.images,
    this.treatmentPlan,
    this.followUpReport,
    required this.createdAt,
    required this.updatedAt,
    this.bodySite,
    this.ai,
  });

  factory DermCase.fromJson(Map<String, dynamic> j) => DermCase(
        id: j['id'] as String,
        ref: j['ref'] as String,
        patientId: j['patientId'] as String,
        primaryConcern: j['primaryConcern'] as String,
        clinicalInfo: j['clinicalInfo'] as String? ?? '',
        durationDays: j['durationDays'] as int? ?? 0,
        suspectedCondition: j['suspectedCondition'] as String? ?? '',
        status: j['status'] as String,
        priority: j['priority'] as String? ?? 'routine',
        images: (j['images'] as List?)?.cast<Map<String, dynamic>>() ?? [],
        treatmentPlan: j['treatmentPlan'] as Map<String, dynamic>?,
        followUpReport: j['followUpReport'] as Map<String, dynamic>?,
        createdAt: j['createdAt'] as String,
        updatedAt: j['updatedAt'] as String,
        bodySite: j['bodySite'] as String?,
        ai: j['ai'] as Map<String, dynamic>?,
      );

  bool get hasGuidance => treatmentPlan != null;
  bool get hasFollowUpReport => followUpReport != null;
  bool get hasAiAssessment => ai != null;
  bool get hasSpecialistFollowUpFeedback =>
      followUpReport != null && followUpReport!['specialistFeedback'] != null;
  String? get specialistFollowUpFeedback =>
      followUpReport?['specialistFeedback'] as String?;
  String? get specialistFollowUpAction =>
      followUpReport?['specialistAction'] as String?;
  String? get specialistFollowUpRespondedAt =>
      followUpReport?['respondedAt'] as String?;
}

class DashboardStats {
  final int newCount;
  final int awaitingReview;
  final int completed;
  final int guidanceReady;
  final int dueFollowUps;
  final List<DermCase> recentCases;

  DashboardStats({
    required this.newCount,
    required this.awaitingReview,
    required this.completed,
    required this.guidanceReady,
    required this.dueFollowUps,
    required this.recentCases,
  });

  factory DashboardStats.fromJson(Map<String, dynamic> j) => DashboardStats(
        newCount: j['newCount'] as int? ?? 0,
        awaitingReview: j['awaitingReview'] as int? ?? 0,
        completed: j['completed'] as int? ?? 0,
        guidanceReady: j['guidanceReady'] as int? ?? 0,
        dueFollowUps: j['dueFollowUps'] as int? ?? 0,
        recentCases: (j['recentCases'] as List?)
                ?.map((c) => DermCase.fromJson(c as Map<String, dynamic>))
                .toList() ??
            [],
      );
}

class FollowUp {
  final String id;
  final String tenantId;
  final String caseId;
  final String caseRef;
  final String patientName;
  final String scheduledFor;
  final String status;
  final String purpose;
  final String? assignedToId;
  final String? outcome;

  FollowUp({
    required this.id,
    required this.tenantId,
    required this.caseId,
    required this.caseRef,
    required this.patientName,
    required this.scheduledFor,
    required this.status,
    required this.purpose,
    this.assignedToId,
    this.outcome,
  });

  factory FollowUp.fromJson(Map<String, dynamic> j) => FollowUp(
        id: j['id'] as String,
        tenantId: j['tenantId'] as String? ?? '',
        caseId: j['caseId'] as String,
        caseRef: j['caseRef'] as String,
        patientName: j['patientName'] as String,
        scheduledFor: j['scheduledFor'] as String,
        status: j['status'] as String,
        purpose: j['purpose'] as String,
        assignedToId: j['assignedToId'] as String?,
        outcome: j['outcome'] as String?,
      );
}
