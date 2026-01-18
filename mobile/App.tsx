import React, { useState, useEffect, useCallback, useRef } from 'react';
import { StatusBar } from 'expo-status-bar';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  ActivityIndicator,
  Alert,
  RefreshControl,
  Animated,
  Dimensions,
  Modal,
  I18nManager,
} from 'react-native';
import { SafeAreaView, SafeAreaProvider } from 'react-native-safe-area-context';
import * as ImagePicker from 'expo-image-picker';
import * as SecureStore from 'expo-secure-store';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { LanguageProvider, useLanguage } from './src/context/LanguageContext';
import type { Language } from './src/lib/translations';

// API Configuration
const API_BASE_URL = 'http://192.168.1.187:3000';

// Theme
const theme = {
  colors: {
    primary: '#6366f1',
    primaryDark: '#4f46e5',
    primaryLight: '#818cf8',
    success: '#10b981',
    successLight: '#d1fae5',
    warning: '#f59e0b',
    warningLight: '#fef3c7',
    danger: '#ef4444',
    dangerLight: '#fee2e2',
    background: '#fafafa',
    backgroundDark: '#f3f4f6',
    card: '#ffffff',
    border: '#e5e7eb',
    borderHover: '#d1d5db',
    text: '#111827',
    textMuted: '#6b7280',
    textSubtle: '#9ca3af',
  },
  spacing: {
    xs: 4,
    sm: 8,
    md: 16,
    lg: 24,
    xl: 32,
  },
  borderRadius: {
    sm: 8,
    md: 12,
    lg: 16,
    xl: 24,
    full: 9999,
  },
};

// Types
type Screen = 'login' | 'register' | 'dashboard' | 'document' | 'language';
type DocumentType = 'BELASTING' | 'BOETE' | 'VERZEKERING' | 'ABONNEMENT' | 'OVERIG' | null;
type ActionStatus = 'OPEN' | 'DONE';

type ActionItem = {
  id: string;
  title: string;
  description: string;
  deadline: string | null;
  status: ActionStatus;
};

type Document = {
  id: string;
  originalFilename: string;
  type: DocumentType;
  sender: string | null;
  amount: string | null;
  summary: string | null;
  deadline: string | null;
  createdAt: string;
  job: { status: string; error?: string } | null;
  actionItems: ActionItem[];
};

// Utilities
const getUrgency = (deadline: string | null): 'urgent' | 'soon' | 'normal' | 'none' => {
  if (!deadline) return 'none';
  const d = new Date(deadline);
  const now = new Date();
  const diff = d.getTime() - now.getTime();
  const days = diff / (1000 * 60 * 60 * 24);
  if (days < 0) return 'urgent';
  if (days <= 3) return 'urgent';
  if (days <= 7) return 'soon';
  return 'normal';
};

// Main App with Language Provider
export default function App() {
  return (
    <LanguageProvider>
      <AppContent />
    </LanguageProvider>
  );
}

// App Content (uses language context)
function AppContent() {
  const { t, isRTL, typeLabels, formatDate, formatFullDate, language, setLanguage } = useLanguage();
  
  const [screen, setScreen] = useState<Screen>('login');
  const [selectedDocument, setSelectedDocument] = useState<Document | null>(null);
  const [showLanguageModal, setShowLanguageModal] = useState(false);
  
  // Auth state
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [initialLoading, setInitialLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  // Data state
  const [documents, setDocuments] = useState<Document[]>([]);
  const [refreshing, setRefreshing] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [statusFilter, setStatusFilter] = useState<'all' | 'open' | 'done'>('open');
  const [searchQuery, setSearchQuery] = useState('');
  
  // Auth token
  const authToken = useRef<string | null>(null);
  
  // Animations
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(50)).current;

  // Dynamic styles based on RTL
  const rtlStyle = isRTL ? { flexDirection: 'row-reverse' as const } : {};
  const rtlTextAlign = isRTL ? { textAlign: 'right' as const } : {};
  const rtlWritingDirection = isRTL ? { writingDirection: 'rtl' as const } : {};

  // Load session on startup
  useEffect(() => {
    const loadSession = async () => {
      try {
        const saved = await SecureStore.getItemAsync('auth_token');
        if (saved) {
          authToken.current = saved;
          const res = await fetch(`${API_BASE_URL}/api/documents?status=open`, {
            headers: { Authorization: `Bearer ${saved}` },
          });
          if (res.ok) {
            setScreen('dashboard');
          } else {
            authToken.current = null;
            await SecureStore.deleteItemAsync('auth_token');
          }
        }
      } catch (e) {
        console.log('Could not load session:', e);
      } finally {
        setInitialLoading(false);
      }
    };
    loadSession();
  }, []);

  // Animate on screen change
  useEffect(() => {
    fadeAnim.setValue(0);
    slideAnim.setValue(30);
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 400,
        useNativeDriver: true,
      }),
      Animated.timing(slideAnim, {
        toValue: 0,
        duration: 400,
        useNativeDriver: true,
      }),
    ]).start();
  }, [screen]);

  // Fetch documents
  const fetchDocuments = useCallback(async () => {
    if (!authToken.current) return;
    try {
      const params = new URLSearchParams({ status: statusFilter });
      if (searchQuery) params.set('q', searchQuery);
      
      const res = await fetch(`${API_BASE_URL}/api/documents?${params}`, {
        headers: { Authorization: `Bearer ${authToken.current}` },
      });
      if (res.ok) {
        const data = await res.json();
        setDocuments(data.documents || []);
      }
    } catch (e) {
      console.log('Could not fetch documents:', e);
    }
  }, [statusFilter, searchQuery]);

  // Auto-refresh
  useEffect(() => {
    if (screen === 'dashboard') {
      fetchDocuments();
      const interval = setInterval(fetchDocuments, 5000);
      return () => clearInterval(interval);
    }
  }, [screen, fetchDocuments]);

  const onRefresh = async () => {
    setRefreshing(true);
    await fetchDocuments();
    setRefreshing(false);
  };

  // Auth handlers
  const handleLogin = async () => {
    if (!email || !password) {
      setError(t('fillEmailAndPassword'));
      return;
    }
    setLoading(true);
    setError(null);
    
    try {
      const res = await fetch(`${API_BASE_URL}/api/mobile/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: email.trim().toLowerCase(), password }),
      });
      
      const data = await res.json();
      
      if (res.ok && data.token) {
        authToken.current = data.token;
        await SecureStore.setItemAsync('auth_token', data.token);
        setScreen('dashboard');
        fetchDocuments();
      } else {
        setError(data.error || t('emailOrPasswordIncorrect'));
      }
    } catch (e) {
      setError(t('cannotConnectToServer'));
    } finally {
      setLoading(false);
    }
  };

  const handleRegister = async () => {
    if (!email || !password || !confirmPassword) {
      setError(t('fillAllFields'));
      return;
    }
    if (password !== confirmPassword) {
      setError(t('passwordsDontMatch'));
      return;
    }
    if (password.length < 6) {
      setError(t('passwordMinLength'));
      return;
    }
    
    setLoading(true);
    setError(null);
    
    try {
      const res = await fetch(`${API_BASE_URL}/api/auth/register`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: email.trim().toLowerCase(), password }),
      });
      
      if (res.ok) {
        Alert.alert(t('success'), t('accountCreated'), [
          { text: 'OK', onPress: () => setScreen('login') }
        ]);
        setConfirmPassword('');
      } else {
        const data = await res.json();
        setError(data.error || t('registrationFailed'));
      }
    } catch (e) {
      setError(t('cannotConnectToServer'));
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = async () => {
    Alert.alert(t('logout'), t('confirmLogout'), [
      { text: t('cancel'), style: 'cancel' },
      {
        text: t('logout'),
        style: 'destructive',
        onPress: async () => {
          authToken.current = null;
          await SecureStore.deleteItemAsync('auth_token');
          setDocuments([]);
          setScreen('login');
          setEmail('');
          setPassword('');
        },
      },
    ]);
  };

  // Upload handlers
  const handleUpload = () => {
    Alert.alert(
      t('uploadDocument'),
      t('chooseUploadMethod'),
      [
        { text: t('camera'), onPress: handleCameraUpload },
        { text: t('photoLibrary'), onPress: handleImagePickerUpload },
        { text: t('cancel'), style: 'cancel' },
      ]
    );
  };

  const handleCameraUpload = async () => {
    const permission = await ImagePicker.requestCameraPermissionsAsync();
    if (!permission.granted) {
      Alert.alert(t('noAccess'), t('cameraAccessRequired'));
      return;
    }
    const result = await ImagePicker.launchCameraAsync({
      mediaTypes: ['images'],
      quality: 0.8,
    });
    if (!result.canceled && result.assets[0]) {
      await uploadFile(result.assets[0].uri, 'camera-photo.jpg', 'image/jpeg');
    }
  };

  const handleImagePickerUpload = async () => {
    const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!permission.granted) {
      Alert.alert(t('noAccess'), t('photoLibraryAccessRequired'));
      return;
    }
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images'],
      quality: 0.8,
    });
    if (!result.canceled && result.assets[0]) {
      const asset = result.assets[0];
      await uploadFile(asset.uri, asset.fileName || 'image.jpg', asset.mimeType || 'image/jpeg');
    }
  };

  const uploadFile = async (uri: string, filename: string, mimeType: string) => {
    if (!authToken.current) {
      Alert.alert(t('error'), t('notLoggedIn'));
      setScreen('login');
      return;
    }
    
    setUploading(true);
    try {
      const formData = new FormData();
      formData.append('file', {
        uri,
        name: filename,
        type: mimeType,
      } as unknown as Blob);

      const res = await fetch(`${API_BASE_URL}/api/upload`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${authToken.current}` },
        body: formData,
      });

      if (res.ok) {
        Alert.alert(t('success'), t('documentUploaded'));
        fetchDocuments();
      } else {
        const data = await res.json();
        if (res.status === 401) {
          Alert.alert(t('sessionExpired'), t('loginAgain'));
          handleLogout();
        } else {
          Alert.alert(t('error'), data.error || t('uploadFailed'));
        }
      }
    } catch (e) {
      Alert.alert(t('error'), t('cannotUpload'));
    } finally {
      setUploading(false);
    }
  };

  // Action handlers
  const toggleActionStatus = async (documentId: string, actionId: string, currentStatus: ActionStatus) => {
    if (!authToken.current) return;
    
    try {
      const newStatus = currentStatus === 'OPEN' ? 'DONE' : 'OPEN';
      const res = await fetch(`${API_BASE_URL}/api/documents/${documentId}/actions/${actionId}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${authToken.current}`,
        },
        body: JSON.stringify({ status: newStatus }),
      });
      
      if (res.ok) {
        fetchDocuments();
        if (selectedDocument) {
          const updatedDoc = documents.find(d => d.id === documentId);
          if (updatedDoc) setSelectedDocument(updatedDoc);
        }
      }
    } catch (e) {
      console.log('Could not update action:', e);
    }
  };

  // Handle language change
  const handleLanguageChange = async (lang: Language) => {
    await setLanguage(lang);
    setShowLanguageModal(false);
    
    // Force re-render by re-applying RTL
    if ((lang === 'ar') !== I18nManager.isRTL) {
      Alert.alert(
        lang === 'ar' ? 'تم تغيير اللغة' : 'Taal gewijzigd',
        lang === 'ar' ? 'يرجى إعادة تشغيل التطبيق لتطبيق التغييرات' : 'Herstart de app om de wijzigingen toe te passen',
        [{ text: 'OK' }]
      );
    }
  };

  // Calculate stats
  const stats = {
    totalDocs: documents.length,
    openActions: documents.flatMap(d => d.actionItems).filter(a => a.status === 'OPEN').length,
    urgentActions: documents.flatMap(d => d.actionItems).filter(a => 
      a.status === 'OPEN' && getUrgency(a.deadline) === 'urgent'
    ).length,
    processingDocs: documents.filter(d => 
      d.job?.status === 'PENDING' || d.job?.status === 'PROCESSING'
    ).length,
  };

  // Language Selection Modal
  const LanguageModal = () => (
    <Modal
      visible={showLanguageModal}
      animationType="slide"
      transparent={true}
      onRequestClose={() => setShowLanguageModal(false)}
    >
      <View style={styles.modalOverlay}>
        <View style={styles.modalContent}>
          <Text style={[styles.modalTitle, rtlTextAlign]}>{t('selectLanguage')}</Text>
          
          <TouchableOpacity
            style={[
              styles.languageOption,
              language === 'nl' && styles.languageOptionActive,
            ]}
            onPress={() => handleLanguageChange('nl')}
          >
            <Text style={styles.languageFlag}>🇳🇱</Text>
            <Text style={[
              styles.languageText,
              language === 'nl' && styles.languageTextActive,
            ]}>
              Nederlands
            </Text>
            {language === 'nl' && (
              <Ionicons name="checkmark-circle" size={24} color={theme.colors.primary} />
            )}
          </TouchableOpacity>
          
          <TouchableOpacity
            style={[
              styles.languageOption,
              language === 'ar' && styles.languageOptionActive,
            ]}
            onPress={() => handleLanguageChange('ar')}
          >
            <Text style={styles.languageFlag}>🇸🇦</Text>
            <Text style={[
              styles.languageText,
              language === 'ar' && styles.languageTextActive,
            ]}>
              العربية
            </Text>
            {language === 'ar' && (
              <Ionicons name="checkmark-circle" size={24} color={theme.colors.primary} />
            )}
          </TouchableOpacity>
          
          <TouchableOpacity
            style={styles.modalCloseButton}
            onPress={() => setShowLanguageModal(false)}
          >
            <Text style={styles.modalCloseText}>{t('cancel')}</Text>
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );

  // Loading screen
  if (initialLoading) {
    return (
      <SafeAreaProvider>
        <View style={styles.loadingScreen}>
          <LinearGradient
            colors={[theme.colors.primary, theme.colors.primaryDark]}
            style={styles.loadingGradient}
          >
            <View style={styles.logoLarge}>
              <Text style={styles.logoTextLarge}>P</Text>
            </View>
            <Text style={styles.loadingTitle}>{t('appName')}</Text>
            <ActivityIndicator size="large" color="#fff" style={{ marginTop: 24 }} />
          </LinearGradient>
        </View>
      </SafeAreaProvider>
    );
  }

  // Login Screen
  if (screen === 'login' || screen === 'register') {
    return (
      <SafeAreaProvider>
        <View style={styles.authContainer}>
          <StatusBar style="light" />
          <LanguageModal />
          
          <LinearGradient
            colors={[theme.colors.primary, theme.colors.primaryDark]}
            style={styles.authGradient}
          >
            <View style={styles.authHeader}>
              <TouchableOpacity
                style={styles.languageButton}
                onPress={() => setShowLanguageModal(true)}
              >
                <Ionicons name="globe-outline" size={24} color="#fff" />
                <Text style={styles.languageButtonText}>
                  {language === 'nl' ? 'NL' : 'AR'}
                </Text>
              </TouchableOpacity>
              
              <View style={styles.logoMedium}>
                <Text style={styles.logoTextMedium}>P</Text>
              </View>
              <Text style={styles.authBrand}>{t('appName')}</Text>
            </View>
          </LinearGradient>
          
          <KeyboardAvoidingView
            behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
            style={styles.authFormContainer}
          >
            <Animated.View
              style={[
                styles.authCard,
                { opacity: fadeAnim, transform: [{ translateY: slideAnim }] }
              ]}
            >
              <ScrollView
                contentContainerStyle={styles.authScrollContent}
                keyboardShouldPersistTaps="handled"
                showsVerticalScrollIndicator={false}
              >
                <Text style={[styles.authTitle, rtlTextAlign]}>
                  {screen === 'login' ? t('welcomeBack') : t('createAccount')}
                </Text>
                <Text style={[styles.authSubtitle, rtlTextAlign]}>
                  {screen === 'login'
                    ? t('loginToManage')
                    : t('createFreeAccount')}
                </Text>

                {error && (
                  <View style={[styles.errorBox, rtlStyle]}>
                    <Ionicons name="alert-circle" size={18} color={theme.colors.danger} />
                    <Text style={[styles.errorText, rtlTextAlign]}>{error}</Text>
                  </View>
                )}

                <View style={styles.inputGroup}>
                  <Text style={[styles.inputLabel, rtlTextAlign]}>{t('email')}</Text>
                  <View style={[styles.inputWrapper, rtlStyle]}>
                    <Ionicons name="mail-outline" size={20} color={theme.colors.textSubtle} style={styles.inputIcon} />
                    <TextInput
                      style={[styles.input, rtlTextAlign, rtlWritingDirection]}
                      value={email}
                      onChangeText={setEmail}
                      placeholder={t('emailPlaceholder')}
                      placeholderTextColor={theme.colors.textSubtle}
                      keyboardType="email-address"
                      autoCapitalize="none"
                      autoCorrect={false}
                    />
                  </View>
                </View>

                <View style={styles.inputGroup}>
                  <Text style={[styles.inputLabel, rtlTextAlign]}>{t('password')}</Text>
                  <View style={[styles.inputWrapper, rtlStyle]}>
                    <Ionicons name="lock-closed-outline" size={20} color={theme.colors.textSubtle} style={styles.inputIcon} />
                    <TextInput
                      style={[styles.input, rtlTextAlign, rtlWritingDirection]}
                      value={password}
                      onChangeText={setPassword}
                      placeholder={t('passwordPlaceholder')}
                      placeholderTextColor={theme.colors.textSubtle}
                      secureTextEntry={true}
                    />
                  </View>
                </View>

                {screen === 'register' && (
                  <View style={styles.inputGroup}>
                    <Text style={[styles.inputLabel, rtlTextAlign]}>{t('confirmPassword')}</Text>
                    <View style={[styles.inputWrapper, rtlStyle]}>
                      <Ionicons name="lock-closed-outline" size={20} color={theme.colors.textSubtle} style={styles.inputIcon} />
                      <TextInput
                        style={[styles.input, rtlTextAlign, rtlWritingDirection]}
                        value={confirmPassword}
                        onChangeText={setConfirmPassword}
                        placeholder={t('passwordPlaceholder')}
                        placeholderTextColor={theme.colors.textSubtle}
                        secureTextEntry={true}
                      />
                    </View>
                  </View>
                )}

                <TouchableOpacity
                  style={[styles.primaryButton, loading && styles.buttonDisabled]}
                  onPress={screen === 'login' ? handleLogin : handleRegister}
                  disabled={loading}
                  activeOpacity={0.8}
                >
                  {loading ? (
                    <ActivityIndicator color="#fff" />
                  ) : (
                    <View style={[styles.buttonContent, rtlStyle]}>
                      <Text style={styles.primaryButtonText}>
                        {screen === 'login' ? t('login') : t('createAccount')}
                      </Text>
                      <Ionicons name={isRTL ? "arrow-back" : "arrow-forward"} size={20} color="#fff" />
                    </View>
                  )}
                </TouchableOpacity>

                <View style={[styles.authFooter, rtlStyle]}>
                  <Text style={styles.authFooterText}>
                    {screen === 'login' ? t('noAccountYet') : t('alreadyHaveAccount')}
                  </Text>
                  <TouchableOpacity
                    onPress={() => {
                      setScreen(screen === 'login' ? 'register' : 'login');
                      setError(null);
                    }}
                  >
                    <Text style={styles.authFooterLink}>
                      {screen === 'login' ? t('register') : t('login')}
                    </Text>
                  </TouchableOpacity>
                </View>
              </ScrollView>
            </Animated.View>
          </KeyboardAvoidingView>
        </View>
      </SafeAreaProvider>
    );
  }

  // Document Detail Screen
  if (screen === 'document' && selectedDocument) {
    const doc = selectedDocument;
    const typeInfo = doc.type ? typeLabels[doc.type] : null;
    const isProcessing = doc.job?.status === 'PENDING' || doc.job?.status === 'PROCESSING';
    const isFailed = doc.job?.status === 'FAILED';

    return (
      <SafeAreaProvider>
        <SafeAreaView style={styles.container}>
          <StatusBar style="dark" />
          <LanguageModal />
          
          {/* Header */}
          <View style={[styles.detailHeader, rtlStyle]}>
            <TouchableOpacity
              onPress={() => {
                setSelectedDocument(null);
                setScreen('dashboard');
              }}
              style={styles.backButton}
            >
              <Ionicons name={isRTL ? "arrow-forward" : "arrow-back"} size={24} color={theme.colors.text} />
            </TouchableOpacity>
            <View style={[styles.detailHeaderTitle, isRTL && { alignItems: 'flex-end' }]}>
              <Text style={[styles.detailHeaderText, rtlTextAlign]} numberOfLines={1}>
                {doc.originalFilename}
              </Text>
              {typeInfo && (
                <View style={[styles.typeBadge, { backgroundColor: typeInfo.color + '20' }, rtlStyle]}>
                  <Text style={styles.typeBadgeEmoji}>{typeInfo.emoji}</Text>
                  <Text style={[styles.typeBadgeText, { color: typeInfo.color }]}>
                    {typeInfo.label}
                  </Text>
                </View>
              )}
            </View>
          </View>

          <ScrollView
            style={styles.detailScroll}
            contentContainerStyle={styles.detailContent}
            showsVerticalScrollIndicator={false}
          >
            {/* Status Card */}
            <View style={styles.detailCard}>
              <View style={[styles.detailCardHeader, rtlStyle]}>
                <Text style={[styles.detailCardTitle, rtlTextAlign]}>{t('status')}</Text>
                {isProcessing && (
                  <View style={[styles.statusBadge, styles.statusProcessing, rtlStyle]}>
                    <ActivityIndicator size="small" color={theme.colors.warning} />
                    <Text style={styles.statusProcessingText}>{t('processingDocument')}</Text>
                  </View>
                )}
                {isFailed && (
                  <View style={[styles.statusBadge, styles.statusFailed, rtlStyle]}>
                    <Ionicons name="close-circle" size={16} color={theme.colors.danger} />
                    <Text style={styles.statusFailedText}>{t('failed')}</Text>
                  </View>
                )}
                {!isProcessing && !isFailed && (
                  <View style={[styles.statusBadge, styles.statusSuccess, rtlStyle]}>
                    <Ionicons name="checkmark-circle" size={16} color={theme.colors.success} />
                    <Text style={styles.statusSuccessText}>{t('ready')}</Text>
                  </View>
                )}
              </View>
              
              {isProcessing && (
                <View style={styles.progressBar}>
                  <View style={styles.progressFill} />
                </View>
              )}
            </View>

            {/* Info Card */}
            <View style={styles.detailCard}>
              <Text style={[styles.detailCardTitle, rtlTextAlign]}>{t('information')}</Text>
              
              {doc.sender && (
                <View style={[styles.infoRow, rtlStyle]}>
                  <Ionicons name="business-outline" size={20} color={theme.colors.textMuted} />
                  <View style={[styles.infoContent, isRTL && { alignItems: 'flex-end' }]}>
                    <Text style={[styles.infoLabel, rtlTextAlign]}>{t('sender')}</Text>
                    <Text style={[styles.infoValue, rtlTextAlign]}>{doc.sender}</Text>
                  </View>
                </View>
              )}
              
              {doc.deadline && (
                <View style={[styles.infoRow, rtlStyle]}>
                  <Ionicons name="calendar-outline" size={20} color={theme.colors.textMuted} />
                  <View style={[styles.infoContent, isRTL && { alignItems: 'flex-end' }]}>
                    <Text style={[styles.infoLabel, rtlTextAlign]}>{t('deadline')}</Text>
                    <Text style={[styles.infoValue, rtlTextAlign]}>{formatFullDate(doc.deadline)}</Text>
                  </View>
                </View>
              )}
              
              {doc.amount && (
                <View style={[styles.infoRow, rtlStyle]}>
                  <Ionicons name="cash-outline" size={20} color={theme.colors.textMuted} />
                  <View style={[styles.infoContent, isRTL && { alignItems: 'flex-end' }]}>
                    <Text style={[styles.infoLabel, rtlTextAlign]}>{t('amount')}</Text>
                    <Text style={[styles.infoValue, rtlTextAlign]}>€{parseFloat(doc.amount).toFixed(2)}</Text>
                  </View>
                </View>
              )}
              
              <View style={[styles.infoRow, rtlStyle]}>
                <Ionicons name="time-outline" size={20} color={theme.colors.textMuted} />
                <View style={[styles.infoContent, isRTL && { alignItems: 'flex-end' }]}>
                  <Text style={[styles.infoLabel, rtlTextAlign]}>{t('uploaded')}</Text>
                  <Text style={[styles.infoValue, rtlTextAlign]}>{formatFullDate(doc.createdAt)}</Text>
                </View>
              </View>
            </View>

            {/* Summary Card */}
            {doc.summary && (
              <View style={styles.detailCard}>
                <View style={[styles.detailCardHeader, rtlStyle]}>
                  <Text style={[styles.detailCardTitle, rtlTextAlign]}>{t('summary')}</Text>
                  <Ionicons name="sparkles" size={20} color={theme.colors.primary} />
                </View>
                <Text style={[styles.summaryText, rtlTextAlign, rtlWritingDirection]}>{doc.summary}</Text>
              </View>
            )}

            {/* Actions Card */}
            <View style={styles.detailCard}>
              <View style={[styles.detailCardHeader, rtlStyle]}>
                <Text style={[styles.detailCardTitle, rtlTextAlign]}>{t('actionItems')}</Text>
                <View style={styles.actionCountBadge}>
                  <Text style={styles.actionCountText}>
                    {doc.actionItems.filter(a => a.status === 'OPEN').length} {t('open').toLowerCase()}
                  </Text>
                </View>
              </View>
              
              {doc.actionItems.length === 0 ? (
                <View style={styles.emptyActions}>
                  <Ionicons name="checkmark-done-circle-outline" size={48} color={theme.colors.textSubtle} />
                  <Text style={[styles.emptyActionsTitle, rtlTextAlign]}>{t('noActionItems')}</Text>
                  <Text style={[styles.emptyActionsText, rtlTextAlign]}>{t('noOpenActions')}</Text>
                </View>
              ) : (
                doc.actionItems.map((action) => {
                  const urgency = getUrgency(action.deadline);
                  const isDone = action.status === 'DONE';
                  
                  return (
                    <TouchableOpacity
                      key={action.id}
                      style={[
                        styles.actionCard,
                        urgency === 'urgent' && !isDone && styles.actionUrgent,
                        urgency === 'soon' && !isDone && styles.actionSoon,
                        isDone && styles.actionDone,
                        rtlStyle,
                      ]}
                      onPress={() => toggleActionStatus(doc.id, action.id, action.status)}
                      activeOpacity={0.7}
                    >
                      <View style={[
                        styles.actionCheckbox,
                        isDone && styles.actionCheckboxDone,
                      ]}>
                        {isDone && (
                          <Ionicons name="checkmark" size={14} color="#fff" />
                        )}
                      </View>
                      <View style={[styles.actionContent, isRTL && { alignItems: 'flex-end' }]}>
                        <Text style={[
                          styles.actionTitle,
                          isDone && styles.actionTitleDone,
                          rtlTextAlign,
                        ]}>
                          {action.title}
                        </Text>
                        <Text style={[styles.actionDescription, rtlTextAlign]} numberOfLines={2}>
                          {action.description}
                        </Text>
                        {action.deadline && (
                          <View style={[styles.actionDeadlineRow, rtlStyle]}>
                            <Ionicons 
                              name="calendar-outline" 
                              size={14} 
                              color={
                                urgency === 'urgent' ? theme.colors.danger :
                                urgency === 'soon' ? theme.colors.warning :
                                theme.colors.textSubtle
                              }
                            />
                            <Text style={[
                              styles.actionDeadline,
                              urgency === 'urgent' && styles.actionDeadlineUrgent,
                              urgency === 'soon' && styles.actionDeadlineSoon,
                            ]}>
                              {formatDate(action.deadline)}
                            </Text>
                          </View>
                        )}
                      </View>
                    </TouchableOpacity>
                  );
                })
              )}
            </View>
          </ScrollView>
        </SafeAreaView>
      </SafeAreaProvider>
    );
  }

  // Dashboard Screen
  return (
    <SafeAreaProvider>
      <SafeAreaView style={styles.container}>
        <StatusBar style="dark" />
        <LanguageModal />
        
        {/* Header */}
        <View style={[styles.dashboardHeader, rtlStyle]}>
          <View style={isRTL ? { alignItems: 'flex-end' } : {}}>
            <Text style={[styles.dashboardTitle, rtlTextAlign]}>{t('dashboard')}</Text>
            <Text style={[styles.dashboardSubtitle, rtlTextAlign]}>{t('manageYourDocuments')}</Text>
          </View>
          <View style={[styles.headerButtons, rtlStyle]}>
            <TouchableOpacity 
              onPress={() => setShowLanguageModal(true)} 
              style={styles.headerButton}
            >
              <Ionicons name="globe-outline" size={24} color={theme.colors.textMuted} />
            </TouchableOpacity>
            <TouchableOpacity onPress={handleLogout} style={styles.headerButton}>
              <Ionicons name="log-out-outline" size={24} color={theme.colors.textMuted} />
            </TouchableOpacity>
          </View>
        </View>

        <ScrollView
          style={styles.dashboardScroll}
          contentContainerStyle={styles.dashboardContent}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={onRefresh}
              tintColor={theme.colors.primary}
            />
          }
          showsVerticalScrollIndicator={false}
        >
          {/* Stats Grid */}
          <View style={[styles.statsGrid, isRTL && { flexDirection: 'row-reverse' }]}>
            <View style={[styles.statCard, styles.statPrimary]}>
              <View style={styles.statIconContainer}>
                <Ionicons name="document-text" size={24} color={theme.colors.primary} />
              </View>
              <Text style={styles.statValue}>{stats.totalDocs}</Text>
              <Text style={[styles.statLabel, rtlTextAlign]}>{t('documents')}</Text>
            </View>
            
            <View style={[styles.statCard, styles.statWarning]}>
              <View style={[styles.statIconContainer, { backgroundColor: theme.colors.warningLight }]}>
                <Ionicons name="list" size={24} color={theme.colors.warning} />
              </View>
              <Text style={styles.statValue}>{stats.openActions}</Text>
              <Text style={[styles.statLabel, rtlTextAlign]}>{t('openActions')}</Text>
            </View>
            
            <View style={[styles.statCard, styles.statDanger]}>
              <View style={[styles.statIconContainer, { backgroundColor: theme.colors.dangerLight }]}>
                <Ionicons name="alert-circle" size={24} color={theme.colors.danger} />
              </View>
              <Text style={styles.statValue}>{stats.urgentActions}</Text>
              <Text style={[styles.statLabel, rtlTextAlign]}>{t('urgent')}</Text>
            </View>
            
            <View style={[styles.statCard, styles.statSuccess]}>
              <View style={[styles.statIconContainer, { backgroundColor: theme.colors.successLight }]}>
                <Ionicons name="sync" size={24} color={theme.colors.success} />
              </View>
              <Text style={styles.statValue}>{stats.processingDocs}</Text>
              <Text style={[styles.statLabel, rtlTextAlign]}>{t('processing')}</Text>
            </View>
          </View>

          {/* Upload Card */}
          <TouchableOpacity
            style={styles.uploadCard}
            onPress={handleUpload}
            disabled={uploading}
            activeOpacity={0.8}
          >
            <LinearGradient
              colors={[theme.colors.primary, theme.colors.primaryDark]}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={[styles.uploadGradient, rtlStyle]}
            >
              <View style={styles.uploadIconCircle}>
                {uploading ? (
                  <ActivityIndicator color={theme.colors.primary} />
                ) : (
                  <Ionicons name="cloud-upload" size={28} color={theme.colors.primary} />
                )}
              </View>
              <View style={[styles.uploadTextContainer, isRTL && { alignItems: 'flex-end' }]}>
                <Text style={[styles.uploadTitle, rtlTextAlign]}>
                  {uploading ? t('uploading') : t('uploadDocument')}
                </Text>
                <Text style={[styles.uploadSubtitle, rtlTextAlign]}>
                  {t('takePhotoOrChoose')}
                </Text>
              </View>
              <Ionicons name="add-circle" size={32} color="#fff" />
            </LinearGradient>
          </TouchableOpacity>

          {/* Filter Tabs */}
          <View style={[styles.filterTabs, isRTL && { flexDirection: 'row-reverse' }]}>
            {(['open', 'done', 'all'] as const).map((filter) => (
              <TouchableOpacity
                key={filter}
                style={[
                  styles.filterTab,
                  statusFilter === filter && styles.filterTabActive,
                ]}
                onPress={() => setStatusFilter(filter)}
              >
                <Text style={[
                  styles.filterTabText,
                  statusFilter === filter && styles.filterTabTextActive,
                ]}>
                  {filter === 'open' ? t('open') : filter === 'done' ? t('done') : t('all')}
                </Text>
              </TouchableOpacity>
            ))}
          </View>

          {/* Search */}
          <View style={[styles.searchContainer, rtlStyle]}>
            <Ionicons name="search" size={20} color={theme.colors.textSubtle} />
            <TextInput
              style={[styles.searchInput, rtlTextAlign, rtlWritingDirection]}
              placeholder={t('searchDocuments')}
              placeholderTextColor={theme.colors.textSubtle}
              value={searchQuery}
              onChangeText={setSearchQuery}
            />
            {searchQuery.length > 0 && (
              <TouchableOpacity onPress={() => setSearchQuery('')}>
                <Ionicons name="close-circle" size={20} color={theme.colors.textSubtle} />
              </TouchableOpacity>
            )}
          </View>

          {/* Documents List */}
          <View style={[styles.sectionHeader, rtlStyle]}>
            <Text style={[styles.sectionTitle, rtlTextAlign]}>{t('documents')}</Text>
            <View style={styles.sectionBadge}>
              <Text style={styles.sectionBadgeText}>{documents.length}</Text>
            </View>
          </View>

          {documents.length === 0 ? (
            <View style={styles.emptyState}>
              <Ionicons name="document-outline" size={64} color={theme.colors.textSubtle} />
              <Text style={[styles.emptyStateTitle, rtlTextAlign]}>{t('noDocuments')}</Text>
              <Text style={[styles.emptyStateText, rtlTextAlign]}>
                {t('uploadFirstDocument')}
              </Text>
              <TouchableOpacity
                style={[styles.emptyStateButton, rtlStyle]}
                onPress={handleUpload}
              >
                <Ionicons name="add" size={20} color="#fff" />
                <Text style={styles.emptyStateButtonText}>{t('uploadDocument')}</Text>
              </TouchableOpacity>
            </View>
          ) : (
            documents.map((doc) => {
              const typeInfo = doc.type ? typeLabels[doc.type] : null;
              const isProcessing = doc.job?.status === 'PENDING' || doc.job?.status === 'PROCESSING';
              const isFailed = doc.job?.status === 'FAILED';
              const openActions = doc.actionItems.filter(a => a.status === 'OPEN').length;
              const hasUrgent = doc.actionItems.some(a => 
                a.status === 'OPEN' && getUrgency(a.deadline) === 'urgent'
              );

              return (
                <TouchableOpacity
                  key={doc.id}
                  style={[
                    styles.documentCard,
                    hasUrgent && styles.documentCardUrgent,
                    isFailed && styles.documentCardFailed,
                  ]}
                  onPress={() => {
                    setSelectedDocument(doc);
                    setScreen('document');
                  }}
                  activeOpacity={0.7}
                >
                  <View style={[styles.documentCardHeader, rtlStyle]}>
                    <View style={[styles.documentCardLeft, rtlStyle]}>
                      {typeInfo && (
                        <View style={[styles.documentTypeIcon, { backgroundColor: typeInfo.color + '20' }]}>
                          <Text style={styles.documentTypeEmoji}>{typeInfo.emoji}</Text>
                        </View>
                      )}
                      <View style={[styles.documentCardTitles, isRTL && { alignItems: 'flex-end' }]}>
                        <Text style={[styles.documentCardTitle, rtlTextAlign]} numberOfLines={1}>
                          {doc.originalFilename}
                        </Text>
                        {doc.sender && (
                          <Text style={[styles.documentCardSender, rtlTextAlign]} numberOfLines={1}>
                            {t('from')} {doc.sender}
                          </Text>
                        )}
                      </View>
                    </View>
                    
                    {isProcessing && (
                      <View style={[styles.docStatusBadge, styles.docStatusProcessing]}>
                        <ActivityIndicator size="small" color={theme.colors.warning} />
                      </View>
                    )}
                    {isFailed && (
                      <View style={[styles.docStatusBadge, styles.docStatusFailed]}>
                        <Ionicons name="close" size={14} color={theme.colors.danger} />
                      </View>
                    )}
                    {!isProcessing && !isFailed && (
                      <View style={[styles.docStatusBadge, styles.docStatusSuccess]}>
                        <Ionicons name="checkmark" size={14} color={theme.colors.success} />
                      </View>
                    )}
                  </View>

                  {doc.summary && !isProcessing && (
                    <Text style={[styles.documentCardSummary, rtlTextAlign, rtlWritingDirection]} numberOfLines={2}>
                      {doc.summary}
                    </Text>
                  )}

                  {isProcessing && (
                    <View style={styles.processingIndicator}>
                      <View style={styles.processingBar}>
                        <Animated.View style={styles.processingFill} />
                      </View>
                      <Text style={[styles.processingText, rtlTextAlign]}>{t('aiProcessing')}</Text>
                    </View>
                  )}

                  <View style={[styles.documentCardFooter, rtlStyle]}>
                    <View style={[styles.documentCardMeta, rtlStyle]}>
                      {doc.deadline && (
                        <View style={[styles.metaItem, rtlStyle]}>
                          <Ionicons name="calendar-outline" size={14} color={theme.colors.textSubtle} />
                          <Text style={styles.metaText}>{formatDate(doc.deadline)}</Text>
                        </View>
                      )}
                      {doc.amount && (
                        <View style={styles.metaItem}>
                          <Text style={styles.metaText}>€{parseFloat(doc.amount).toFixed(2)}</Text>
                        </View>
                      )}
                    </View>
                    
                    {openActions > 0 && (
                      <View style={[
                        styles.actionsBadge,
                        hasUrgent && styles.actionsBadgeUrgent,
                      ]}>
                        <Text style={[
                          styles.actionsBadgeText,
                          hasUrgent && styles.actionsBadgeTextUrgent,
                        ]}>
                          {openActions} {openActions === 1 ? t('action') : t('actionPlural')}
                        </Text>
                      </View>
                    )}
                  </View>
                </TouchableOpacity>
              );
            })
          )}
          
          <View style={{ height: 32 }} />
        </ScrollView>
      </SafeAreaView>
    </SafeAreaProvider>
  );
}

// Styles
const { width } = Dimensions.get('window');

const styles = StyleSheet.create({
  // Loading
  loadingScreen: {
    flex: 1,
  },
  loadingGradient: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  logoLarge: {
    width: 100,
    height: 100,
    borderRadius: 28,
    backgroundColor: '#fff',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.3,
    shadowRadius: 16,
    elevation: 16,
  },
  logoTextLarge: {
    fontSize: 48,
    fontWeight: '700',
    color: theme.colors.primary,
  },
  loadingTitle: {
    marginTop: 24,
    fontSize: 24,
    fontWeight: '700',
    color: '#fff',
  },

  // Auth
  authContainer: {
    flex: 1,
    backgroundColor: theme.colors.background,
  },
  authGradient: {
    paddingTop: 60,
    paddingBottom: 80,
    alignItems: 'center',
    borderBottomLeftRadius: 40,
    borderBottomRightRadius: 40,
  },
  authHeader: {
    alignItems: 'center',
  },
  languageButton: {
    position: 'absolute',
    top: -40,
    right: 20,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.2)',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 20,
  },
  languageButtonText: {
    color: '#fff',
    fontWeight: '600',
    marginLeft: 6,
    fontSize: 14,
  },
  logoMedium: {
    width: 72,
    height: 72,
    borderRadius: 20,
    backgroundColor: '#fff',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 8,
  },
  logoTextMedium: {
    fontSize: 36,
    fontWeight: '700',
    color: theme.colors.primary,
  },
  authBrand: {
    marginTop: 16,
    fontSize: 18,
    fontWeight: '600',
    color: '#fff',
  },
  authFormContainer: {
    flex: 1,
    marginTop: -40,
  },
  authCard: {
    flex: 1,
    marginHorizontal: 20,
    backgroundColor: theme.colors.card,
    borderRadius: 24,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 12,
    elevation: 8,
  },
  authScrollContent: {
    padding: 28,
  },
  authTitle: {
    fontSize: 28,
    fontWeight: '700',
    color: theme.colors.text,
    textAlign: 'center',
  },
  authSubtitle: {
    marginTop: 8,
    fontSize: 15,
    color: theme.colors.textMuted,
    textAlign: 'center',
    marginBottom: 32,
  },
  errorBox: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: theme.colors.dangerLight,
    borderRadius: 12,
    padding: 14,
    marginBottom: 20,
  },
  errorText: {
    marginLeft: 10,
    flex: 1,
    fontSize: 14,
    color: theme.colors.danger,
  },
  inputGroup: {
    marginBottom: 20,
  },
  inputLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: theme.colors.textMuted,
    marginBottom: 8,
  },
  inputWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: theme.colors.background,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: theme.colors.border,
  },
  inputIcon: {
    marginLeft: 14,
  },
  input: {
    flex: 1,
    paddingVertical: 14,
    paddingHorizontal: 12,
    fontSize: 16,
    color: theme.colors.text,
  },
  primaryButton: {
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: theme.colors.primary,
    borderRadius: 14,
    paddingVertical: 16,
    marginTop: 8,
    shadowColor: theme.colors.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 4,
  },
  buttonContent: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  buttonDisabled: {
    opacity: 0.7,
  },
  primaryButtonText: {
    fontSize: 17,
    fontWeight: '600',
    color: '#fff',
    marginRight: 8,
  },
  authFooter: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginTop: 28,
  },
  authFooterText: {
    fontSize: 15,
    color: theme.colors.textMuted,
  },
  authFooterLink: {
    fontSize: 15,
    fontWeight: '600',
    color: theme.colors.primary,
  },

  // Dashboard
  container: {
    flex: 1,
    backgroundColor: theme.colors.background,
  },
  dashboardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 16,
    backgroundColor: theme.colors.card,
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.border,
  },
  headerButtons: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  headerButton: {
    padding: 10,
    marginLeft: 4,
  },
  dashboardTitle: {
    fontSize: 28,
    fontWeight: '700',
    color: theme.colors.text,
  },
  dashboardSubtitle: {
    fontSize: 14,
    color: theme.colors.textMuted,
    marginTop: 2,
  },
  logoutButton: {
    padding: 10,
  },
  dashboardScroll: {
    flex: 1,
  },
  dashboardContent: {
    padding: 20,
  },

  // Stats
  statsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginHorizontal: -6,
    marginBottom: 20,
  },
  statCard: {
    width: (width - 52) / 2,
    marginHorizontal: 6,
    marginBottom: 12,
    backgroundColor: theme.colors.card,
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: theme.colors.border,
  },
  statPrimary: {},
  statWarning: {},
  statDanger: {},
  statSuccess: {},
  statIconContainer: {
    width: 44,
    height: 44,
    borderRadius: 12,
    backgroundColor: theme.colors.primary + '15',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 12,
  },
  statValue: {
    fontSize: 32,
    fontWeight: '700',
    color: theme.colors.text,
  },
  statLabel: {
    fontSize: 13,
    color: theme.colors.textMuted,
    marginTop: 4,
  },

  // Upload
  uploadCard: {
    marginBottom: 20,
    borderRadius: 20,
    overflow: 'hidden',
    shadowColor: theme.colors.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 12,
    elevation: 6,
  },
  uploadGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 20,
  },
  uploadIconCircle: {
    width: 56,
    height: 56,
    borderRadius: 16,
    backgroundColor: '#fff',
    justifyContent: 'center',
    alignItems: 'center',
  },
  uploadTextContainer: {
    flex: 1,
    marginLeft: 16,
  },
  uploadTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#fff',
  },
  uploadSubtitle: {
    fontSize: 13,
    color: 'rgba(255,255,255,0.8)',
    marginTop: 2,
  },

  // Filters
  filterTabs: {
    flexDirection: 'row',
    backgroundColor: theme.colors.backgroundDark,
    borderRadius: 12,
    padding: 4,
    marginBottom: 16,
  },
  filterTab: {
    flex: 1,
    paddingVertical: 10,
    alignItems: 'center',
    borderRadius: 10,
  },
  filterTabActive: {
    backgroundColor: theme.colors.card,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  filterTabText: {
    fontSize: 14,
    fontWeight: '500',
    color: theme.colors.textMuted,
  },
  filterTabTextActive: {
    color: theme.colors.text,
    fontWeight: '600',
  },

  // Search
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: theme.colors.card,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: theme.colors.border,
    paddingHorizontal: 14,
    marginBottom: 20,
  },
  searchInput: {
    flex: 1,
    paddingVertical: 14,
    paddingHorizontal: 10,
    fontSize: 15,
    color: theme.colors.text,
  },

  // Section
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: theme.colors.text,
  },
  sectionBadge: {
    marginLeft: 10,
    backgroundColor: theme.colors.primary + '15',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
  },
  sectionBadgeText: {
    fontSize: 13,
    fontWeight: '600',
    color: theme.colors.primary,
  },

  // Empty State
  emptyState: {
    alignItems: 'center',
    paddingVertical: 48,
    paddingHorizontal: 24,
    backgroundColor: theme.colors.card,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: theme.colors.border,
  },
  emptyStateTitle: {
    marginTop: 16,
    fontSize: 20,
    fontWeight: '700',
    color: theme.colors.text,
  },
  emptyStateText: {
    marginTop: 8,
    fontSize: 15,
    color: theme.colors.textMuted,
    textAlign: 'center',
  },
  emptyStateButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: theme.colors.primary,
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 12,
    marginTop: 20,
  },
  emptyStateButtonText: {
    marginLeft: 8,
    fontSize: 15,
    fontWeight: '600',
    color: '#fff',
  },

  // Document Card
  documentCard: {
    backgroundColor: theme.colors.card,
    borderRadius: 16,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: theme.colors.border,
  },
  documentCardUrgent: {
    borderColor: theme.colors.danger + '50',
    backgroundColor: theme.colors.dangerLight + '30',
  },
  documentCardFailed: {
    borderColor: theme.colors.danger + '50',
  },
  documentCardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  documentCardLeft: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
  },
  documentTypeIcon: {
    width: 40,
    height: 40,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  documentTypeEmoji: {
    fontSize: 20,
  },
  documentCardTitles: {
    flex: 1,
  },
  documentCardTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: theme.colors.text,
  },
  documentCardSender: {
    fontSize: 13,
    color: theme.colors.textMuted,
    marginTop: 2,
  },
  docStatusBadge: {
    width: 28,
    height: 28,
    borderRadius: 14,
    justifyContent: 'center',
    alignItems: 'center',
  },
  docStatusProcessing: {
    backgroundColor: theme.colors.warningLight,
  },
  docStatusFailed: {
    backgroundColor: theme.colors.dangerLight,
  },
  docStatusSuccess: {
    backgroundColor: theme.colors.successLight,
  },
  documentCardSummary: {
    marginTop: 12,
    fontSize: 14,
    color: theme.colors.textMuted,
    lineHeight: 20,
  },
  processingIndicator: {
    marginTop: 12,
  },
  processingBar: {
    height: 4,
    backgroundColor: theme.colors.backgroundDark,
    borderRadius: 2,
    overflow: 'hidden',
  },
  processingFill: {
    width: '40%',
    height: '100%',
    backgroundColor: theme.colors.warning,
    borderRadius: 2,
  },
  processingText: {
    marginTop: 6,
    fontSize: 12,
    color: theme.colors.warning,
  },
  documentCardFooter: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: 12,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: theme.colors.border,
  },
  documentCardMeta: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  metaItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginRight: 16,
  },
  metaText: {
    marginLeft: 4,
    fontSize: 13,
    color: theme.colors.textSubtle,
  },
  actionsBadge: {
    backgroundColor: theme.colors.primary + '15',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 10,
  },
  actionsBadgeUrgent: {
    backgroundColor: theme.colors.dangerLight,
  },
  actionsBadgeText: {
    fontSize: 12,
    fontWeight: '600',
    color: theme.colors.primary,
  },
  actionsBadgeTextUrgent: {
    color: theme.colors.danger,
  },

  // Document Detail
  detailHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: theme.colors.card,
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.border,
  },
  backButton: {
    padding: 8,
    marginRight: 8,
  },
  detailHeaderTitle: {
    flex: 1,
  },
  detailHeaderText: {
    fontSize: 18,
    fontWeight: '600',
    color: theme.colors.text,
  },
  typeBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
    marginTop: 4,
  },
  typeBadgeEmoji: {
    fontSize: 12,
    marginRight: 4,
  },
  typeBadgeText: {
    fontSize: 12,
    fontWeight: '600',
  },
  detailScroll: {
    flex: 1,
  },
  detailContent: {
    padding: 16,
  },
  detailCard: {
    backgroundColor: theme.colors.card,
    borderRadius: 16,
    padding: 16,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: theme.colors.border,
  },
  detailCardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  detailCardTitle: {
    fontSize: 17,
    fontWeight: '700',
    color: theme.colors.text,
  },
  statusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 10,
  },
  statusProcessing: {
    backgroundColor: theme.colors.warningLight,
  },
  statusProcessingText: {
    marginLeft: 6,
    fontSize: 13,
    fontWeight: '500',
    color: theme.colors.warning,
  },
  statusFailed: {
    backgroundColor: theme.colors.dangerLight,
  },
  statusFailedText: {
    marginLeft: 4,
    fontSize: 13,
    fontWeight: '500',
    color: theme.colors.danger,
  },
  statusSuccess: {
    backgroundColor: theme.colors.successLight,
  },
  statusSuccessText: {
    marginLeft: 4,
    fontSize: 13,
    fontWeight: '500',
    color: theme.colors.success,
  },
  progressBar: {
    height: 6,
    backgroundColor: theme.colors.backgroundDark,
    borderRadius: 3,
    overflow: 'hidden',
  },
  progressFill: {
    width: '50%',
    height: '100%',
    backgroundColor: theme.colors.warning,
    borderRadius: 3,
  },
  infoRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.border,
  },
  infoContent: {
    flex: 1,
    marginLeft: 12,
  },
  infoLabel: {
    fontSize: 13,
    color: theme.colors.textMuted,
  },
  infoValue: {
    fontSize: 15,
    fontWeight: '500',
    color: theme.colors.text,
    marginTop: 2,
  },
  summaryText: {
    fontSize: 15,
    color: theme.colors.textMuted,
    lineHeight: 22,
  },
  actionCountBadge: {
    backgroundColor: theme.colors.primary + '15',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 10,
  },
  actionCountText: {
    fontSize: 13,
    fontWeight: '600',
    color: theme.colors.primary,
  },
  emptyActions: {
    alignItems: 'center',
    paddingVertical: 32,
  },
  emptyActionsTitle: {
    marginTop: 12,
    fontSize: 17,
    fontWeight: '600',
    color: theme.colors.text,
  },
  emptyActionsText: {
    marginTop: 4,
    fontSize: 14,
    color: theme.colors.textMuted,
  },
  actionCard: {
    flexDirection: 'row',
    backgroundColor: theme.colors.background,
    borderRadius: 12,
    padding: 14,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: theme.colors.border,
  },
  actionUrgent: {
    backgroundColor: theme.colors.dangerLight + '50',
    borderColor: theme.colors.danger + '30',
  },
  actionSoon: {
    backgroundColor: theme.colors.warningLight + '50',
    borderColor: theme.colors.warning + '30',
  },
  actionDone: {
    opacity: 0.6,
  },
  actionCheckbox: {
    width: 24,
    height: 24,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: theme.colors.border,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  actionCheckboxDone: {
    backgroundColor: theme.colors.success,
    borderColor: theme.colors.success,
  },
  actionContent: {
    flex: 1,
  },
  actionTitle: {
    fontSize: 15,
    fontWeight: '600',
    color: theme.colors.text,
  },
  actionTitleDone: {
    textDecorationLine: 'line-through',
    color: theme.colors.textMuted,
  },
  actionDescription: {
    marginTop: 4,
    fontSize: 13,
    color: theme.colors.textMuted,
    lineHeight: 18,
  },
  actionDeadlineRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 8,
  },
  actionDeadline: {
    marginLeft: 4,
    fontSize: 12,
    color: theme.colors.textSubtle,
  },
  actionDeadlineUrgent: {
    color: theme.colors.danger,
    fontWeight: '600',
  },
  actionDeadlineSoon: {
    color: theme.colors.warning,
    fontWeight: '600',
  },

  // Modal styles
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: theme.colors.card,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    padding: 24,
    paddingBottom: 40,
  },
  modalTitle: {
    fontSize: 22,
    fontWeight: '700',
    color: theme.colors.text,
    marginBottom: 20,
    textAlign: 'center',
  },
  languageOption: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderRadius: 14,
    marginBottom: 12,
    backgroundColor: theme.colors.background,
    borderWidth: 2,
    borderColor: 'transparent',
  },
  languageOptionActive: {
    borderColor: theme.colors.primary,
    backgroundColor: theme.colors.primary + '10',
  },
  languageFlag: {
    fontSize: 28,
    marginRight: 16,
  },
  languageText: {
    flex: 1,
    fontSize: 18,
    fontWeight: '500',
    color: theme.colors.text,
  },
  languageTextActive: {
    color: theme.colors.primary,
    fontWeight: '600',
  },
  modalCloseButton: {
    marginTop: 8,
    alignItems: 'center',
    padding: 16,
  },
  modalCloseText: {
    fontSize: 16,
    color: theme.colors.textMuted,
    fontWeight: '500',
  },
});
