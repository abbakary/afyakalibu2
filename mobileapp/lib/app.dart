import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import 'providers/app_state.dart';
import 'screens/home_shell.dart';
import 'screens/login_screen.dart';
import 'theme/skinlink_theme.dart';

class SkinLinkApp extends StatelessWidget {
  const SkinLinkApp({super.key});

  @override
  Widget build(BuildContext context) {
    return ChangeNotifierProvider(
      create: (_) => AppState()..init(),
      child: MaterialApp(
        title: 'SkinLink',
        debugShowCheckedModeBanner: false,
        theme: buildSkinLinkTheme(),
        home: const _RootGate(),
      ),
    );
  }
}

class _RootGate extends StatelessWidget {
  const _RootGate();

  @override
  Widget build(BuildContext context) {
    return Consumer<AppState>(
      builder: (_, state, child) {
        if (state.user == null) return const LoginScreen();
        return const HomeShell();
      },
    );
  }
}

