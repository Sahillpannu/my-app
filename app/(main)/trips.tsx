import React, { useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  Alert,
  StatusBar,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { ArrowLeft, Trash } from 'phosphor-react-native';
import { useAuthStore } from '@/src/stores/authStore';
import { useTripStore } from '@/src/stores/tripStore';
import { Trip } from '@/src/types/trip';

// ─── Design tokens — Matches Dashboard + Settings exactly ────────
const COLORS = {
  bg: '#F4F6F8',
  surface: '#FFFFFF',
  surfaceRaised: '#EAF0F6',
  border: '#E2E8F0',
  accent: '#D97706',       // Dark safety amber for text & icons (high contrast on white)
  accentBg: '#FFB020',     // High-visibility amber safety color for button backgrounds
  accentDim: '#FEF3C7',    // Light amber background for tags
  textPrimary: '#0F172A',  // Dark slate for headers
  textSecondary: '#475569',// Medium slate for body/info
  textTertiary: '#94A3B8', // Muted slate for eyebrows & borders
  success: '#10B981',      // Emerald green
  successDim: '#D1FAE5',   // Light green background
  danger: '#EF4444',       // Coral red
  dangerDim: '#FEE2E2',    // Light red background
};

const STATUS_META: Record<
  Trip['status'],
  { label: string; color: string; dim: string }
> = {
  COMPLETED: { label: 'COMPLETED', color: COLORS.success, dim: COLORS.successDim },
  CANCELLED: { label: 'CANCELLED', color: COLORS.danger, dim: COLORS.dangerDim },
  IN_PROGRESS: { label: 'IN PROGRESS', color: COLORS.accent, dim: COLORS.accentDim },
};

export default function TripsScreen() {
  const { user } = useAuthStore();
  const { trips, hydrate, deleteTrip } = useTripStore();

  useEffect(() => {
    if (user?.id) hydrate(user.id);
  }, [user?.id]);

  const handleDelete = useCallback(
    (id: string, destination: string) => {
      Alert.alert(
        'Delete Trip',
        `Remove the trip to "${destination}" from your history?`,
        [
          { text: 'Cancel', style: 'cancel' },
          { text: 'Delete', style: 'destructive', onPress: () => deleteTrip(id) },
        ]
      );
    },
    [deleteTrip]
  );

  const completedCount = trips.filter((t) => t.status === 'COMPLETED').length;
  const totalKm = trips
    .filter((t) => t.status === 'COMPLETED')
    .reduce((sum, t) => sum + t.distanceKm, 0);

  const renderItem = ({ item, index }: { item: Trip; index: number }) => {
    const meta = STATUS_META[item.status];
    const date = new Date(item.startedAt);
    const dateLabel = formatRelativeDate(item.startedAt);
    const timeLabel = date.toLocaleTimeString('en-AU', {
      hour: '2-digit',
      minute: '2-digit',
    });

    return (
      <View style={styles.tripCard}>
        <View style={styles.tripCardTop}>
          <View style={styles.tripIndexWrap}>
            <Text style={styles.tripIndex}>{String(index + 1).padStart(2, '0')}</Text>
          </View>
          <View style={{ flex: 1 }}>
            <View style={styles.routeLine}>
              <View style={styles.routeDotGreen} />
              <Text style={styles.routeText} numberOfLines={1}>
                {item.origin}
              </Text>
            </View>
            <View style={styles.routeConnector} />
            <View style={styles.routeLine}>
              <View style={styles.routeDotRed} />
              <Text style={styles.routeText} numberOfLines={1}>
                {item.destination}
              </Text>
            </View>
          </View>
          <TouchableOpacity
            onPress={() => handleDelete(item.id, item.destination)}
            hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
            style={styles.deleteBtn}
          >
            <Trash size={16} color={COLORS.textTertiary} weight="regular" />
          </TouchableOpacity>
        </View>

        <View style={styles.tripCardBottom}>
          <View style={styles.statBlock}>
            <Text style={styles.statValue}>{item.distanceKm.toFixed(1)}</Text>
            <Text style={styles.statUnit}>KM</Text>
          </View>
          <View style={styles.statDivider} />
          <View style={styles.statBlock}>
            <Text style={styles.statValue}>{Math.round(item.durationMinutes)}</Text>
            <Text style={styles.statUnit}>MIN</Text>
          </View>
          <View style={styles.statDivider} />
          <View style={styles.statBlock}>
            <Text style={styles.statValueSmall}>{dateLabel}</Text>
            <Text style={styles.statUnit}>{timeLabel.toUpperCase()}</Text>
          </View>
          <View style={[styles.statusBadge, { backgroundColor: meta.dim }]}>
            <View style={[styles.statusDot, { backgroundColor: meta.color }]} />
            <Text style={[styles.statusText, { color: meta.color }]}>{meta.label}</Text>
          </View>
        </View>
      </View>
    );
  };

  return (
    <View style={styles.root}>
      <StatusBar barStyle="dark-content" backgroundColor={COLORS.bg} />
      <SafeAreaView style={styles.safe} edges={['top']}>
        {/* Header */}
        <View style={styles.topBar}>
          <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
            <ArrowLeft size={20} color={COLORS.textPrimary} weight="bold" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Trip History</Text>
          <View style={{ width: 40 }} />
        </View>

        {/* Summary strip */}
        {trips.length > 0 && (
          <View style={styles.summaryStrip}>
            <View style={styles.summaryItem}>
              <Text style={styles.summaryValue}>{completedCount}</Text>
              <Text style={styles.summaryLabel}>COMPLETED</Text>
            </View>
            <View style={styles.summaryDivider} />
            <View style={styles.summaryItem}>
              <Text style={styles.summaryValue}>{totalKm.toFixed(0)}</Text>
              <Text style={styles.summaryLabel}>TOTAL KM</Text>
            </View>
            <View style={styles.summaryDivider} />
            <View style={styles.summaryItem}>
              <Text style={styles.summaryValue}>{trips.length}</Text>
              <Text style={styles.summaryLabel}>ALL TRIPS</Text>
            </View>
          </View>
        )}

        <FlatList
          data={trips}
          keyExtractor={(item) => item.id}
          renderItem={renderItem}
          contentContainerStyle={styles.listContent}
          showsVerticalScrollIndicator={false}
          ListEmptyComponent={
            <View style={styles.emptyState}>
              <View style={styles.emptyIconWrap}>
                <Text style={styles.emptyIcon}>—</Text>
              </View>
              <Text style={styles.emptyTitle}>No trips logged</Text>
              <Text style={styles.emptySub}>
                Your completed trips will appear here.{'\n'}
                Trip logging will be wired up in a later step.
              </Text>
            </View>
          }
        />
      </SafeAreaView>
    </View>
  );
}

function formatRelativeDate(iso: string): string {
  const date = new Date(iso);
  const now = new Date();
  const diffDays = Math.floor(
    (now.setHours(0, 0, 0, 0) - new Date(date).setHours(0, 0, 0, 0)) /
      (1000 * 60 * 60 * 24)
  );
  if (diffDays === 0) return 'Today';
  if (diffDays === 1) return 'Yesterday';
  if (diffDays < 7) return `${diffDays}d ago`;
  return date.toLocaleDateString('en-AU', { day: 'numeric', month: 'short' });
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: COLORS.bg },
  safe: { flex: 1 },

  // Top bar
  topBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
    backgroundColor: COLORS.surface,
  },
  backBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: COLORS.surfaceRaised,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTitle: {
    fontSize: 16,
    fontWeight: '800',
    color: COLORS.textPrimary,
    letterSpacing: 0.2,
  },

  // Summary strip
  summaryStrip: {
    flexDirection: 'row',
    alignItems: 'center',
    marginHorizontal: 20,
    marginTop: 16,
    marginBottom: 16,
    backgroundColor: COLORS.surface,
    borderRadius: 16,
    padding: 14,
    borderWidth: 1,
    borderColor: COLORS.border,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.04,
    shadowRadius: 3,
    elevation: 1,
  },
  summaryItem: { flex: 1, alignItems: 'center' },
  summaryValue: {
    fontSize: 20,
    fontWeight: '800',
    color: COLORS.textPrimary,
    fontVariant: ['tabular-nums'],
  },
  summaryLabel: {
    fontSize: 9,
    fontWeight: '700',
    color: COLORS.textTertiary,
    letterSpacing: 1,
    marginTop: 4,
  },
  summaryDivider: { width: 1, height: 28, backgroundColor: COLORS.border },

  // List
  listContent: { paddingHorizontal: 20, paddingVertical: 16, paddingBottom: 40 },

  // Trip card
  tripCard: {
    backgroundColor: COLORS.surface,
    borderRadius: 16,
    padding: 14,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: COLORS.border,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.04,
    shadowRadius: 3,
    elevation: 1,
  },
  tripCardTop: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 12,
  },
  tripIndexWrap: {
    width: 30,
    height: 30,
    borderRadius: 8,
    backgroundColor: COLORS.surfaceRaised,
    alignItems: 'center',
    justifyContent: 'center',
  },
  tripIndex: {
    fontSize: 10,
    fontWeight: '700',
    color: COLORS.textTertiary,
    fontVariant: ['tabular-nums'],
  },
  routeLine: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    flex: 1,
  },
  routeDotGreen: {
    width: 7,
    height: 7,
    borderRadius: 3.5,
    backgroundColor: COLORS.success,
  },
  routeDotRed: {
    width: 7,
    height: 7,
    borderRadius: 3.5,
    backgroundColor: COLORS.danger,
  },
  routeConnector: {
    width: 1,
    height: 10,
    backgroundColor: COLORS.border,
    marginLeft: 3,
    marginVertical: 2,
  },
  routeText: {
    fontSize: 13,
    fontWeight: '600',
    color: COLORS.textPrimary,
    flex: 1,
  },
  deleteBtn: {
    padding: 4,
  },

  tripCardBottom: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 12,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: COLORS.border,
    gap: 12,
  },
  statBlock: { alignItems: 'flex-start' },
  statValue: {
    fontSize: 15,
    fontWeight: '800',
    color: COLORS.textPrimary,
    fontVariant: ['tabular-nums'],
  },
  statValueSmall: {
    fontSize: 12,
    fontWeight: '700',
    color: COLORS.textPrimary,
  },
  statUnit: {
    fontSize: 9,
    fontWeight: '700',
    color: COLORS.textTertiary,
    letterSpacing: 0.5,
    marginTop: 2,
  },
  statDivider: { width: 1, height: 24, backgroundColor: COLORS.border },
  statusBadge: {
    marginLeft: 'auto',
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    paddingHorizontal: 9,
    paddingVertical: 5,
    borderRadius: 8,
  },
  statusDot: { width: 5, height: 5, borderRadius: 2.5 },
  statusText: { fontSize: 9, fontWeight: '800', letterSpacing: 0.4 },

  // Empty state
  emptyState: {
    alignItems: 'center',
    paddingTop: 60,
    paddingHorizontal: 32,
  },
  emptyIconWrap: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: COLORS.surface,
    borderWidth: 1.5,
    borderColor: COLORS.border,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 14,
  },
  emptyIcon: { fontSize: 20, color: COLORS.textTertiary, fontWeight: '700' },
  emptyTitle: { fontSize: 15, fontWeight: '700', color: COLORS.textSecondary },
  emptySub: {
    fontSize: 12,
    color: COLORS.textTertiary,
    textAlign: 'center',
    marginTop: 6,
    lineHeight: 18,
  },
});
