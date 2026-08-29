import 'dart:convert';
import 'dart:io';

import 'package:flutter/foundation.dart';
import 'package:http/http.dart' as http;
import 'package:image_picker/image_picker.dart';

import '../models/models.dart';

class ApiException implements Exception {
  final String message;
  final int? statusCode;
  ApiException(this.message, [this.statusCode]);
  @override
  String toString() => message;
}

class ApiService {
  ApiService({String? baseUrl}) : baseUrl = baseUrl ?? _defaultBaseUrl();

  final String baseUrl;
  String? _token;

  static String _defaultBaseUrl() {
    if (!kIsWeb && Platform.isAndroid) return 'http://10.0.2.2:8000';
    return 'http://127.0.0.1:8000';
  }

  void setToken(String? token) => _token = token;

  Map<String, String> get _headers => {
        'Content-Type': 'application/json',
        if (_token != null) 'Authorization': 'Bearer $_token',
      };

  Uri _uri(String path) => Uri.parse('$baseUrl/api/v1$path');

  Future<Map<String, dynamic>> _decode(http.Response res) async {
    if (res.statusCode >= 200 && res.statusCode < 300) {
      if (res.body.isEmpty) return {};
      return jsonDecode(res.body) as Map<String, dynamic>;
    }
    String msg = 'Request failed';
    try {
      final body = jsonDecode(res.body);
      if (body is Map && body['detail'] != null) {
        msg = body['detail'].toString();
      }
    } catch (_) {}
    throw ApiException(msg, res.statusCode);
  }

  Future<List<dynamic>> _decodeList(http.Response res) async {
    if (res.statusCode >= 200 && res.statusCode < 300) {
      return jsonDecode(res.body) as List<dynamic>;
    }
    throw ApiException('Request failed', res.statusCode);
  }

  Future<({User user, Tenant? tenant, String token})> login(
      String email, String password) async {
    final res = await http.post(
      _uri('/auth/login'),
      headers: {'Content-Type': 'application/json'},
      body: jsonEncode({'email': email, 'password': password}),
    );
    final data = await _decode(res);
    final token = data['access_token'] as String;
    _token = token;
    return (
      user: User.fromJson(data['user'] as Map<String, dynamic>),
      tenant: data['tenant'] != null
          ? Tenant.fromJson(data['tenant'] as Map<String, dynamic>)
          : null,
      token: token,
    );
  }

  Future<DashboardStats> getDashboard() async {
    final res = await http.get(_uri('/cases/dashboard'), headers: _headers);
    final data = await _decode(res);
    return DashboardStats.fromJson(data);
  }

  Future<List<Patient>> getPatients() async {
    final res = await http.get(_uri('/patients'), headers: _headers);
    final list = await _decodeList(res);
    return list.map((p) => Patient.fromJson(p as Map<String, dynamic>)).toList();
  }

  Future<List<DermCase>> getCases() async {
    final res = await http.get(_uri('/cases'), headers: _headers);
    final list = await _decodeList(res);
    return list.map((c) => DermCase.fromJson(c as Map<String, dynamic>)).toList();
  }

  Future<DermCase> getCase(String id) async {
    final res = await http.get(_uri('/cases/$id'), headers: _headers);
    return DermCase.fromJson(await _decode(res));
  }

  Future<List<FollowUp>> getFollowUps() async {
    final res = await http.get(_uri('/follow-ups'), headers: _headers);
    final list = await _decodeList(res);
    return list.map((f) => FollowUp.fromJson(f as Map<String, dynamic>)).toList();
  }

  Future<String> uploadImage(XFile file) async {
    final req = http.MultipartRequest('POST', _uri('/cases/upload-image'));
    if (_token != null) req.headers['Authorization'] = 'Bearer $_token';
    final bytes = await file.readAsBytes();
    req.files.add(http.MultipartFile.fromBytes(
      'file',
      bytes,
      filename: file.name.isNotEmpty ? file.name : 'image.jpg',
    ));
    final streamed = await req.send();
    final res = await http.Response.fromStream(streamed);
    final data = await _decode(res);
    final url = data['url'] as String;
    return '$baseUrl$url';
  }

  /// Run AI image-quality check for a single uploaded image.
  /// Returns a map with keys: rating, score, issues, focus, lighting,
  /// lesion_visible, retake_required. Throws on AI / API failure.
  Future<Map<String, dynamic>> checkImageQuality(
    String imageUrl, {
    String? angle,
  }) async {
    final res = await http.post(
      _uri('/ai/image-quality-check'),
      headers: _headers,
      body: jsonEncode({
        'image_url': imageUrl,
        'angle': angle,
        'required_angles': <String>[],
      }),
    );
    final body = jsonDecode(res.body);
    if (res.statusCode >= 200 && res.statusCode < 300 && body is Map<String, dynamic>) {
      return body;
    }
    throw Exception(_aiErrorMessage(body, res.statusCode));
  }

  /// Run AI skin assessment for a case. Returns the assessment map
  /// (possible_conditions, urgency, image_quality, etc.). Throws on failure.
  Future<Map<String, dynamic>> runSkinAssessment(DermCase dermCase) async {
    final images = dermCase.images
        .map((img) => {
              'url': img['url'] ?? '',
              'angle': img['angle'],
            })
        .toList();

    final res = await http.post(
      _uri('/ai/skin-assessment'),
      headers: _headers,
      body: jsonEncode({
        'patient_age': null,
        'sex': null,
        'symptoms': <String>[],
        'duration': dermCase.durationDays > 0 ? '${dermCase.durationDays} days' : null,
        'duration_days': dermCase.durationDays > 0 ? dermCase.durationDays : null,
        'body_site': dermCase.bodySite,
        'severity': null,
        'previous_treatment': null,
        'treatment_response': null,
        'adherence': null,
        'red_flags': <String>[],
        'primary_concern': dermCase.primaryConcern,
        'clinical_info': dermCase.clinicalInfo,
        'case_id': dermCase.id,
        'images': images,
        'image_urls': images.map((i) => i['url']).toList(),
      }),
    );
    final body = jsonDecode(res.body);
    if (res.statusCode >= 200 && res.statusCode < 300 && body is Map<String, dynamic>) {
      return body;
    }
    throw Exception(_aiErrorMessage(body, res.statusCode));
  }

  String _aiErrorMessage(dynamic body, int status) {
    if (body is Map) {
      final detail = body['detail'];
      if (detail is String) return detail;
      if (detail is Map) {
        final message = detail['message'];
        if (message is String && message.isNotEmpty) return message;
      }
      final message = body['message'];
      if (message is String && message.isNotEmpty) return message;
    }
    return 'AI service error ($status)';
  }

  Future<Patient> createPatient(Map<String, dynamic> body) async {
    final res = await http.post(
      _uri('/patients'),
      headers: _headers,
      body: jsonEncode(body),
    );
    return Patient.fromJson(await _decode(res));
  }

  Future<List<Specialist>> getSpecialists() async {
    final res = await http.get(_uri('/cases/specialists'), headers: _headers);
    final list = await _decodeList(res);
    return list
        .map((s) => Specialist.fromJson(s as Map<String, dynamic>))
        .toList();
  }

  Future<({DermCase case_, String patientId})> submitReferral(
      Map<String, dynamic> payload) async {
    final res = await http.post(
      _uri('/cases/submit-referral'),
      headers: _headers,
      body: jsonEncode(payload),
    );
    final data = await _decode(res);
    return (
      case_: DermCase.fromJson(data['case'] as Map<String, dynamic>),
      patientId: data['patientId'] as String,
    );
  }

  Future<List<Map<String, dynamic>>> getDrafts() async {
    final res = await http.get(_uri('/drafts'), headers: _headers);
    final list = await _decodeList(res);
    return list.cast<Map<String, dynamic>>();
  }

  Future<Map<String, dynamic>> saveDraft(Map<String, dynamic> draft) async {
    final res = await http.post(
      _uri('/drafts'),
      headers: _headers,
      body: jsonEncode(draft),
    );
    return await _decode(res);
  }

  Future<void> deleteDraft(String id) async {
    await http.delete(_uri('/drafts/$id'), headers: _headers);
  }

  Future<DermCase> addCaseNote(String caseId, String body) async {
    final res = await http.post(
      _uri('/cases/$caseId/notes'),
      headers: _headers,
      body: jsonEncode({'body': body}),
    );
    return DermCase.fromJson(await _decode(res));
  }

  Future<FollowUp> createFollowUp(Map<String, dynamic> body) async {
    final res = await http.post(
      _uri('/follow-ups'),
      headers: _headers,
      body: jsonEncode(body),
    );
    return FollowUp.fromJson(await _decode(res));
  }

  Future<void> updateFollowUp(String id, Map<String, dynamic> patch) async {
    await http.patch(
      _uri('/follow-ups/$id'),
      headers: _headers,
      body: jsonEncode(patch),
    );
  }

  Future<DermCase> updateCase(String id, Map<String, dynamic> patch) async {
    final res = await http.patch(
      _uri('/cases/$id'),
      headers: _headers,
      body: jsonEncode(patch),
    );
    return DermCase.fromJson(await _decode(res));
  }

  Future<bool> healthCheck() async {
    try {
      final res = await http.get(_uri('/health')).timeout(const Duration(seconds: 3));
      return res.statusCode == 200;
    } catch (_) {
      return false;
    }
  }
}
