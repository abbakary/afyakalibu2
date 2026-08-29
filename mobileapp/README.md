# SkinLink Village Clinic App

Flutter mobile app for rural healthcare workers — register patients, capture lesion images, submit referrals, and receive specialist guidance.

## Design

Matches the SkinLink prototype:
- Teal/navy brand palette (`#1F7A8C`, `#0C2340`)
- 4-step referral wizard with stepper
- Today's overview dashboard with stat cards
- Bottom navigation: Dashboard · Referrals · New · Patients · More
- Consent, image capture, clinical checklist, review & submit
- Case tracking, specialist guidance, 7-day follow-up

## Prerequisites

- Flutter SDK 3.12+
- SkinLink FastAPI backend running (see `../backend/README.md`)

## Run

```bash
cd mobileapp
flutter pub get
flutter run
```

## API connection

| Platform | Default API URL |
|----------|-----------------|
| Android emulator | `http://10.0.2.2:8000` |
| iOS simulator | `http://127.0.0.1:8000` |
| Physical device | Your PC LAN IP, e.g. `http://192.168.1.10:8000` |

Override in `lib/services/api_service.dart` if needed.

## Demo login

| Email | Password |
|-------|----------|
| `neema@mwanzahealth.org` | `clinic123` |

## Features

- Secure JWT authentication
- Offline draft saving (SharedPreferences)
- Camera & gallery image capture
- Combined referral submission API
- Case status timeline
- Specialist treatment guidance view
- Follow-up recording
- **Branded patient treatment PDF** — print or share handout for patients
