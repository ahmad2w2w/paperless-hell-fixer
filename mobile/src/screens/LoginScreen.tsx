import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  TouchableOpacity,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
import { Button, Input, Card } from '../components/ui';
import { spacing, fontSize, borderRadius } from '../lib/theme';

type RootStackParamList = {
  Login: undefined;
  Register: undefined;
  Main: undefined;
};

type LoginScreenProps = {
  navigation: NativeStackNavigationProp<RootStackParamList, 'Login'>;
};

export function LoginScreen({ navigation }: LoginScreenProps) {
  const { login } = useAuth();
  const { theme } = useTheme();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const handleLogin = async () => {
    setError(null);

    if (!email || !password) {
      setError('Vul je e-mail en wachtwoord in.');
      return;
    }

    setLoading(true);
    try {
      await login(email, password);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Inloggen mislukt.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: theme.colors.background }]}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.keyboardView}
      >
        <ScrollView
          contentContainerStyle={styles.scrollContent}
          keyboardShouldPersistTaps="handled"
        >
          <Card style={styles.card}>
            {/* Logo */}
            <View style={styles.logoContainer}>
              <View style={styles.logoGradient}>
                <Text style={styles.logoText}>P</Text>
              </View>
            </View>

            <Text style={[styles.title, { color: theme.colors.foreground }]}>
              Welkom terug
            </Text>
            <Text style={[styles.subtitle, { color: theme.colors.foregroundMuted }]}>
              Log in om je documenten en acties te beheren.
            </Text>

            {error && (
              <View style={[styles.errorContainer, { backgroundColor: theme.colors.dangerLight }]}>
                <Text style={[styles.errorText, { color: theme.colors.danger }]}>
                  {error}
                </Text>
              </View>
            )}

            <Input
              label="E-mailadres"
              value={email}
              onChangeText={setEmail}
              placeholder="jouw@email.nl"
              keyboardType="email-address"
              autoCapitalize="none"
              autoComplete="email"
            />

            <Input
              label="Wachtwoord"
              value={password}
              onChangeText={setPassword}
              placeholder="••••••••"
              secureTextEntry={true}
              autoComplete="password"
            />

            <Button onPress={handleLogin} loading={loading} fullWidth>
              Inloggen
            </Button>

            <View style={styles.footer}>
              <Text style={[styles.footerText, { color: theme.colors.foregroundMuted }]}>
                Nog geen account?{' '}
              </Text>
              <TouchableOpacity onPress={() => navigation.navigate('Register')}>
                <Text style={[styles.linkText, { color: theme.colors.primary }]}>
                  Registreren
                </Text>
              </TouchableOpacity>
            </View>
          </Card>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  keyboardView: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
    justifyContent: 'center',
    padding: spacing.lg,
  },
  card: {
    padding: spacing.xl,
  },
  logoContainer: {
    alignItems: 'center',
    marginBottom: spacing.lg,
  },
  logoGradient: {
    width: 64,
    height: 64,
    borderRadius: borderRadius.lg,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#6366f1',
  },
  logoText: {
    fontSize: fontSize.xxl,
    fontWeight: '700',
    color: '#ffffff',
  },
  title: {
    fontSize: fontSize.xxl,
    fontWeight: '700',
    textAlign: 'center',
    marginBottom: spacing.xs,
  },
  subtitle: {
    fontSize: fontSize.sm,
    textAlign: 'center',
    marginBottom: spacing.xl,
  },
  errorContainer: {
    padding: spacing.sm + 4,
    borderRadius: borderRadius.md,
    marginBottom: spacing.md,
  },
  errorText: {
    fontSize: fontSize.sm,
  },
  footer: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginTop: spacing.lg,
  },
  footerText: {
    fontSize: fontSize.sm,
  },
  linkText: {
    fontSize: fontSize.sm,
    fontWeight: '500',
  },
});
