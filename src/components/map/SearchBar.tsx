import React, { useState, useRef, useCallback } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  FlatList,
  Keyboard,
} from 'react-native';
import { SearchResult, Coords } from '@/src/types/trip';
import { searchPlaces, debounce } from '@/src/services/geocoding';

const COLORS = {
  surface: '#16191E',
  surfaceRaised: '#1D2127',
  border: '#262B33',
  accent: '#FFB020',
  textPrimary: '#F5F6F7',
  textSecondary: '#7C8390',
  textTertiary: '#4A505C',
  success: '#34D399',
  danger: '#F87171',
};

interface SearchBarProps {
  originText: string;
  destinationText: string;
  onOriginSelect: (result: SearchResult) => void;
  onDestinationSelect: (result: SearchResult) => void;
  onOriginTextChange: (text: string) => void;
  onDestinationTextChange: (text: string) => void;
  currentLocation: Coords | null;
  onClear: () => void;
}

type ActiveField = 'origin' | 'destination' | null;

export default function SearchBar({
  originText,
  destinationText,
  onOriginSelect,
  onDestinationSelect,
  onOriginTextChange,
  onDestinationTextChange,
  currentLocation,
  onClear,
}: SearchBarProps) {
  const [activeField, setActiveField] = useState<ActiveField>(null);
  const [results, setResults] = useState<SearchResult[]>([]);
  const [loading, setLoading] = useState(false);
  const lastFiredRequestId = useRef(0);

  const destinationRef = useRef<TextInput>(null);

  const doSearch = useCallback(
    debounce(async (query: string) => {
      if (query.trim().length < 3) {
        setResults([]);
        setLoading(false);
        return;
      }
      try {
        const { results, requestId } = await searchPlaces(
          query,
          currentLocation ?? undefined
        );
        if (requestId >= lastFiredRequestId.current) {
          setResults(results);
        }
      } catch {
        setResults([]);
      } finally {
        setLoading(false);
      }
    }, 800),
    [currentLocation]
  );

  const fireSearch = (text: string) => {
    lastFiredRequestId.current += 1;
    setLoading(true);
    doSearch(text);
  };

  const handleSelect = (result: SearchResult) => {
    Keyboard.dismiss();
    setResults([]);
    setActiveField(null);
    if (activeField === 'origin') {
      onOriginSelect(result);
    } else {
      onDestinationSelect(result);
    }
  };

  const showDropdown = activeField !== null && (results.length > 0 || loading);

  return (
    <View style={styles.wrapper}>
      <View style={styles.card}>
        <View style={styles.row}>
          <View style={styles.dotGreen} />
          <TextInput
            style={styles.input}
            placeholder="From"
            placeholderTextColor={COLORS.textTertiary}
            value={originText}
            onChangeText={(t) => { onOriginTextChange(t); fireSearch(t); }}
            onFocus={() => { setActiveField('origin'); setResults([]); }}
            returnKeyType="next"
            onSubmitEditing={() => destinationRef.current?.focus()}
          />
          {originText.length > 0 && (
            <TouchableOpacity onPress={() => { onOriginTextChange(''); setResults([]); }}>
              <Text style={styles.clearX}>×</Text>
            </TouchableOpacity>
          )}
        </View>

        <View style={styles.dividerRow}>
          <View style={styles.connectorLine} />
          <View style={styles.divider} />
        </View>

        <View style={styles.row}>
          <View style={styles.dotRed} />
          <TextInput
            ref={destinationRef}
            style={styles.input}
            placeholder="Where to?"
            placeholderTextColor={COLORS.textTertiary}
            value={destinationText}
            onChangeText={(t) => { onDestinationTextChange(t); fireSearch(t); }}
            onFocus={() => { setActiveField('destination'); setResults([]); }}
            returnKeyType="search"
          />
          {destinationText.length > 0 && (
            <TouchableOpacity onPress={() => { onDestinationTextChange(''); setResults([]); onClear(); }}>
              <Text style={styles.clearX}>×</Text>
            </TouchableOpacity>
          )}
        </View>
      </View>

      {showDropdown && (
        <View style={styles.dropdown}>
          {loading && results.length === 0 ? (
            <View style={styles.loadingRow}>
              <ActivityIndicator size="small" color={COLORS.textSecondary} />
              <Text style={styles.loadingText}>Searching...</Text>
            </View>
          ) : (
            <FlatList
              data={results}
              keyExtractor={(item) => item.id}
              keyboardShouldPersistTaps="handled"
              renderItem={({ item }) => (
                <TouchableOpacity
                  style={styles.resultItem}
                  onPress={() => handleSelect(item)}
                  activeOpacity={0.7}
                >
                  <View style={styles.resultPinWrap}>
                    <Text style={styles.resultPin}>◎</Text>
                  </View>
                  <View style={styles.resultText}>
                    <Text style={styles.resultShort} numberOfLines={1}>{item.shortName}</Text>
                    <Text style={styles.resultFull} numberOfLines={1}>{item.displayName}</Text>
                  </View>
                </TouchableOpacity>
              )}
              ItemSeparatorComponent={() => <View style={styles.sep} />}
            />
          )}
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper: { position: 'absolute', top: 0, left: 0, right: 0, zIndex: 100 },
  card: {
    margin: 12,
    backgroundColor: COLORS.surface,
    borderRadius: 18,
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderWidth: 1,
    borderColor: COLORS.border,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 12,
    elevation: 8,
  },
  row: { flexDirection: 'row', alignItems: 'center', gap: 12, paddingVertical: 4 },
  dotGreen: { width: 10, height: 10, borderRadius: 5, backgroundColor: COLORS.success },
  dotRed: { width: 10, height: 10, borderRadius: 5, backgroundColor: COLORS.danger },
  input: { flex: 1, fontSize: 14, color: COLORS.textPrimary, paddingVertical: 6 },
  clearX: { fontSize: 18, color: COLORS.textTertiary, paddingHorizontal: 4 },
  dividerRow: { flexDirection: 'row', alignItems: 'center', marginLeft: 5 },
  connectorLine: { width: 2, height: 14, backgroundColor: COLORS.border, marginRight: 10, borderRadius: 1 },
  divider: { flex: 1, height: 1, backgroundColor: COLORS.border },
  dropdown: {
    marginHorizontal: 12,
    backgroundColor: COLORS.surface,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: COLORS.border,
    maxHeight: 280,
    overflow: 'hidden',
  },
  loadingRow: { flexDirection: 'row', alignItems: 'center', padding: 16, gap: 10 },
  loadingText: { fontSize: 13, color: COLORS.textSecondary },
  resultItem: { flexDirection: 'row', alignItems: 'center', padding: 14, gap: 10 },
  resultPinWrap: {
    width: 28, height: 28, borderRadius: 14,
    backgroundColor: COLORS.surfaceRaised,
    alignItems: 'center', justifyContent: 'center',
  },
  resultPin: { fontSize: 12, color: COLORS.accent },
  resultText: { flex: 1 },
  resultShort: { fontSize: 14, fontWeight: '700', color: COLORS.textPrimary },
  resultFull: { fontSize: 12, color: COLORS.textTertiary, marginTop: 2 },
  sep: { height: 1, backgroundColor: COLORS.border, marginLeft: 40 },
});
