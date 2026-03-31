#!/bin/bash

echo "🔍 Verifying Our Nikkah Mobile App Setup..."
echo ""

# Check if all required files exist
echo "📁 Checking files..."
FILES=(
  "src/lib/api.ts"
  "src/lib/types.ts"
  "src/lib/fetchWithAuth.ts"
  "src/lib/validation.ts"
  "src/lib/useNotes.ts"
  "src/lib/useAuth.ts"
  "src/app/index.tsx"
  "src/app/notes/index.tsx"
  "src/app/notes/new.tsx"
  "src/app/notes/[id].tsx"
  "src/components/ui/button.tsx"
  "src/components/ui/card.tsx"
  "package.json"
  ".env.local"
)

MISSING=0
for file in "${FILES[@]}"; do
  if [ -f "$file" ]; then
    echo "  ✅ $file"
  else
    echo "  ❌ MISSING: $file"
    MISSING=$((MISSING+1))
  fi
done

echo ""
echo "📦 Checking dependencies..."

# Check if required packages are installed
if npm list @react-native-async-storage/async-storage > /dev/null 2>&1; then
  echo "  ✅ @react-native-async-storage/async-storage"
else
  echo "  ❌ Missing @react-native-async-storage/async-storage"
  MISSING=$((MISSING+1))
fi

if npm list expo-router > /dev/null 2>&1; then
  echo "  ✅ expo-router"
else
  echo "  ❌ Missing expo-router"
  MISSING=$((MISSING+1))
fi

if npm list react-native > /dev/null 2>&1; then
  echo "  ✅ react-native"
else
  echo "  ❌ Missing react-native"
  MISSING=$((MISSING+1))
fi

echo ""

if [ $MISSING -eq 0 ]; then
  echo "✨ All checks passed!"
  echo ""
  echo "🚀 Ready to start the app!"
  echo ""
  echo "Next: Run 'npm start' to launch the development server"
  echo ""
  echo "Press 'i' for iOS Simulator"
  echo "Press 'a' for Android Emulator"
  echo "Press 'w' for web browser"
  echo "Scan QR code with Expo Go on your phone"
  exit 0
else
  echo "⚠️  $MISSING issue(s) found. Please fix them before running."
  exit 1
fi
