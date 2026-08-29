import 'package:flutter/material.dart';

import '../theme/skinlink_theme.dart';
import 'dashboard_screen.dart';
import 'more_screen.dart';
import 'new_referral_screen.dart';
import 'patients_screen.dart';
import 'referrals_screen.dart';

class HomeShell extends StatefulWidget {
  const HomeShell({super.key});

  @override
  State<HomeShell> createState() => _HomeShellState();
}

class _HomeShellState extends State<HomeShell> {
  int _index = 0;

  final _screens = const [
    DashboardScreen(),
    ReferralsScreen(),
    SizedBox.shrink(),
    PatientsScreen(),
    MoreScreen(),
  ];

  @override
  Widget build(BuildContext context) {
    final screenIndex = _index > 2 ? _index - 1 : _index;
    return Scaffold(
      body: IndexedStack(
        index: screenIndex,
        children: [
          _screens[0],
          _screens[1],
          _screens[3],
          _screens[4],
        ],
      ),
      bottomNavigationBar: Container(
        decoration: BoxDecoration(
          color: Colors.white,
          border: Border(top: BorderSide(color: SkinLinkColors.cardBorder.withValues(alpha: 0.8))),
          boxShadow: [
            BoxShadow(
              color: Colors.black.withValues(alpha: 0.04),
              blurRadius: 10,
              offset: const Offset(0, -2),
            ),
          ],
        ),
        child: BottomNavigationBar(
          currentIndex: _index,
          selectedItemColor: SkinLinkColors.primary,
          unselectedItemColor: SkinLinkColors.textMuted,
          onTap: (i) {
            if (i == 2) {
              Navigator.of(context).push(
                MaterialPageRoute(builder: (_) => const NewReferralScreen()),
              );
              return;
            }
            setState(() => _index = i);
          },
          items: const [
            BottomNavigationBarItem(
              icon: Icon(Icons.dashboard_outlined),
              activeIcon: Icon(Icons.dashboard),
              label: 'Dashboard',
            ),
            BottomNavigationBarItem(
              icon: Icon(Icons.assignment_outlined),
              activeIcon: Icon(Icons.assignment),
              label: 'Referrals',
            ),
            BottomNavigationBarItem(
              icon: Icon(Icons.add_circle, size: 30, color: SkinLinkColors.orangeBadge),
              activeIcon: Icon(Icons.add_circle, size: 30, color: SkinLinkColors.orangeBadge),
              label: 'New',
            ),
            BottomNavigationBarItem(
              icon: Icon(Icons.people_outline),
              activeIcon: Icon(Icons.people),
              label: 'Patients',
            ),
            BottomNavigationBarItem(
              icon: Icon(Icons.more_horiz),
              activeIcon: Icon(Icons.more_horiz, color: SkinLinkColors.primary),
              label: 'More',
            ),
          ],
        ),
      ),
    );
  }
}

