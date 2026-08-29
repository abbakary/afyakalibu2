import 'dart:convert';

import 'package:connectivity_plus/connectivity_plus.dart';
import 'package:flutter/foundation.dart';
import 'package:shared_preferences/shared_preferences.dart';

import '../models/models.dart';
import '../services/api_service.dart';

class AppState extends ChangeNotifier {
  AppState({ApiService? api}) : api = api ?? ApiService();

  final ApiService api;

  User? user;
  Tenant? tenant;
  bool loading = false;
  String? error;
  bool online = true;
  DashboardStats? dashboard;
  List<Patient> patients = [];
  List<DermCase> cases = [];
  List<FollowUp> followUps = [];
  List<Map<String, dynamic>> localDrafts = [];

  static const _tokenKey = 'skinlink.token';
  static const _userKey = 'skinlink.user';
  static const _tenantKey = 'skinlink.tenant';
  static const _draftsKey = 'skinlink.local_drafts';

  Future<void> init() async {
    Connectivity().onConnectivityChanged.listen((results) {
      online = !results.contains(ConnectivityResult.none);
      notifyListeners();
    });
    final prefs = await SharedPreferences.getInstance();
    final token = prefs.getString(_tokenKey);
    final userJson = prefs.getString(_userKey);
    final tenantJson = prefs.getString(_tenantKey);
    final draftsJson = prefs.getString(_draftsKey);
    if (draftsJson != null) {
      localDrafts = (jsonDecode(draftsJson) as List).cast<Map<String, dynamic>>();
    }
    if (token != null && userJson != null) {
      api.setToken(token);
      user = User.fromJson(jsonDecode(userJson) as Map<String, dynamic>);
      if (tenantJson != null) {
        tenant = Tenant.fromJson(jsonDecode(tenantJson) as Map<String, dynamic>);
      }
      await refreshAll(silent: true);
    }
    online = await api.healthCheck();
    notifyListeners();
  }

  Future<bool> login(String email, String password) async {
    loading = true;
    error = null;
    notifyListeners();
    try {
      final result = await api.login(email, password);
      user = result.user;
      tenant = result.tenant;
      final prefs = await SharedPreferences.getInstance();
      await prefs.setString(_tokenKey, result.token);
      await prefs.setString(_userKey, jsonEncode({
        'id': user!.id,
        'tenantId': user!.tenantId,
        'name': user!.name,
        'email': user!.email,
        'role': user!.role,
        'title': user!.title,
      }));
      if (tenant != null) {
        await prefs.setString(_tenantKey, jsonEncode({
          'id': tenant!.id,
          'name': tenant!.name,
          'region': tenant!.region,
          'country': tenant!.country,
          'primaryColor': tenant!.primaryColor,
        }));
      }
      await refreshAll();
      online = true;
      return true;
    } on ApiException catch (e) {
      error = e.message;
      return false;
    } finally {
      loading = false;
      notifyListeners();
    }
  }

  Future<void> logout() async {
    user = null;
    tenant = null;
    dashboard = null;
    patients = [];
    cases = [];
    followUps = [];
    api.setToken(null);
    final prefs = await SharedPreferences.getInstance();
    await prefs.remove(_tokenKey);
    await prefs.remove(_userKey);
    await prefs.remove(_tenantKey);
    notifyListeners();
  }

  Future<void> refreshAll({bool silent = false}) async {
    if (user == null) return;
    if (!silent) {
      loading = true;
      notifyListeners();
    }
    try {
      online = await api.healthCheck();
      if (online) {
        dashboard = await api.getDashboard();
        patients = await api.getPatients();
        cases = await api.getCases();
        followUps = await api.getFollowUps();
        _updateIndexMaps();
        await syncLocalDrafts();
      }
    } catch (e) {
      if (!silent) error = e.toString();
    } finally {
      if (!silent) loading = false;
      notifyListeners();
    }
  }

  Map<String, Patient> _patientMap = {};
  Map<String, DermCase> _caseMap = {};

  void _updateIndexMaps() {
    _patientMap = {for (final p in patients) p.id: p};
    _caseMap = {for (final c in cases) c.id: c};
  }

  Patient? patientById(String id) {
    if (_patientMap.containsKey(id)) return _patientMap[id];
    try {
      final p = patients.firstWhere((p) => p.id == id);
      _patientMap[p.id] = p;
      return p;
    } catch (_) {
      return null;
    }
  }

  DermCase? caseById(String id) {
    if (_caseMap.containsKey(id)) return _caseMap[id];
    try {
      final c = cases.firstWhere((c) => c.id == id);
      _caseMap[c.id] = c;
      return c;
    } catch (_) {
      return null;
    }
  }

  Future<void> saveLocalDraft(Map<String, dynamic> draft) async {
    final idx = localDrafts.indexWhere((d) => d['id'] == draft['id']);
    if (idx >= 0) {
      localDrafts[idx] = draft;
    } else {
      localDrafts.insert(0, draft);
    }
    final prefs = await SharedPreferences.getInstance();
    await prefs.setString(_draftsKey, jsonEncode(localDrafts));
    if (online) {
      try {
        await api.saveDraft(draft);
      } catch (_) {}
    }
    notifyListeners();
  }

  Future<void> removeLocalDraft(String id) async {
    localDrafts.removeWhere((d) => d['id'] == id);
    final prefs = await SharedPreferences.getInstance();
    await prefs.setString(_draftsKey, jsonEncode(localDrafts));
    if (online) {
      try {
        await api.deleteDraft(id);
      } catch (_) {}
    }
    notifyListeners();
  }

  Future<void> syncLocalDrafts() async {
    for (final draft in List<Map<String, dynamic>>.from(localDrafts)) {
      if (draft['pendingSync'] == true) continue;
      try {
        await api.saveDraft(draft);
      } catch (_) {}
    }
  }

  Future<DermCase?> submitReferral(Map<String, dynamic> payload) async {
    loading = true;
    error = null;
    notifyListeners();
    try {
      if (!online) {
        payload['pendingSync'] = true;
        await saveLocalDraft(payload);
        return null;
      }
      final result = await api.submitReferral(payload);
      final draftId = payload['draftId'] as String?;
      if (draftId != null) await removeLocalDraft(draftId);
      await refreshAll(silent: true);
      return result.case_;
    } on ApiException catch (e) {
      error = e.message;
      return null;
    } finally {
      loading = false;
      notifyListeners();
    }
  }

  /// Optimistically update a case in local list (offline fallback).
  void updateLocalCase(String caseId, Map<String, dynamic> patch) {
    final idx = cases.indexWhere((c) => c.id == caseId);
    if (idx < 0) return;
    final existing = cases[idx];
    // Rebuild DermCase from merged JSON
    final Map<String, dynamic> json = {
      'id': existing.id,
      'ref': existing.ref,
      'patientId': existing.patientId,
      'primaryConcern': existing.primaryConcern,
      'clinicalInfo': existing.clinicalInfo,
      'durationDays': existing.durationDays,
      'suspectedCondition': existing.suspectedCondition,
      'status': existing.status,
      'priority': existing.priority,
      'images': existing.images,
      'treatmentPlan': existing.treatmentPlan,
      'followUpReport': existing.followUpReport,
      'createdAt': existing.createdAt,
      'updatedAt': DateTime.now().toIso8601String(),
      'bodySite': existing.bodySite,
    };
    if (patch.containsKey('followUpReport') &&
        patch['followUpReport'] is Map &&
        existing.followUpReport != null) {
      final mergedReport = Map<String, dynamic>.from(existing.followUpReport!);
      mergedReport.addAll(patch['followUpReport'] as Map<String, dynamic>);
      patch['followUpReport'] = mergedReport;
    }
    json.addAll(patch);
    cases[idx] = DermCase.fromJson(json);
    notifyListeners();
  }

  /// Optimistically update a follow-up in local list (offline fallback).
  void updateLocalFollowUp(String followUpId, Map<String, dynamic> patch) {
    final idx = followUps.indexWhere((f) => f.id == followUpId);
    if (idx < 0) return;
    final existing = followUps[idx];
    final Map<String, dynamic> json = {
      'id': existing.id,
      'tenantId': existing.tenantId,
      'caseId': existing.caseId,
      'caseRef': existing.caseRef,
      'patientName': existing.patientName,
      'scheduledFor': existing.scheduledFor,
      'status': existing.status,
      'assignedToId': existing.assignedToId,
      'purpose': existing.purpose,
      'outcome': existing.outcome,
    };
    json.addAll(patch);
    followUps[idx] = FollowUp.fromJson(json);
    notifyListeners();
  }

  /// Formats image URLs for cross-platform playback (Android emulator alias & server path).
  String formatImageUrl(String? url) {
    if (url == null || url.isEmpty) return '';
    if (url.startsWith('blob:') || url.startsWith('data:')) return url;
    String clean = url;
    if (!kIsWeb && defaultTargetPlatform == TargetPlatform.android) {
      clean = clean
          .replaceAll('localhost:8000', '10.0.2.2:8000')
          .replaceAll('127.0.0.1:8000', '10.0.2.2:8000');
    }
    if (clean.startsWith('/')) {
      return '${api.baseUrl}$clean';
    }
    return clean;
  }
}
