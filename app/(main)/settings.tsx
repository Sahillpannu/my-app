import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TextInput,
  TouchableOpacity,
  Alert,
  Modal,
  StatusBar,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Plus, SignOut } from 'phosphor-react-native';
import { useAuthStore } from '@/src/stores/authStore';
import { useVehicleStore } from '@/src/stores/vehicleStore';
import { useSubscriptionStore } from '@/src/stores/subscriptionStore';
import { VehicleClass, AxleConfig, VehicleProfile } from '@/src/types/vehicle';

// ─── Design tokens — light theme, matches Dashboard ──────────────
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
  inputBg: '#F8FAFC',
};

const VEHICLE_CLASSES: { value: VehicleClass; label: string }[] = [
  { value: 'GENERAL_ACCESS', label: 'GENERAL' },
  { value: 'CLASS_2_RESTRICTED_ACCESS', label: 'CLASS 2 RA' },
  { value: 'CLASS_1_SPECIAL_PURPOSE', label: 'CLASS 1 SP' },
  { value: 'PBS', label: 'PBS' },
];

function formatPermitDate(iso: string): string {
  return new Date(iso).toLocaleDateString('en-AU', { day: 'numeric', month: 'short', year: 'numeric' });
}

function daysUntil(iso: string): number {
  return Math.ceil((new Date(iso).getTime() - Date.now()) / (1000 * 60 * 60 * 24));
}

function isPermitExpired(iso: string): boolean {
  return daysUntil(iso) < 0;
}

function isPermitExpiringSoon(iso: string): boolean {
  const days = daysUntil(iso);
  return days >= 0 && days <= 14;
}

export default function SettingsScreen() {
  const { user, signOut } = useAuthStore();
  const {
    profiles,
    activeProfileId,
    hydrate,
    addProfile,
    updateProfile,
    deleteProfile,
    setActiveProfile,
  } = useVehicleStore();
  const { currentPlan, hydrate: hydrateSubscription, selectPlan, cancelPlan } = useSubscriptionStore();

  const [modalVisible, setModalVisible] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [name, setName] = useState('');
  const [vehicleClass, setVehicleClass] = useState<VehicleClass>('GENERAL_ACCESS');
  const [length, setLength] = useState('');
  const [width, setWidth] = useState('');
  const [height, setHeight] = useState('');
  const [gvm, setGvm] = useState('');
  const [gcm, setGcm] = useState('');
  const [permitExpiryDate, setPermitExpiryDate] = useState('');
  const [formError, setFormError] = useState<string | null>(null);

  useEffect(() => {
    if (user?.id) {
      hydrate(user.id);
      hydrateSubscription(user.id);
    }
  }, [user?.id]);

  const resetForm = () => {
    setName('');
    setVehicleClass('GENERAL_ACCESS');
    setLength('');
    setWidth('');
    setHeight('');
    setGvm('');
    setGcm('');
    setPermitExpiryDate('');
    setEditingId(null);
    setFormError(null);
  };

  const handleOpenEdit = (profile: VehicleProfile) => {
    setEditingId(profile.id);
    setName(profile.name);
    setVehicleClass(profile.vehicleClass);
    setLength(profile.lengthMetres.toString());
    setWidth(profile.widthMetres.toString());
    setHeight(profile.heightMetres.toString());
    setGvm(profile.gvmTonnes.toString());
    setGcm(profile.gcmTonnes.toString());
    setPermitExpiryDate(
      profile.permitExpiryDate
        ? profile.permitExpiryDate.slice(0, 10)
        : ''
    );
    setFormError(null);
    setModalVisible(true);
  };

  const handleOpenAdd = () => {
    resetForm();
    setEditingId(null);
    setModalVisible(true);
  };

  const handleSave = async () => {
    if (!name.trim()) {
      setFormError('Vehicle name is required');
      return;
    }
    const dims = [length, width, height, gvm, gcm];
    if (dims.some((d) => d.trim() === '')) {
      setFormError('All dimension and weight fields are required');
      return;
    }
    const parsed = dims.map((d) => parseFloat(d));
    if (parsed.some((n) => isNaN(n) || n <= 0)) {
      setFormError('Dimensions must be valid positive numbers');
      return;
    }

    let permitISO: string | null = null;
    if (permitExpiryDate.trim() !== '') {
      const dateRegex = /^\d{4}-\d{2}-\d{2}$/;
      if (!dateRegex.test(permitExpiryDate.trim())) {
        setFormError('Permit expiry must be in YYYY-MM-DD format, e.g. 2026-12-31');
        return;
      }
      const parsedDate = new Date(permitExpiryDate.trim());
      if (isNaN(parsedDate.getTime())) {
        setFormError('Permit expiry date is not a valid date');
        return;
      }
      permitISO = parsedDate.toISOString();
    }

    const payload = {
      name: name.trim(),
      vehicleClass,
      lengthMetres: parsed[0],
      widthMetres: parsed[1],
      heightMetres: parsed[2],
      gvmTonnes: parsed[3],
      gcmTonnes: parsed[4],
      axleConfig: 'TANDEM' as AxleConfig,
      dangerousGoods: false,
      permitExpiryDate: permitISO,
    };

    if (editingId) {
      await updateProfile(editingId, payload);
    } else {
      await addProfile(payload);
    }

    resetForm();
    setModalVisible(false);
  };

  const handleDelete = (id: string, vehicleName: string) => {
    Alert.alert(
      'Remove Vehicle',
      `Remove "${vehicleName}" from your profiles?`,
      [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Remove', style: 'destructive', onPress: () => deleteProfile(id) },
      ]
    );
  };

  const handleSignOut = () => {
    Alert.alert(
      'Sign Out',
      'Are you sure you want to sign out?',
      [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Sign Out', style: 'destructive', onPress: () => signOut() },
      ],
      { cancelable: true }
    );
  };

  return (
    <View style={styles.root}>
      <StatusBar barStyle="dark-content" backgroundColor={COLORS.bg} />
      <SafeAreaView style={styles.safe} edges={['top']}>
        {/* ── Header ─────────────────────────────────── */}
        <View style={styles.topBar}>
          <View style={{ width: 40 }} />
          <Text style={styles.headerTitle}>Settings</Text>
          {/* balance the header layout */}
          <View style={{ width: 40 }} />
        </View>

        <ScrollView
          showsVerticalScrollIndicator={false}
          contentContainerStyle={styles.scrollContent}
        >
          {/* ── Vehicle Profiles ─────────────────────── */}
          <View style={styles.sectionHeaderRow}>
            <Text style={styles.sectionLabel}>VEHICLE PROFILES</Text>
            <TouchableOpacity
              style={styles.addBtn}
              onPress={handleOpenAdd}
              activeOpacity={0.8}
            >
              <Plus size={12} color={COLORS.accent} weight="bold" />
              <Text style={styles.addBtnText}>ADD</Text>
            </TouchableOpacity>
          </View>

          {profiles.length === 0 ? (
            <TouchableOpacity
              style={styles.emptyState}
              activeOpacity={0.8}
              onPress={handleOpenAdd}
            >
              <View style={styles.emptyIconWrap}>
                <Text style={styles.emptyIcon}>🚛</Text>
              </View>
              <Text style={styles.emptyTitle}>No vehicles added</Text>
              <Text style={styles.emptySub}>
                Tap to add your first vehicle and enable routing
              </Text>
            </TouchableOpacity>
          ) : (
            <View style={styles.profilesList}>
              {profiles.map((p) => (
                <TouchableOpacity
                  key={p.id}
                  style={[
                    styles.vehicleRow,
                    activeProfileId === p.id && styles.vehicleRowActive,
                  ]}
                  onPress={() => setActiveProfile(p.id)}
                  activeOpacity={0.8}
                >
                  <View
                    style={[
                      styles.vehiclePlate,
                      activeProfileId === p.id && styles.vehiclePlateActive,
                    ]}
                  >
                    <Text
                      style={[
                        styles.vehiclePlateText,
                        activeProfileId === p.id && styles.vehiclePlateTextActive,
                      ]}
                    >
                      {p.vehicleClass.slice(0, 2)}
                    </Text>
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.vehicleName}>{p.name}</Text>
                    <Text style={styles.vehicleMeta}>
                      {p.lengthMetres}M · {p.gcmTonnes}T · {p.vehicleClass.replace(/_/g, ' ')}
                    </Text>
                    {p.permitExpiryDate &&
                      (isPermitExpired(p.permitExpiryDate) ||
                        isPermitExpiringSoon(p.permitExpiryDate)) && (
                        <Text
                          style={[
                            styles.permitTag,
                            isPermitExpired(p.permitExpiryDate) && styles.permitTagExpired,
                            isPermitExpiringSoon(p.permitExpiryDate) && styles.permitTagWarning,
                          ]}
                        >
                          {isPermitExpired(p.permitExpiryDate)
                            ? 'PERMIT EXPIRED'
                            : `PERMIT EXPIRES ${formatPermitDate(p.permitExpiryDate)}`}
                        </Text>
                      )}
                  </View>
                  {activeProfileId === p.id && (
                    <View style={styles.activeTag}>
                      <Text style={styles.activeTagText}>ACTIVE</Text>
                    </View>
                  )}
                  <TouchableOpacity
                    onPress={() => handleOpenEdit(p)}
                    hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
                    style={styles.editBtn}
                  >
                    <Text style={styles.editIcon}>✎</Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    onPress={() => handleDelete(p.id, p.name)}
                    hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
                    style={styles.deleteBtn}
                  >
                    <Text style={styles.deleteIcon}>×</Text>
                  </TouchableOpacity>
                </TouchableOpacity>
              ))}
            </View>
          )}

          {/* ── Subscription ─────────────────────────────── */}
          <Text style={[styles.sectionLabel, { marginTop: 32 }]}>SUBSCRIPTION</Text>

          <View style={styles.planRow}>
            <TouchableOpacity
              style={[
                styles.planCard,
                currentPlan === 'MONTHLY' && styles.planCardActive,
              ]}
              onPress={() => selectPlan('MONTHLY')}
              activeOpacity={0.85}
            >
              <Text style={styles.planLabel}>MONTHLY</Text>
              <View style={styles.planPriceRow}>
                <Text style={styles.planPrice}>$15</Text>
                <Text style={styles.planPeriod}>/mo</Text>
              </View>
              <Text style={styles.planSub}>Billed monthly</Text>
              {currentPlan === 'MONTHLY' && (
                <View style={styles.planActiveBadge}>
                  <Text style={styles.planActiveBadgeText}>CURRENT PLAN</Text>
                </View>
              )}
            </TouchableOpacity>

            <TouchableOpacity
              style={[
                styles.planCard,
                currentPlan === 'YEARLY' && styles.planCardActive,
              ]}
              onPress={() => selectPlan('YEARLY')}
              activeOpacity={0.85}
            >
              <View style={styles.saveBadge}>
                <Text style={styles.saveBadgeText}>SAVE 33%</Text>
              </View>
              <Text style={styles.planLabel}>YEARLY</Text>
              <View style={styles.planPriceRow}>
                <Text style={styles.planPrice}>$120</Text>
                <Text style={styles.planPeriod}>/yr</Text>
              </View>
              <Text style={styles.planSub}>$10/mo equivalent</Text>
              {currentPlan === 'YEARLY' && (
                <View style={styles.planActiveBadge}>
                  <Text style={styles.planActiveBadgeText}>CURRENT PLAN</Text>
                </View>
              )}
            </TouchableOpacity>
          </View>

          {currentPlan && (
            <TouchableOpacity
              style={styles.cancelPlanBtn}
              onPress={() =>
                Alert.alert('Cancel subscription', 'Remove your current plan selection?', [
                  { text: 'Keep plan', style: 'cancel' },
                  { text: 'Cancel plan', style: 'destructive', onPress: cancelPlan },
                ])
              }
            >
              <Text style={styles.cancelPlanText}>Cancel subscription</Text>
            </TouchableOpacity>
          )}

          {!currentPlan && (
            <Text style={styles.noPlanHint}>
              No active plan — select one above to unlock premium routing features
            </Text>
          )}

          {/* ── Account ──────────────────────────────── */}
          <Text style={[styles.sectionLabel, { marginTop: 32, marginHorizontal: 20, marginBottom: 12 }]}>
            ACCOUNT
          </Text>

          <View style={styles.accountCard}>
            <View style={styles.accountRow}>
              <Text style={styles.accountLabel}>Email</Text>
              <Text style={styles.accountEmail} numberOfLines={1}>{user?.email}</Text>
            </View>
          </View>

          <TouchableOpacity
            style={styles.signOutBtn}
            onPress={handleSignOut}
            activeOpacity={0.8}
          >
            <SignOut size={18} color={COLORS.danger} weight="bold" />
            <Text style={styles.signOutText}>Sign Out</Text>
          </TouchableOpacity>

          <View style={{ height: 40 }} />
        </ScrollView>
      </SafeAreaView>

      {/* ── Add Vehicle Modal ────────────────────────── */}
      <Modal visible={modalVisible} animationType="slide" transparent>
        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
          style={styles.modalOverlay}
        >
          <TouchableOpacity
            style={styles.modalBackdrop}
            activeOpacity={1}
            onPress={() => { resetForm(); setModalVisible(false); }}
          />
          <View style={styles.modalCard}>
            <View style={styles.modalHandle} />
            <Text style={styles.modalTitle}>{editingId ? 'Edit Vehicle' : 'Add Vehicle'}</Text>
            <Text style={styles.modalSubtitle}>Configure your vehicle's dimensions and class for accurate route planning.</Text>

            {/* Vehicle name */}
            <Text style={styles.fieldLabel}>VEHICLE NAME</Text>
            <TextInput
              style={styles.input}
              placeholder="e.g. B-Double Main Rig"
              placeholderTextColor={COLORS.textTertiary}
              value={name}
              onChangeText={(t) => { setName(t); setFormError(null); }}
              returnKeyType="next"
            />

            {/* Vehicle class chips */}
            <Text style={styles.fieldLabel}>VEHICLE CLASS</Text>
            <View style={styles.classRow}>
              {VEHICLE_CLASSES.map((c) => (
                <TouchableOpacity
                  key={c.value}
                  style={[styles.classChip, vehicleClass === c.value && styles.classChipActive]}
                  onPress={() => setVehicleClass(c.value)}
                >
                  <Text
                    style={[
                      styles.classChipText,
                      vehicleClass === c.value && styles.classChipTextActive,
                    ]}
                  >
                    {c.label}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>

            {/* Dimensions */}
            <Text style={styles.fieldLabel}>DIMENSIONS (METRES)</Text>
            <View style={styles.rowInputs}>
              <View style={[styles.inputWrap, styles.inputThird]}>
                <Text style={styles.inputInlineLabel}>L</Text>
                <TextInput
                  style={styles.inputInline}
                  placeholder="0.0"
                  placeholderTextColor={COLORS.textTertiary}
                  keyboardType="decimal-pad"
                  value={length}
                  onChangeText={(t) => { setLength(t); setFormError(null); }}
                />
              </View>
              <View style={[styles.inputWrap, styles.inputThird]}>
                <Text style={styles.inputInlineLabel}>W</Text>
                <TextInput
                  style={styles.inputInline}
                  placeholder="0.0"
                  placeholderTextColor={COLORS.textTertiary}
                  keyboardType="decimal-pad"
                  value={width}
                  onChangeText={(t) => { setWidth(t); setFormError(null); }}
                />
              </View>
              <View style={[styles.inputWrap, styles.inputThird]}>
                <Text style={styles.inputInlineLabel}>H</Text>
                <TextInput
                  style={styles.inputInline}
                  placeholder="0.0"
                  placeholderTextColor={COLORS.textTertiary}
                  keyboardType="decimal-pad"
                  value={height}
                  onChangeText={(t) => { setHeight(t); setFormError(null); }}
                />
              </View>
            </View>

            {/* Mass */}
            <Text style={styles.fieldLabel}>MASS (TONNES)</Text>
            <View style={styles.rowInputs}>
              <View style={[styles.inputWrap, styles.inputHalf]}>
                <Text style={styles.inputInlineLabel}>GVM</Text>
                <TextInput
                  style={styles.inputInline}
                  placeholder="0.0"
                  placeholderTextColor={COLORS.textTertiary}
                  keyboardType="decimal-pad"
                  value={gvm}
                  onChangeText={(t) => { setGvm(t); setFormError(null); }}
                />
              </View>
              <View style={[styles.inputWrap, styles.inputHalf]}>
                <Text style={styles.inputInlineLabel}>GCM</Text>
                <TextInput
                  style={styles.inputInline}
                  placeholder="0.0"
                  placeholderTextColor={COLORS.textTertiary}
                  keyboardType="decimal-pad"
                  value={gcm}
                  onChangeText={(t) => { setGcm(t); setFormError(null); }}
                />
              </View>
            </View>

            <Text style={styles.fieldLabel}>PERMIT EXPIRY (OPTIONAL)</Text>
            <TextInput
              style={styles.input}
              placeholder="YYYY-MM-DD — e.g. 2026-12-31"
              placeholderTextColor={COLORS.textTertiary}
              value={permitExpiryDate}
              onChangeText={(t) => { setPermitExpiryDate(t); setFormError(null); }}
              keyboardType="numbers-and-punctuation"
              maxLength={10}
            />

            {/* Error box */}
            {formError && (
              <View style={styles.errorBox}>
                <Text style={styles.errorText}>⚠ {formError}</Text>
              </View>
            )}

            {/* Actions */}
            <View style={styles.modalActions}>
              <TouchableOpacity
                style={styles.cancelBtn}
                onPress={() => { resetForm(); setModalVisible(false); }}
                activeOpacity={0.8}
              >
                <Text style={styles.cancelBtnText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.saveBtn} onPress={handleSave} activeOpacity={0.85}>
                <Text style={styles.saveBtnText}>{editingId ? 'Update Vehicle' : 'Save Vehicle'}</Text>
              </TouchableOpacity>
            </View>
          </View>
        </KeyboardAvoidingView>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: COLORS.bg },
  safe: { flex: 1 },
  scrollContent: { paddingBottom: 24 },

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

  // Section header
  sectionHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginHorizontal: 20,
    marginTop: 24,
    marginBottom: 12,
  },
  sectionLabel: {
    fontSize: 11,
    fontWeight: '800',
    color: COLORS.textTertiary,
    letterSpacing: 1.5,
  },
  addBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: COLORS.accentDim,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
  },
  addBtnText: {
    fontSize: 11,
    fontWeight: '800',
    color: COLORS.accent,
    letterSpacing: 0.8,
  },

  // Empty state
  emptyState: {
    marginHorizontal: 20,
    alignItems: 'center',
    paddingVertical: 36,
    backgroundColor: COLORS.surface,
    borderRadius: 18,
    borderWidth: 1.5,
    borderColor: COLORS.border,
    borderStyle: 'dashed',
  },
  emptyIconWrap: {
    width: 52,
    height: 52,
    borderRadius: 26,
    backgroundColor: COLORS.surfaceRaised,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 12,
  },
  emptyIcon: { fontSize: 24 },
  emptyTitle: { fontSize: 14, fontWeight: '700', color: COLORS.textSecondary },
  emptySub: {
    fontSize: 12,
    color: COLORS.textTertiary,
    marginTop: 4,
    textAlign: 'center',
    paddingHorizontal: 32,
  },

  // Vehicle list
  profilesList: { marginHorizontal: 20, gap: 10 },
  vehicleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
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
  vehicleRowActive: {
    borderColor: COLORS.accentBg,
    backgroundColor: '#FFFBF0',
  },
  vehiclePlate: {
    width: 44,
    height: 44,
    borderRadius: 11,
    backgroundColor: COLORS.surfaceRaised,
    alignItems: 'center',
    justifyContent: 'center',
  },
  vehiclePlateActive: {
    backgroundColor: COLORS.accentDim,
  },
  vehiclePlateText: {
    fontSize: 13,
    fontWeight: '800',
    color: COLORS.textTertiary,
    letterSpacing: 0.3,
  },
  vehiclePlateTextActive: {
    color: COLORS.accent,
  },
  vehicleName: {
    fontSize: 14,
    fontWeight: '700',
    color: COLORS.textPrimary,
  },
  vehicleMeta: {
    fontSize: 11,
    color: COLORS.textTertiary,
    marginTop: 2,
    letterSpacing: 0.2,
  },
  permitTag: {
    fontSize: 9,
    fontWeight: '700',
    color: COLORS.textTertiary,
    marginTop: 3,
    letterSpacing: 0.3,
  },
  permitTagWarning: {
    color: COLORS.accent,
  },
  permitTagExpired: {
    color: COLORS.danger,
  },
  activeTag: {
    backgroundColor: COLORS.accentDim,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 20,
  },
  activeTagText: {
    fontSize: 9,
    fontWeight: '800',
    color: COLORS.accent,
    letterSpacing: 0.8,
  },
  editBtn: { paddingHorizontal: 4 },
  editIcon: { fontSize: 15, color: COLORS.textSecondary },
  deleteBtn: {
    padding: 4,
  },
  deleteIcon: { fontSize: 20, color: COLORS.textTertiary, lineHeight: 20 },

  planRow: {
    flexDirection: 'row',
    gap: 10,
    marginHorizontal: 20,
  },
  planCard: {
    flex: 1,
    backgroundColor: COLORS.surface,
    borderRadius: 16,
    padding: 14,
    borderWidth: 1.5,
    borderColor: COLORS.border,
    position: 'relative',
  },
  planCardActive: {
    borderColor: COLORS.accent,
    backgroundColor: COLORS.accentDim,
  },
  planLabel: {
    fontSize: 10,
    fontWeight: '800',
    color: COLORS.textTertiary,
    letterSpacing: 1,
  },
  planPriceRow: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    marginTop: 8,
  },
  planPrice: {
    fontSize: 24,
    fontWeight: '800',
    color: COLORS.textPrimary,
    letterSpacing: -0.5,
  },
  planPeriod: {
    fontSize: 12,
    fontWeight: '600',
    color: COLORS.textSecondary,
    marginBottom: 3,
    marginLeft: 2,
  },
  planSub: {
    fontSize: 10,
    color: COLORS.textTertiary,
    marginTop: 4,
  },
  saveBadge: {
    position: 'absolute',
    top: -8,
    right: 10,
    backgroundColor: COLORS.accent,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 8,
  },
  saveBadgeText: {
    fontSize: 9,
    fontWeight: '800',
    color: '#1A1206',
    letterSpacing: 0.3,
  },
  planActiveBadge: {
    marginTop: 10,
    backgroundColor: COLORS.accent,
    borderRadius: 8,
    paddingVertical: 5,
    alignItems: 'center',
  },
  planActiveBadgeText: {
    fontSize: 9,
    fontWeight: '800',
    color: '#1A1206',
    letterSpacing: 0.5,
  },
  cancelPlanBtn: {
    marginHorizontal: 20,
    marginTop: 10,
    alignItems: 'center',
    paddingVertical: 8,
  },
  cancelPlanText: {
    fontSize: 12,
    color: COLORS.textTertiary,
    fontWeight: '600',
    textDecorationLine: 'underline',
  },
  noPlanHint: {
    fontSize: 11,
    color: COLORS.textTertiary,
    marginHorizontal: 20,
    marginTop: 10,
    textAlign: 'center',
  },

  // Account section
  accountCard: {
    marginHorizontal: 20,
    backgroundColor: COLORS.surface,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: COLORS.border,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.04,
    shadowRadius: 3,
    elevation: 1,
  },
  accountRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 14,
  },
  accountLabel: {
    fontSize: 13,
    fontWeight: '600',
    color: COLORS.textSecondary,
  },
  accountEmail: {
    fontSize: 13,
    color: COLORS.textTertiary,
    maxWidth: '65%',
    textAlign: 'right',
  },

  signOutBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    marginHorizontal: 20,
    marginTop: 12,
    backgroundColor: COLORS.dangerDim,
    borderRadius: 16,
    paddingVertical: 15,
    borderWidth: 1,
    borderColor: '#FCA5A5',
  },
  signOutText: {
    color: COLORS.danger,
    fontWeight: '700',
    fontSize: 14,
  },

  // Modal
  modalOverlay: {
    flex: 1,
    justifyContent: 'flex-end',
  },
  modalBackdrop: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0,0,0,0.35)',
  },
  modalCard: {
    backgroundColor: COLORS.surface,
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    padding: 24,
    paddingBottom: Platform.OS === 'ios' ? 40 : 28,
    gap: 10,
  },
  modalHandle: {
    width: 40,
    height: 4,
    borderRadius: 2,
    backgroundColor: COLORS.border,
    alignSelf: 'center',
    marginBottom: 4,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: '800',
    color: COLORS.textPrimary,
  },
  modalSubtitle: {
    fontSize: 13,
    color: COLORS.textTertiary,
    marginBottom: 4,
    lineHeight: 18,
  },
  fieldLabel: {
    fontSize: 10,
    fontWeight: '800',
    color: COLORS.textTertiary,
    letterSpacing: 1.2,
    marginTop: 4,
    marginBottom: 2,
  },
  input: {
    backgroundColor: COLORS.inputBg,
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 13,
    fontSize: 14,
    color: COLORS.textPrimary,
  },
  rowInputs: { flexDirection: 'row', gap: 8 },
  inputWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.inputBg,
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 12,
    gap: 6,
  },
  inputInlineLabel: {
    fontSize: 11,
    fontWeight: '800',
    color: COLORS.textTertiary,
    letterSpacing: 0.5,
  },
  inputInline: {
    flex: 1,
    fontSize: 14,
    color: COLORS.textPrimary,
    padding: 0,
  },
  inputThird: { flex: 1 },
  inputHalf: { flex: 1 },

  // Vehicle class chips
  classRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 6 },
  classChip: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: COLORS.surfaceRaised,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  classChipActive: {
    backgroundColor: COLORS.accentDim,
    borderColor: COLORS.accentBg,
  },
  classChipText: {
    fontSize: 11,
    fontWeight: '700',
    color: COLORS.textSecondary,
    letterSpacing: 0.3,
  },
  classChipTextActive: { color: COLORS.accent },

  // Error
  errorBox: {
    backgroundColor: COLORS.dangerDim,
    borderRadius: 10,
    padding: 12,
    borderLeftWidth: 3,
    borderLeftColor: COLORS.danger,
  },
  errorText: { fontSize: 12, color: COLORS.danger, fontWeight: '600' },

  // Modal actions
  modalActions: { flexDirection: 'row', gap: 10, marginTop: 4 },
  cancelBtn: {
    flex: 1,
    paddingVertical: 15,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: COLORS.border,
    alignItems: 'center',
    backgroundColor: COLORS.surfaceRaised,
  },
  cancelBtnText: { color: COLORS.textSecondary, fontWeight: '700', fontSize: 14 },
  saveBtn: {
    flex: 1.4,
    paddingVertical: 15,
    borderRadius: 14,
    backgroundColor: COLORS.accentBg,
    alignItems: 'center',
    shadowColor: COLORS.accentBg,
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.3,
    shadowRadius: 6,
    elevation: 3,
  },
  saveBtnText: { color: '#1A1206', fontWeight: '800', fontSize: 14 },
});
