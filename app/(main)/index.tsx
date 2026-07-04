import React, { useEffect, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  StatusBar,
  Platform,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { SignOut } from 'phosphor-react-native';
import { useAuthStore } from '@/src/stores/authStore';
import { useTripStore } from '@/src/stores/tripStore';
import { useVehicleStore } from '@/src/stores/vehicleStore';

// ─── Design tokens (Light Theme) ─────────────────────────────────
const COLORS = {
  bg: '#F4F6F8',
  surface: '#FFFFFF',
  surfaceRaised: '#EAF0F6',
  border: '#E2E8F0',
  accent: '#D97706',
  accentBg: '#FFB020',
  accentDim: '#FEF3C7',
  textPrimary: '#0F172A',
  textSecondary: '#475569',
  textTertiary: '#94A3B8',
  success: '#10B981',
  successDim: '#D1FAE5',
  danger: '#EF4444',
  dangerDim: '#FEE2E2',
  mapBtn: '#1E3A5F',
  mapBtnShadow: '#1E3A5F',
};

export default function DashboardScreen() {
  const { user, signOut } = useAuthStore();
  const { trips, hydrate: hydrateTrips } = useTripStore();
  const { profiles, getActiveProfile, hydrate: hydrateVehicles } = useVehicleStore();

  useEffect(() => {
    if (user?.id) {
      hydrateTrips(user.id);
      hydrateVehicles(user.id);
    }
  }, [user?.id]);

  const activeProfile = getActiveProfile();

  const todayStats = useMemo(() => {
    const today = new Date().toDateString();
    const todayTrips = trips.filter(
      (t) => new Date(t.startedAt).toDateString() === today && t.status === 'COMPLETED'
    );
    const totalKm = todayTrips.reduce((sum, t) => sum + t.distanceKm, 0);
    const totalMin = todayTrips.reduce((sum, t) => sum + t.durationMinutes, 0);
    return { count: todayTrips.length, km: totalKm, minutes: totalMin };
  }, [trips]);

  const recentTrips = trips.slice(0, 3);
  const firstName = user?.email ? user.email.split('@')[0] : 'Driver';

  const handleGoToMap = () => {
    router.push('/(main)/map');
  };

  const handleSignOut = () => {
    Alert.alert(
      'Sign Out',
      'Are you sure you want to sign out?',
      [
        {
          text: 'Cancel',
          style: 'cancel',
        },
        {
          text: 'Sign Out',
          style: 'destructive',
          onPress: () => signOut(),
        },
      ],
      { cancelable: true }
    );
  };

  return (
    <View style={styles.root}>
      <StatusBar barStyle="dark-content" backgroundColor={COLORS.bg} />
      <SafeAreaView style={styles.safe} edges={['top']}>
        <ScrollView
          showsVerticalScrollIndicator={false}
          contentContainerStyle={styles.scrollContent}
        >
          {/* ── Top bar ───────────────────────────────── */}
          <View style={styles.topBar}>
            <View>
              <Text style={styles.eyebrow}>{getGreeting().toUpperCase()}</Text>
              <Text style={styles.driverName}>{firstName}</Text>
            </View>
            <TouchableOpacity
              style={styles.signOutBtn}
              onPress={() => router.push('/(main)/settings')}
              activeOpacity={0.7}
            >
              <SignOut size={20} color={COLORS.accent} weight="bold" />
            </TouchableOpacity>
          </View>

          {/* ── Status pill — signature element ─────────── */}
          <View style={styles.statusPill}>
            <View style={styles.statusDotWrap}>
              <View style={styles.statusDot} />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={styles.statusLabel}>STANDING BY</Text>
              <Text style={styles.statusSub}>No active trip</Text>
            </View>
            <TouchableOpacity style={styles.statusCta} onPress={handleGoToMap}>
              <Text style={styles.statusCtaText}>GO</Text>
            </TouchableOpacity>
          </View>

          {/* ── Instrument cluster — today's stats ──────── */}
          <View style={styles.clusterCard}>
            <View style={styles.clusterHeader}>
              <Text style={styles.clusterTitle}>TODAY</Text>
              <View style={styles.clusterHeaderLine} />
            </View>
            <View style={styles.clusterRow}>
              <View style={styles.clusterStat}>
                <Text style={styles.clusterValue}>{todayStats.count}</Text>
                <Text style={styles.clusterUnit}>TRIPS</Text>
              </View>
              <View style={styles.clusterDivider} />
              <View style={styles.clusterStat}>
                <Text style={styles.clusterValue}>
                  {todayStats.km.toFixed(0)}
                  <Text style={styles.clusterValueSmall}> km</Text>
                </Text>
                <Text style={styles.clusterUnit}>DISTANCE</Text>
              </View>
              <View style={styles.clusterDivider} />
              <View style={styles.clusterStat}>
                <Text style={styles.clusterValue}>
                  {Math.round(todayStats.minutes)}
                  <Text style={styles.clusterValueSmall}> m</Text>
                </Text>
                <Text style={styles.clusterUnit}>DRIVE TIME</Text>
              </View>
            </View>
          </View>

          {/* ── Open Map CTA banner ───────────────────────── */}
          <TouchableOpacity
            style={styles.mapBtn}
            onPress={handleGoToMap}
            activeOpacity={0.88}
          >
            <View style={styles.mapBtnIconWrap}>
              <Text style={styles.mapBtnIcon}>🧭</Text>
            </View>
            <View style={{ flex: 1 }}>
              <Text style={styles.mapBtnTitle}>Open Map</Text>
              <Text style={styles.mapBtnSub}>Trip search coming in the next step</Text>
            </View>
            <Text style={styles.mapBtnChevron}>›</Text>
          </TouchableOpacity>

          {/* ── Vehicle ID card ──────────────────────────── */}
          <Text style={styles.sectionLabel}>ACTIVE VEHICLE</Text>
          {activeProfile ? (
            <TouchableOpacity style={styles.vehicleCard} activeOpacity={0.85} onPress={() => router.push('/(main)/settings')}>
              <View style={styles.vehiclePlate}>
                <Text style={styles.vehiclePlateText}>
                  {activeProfile.vehicleClass.slice(0, 2)}
                </Text>
              </View>
              <View style={{ flex: 1 }}>
                <Text style={styles.vehicleName}>{activeProfile.name}</Text>
                <Text style={styles.vehicleSpecs}>
                  {activeProfile.lengthMetres}M · {activeProfile.gcmTonnes}T ·{' '}
                  {activeProfile.vehicleClass.replace(/_/g, ' ')}
                </Text>
              </View>
              <Text style={styles.chevron}>›</Text>
            </TouchableOpacity>
          ) : (
            <TouchableOpacity style={styles.vehicleCardEmpty} activeOpacity={0.85} onPress={() => router.push('/(main)/settings')}>
              <View style={styles.vehiclePlateEmpty}>
                <Text style={styles.vehiclePlateEmptyText}>＋</Text>
              </View>
              <View style={{ flex: 1 }}>
                <Text style={styles.vehicleEmptyTitle}>No vehicle configured</Text>
                <Text style={styles.vehicleEmptySub}>Tap to set up in Settings →</Text>
              </View>
            </TouchableOpacity>
          )}

          {/* ── Recent trips ─────────────────────────────── */}
          <View style={styles.recentHeader}>
            <Text style={styles.sectionLabel}>RECENT TRIPS</Text>
            {recentTrips.length > 0 && (
              <TouchableOpacity onPress={() => router.push('/(main)/trips')}>
                <Text style={styles.seeAllLink}>SEE ALL</Text>
              </TouchableOpacity>
            )}
          </View>

          {recentTrips.length === 0 ? (
            <View style={styles.emptyState}>
              <View style={styles.emptyIconWrap}>
                <Text style={styles.emptyIcon}>—</Text>
              </View>
              <Text style={styles.emptyTitle}>No trips logged</Text>
              <Text style={styles.emptySub}>
                Your completed trips will appear here
              </Text>
            </View>
          ) : (
            recentTrips.map((trip, i) => (
              <View
                key={trip.id}
                style={[
                  styles.tripRow,
                  i === recentTrips.length - 1 && styles.tripRowLast,
                ]}
              >
                <View style={styles.tripIndexWrap}>
                  <Text style={styles.tripIndex}>{String(i + 1).padStart(2, '0')}</Text>
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={styles.tripDest} numberOfLines={1}>
                    {trip.destination}
                  </Text>
                  <Text style={styles.tripMeta}>{trip.distanceKm.toFixed(1)} km</Text>
                </View>
                <View
                  style={[
                    styles.tripStatusDot,
                    trip.status === 'COMPLETED' && { backgroundColor: COLORS.success },
                    trip.status === 'CANCELLED' && { backgroundColor: COLORS.danger },
                    trip.status === 'IN_PROGRESS' && { backgroundColor: COLORS.accentBg },
                  ]}
                />
              </View>
            ))
          )}

          <View style={{ height: 40 }} />
        </ScrollView>
      </SafeAreaView>
    </View>
  );
}

function getGreeting(): string {
  const hour = new Date().getHours();
  if (hour < 12) return 'Good morning';
  if (hour < 18) return 'Good afternoon';
  return 'Good evening';
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: COLORS.bg },
  safe: { flex: 1 },
  scrollContent: { paddingBottom: 24 },

  // Top bar
  topBar: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingTop: Platform.OS === 'android' ? 8 : 4,
    paddingBottom: 20,
  },
  eyebrow: {
    fontSize: 11,
    fontWeight: '700',
    color: COLORS.textTertiary,
    letterSpacing: 1.5,
    marginBottom: 4,
  },
  driverName: {
    fontSize: 24,
    fontWeight: '800',
    color: COLORS.textPrimary,
    letterSpacing: -0.5,
  },
  signOutBtn: {
    width: 42,
    height: 42,
    borderRadius: 21,
    backgroundColor: COLORS.surface,
    borderWidth: 1,
    borderColor: COLORS.border,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.06,
    shadowRadius: 3,
    elevation: 2,
  },

  // Status pill
  statusPill: {
    flexDirection: 'row',
    alignItems: 'center',
    marginHorizontal: 20,
    backgroundColor: COLORS.surface,
    borderRadius: 20,
    padding: 14,
    gap: 12,
    borderWidth: 1,
    borderColor: COLORS.border,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 3,
    elevation: 1,
  },
  statusDotWrap: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: COLORS.successDim,
    alignItems: 'center',
    justifyContent: 'center',
  },
  statusDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: COLORS.success,
  },
  statusLabel: {
    fontSize: 13,
    fontWeight: '800',
    color: COLORS.textPrimary,
    letterSpacing: 0.5,
  },
  statusSub: {
    fontSize: 12,
    color: COLORS.textSecondary,
    marginTop: 2,
  },
  statusCta: {
    backgroundColor: COLORS.accentBg,
    paddingHorizontal: 22,
    paddingVertical: 11,
    borderRadius: 14,
  },
  statusCtaText: {
    fontSize: 13,
    fontWeight: '800',
    color: '#1A1206',
    letterSpacing: 1,
  },

  // Instrument cluster
  clusterCard: {
    marginHorizontal: 20,
    marginTop: 16,
    backgroundColor: COLORS.surface,
    borderRadius: 20,
    padding: 18,
    borderWidth: 1,
    borderColor: COLORS.border,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 3,
    elevation: 1,
  },
  clusterHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginBottom: 16,
  },
  clusterTitle: {
    fontSize: 11,
    fontWeight: '800',
    color: COLORS.textTertiary,
    letterSpacing: 1.5,
  },
  clusterHeaderLine: {
    flex: 1,
    height: 1,
    backgroundColor: COLORS.border,
  },
  clusterRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  clusterStat: {
    flex: 1,
    alignItems: 'center',
  },
  clusterValue: {
    fontSize: 26,
    fontWeight: '800',
    color: COLORS.textPrimary,
    fontVariant: ['tabular-nums'],
    letterSpacing: -0.5,
  },
  clusterValueSmall: {
    fontSize: 14,
    fontWeight: '600',
    color: COLORS.textSecondary,
  },
  clusterUnit: {
    fontSize: 9,
    fontWeight: '700',
    color: COLORS.textTertiary,
    letterSpacing: 1,
    marginTop: 6,
  },
  clusterDivider: {
    width: 1,
    height: 32,
    backgroundColor: COLORS.border,
  },

  // Open Map banner
  mapBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
    marginHorizontal: 20,
    marginTop: 16,
    backgroundColor: COLORS.mapBtn,
    borderRadius: 18,
    padding: 16,
    shadowColor: COLORS.mapBtnShadow,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.25,
    shadowRadius: 10,
    elevation: 5,
  },
  mapBtnIconWrap: {
    width: 44,
    height: 44,
    borderRadius: 12,
    backgroundColor: 'rgba(255,255,255,0.12)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  mapBtnIcon: {
    fontSize: 22,
  },
  mapBtnTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  mapBtnSub: {
    fontSize: 12,
    color: 'rgba(255,255,255,0.6)',
    marginTop: 2,
  },
  mapBtnChevron: {
    fontSize: 22,
    color: 'rgba(255,255,255,0.5)',
  },

  // Section label
  sectionLabel: {
    fontSize: 11,
    fontWeight: '800',
    color: COLORS.textTertiary,
    letterSpacing: 1.5,
    marginHorizontal: 20,
    marginTop: 28,
    marginBottom: 12,
  },

  // Vehicle card
  vehicleCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
    marginHorizontal: 20,
    backgroundColor: COLORS.surface,
    borderRadius: 18,
    padding: 14,
    borderWidth: 1,
    borderColor: COLORS.border,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 3,
    elevation: 1,
  },
  vehiclePlate: {
    width: 48,
    height: 48,
    borderRadius: 12,
    backgroundColor: COLORS.accentDim,
    alignItems: 'center',
    justifyContent: 'center',
  },
  vehiclePlateText: {
    fontSize: 15,
    fontWeight: '800',
    color: COLORS.accent,
    letterSpacing: 0.5,
  },
  vehicleName: {
    fontSize: 15,
    fontWeight: '700',
    color: COLORS.textPrimary,
  },
  vehicleSpecs: {
    fontSize: 12,
    color: COLORS.textSecondary,
    marginTop: 3,
    letterSpacing: 0.3,
  },
  chevron: {
    fontSize: 22,
    color: COLORS.textTertiary,
  },
  vehicleCardEmpty: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
    marginHorizontal: 20,
    backgroundColor: 'transparent',
    borderRadius: 18,
    padding: 14,
    borderWidth: 1.5,
    borderColor: COLORS.border,
    borderStyle: 'dashed',
  },
  vehiclePlateEmpty: {
    width: 48,
    height: 48,
    borderRadius: 12,
    backgroundColor: COLORS.surface,
    alignItems: 'center',
    justifyContent: 'center',
  },
  vehiclePlateEmptyText: {
    fontSize: 18,
    color: COLORS.textTertiary,
    fontWeight: '600',
  },
  vehicleEmptyTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: COLORS.textSecondary,
  },
  vehicleEmptySub: {
    fontSize: 12,
    color: COLORS.textTertiary,
    marginTop: 2,
  },

  // Recent trips
  recentHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginHorizontal: 20,
    marginTop: 28,
    marginBottom: 12,
  },
  seeAllLink: {
    fontSize: 10,
    fontWeight: '800',
    color: COLORS.accent,
    letterSpacing: 1,
  },
  emptyState: {
    marginHorizontal: 20,
    alignItems: 'center',
    paddingVertical: 36,
    backgroundColor: COLORS.surface,
    borderRadius: 18,
    borderWidth: 1,
    borderColor: COLORS.border,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 3,
    elevation: 1,
  },
  emptyIconWrap: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: COLORS.surfaceRaised,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 10,
  },
  emptyIcon: {
    fontSize: 18,
    color: COLORS.textTertiary,
    fontWeight: '700',
  },
  emptyTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: COLORS.textSecondary,
  },
  emptySub: {
    fontSize: 12,
    color: COLORS.textTertiary,
    marginTop: 4,
  },
  tripRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
    marginHorizontal: 20,
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },
  tripRowLast: {
    borderBottomWidth: 0,
  },
  tripIndexWrap: {
    width: 32,
    height: 32,
    borderRadius: 8,
    backgroundColor: COLORS.surfaceRaised,
    alignItems: 'center',
    justifyContent: 'center',
  },
  tripIndex: {
    fontSize: 11,
    fontWeight: '700',
    color: COLORS.textSecondary,
    fontVariant: ['tabular-nums'],
  },
  tripDest: {
    fontSize: 14,
    fontWeight: '600',
    color: COLORS.textPrimary,
  },
  tripMeta: {
    fontSize: 12,
    color: COLORS.textSecondary,
    marginTop: 2,
  },
  tripStatusDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
});
