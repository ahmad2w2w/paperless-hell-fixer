import React, { useCallback, useEffect, useMemo, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  RefreshControl,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import * as ImagePicker from 'expo-image-picker';
import * as DocumentPicker from 'expo-document-picker';
import { useTheme } from '../context/ThemeContext';
import { useAuth } from '../context/AuthContext';
import { api, DocumentDTO } from '../lib/api';
import { formatDutchDate, parseDate, getUrgency } from '../lib/date';
import { Card, Badge, Button } from '../components/ui';
import { spacing, fontSize, borderRadius } from '../lib/theme';
import { Ionicons } from '@expo/vector-icons';

type RootStackParamList = {
  Dashboard: undefined;
  DocumentDetail: { documentId: string };
};

type DashboardScreenProps = {
  navigation: NativeStackNavigationProp<RootStackParamList, 'Dashboard'>;
};

const typeLabels: Record<string, { label: string; emoji: string }> = {
  BELASTING: { label: 'Belasting', emoji: '🏛️' },
  BOETE: { label: 'Boete', emoji: '⚠️' },
  VERZEKERING: { label: 'Verzekering', emoji: '🛡️' },
  ABONNEMENT: { label: 'Abonnement', emoji: '📅' },
  OVERIG: { label: 'Overig', emoji: '📄' },
};

export function DashboardScreen({ navigation }: DashboardScreenProps) {
  const { theme } = useTheme();
  const { logout } = useAuth();
  const [documents, setDocuments] = useState<DocumentDTO[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [filter, setFilter] = useState<'open' | 'done' | 'all'>('open');

  const fetchDocuments = useCallback(async () => {
    try {
      const docs = await api.getDocuments({ status: filter });
      setDocuments(docs);
      setError(null);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Kon documenten niet laden.');
    }
  }, [filter]);

  const load = useCallback(async () => {
    setLoading(true);
    await fetchDocuments();
    setLoading(false);
  }, [fetchDocuments]);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await fetchDocuments();
    setRefreshing(false);
  }, [fetchDocuments]);

  useEffect(() => {
    load();
  }, [load]);

  // Auto-refresh every 5 seconds
  useEffect(() => {
    const interval = setInterval(() => {
      fetchDocuments();
    }, 5000);
    return () => clearInterval(interval);
  }, [fetchDocuments]);

  const stats = useMemo(() => {
    const allActions = documents.flatMap((d) => d.actionItems);
    const openActions = allActions.filter((a) => a.status === 'OPEN');
    const urgentActions = openActions.filter((a) => {
      const deadline = parseDate(a.deadline);
      return deadline && getUrgency(deadline) === 'urgent';
    });

    return {
      totalDocs: documents.length,
      openActions: openActions.length,
      urgentActions: urgentActions.length,
    };
  }, [documents]);

  const actionsForView = useMemo(() => {
    return documents
      .flatMap((d) =>
        d.actionItems.map((a) => ({
          ...a,
          documentId: d.id,
          documentName: d.originalFilename,
          docDeadline: d.deadline,
          docType: d.type,
        }))
      )
      .filter((a) => filter === 'all' || (filter === 'open' ? a.status === 'OPEN' : a.status === 'DONE'))
      .sort((a, b) => {
        const da = parseDate(a.deadline ?? a.docDeadline);
        const db = parseDate(b.deadline ?? b.docDeadline);
        if (!da && !db) return 0;
        if (!da) return 1;
        if (!db) return -1;
        return da.getTime() - db.getTime();
      });
  }, [documents, filter]);

  const handleUpload = async () => {
    Alert.alert(
      'Document uploaden',
      'Kies hoe je wilt uploaden',
      [
        {
          text: 'Camera',
          onPress: handleCameraUpload,
        },
        {
          text: 'Foto bibliotheek',
          onPress: handleImagePickerUpload,
        },
        {
          text: 'Bestand kiezen',
          onPress: handleDocumentPickerUpload,
        },
        {
          text: 'Annuleren',
          style: 'cancel',
        },
      ]
    );
  };

  const handleCameraUpload = async () => {
    const permission = await ImagePicker.requestCameraPermissionsAsync();
    if (!permission.granted) {
      Alert.alert('Geen toegang', 'Camera toegang is vereist.');
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
      Alert.alert('Geen toegang', 'Fotobibliotheek toegang is vereist.');
      return;
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images'],
      quality: 0.8,
    });

    if (!result.canceled && result.assets[0]) {
      const asset = result.assets[0];
      const filename = asset.fileName || 'image.jpg';
      const mimeType = asset.mimeType || 'image/jpeg';
      await uploadFile(asset.uri, filename, mimeType);
    }
  };

  const handleDocumentPickerUpload = async () => {
    try {
      const result = await DocumentPicker.getDocumentAsync({
        type: ['application/pdf', 'image/*'],
        copyToCacheDirectory: true,
      });

      if (!result.canceled && result.assets[0]) {
        const asset = result.assets[0];
        await uploadFile(asset.uri, asset.name, asset.mimeType || 'application/pdf');
      }
    } catch (e) {
      console.error('Document picker error:', e);
    }
  };

  const uploadFile = async (uri: string, filename: string, mimeType: string) => {
    setUploading(true);
    setError(null);
    try {
      await api.uploadDocument(uri, filename, mimeType);
      await fetchDocuments();
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Upload mislukt.');
    } finally {
      setUploading(false);
    }
  };

  const handleLogout = () => {
    Alert.alert(
      'Uitloggen',
      'Weet je zeker dat je wilt uitloggen?',
      [
        { text: 'Annuleren', style: 'cancel' },
        { text: 'Uitloggen', style: 'destructive', onPress: logout },
      ]
    );
  };

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: theme.colors.background }]}>
      {/* Header */}
      <View style={[styles.header, { borderBottomColor: theme.colors.border }]}>
        <View>
          <Text style={[styles.headerTitle, { color: theme.colors.foreground }]}>
            Dashboard
          </Text>
          <Text style={[styles.headerSubtitle, { color: theme.colors.foregroundMuted }]}>
            Beheer je documenten
          </Text>
        </View>
        <TouchableOpacity onPress={handleLogout} style={styles.logoutButton}>
          <Ionicons name="log-out-outline" size={24} color={theme.colors.foregroundMuted} />
        </TouchableOpacity>
      </View>

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
      >
        {/* Stats */}
        <View style={styles.statsRow}>
          <Card style={styles.statCard}>
            <Text style={[styles.statValue, { color: theme.colors.primary }]}>
              {stats.totalDocs}
            </Text>
            <Text style={[styles.statLabel, { color: theme.colors.foregroundMuted }]}>
              Documenten
            </Text>
          </Card>
          <Card style={styles.statCard}>
            <Text style={[styles.statValue, { color: theme.colors.warning }]}>
              {stats.openActions}
            </Text>
            <Text style={[styles.statLabel, { color: theme.colors.foregroundMuted }]}>
              Open acties
            </Text>
          </Card>
          <Card style={styles.statCard}>
            <Text style={[styles.statValue, { color: theme.colors.danger }]}>
              {stats.urgentActions}
            </Text>
            <Text style={[styles.statLabel, { color: theme.colors.foregroundMuted }]}>
              Urgent
            </Text>
          </Card>
        </View>

        {/* Upload button */}
        <Card style={styles.uploadCard}>
          <View style={styles.uploadContent}>
            <View style={[styles.uploadIconContainer, { backgroundColor: theme.colors.primaryLight }]}>
              <Ionicons name="cloud-upload-outline" size={24} color={theme.colors.primary} />
            </View>
            <View style={styles.uploadText}>
              <Text style={[styles.uploadTitle, { color: theme.colors.foreground }]}>
                Document uploaden
              </Text>
              <Text style={[styles.uploadSubtitle, { color: theme.colors.foregroundMuted }]}>
                PDF of afbeelding (JPG/PNG)
              </Text>
            </View>
            <Button onPress={handleUpload} loading={uploading} size="sm">
              Upload
            </Button>
          </View>
        </Card>

        {/* Filter tabs */}
        <View style={styles.filterRow}>
          {(['open', 'done', 'all'] as const).map((f) => (
            <TouchableOpacity
              key={f}
              onPress={() => setFilter(f)}
              style={[
                styles.filterTab,
                filter === f && { backgroundColor: theme.colors.primaryLight },
              ]}
            >
              <Text
                style={[
                  styles.filterTabText,
                  { color: filter === f ? theme.colors.primary : theme.colors.foregroundMuted },
                ]}
              >
                {f === 'open' ? 'Open' : f === 'done' ? 'Afgerond' : 'Alles'}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        {/* Error */}
        {error && (
          <View style={[styles.errorContainer, { backgroundColor: theme.colors.dangerLight }]}>
            <Text style={[styles.errorText, { color: theme.colors.danger }]}>{error}</Text>
          </View>
        )}

        {/* Loading */}
        {loading && (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color={theme.colors.primary} />
          </View>
        )}

        {/* Actions list */}
        {!loading && (
          <View style={styles.section}>
            <Text style={[styles.sectionTitle, { color: theme.colors.foreground }]}>
              Acties ({actionsForView.length})
            </Text>
            {actionsForView.length === 0 ? (
              <Card>
                <View style={styles.emptyState}>
                  <Ionicons name="checkmark-circle-outline" size={48} color={theme.colors.foregroundSubtle} />
                  <Text style={[styles.emptyStateTitle, { color: theme.colors.foreground }]}>
                    Geen acties
                  </Text>
                  <Text style={[styles.emptyStateText, { color: theme.colors.foregroundMuted }]}>
                    {filter === 'open' ? 'Je hebt geen openstaande acties. Goed bezig! 🎉' : 'Geen acties gevonden.'}
                  </Text>
                </View>
              </Card>
            ) : (
              actionsForView.slice(0, 10).map((action) => {
                const deadline = parseDate(action.deadline ?? action.docDeadline);
                const urgency = getUrgency(deadline);

                return (
                  <TouchableOpacity
                    key={action.id}
                    onPress={() => navigation.navigate('DocumentDetail', { documentId: action.documentId })}
                  >
                    <Card
                      style={[
                        styles.actionCard,
                        urgency === 'urgent' && { borderLeftWidth: 3, borderLeftColor: theme.colors.danger },
                        urgency === 'soon' && { borderLeftWidth: 3, borderLeftColor: theme.colors.warning },
                      ]}
                    >
                      <View style={styles.actionHeader}>
                        <View style={styles.actionTitleRow}>
                          {action.docType && (
                            <Text style={styles.actionEmoji}>
                              {typeLabels[action.docType]?.emoji}
                            </Text>
                          )}
                          <Text
                            style={[styles.actionTitle, { color: theme.colors.foreground }]}
                            numberOfLines={1}
                          >
                            {action.title}
                          </Text>
                        </View>
                        {deadline && (
                          <Badge
                            color={urgency === 'urgent' ? 'danger' : urgency === 'soon' ? 'warning' : 'default'}
                            size="sm"
                            dot
                          >
                            {formatDutchDate(deadline)}
                          </Badge>
                        )}
                      </View>
                      <Text
                        style={[styles.actionDocument, { color: theme.colors.foregroundSubtle }]}
                        numberOfLines={1}
                      >
                        {action.documentName}
                      </Text>
                      <Text
                        style={[styles.actionDescription, { color: theme.colors.foregroundMuted }]}
                        numberOfLines={2}
                      >
                        {action.description}
                      </Text>
                    </Card>
                  </TouchableOpacity>
                );
              })
            )}
          </View>
        )}

        {/* Documents list */}
        {!loading && (
          <View style={styles.section}>
            <Text style={[styles.sectionTitle, { color: theme.colors.foreground }]}>
              Documenten ({documents.length})
            </Text>
            {documents.length === 0 ? (
              <Card>
                <View style={styles.emptyState}>
                  <Ionicons name="document-outline" size={48} color={theme.colors.foregroundSubtle} />
                  <Text style={[styles.emptyStateTitle, { color: theme.colors.foreground }]}>
                    Geen documenten
                  </Text>
                  <Text style={[styles.emptyStateText, { color: theme.colors.foregroundMuted }]}>
                    Upload je eerste document om te beginnen.
                  </Text>
                </View>
              </Card>
            ) : (
              documents.slice(0, 10).map((doc) => {
                const isProcessing = doc.job?.status === 'PENDING' || doc.job?.status === 'PROCESSING';
                const isFailed = doc.job?.status === 'FAILED';

                return (
                  <TouchableOpacity
                    key={doc.id}
                    onPress={() => navigation.navigate('DocumentDetail', { documentId: doc.id })}
                  >
                    <Card style={styles.documentCard}>
                      <View style={styles.documentHeader}>
                        <View style={styles.documentTitleRow}>
                          {doc.type && (
                            <Text style={styles.actionEmoji}>
                              {typeLabels[doc.type]?.emoji}
                            </Text>
                          )}
                          <Text
                            style={[styles.documentTitle, { color: theme.colors.foreground }]}
                            numberOfLines={1}
                          >
                            {doc.originalFilename}
                          </Text>
                        </View>
                        <Badge
                          color={isFailed ? 'danger' : isProcessing ? 'warning' : 'success'}
                          size="sm"
                          dot
                        >
                          {isFailed ? 'Mislukt' : isProcessing ? 'Verwerken...' : 'Klaar'}
                        </Badge>
                      </View>
                      <Text
                        style={[styles.documentSender, { color: theme.colors.foregroundSubtle }]}
                        numberOfLines={1}
                      >
                        {doc.sender ? `Van: ${doc.sender}` : 'Afzender onbekend'}
                      </Text>
                      {doc.summary && !isProcessing && !isFailed && (
                        <Text
                          style={[styles.documentSummary, { color: theme.colors.foregroundMuted }]}
                          numberOfLines={2}
                        >
                          {doc.summary}
                        </Text>
                      )}
                      {isProcessing && (
                        <View style={[styles.progressBar, { backgroundColor: theme.colors.border }]}>
                          <View style={[styles.progressFill, { backgroundColor: theme.colors.warning }]} />
                        </View>
                      )}
                    </Card>
                  </TouchableOpacity>
                );
              })
            )}
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    borderBottomWidth: 1,
  },
  headerTitle: {
    fontSize: fontSize.xxl,
    fontWeight: '700',
  },
  headerSubtitle: {
    fontSize: fontSize.sm,
    marginTop: 2,
  },
  logoutButton: {
    padding: spacing.sm,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    padding: spacing.lg,
    paddingBottom: spacing.xxl,
  },
  statsRow: {
    flexDirection: 'row',
    marginHorizontal: spacing.xs,
    marginBottom: spacing.lg,
  },
  statCard: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: spacing.md,
  },
  statValue: {
    fontSize: fontSize.xxl,
    fontWeight: '700',
  },
  statLabel: {
    fontSize: fontSize.xs,
    marginTop: spacing.xs,
  },
  uploadCard: {
    marginBottom: spacing.lg,
  },
  uploadContent: {
    flexDirection: 'row',
    alignItems: 'center',
    marginHorizontal: spacing.sm,
  },
  uploadIconContainer: {
    width: 48,
    height: 48,
    borderRadius: borderRadius.lg,
    justifyContent: 'center',
    alignItems: 'center',
  },
  uploadText: {
    flex: 1,
  },
  uploadTitle: {
    fontSize: fontSize.md,
    fontWeight: '600',
  },
  uploadSubtitle: {
    fontSize: fontSize.xs,
    marginTop: 2,
  },
  filterRow: {
    flexDirection: 'row',
    marginHorizontal: spacing.xs,
    marginBottom: spacing.lg,
  },
  filterTab: {
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.md,
    borderRadius: borderRadius.full,
  },
  filterTabText: {
    fontSize: fontSize.sm,
    fontWeight: '500',
  },
  errorContainer: {
    padding: spacing.md,
    borderRadius: borderRadius.md,
    marginBottom: spacing.md,
  },
  errorText: {
    fontSize: fontSize.sm,
  },
  loadingContainer: {
    padding: spacing.xxl,
    alignItems: 'center',
  },
  section: {
    marginBottom: spacing.lg,
  },
  sectionTitle: {
    fontSize: fontSize.lg,
    fontWeight: '600',
    marginBottom: spacing.md,
  },
  emptyState: {
    alignItems: 'center',
    paddingVertical: spacing.xl,
  },
  emptyStateTitle: {
    fontSize: fontSize.lg,
    fontWeight: '600',
    marginTop: spacing.md,
  },
  emptyStateText: {
    fontSize: fontSize.sm,
    marginTop: spacing.xs,
    textAlign: 'center',
  },
  actionCard: {
    marginBottom: spacing.sm,
  },
  actionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginHorizontal: spacing.xs,
  },
  actionTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    marginHorizontal: 2,
  },
  actionEmoji: {
    fontSize: fontSize.md,
  },
  actionTitle: {
    fontSize: fontSize.md,
    fontWeight: '500',
    flex: 1,
  },
  actionDocument: {
    fontSize: fontSize.xs,
    marginTop: spacing.xs,
  },
  actionDescription: {
    fontSize: fontSize.sm,
    marginTop: spacing.xs,
    lineHeight: 20,
  },
  documentCard: {
    marginBottom: spacing.sm,
  },
  documentHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginHorizontal: spacing.xs,
  },
  documentTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    marginHorizontal: 2,
  },
  documentTitle: {
    fontSize: fontSize.md,
    fontWeight: '500',
    flex: 1,
  },
  documentSender: {
    fontSize: fontSize.xs,
    marginTop: spacing.xs,
  },
  documentSummary: {
    fontSize: fontSize.sm,
    marginTop: spacing.xs,
    lineHeight: 20,
  },
  progressBar: {
    height: 4,
    borderRadius: 2,
    marginTop: spacing.sm,
    overflow: 'hidden',
  },
  progressFill: {
    width: '33%',
    height: '100%',
    borderRadius: 2,
  },
});

