# Paperless Hell Fixer - Mobile App

React Native (Expo) mobile app voor het Paperless Hell Fixer platform.

## Features

- 📱 Native iOS en Android app
- 🔐 Veilige authenticatie met secure storage
- 📄 Document upload via camera of foto bibliotheek
- ✅ Actiepunten beheren met deadlines
- 🌙 Automatische dark mode ondersteuning

## Setup

### Vereisten

- Node.js 18+
- Expo CLI (`npm install -g expo-cli`)
- iOS Simulator (Mac) of Android Emulator

### Installatie

```bash
cd mobile
npm install
```

### Development

```bash
# Start Expo development server
npm start

# Start op Android emulator
npm run android

# Start op iOS simulator (alleen Mac)
npm run ios

# Start in browser
npm run web
```

### Backend configuratie

De app verbindt met de Next.js backend API. Pas de `API_BASE_URL` aan in `src/lib/api.ts`:

```typescript
// Voor Android emulator
export const API_BASE_URL = 'http://10.0.2.2:3000';

// Voor iOS simulator
export const API_BASE_URL = 'http://localhost:3000';

// Voor fysiek apparaat (gebruik je computer's IP)
export const API_BASE_URL = 'http://192.168.1.xxx:3000';
```

Zorg dat de Next.js backend draait op poort 3000:
```bash
cd ..  # Terug naar project root
npm run dev
```

## Project structuur

```
mobile/
├── App.tsx                 # Entry point
├── src/
│   ├── components/         # Herbruikbare UI componenten
│   │   └── ui/
│   │       ├── Badge.tsx
│   │       ├── Button.tsx
│   │       ├── Card.tsx
│   │       └── Input.tsx
│   ├── context/            # React Context providers
│   │   ├── AuthContext.tsx
│   │   └── ThemeContext.tsx
│   ├── lib/                # Utilities en API client
│   │   ├── api.ts
│   │   ├── date.ts
│   │   └── theme.ts
│   ├── navigation/         # React Navigation setup
│   │   └── AppNavigator.tsx
│   └── screens/            # App schermen
│       ├── DashboardScreen.tsx
│       ├── DocumentDetailScreen.tsx
│       ├── LoginScreen.tsx
│       └── RegisterScreen.tsx
```

## Build voor productie

### Android APK

```bash
npx expo build:android -t apk
```

### iOS

```bash
npx expo build:ios
```

## Technologieën

- **Expo** - React Native development platform
- **React Navigation** - Navigatie
- **Expo Secure Store** - Veilige token opslag
- **Expo Image Picker** - Camera en foto selectie
- **Expo Document Picker** - PDF selectie



