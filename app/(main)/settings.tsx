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
import { router } from 'expo-router';
import { ArrowLeft, Plus, Trash, SignOut } from 'phosphor-react-native';
import { useAuthStore } from '@/src/stores/authStore';
import { useVehicleStore } from '@/src/stores/vehicleStore';
import { VehicleClass, AxleConfig } from '@/src/types/vehicle';

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

export default function SettingsScreen() {
  const { user, signOut } = useAuthStore();
  const {
    profiles,
    activeProfileId,
    hydrate,
    addProfile,
    deleteProfile,
    setActiveProfile,
  } = useVehicleStore();

  const [modalVisible, setModalVisible] = useState(false);
  const [name, setName] = useState('');
  const [vehicleClass, setVehicleClass] = useState<VehicleClass>('GENERAL_ACCESS');
  const [length, setLength] = useState('');
  const [width, setWidth] = useState('');
  const [height, setHeight] = useState('');
  const [gvm, setGvm] = useState('');
  const [gcm, setGcm] = useState('');
  const [formError, setFormError] = useState<string | null>(null);

  useEffect(() => {
    if (user?.id) hydrate(user.id);
  }, [user?.id]);

  const resetForm = () => {
    setName('');
    setVehicleClass('GENERAL_ACCESS');
    setLength('');
    setWidth('');
    setHeight('');
    setGvm('');
    setGcm('');
    setFormError(null);
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
    await addProfile({
      name: name.trim(),
      vehicleClass,
      lengthMetres: parsed[0],
      widthMetres: parsed[1],
      heightMetres: parsed[2],
      gvmTonnes: parsed[3],
      gcmTonnes: parsed[4],
      axleConfig: 'TANDEM' as AxleConfig,
      dangerousGoods: false,
      permitExpiryDate: null,
    });
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
          <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
            <ArrowLeft size={20} color={COLORS.textPrimary} weight="bold" />
          </TouchableOpacity>
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
              onPress={() => setModalVisible(true)}
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
              onPress={() => setModalVisible(true)}
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
              {profiles.map((p) => {
                const isActive = activeProfileId === p.id;
                return (
                  <TouchableOpacity
                    key={p.id}
                    style={[styles.vehicleRow, isActive && styles.vehicleRowActive]}
                    onPress={() => setActiveProfile(p.id)}
                    activeOpacity={0.8}
                  >
                    <View style={[styles.vehiclePlate, isActive && styles.vehiclePlateActive]}>
                      <Text style={[styles.vehiclePlateText, isActive && styles.vehiclePlateTextActive]}>
                        {p.vehicleClass.slice(0, 2)}
                      </Text>
                    </View>

                    <View style={{ flex: 1 }}>
                      <Text style={styles.vehicleName}>{p.name}</Text>
                      <Text style={styles.vehicleMeta}>
                        {p.lengthMetres}m · {p.gcmTonnes}t · {p.vehicleClass.replace(/_/g, ' ')}
                      </Text>
                    </View>

                    {isActive && (
                      <View style={styles.activeTag}>
                        <Text style={styles.activeTagText}>ACTIVE</Text>
                      </View>
                    )}

                    <TouchableOpacity
                      onPress={() => handleDelete(p.id, p.name)}
                      hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
                      style={styles.deleteBtn}
                    >
                      <Trash size={16} color={COLORS.textTertiary} weight="regular" />
                    </TouchableOpacity>
                  </TouchableOpacity>
                );
              })}
            </View>
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
            <Text style={styles.modalTitle}>Add Vehicle</Text>
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
                <Text style={styles.saveBtnText}>Save Vehicle</Text>
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
  deleteBtn: {
    padding: 4,
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
