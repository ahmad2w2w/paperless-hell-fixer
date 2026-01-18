import React, { useCallback, useEffect, useState } from 'react';
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
import { RouteProp } from '@react-navigation/native';
import { useTheme } from '../context/ThemeContext';
import { api, DocumentDTO, ActionItemDTO } from '../lib/api';
import { formatDutchDate, parseDate, getUrgency } from '../lib/date';
import { Card, Badge, Button } from '../components/ui';
import { spacing, fontSize, borderRadius } from '../lib/theme';
import { Ionicons } from '@expo/vector-icons';

type RootStackParamList = {
  Dashboard: undefined;
  DocumentDetail: { documentId: string };
};

type DocumentDetailScreenProps = {
  navigation: NativeStackNavigationProp<RootStackParamList, 'DocumentDetail'>;
  route: RouteProp<RootStackParamList, 'DocumentDetail'>;
};

const typeLabels: Record<string, { label: string; emoji: string }> = {
  BELASTING: { label: 'Belasting', emoji: '🏛️' },
  BOETE: { label: 'Boete', emoji: '⚠️' },
  VERZEKERING: { label: 'Verzekering', emoji: '🛡️' },
  ABONNEMENT: { label: 'Abonnement', emoji: '📅' },
  OVERIG: { label: 'Overig', emoji: '📄' },
};

export function DocumentDetailScreen({ navigation, route }: DocumentDetailScreenProps) {
  const { documentId } = route.params;
  const { theme } = useTheme();
  const [document, setDocument] = useState<DocumentDTO | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [savingId, setSavingId] = useState<string | null>(null);

  const fetchDocument = useCallback(async () => {
    try {
      const doc = await api.getDocument(documentId);
      setDocument(doc);
      setError(null);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Document niet gevonden.');
    }
  }, [documentId]);

  const load = useCallback(async () => {
    setLoading(true);
    await fetchDocument();
    setLoading(false);
  }, [fetchDocument]);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await fetchDocument();
    setRefreshing(false);
  }, [fetchDocument]);

  useEffect(() => {
    load();
  }, [load]);

  // Auto-refresh if processing
  useEffect(() => {
    if (document?.job?.status === 'PENDING' || document?.job?.status === 'PROCESSING') {
      const interval = setInterval(() => {
        fetchDocument();
      }, 3000);
      return () => clearInterval(interval);
    }
  }, [document?.job?.status, fetchDocument]);

  const handleMarkDone = async (actionId: string) => {
    setSavingId(actionId);
    try {
      await api.markActionDone(actionId);
      await fetchDocument();
    } catch (e) {
      Alert.alert('Fout', e instanceof Error ? e.message : 'Kon actie niet afronden.');
    } finally {
      setSavingId(null);
    }
  };

  const handleRetry = async () => {
    try {
      await api.retryDocument(documentId);
      await fetchDocument();
    } catch (e) {
      Alert.alert('Fout', e instanceof Error ? e.message : 'Retry mislukt.');
    }
  };

  const isProcessing = document?.job?.status === 'PENDING' || document?.job?.status === 'PROCESSING';
  const isFailed = document?.job?.status === 'FAILED';

  const sortedActions = document?.actionItems.slice().sort((a, b) => {
    // Open items first
    if (a.status !== b.status) {
      return a.status === 'OPEN' ? -1 : 1;
    }
    // Then by deadline
    const da = parseDate(a.deadline);
    const db = parseDate(b.deadline);
    if (!da && !db) return 0;
    if (!da) return 1;
    if (!db) return -1;
    return da.getTime() - db.getTime();
  }) || [];

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: theme.colors.background }]} edges={['bottom']}>
      {/* Header */}
      <View style={[styles.header, { backgroundColor: theme.colors.backgroundCard, borderBottomColor: theme.colors.border }]}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
          <Ionicons name="arrow-back" size={24} color={theme.colors.foreground} />
        </TouchableOpacity>
        <View style={styles.headerContent}>
          <Text style={[styles.headerTitle, { color: theme.colors.foreground }]} numberOfLines={1}>
            {document?.originalFilename || 'Document'}
          </Text>
          {document?.type && (
            <View style={styles.headerBadge}>
              <Text>{typeLabels[document.type]?.emoji}</Text>
              <Text style={[styles.headerType, { color: theme.colors.foregroundMuted }]}>
                {typeLabels[document.type]?.label}
              </Text>
            </View>
          )}
        </View>
      </View>

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
      >
        {loading && (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color={theme.colors.primary} />
          </View>
        )}

        {error && (
          <View style={[styles.errorContainer, { backgroundColor: theme.colors.dangerLight }]}>
            <Text style={[styles.errorText, { color: theme.colors.danger }]}>{error}</Text>
          </View>
        )}

        {!loading && document && (
          <>
            {/* Status card */}
            {(isProcessing || isFailed) && (
              <Card style={[
                styles.statusCard,
                isProcessing && { borderLeftWidth: 3, borderLeftColor: theme.colors.warning },
                isFailed && { borderLeftWidth: 3, borderLeftColor: theme.colors.danger },
              ]}>
                <View style={styles.statusHeader}>
                  <Ionicons
                    name={isProcessing ? 'hourglass-outline' : 'alert-circle-outline'}
                    size={24}
                    color={isProcessing ? theme.colors.warning : theme.colors.danger}
                  />
                  <Text style={[styles.statusTitle, { color: theme.colors.foreground }]}>
                    {isProcessing ? 'Document wordt verwerkt...' : 'Verwerking mislukt'}
                  </Text>
                </View>
                {isProcessing && (
                  <View style={[styles.progressBar, { backgroundColor: theme.colors.border }]}>
                    <View style={[styles.progressFill, { backgroundColor: theme.colors.warning }]} />
                  </View>
                )}
                {isFailed && (
                  <>
                    <Text style={[styles.statusError, { color: theme.colors.danger }]}>
                      {document.job?.error || 'Onbekende fout'}
                    </Text>
                    <Button onPress={handleRetry} variant="secondary" size="sm" style={{ marginTop: spacing.sm }}>
                      Opnieuw proberen
                    </Button>
                  </>
                )}
              </Card>
            )}

            {/* Document info */}
            <Card style={styles.infoCard}>
              <Text style={[styles.sectionTitle, { color: theme.colors.foreground }]}>
                Document info
              </Text>
              
              <View style={styles.infoRow}>
                <Text style={[styles.infoLabel, { color: theme.colors.foregroundMuted }]}>
                  Afzender
                </Text>
                <Text style={[styles.infoValue, { color: theme.colors.foreground }]}>
                  {document.sender || 'Onbekend'}
                </Text>
              </View>

              {document.amount && (
                <View style={styles.infoRow}>
                  <Text style={[styles.infoLabel, { color: theme.colors.foregroundMuted }]}>
                    Bedrag
                  </Text>
                  <Text style={[styles.infoValue, { color: theme.colors.foreground }]}>
                    €{parseFloat(document.amount).toFixed(2)}
                  </Text>
                </View>
              )}

              {document.deadline && (
                <View style={styles.infoRow}>
                  <Text style={[styles.infoLabel, { color: theme.colors.foregroundMuted }]}>
                    Deadline
                  </Text>
                  <Text style={[styles.infoValue, { color: theme.colors.foreground }]}>
                    {formatDutchDate(new Date(document.deadline))}
                  </Text>
                </View>
              )}

              {document.summary && (
                <View style={styles.summaryContainer}>
                  <Text style={[styles.infoLabel, { color: theme.colors.foregroundMuted }]}>
                    Samenvatting
                  </Text>
                  <Text style={[styles.summaryText, { color: theme.colors.foreground }]}>
                    {document.summary}
                  </Text>
                </View>
              )}
            </Card>

            {/* Action items */}
            <View style={styles.actionsSection}>
              <Text style={[styles.sectionTitle, { color: theme.colors.foreground }]}>
                Actiepunten ({sortedActions.length})
              </Text>

              {sortedActions.length === 0 ? (
                <Card>
                  <View style={styles.emptyState}>
                    <Ionicons name="checkmark-circle-outline" size={48} color={theme.colors.foregroundSubtle} />
                    <Text style={[styles.emptyStateTitle, { color: theme.colors.foreground }]}>
                      Geen acties
                    </Text>
                    <Text style={[styles.emptyStateText, { color: theme.colors.foregroundMuted }]}>
                      Dit document heeft nog geen actiepunten.
                    </Text>
                  </View>
                </Card>
              ) : (
                sortedActions.map((action) => (
                  <ActionItemCard
                    key={action.id}
                    action={action}
                    onMarkDone={() => handleMarkDone(action.id)}
                    saving={savingId === action.id}
                  />
                ))
              )}
            </View>
          </>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

function ActionItemCard({
  action,
  onMarkDone,
  saving,
}: {
  action: ActionItemDTO;
  onMarkDone: () => void;
  saving: boolean;
}) {
  const { theme } = useTheme();
  const deadline = parseDate(action.deadline);
  const urgency = getUrgency(deadline);
  const isDone = action.status === 'DONE';

  return (
    <Card
      style={[
        styles.actionCard,
        isDone && { opacity: 0.6 },
        !isDone && urgency === 'urgent' && { borderLeftWidth: 3, borderLeftColor: theme.colors.danger },
        !isDone && urgency === 'soon' && { borderLeftWidth: 3, borderLeftColor: theme.colors.warning },
      ]}
    >
      <View style={styles.actionHeader}>
        <View style={styles.actionTitleContainer}>
          <Text
            style={[
              styles.actionTitle,
              { color: theme.colors.foreground },
              isDone && styles.actionTitleDone,
            ]}
          >
            {action.title}
          </Text>
          <Badge color={isDone ? 'success' : 'warning'} size="sm" dot>
            {isDone ? 'Afgerond' : 'Open'}
          </Badge>
        </View>
        {!isDone && (
          <Button onPress={onMarkDone} loading={saving} size="sm" variant="secondary">
            Done
          </Button>
        )}
      </View>

      {deadline && (
        <View style={styles.actionDeadline}>
          <Ionicons name="calendar-outline" size={14} color={theme.colors.foregroundSubtle} />
          <Text style={[styles.actionDeadlineText, { color: theme.colors.foregroundSubtle }]}>
            {formatDutchDate(deadline)}
          </Text>
        </View>
      )}

      <Text style={[styles.actionDescription, { color: theme.colors.foregroundMuted }]}>
        {action.description}
      </Text>

      {action.notes && (
        <View style={[styles.notesContainer, { backgroundColor: theme.colors.background }]}>
          <Text style={[styles.notesLabel, { color: theme.colors.foregroundSubtle }]}>
            Notities:
          </Text>
          <Text style={[styles.notesText, { color: theme.colors.foregroundMuted }]}>
            {action.notes}
          </Text>
        </View>
      )}
    </Card>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.md,
    borderBottomWidth: 1,
  },
  backButton: {
    padding: spacing.xs,
    marginRight: spacing.sm,
  },
  headerContent: {
    flex: 1,
  },
  headerTitle: {
    fontSize: fontSize.lg,
    fontWeight: '600',
  },
  headerBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    marginHorizontal: 2,
    marginTop: 2,
  },
  headerType: {
    fontSize: fontSize.xs,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    padding: spacing.lg,
    paddingBottom: spacing.xxl,
  },
  loadingContainer: {
    padding: spacing.xxl,
    alignItems: 'center',
  },
  errorContainer: {
    padding: spacing.md,
    borderRadius: borderRadius.md,
    marginBottom: spacing.md,
  },
  errorText: {
    fontSize: fontSize.sm,
  },
  statusCard: {
    marginBottom: spacing.lg,
  },
  statusHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginHorizontal: spacing.xs,
  },
  statusTitle: {
    fontSize: fontSize.md,
    fontWeight: '500',
  },
  statusError: {
    fontSize: fontSize.sm,
    marginTop: spacing.sm,
  },
  progressBar: {
    height: 4,
    borderRadius: 2,
    marginTop: spacing.md,
    overflow: 'hidden',
  },
  progressFill: {
    width: '33%',
    height: '100%',
    borderRadius: 2,
  },
  infoCard: {
    marginBottom: spacing.lg,
  },
  sectionTitle: {
    fontSize: fontSize.lg,
    fontWeight: '600',
    marginBottom: spacing.md,
  },
  infoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(0,0,0,0.05)',
  },
  infoLabel: {
    fontSize: fontSize.sm,
  },
  infoValue: {
    fontSize: fontSize.sm,
    fontWeight: '500',
  },
  summaryContainer: {
    marginTop: spacing.md,
  },
  summaryText: {
    fontSize: fontSize.sm,
    marginTop: spacing.xs,
    lineHeight: 22,
  },
  actionsSection: {
    marginBottom: spacing.lg,
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
  actionTitleContainer: {
    flex: 1,
    flexDirection: 'row',
    flexWrap: 'wrap',
    alignItems: 'center',
    marginHorizontal: spacing.xs,
  },
  actionTitle: {
    fontSize: fontSize.md,
    fontWeight: '500',
  },
  actionTitleDone: {
    textDecorationLine: 'line-through',
  },
  actionDeadline: {
    flexDirection: 'row',
    alignItems: 'center',
    marginHorizontal: 2,
    marginTop: spacing.xs,
  },
  actionDeadlineText: {
    fontSize: fontSize.xs,
  },
  actionDescription: {
    fontSize: fontSize.sm,
    marginTop: spacing.sm,
    lineHeight: 20,
  },
  notesContainer: {
    marginTop: spacing.sm,
    padding: spacing.sm,
    borderRadius: borderRadius.sm,
  },
  notesLabel: {
    fontSize: fontSize.xs,
    marginBottom: spacing.xs,
  },
  notesText: {
    fontSize: fontSize.sm,
    lineHeight: 20,
  },
});

