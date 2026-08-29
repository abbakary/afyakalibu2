import 'package:flutter_test/flutter_test.dart';
import 'package:mobileapp/main.dart';

void main() {
  testWidgets('SkinLinkApp renders smoke test', (WidgetTester tester) async {
    await tester.pumpWidget(const SkinLinkApp());
    await tester.pump();

    // Verify SkinLink header exists
    expect(find.text('SkinLink'), findsWidgets);
  });
}

