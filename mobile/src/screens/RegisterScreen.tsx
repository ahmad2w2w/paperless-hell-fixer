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

type RegisterScreenProps = {
  navigation: NativeStackNavigationProp<RootStackParamList, 'Register'>;
};

export function RegisterScreen({ navigation }: RegisterScreenProps) {
  const { register } = useAuth();
  const { theme } = useTheme();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const handleRegister = async () => {
    setError(null);

    if (!email || !password || !confirm) {
      setError('Vul alle velden in.');
      return;
    }

    if (password !== confirm) {
      setError('Wachtwoorden komen niet overeen.');
      return;
    }

    if (password.length < 6) {
      setError('Wachtwoord moet minimaal 6 tekens zijn.');
      return;
    }

    setLoading(true);
    try {
      await register(email, password);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Registratie mislukt.');
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
              Account maken
            </Text>
            <Text style={[styles.subtitle, { color: theme.colors.foregroundMuted }]}>
              Maak een gratis account en begin direct.
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
              placeholder="Minimaal 6 tekens"
              secureTextEntry={true}
              autoComplete="new-password"
            />

            <Input
              label="Wachtwoord bevestigen"
              value={confirm}
              onChangeText={setConfirm}
              placeholder="Herhaal je wachtwoord"
              secureTextEntry={true}
              autoComplete="new-password"
            />

            <Button onPress={handleRegister} loading={loading} fullWidth>
              Account maken
            </Button>

            <View style={styles.footer}>
              <Text style={[styles.footerText, { color: theme.colors.foregroundMuted }]}>
                Al een account?{' '}
              </Text>
              <TouchableOpacity onPress={() => navigation.navigate('Login')}>
                <Text style={[styles.linkText, { color: theme.colors.primary }]}>
                  Inloggen
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
