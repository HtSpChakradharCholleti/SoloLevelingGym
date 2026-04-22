import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Modal,
  TouchableOpacity,
  Platform,
  TouchableWithoutFeedback,
  Keyboard,
  TextInput,
  Animated,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { COLORS, FONTS, FONT_SIZES, SPACING, BORDER_RADIUS, SHADOWS } from '../theme';
import { usePlayer } from '../store/PlayerContext';
import { getTodayString } from '../utils/quests';
import SoundManager from '../utils/SoundManager';

// ─── Tab constants ────────────────────────────────────────────────────────────
const TAB_WEIGHT = 'weight';
const TAB_MEASUREMENTS = 'measurements';

// ─── Measurement fields definition ───────────────────────────────────────────
const MEASUREMENT_FIELDS = [
  { key: 'bicep',  label: 'Bicep',  icon: 'arm-flex',        color: '#7c91ff', placeholder: '0.0' },
  { key: 'chest',  label: 'Chest',  icon: 'human-handsup',   color: '#ff7c7c', placeholder: '0.0' },
  { key: 'belly',  label: 'Belly / Waist', icon: 'human',    color: '#7cffb8', placeholder: '0.0' },
];

// ─── Shared date selector ─────────────────────────────────────────────────────
function DateSelector({ date, onChangeDate }) {
  const today = getTodayString();
  const yesterday = (() => {
    const d = new Date();
    d.setDate(d.getDate() - 1);
    return d.toISOString().split('T')[0];
  })();

  return (
    <View style={styles.dateSelector}>
      <TouchableOpacity
        style={[styles.dateChip, date === today && styles.dateChipActive]}
        onPress={() => { SoundManager.playTap(); onChangeDate(today); }}
      >
        <Text style={[styles.dateChipText, date === today && styles.dateChipTextActive]}>TODAY</Text>
      </TouchableOpacity>
      <TouchableOpacity
        style={[styles.dateChip, date === yesterday && styles.dateChipActive]}
        onPress={() => { SoundManager.playTap(); onChangeDate(yesterday); }}
      >
        <Text style={[styles.dateChipText, date === yesterday && styles.dateChipTextActive]}>YESTERDAY</Text>
      </TouchableOpacity>
      <View style={styles.dateDisplay}>
        <MaterialCommunityIcons name="calendar-edit" size={16} color={COLORS.textMuted} />
        <TextInput
          style={styles.dateInput}
          value={date}
          onChangeText={onChangeDate}
          placeholder="YYYY-MM-DD"
          placeholderTextColor={COLORS.textMuted}
          maxLength={10}
        />
      </View>
    </View>
  );
}

// ─── Weight Tab ───────────────────────────────────────────────────────────────
function WeightTab({ date, onClose }) {
  const { weightHistory, logWeight } = usePlayer();
  const [weight, setWeight] = useState('');
  const [unit, setUnit] = useState('kg');

  useEffect(() => {
    const entry = weightHistory.find(e => e.date === date);
    if (entry) {
      setWeight(entry.weight.toString());
      setUnit(entry.unit || 'kg');
    } else {
      setWeight('');
      if (weightHistory.length > 0) setUnit(weightHistory[0].unit || 'kg');
    }
  }, [date, weightHistory]);

  const toggleUnit = () => {
    SoundManager.playTap();
    setUnit(prev => {
      const next = prev === 'kg' ? 'lbs' : 'kg';
      if (weight) {
        const val = parseFloat(weight);
        if (!isNaN(val)) {
          setWeight(prev === 'kg' ? (val * 2.20462).toFixed(1) : (val / 2.20462).toFixed(1));
        }
      }
      return next;
    });
  };

  const handleSave = () => {
    const parsed = parseFloat(weight);
    if (!isNaN(parsed) && parsed > 0) {
      logWeight(parsed, unit, date);
      onClose();
    } else {
      SoundManager.playTap();
    }
  };

  return (
    <>
      <View style={styles.inputArea}>
        <TextInput
          style={styles.bigInput}
          value={weight}
          onChangeText={setWeight}
          keyboardType="decimal-pad"
          placeholder="0.0"
          placeholderTextColor={COLORS.textMuted}
          maxLength={5}
        />
        <TouchableOpacity style={styles.unitToggle} onPress={toggleUnit}>
          <Text style={styles.unitText}>{unit.toUpperCase()}</Text>
          <MaterialCommunityIcons name="swap-vertical" size={16} color={COLORS.accent} />
        </TouchableOpacity>
      </View>

      <TouchableOpacity
        style={[styles.saveButton, !weight && styles.saveButtonDisabled]}
        onPress={handleSave}
        disabled={!weight}
      >
        <LinearGradient
          colors={weight ? [COLORS.accentDark, COLORS.accent] : [COLORS.surfaceBorder, COLORS.surfaceBorder]}
          start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }}
          style={styles.saveGradient}
        >
          <Text style={[styles.saveText, !weight && { color: COLORS.textMuted }]}>
            UPDATE WEIGHT
          </Text>
        </LinearGradient>
      </TouchableOpacity>
    </>
  );
}

// ─── Measurements Tab ─────────────────────────────────────────────────────────
function MeasurementsTab({ date, onClose }) {
  const { measurementsHistory, logMeasurement } = usePlayer();
  const [values, setValues] = useState({ bicep: '', chest: '', belly: '' });

  // Load existing entry for this date
  useEffect(() => {
    const entry = measurementsHistory.find(e => e.date === date);
    if (entry) {
      setValues({
        bicep: entry.bicep !== undefined ? entry.bicep.toString() : '',
        chest: entry.chest !== undefined ? entry.chest.toString() : '',
        belly: entry.belly !== undefined ? entry.belly.toString() : '',
      });
    } else {
      setValues({ bicep: '', chest: '', belly: '' });
    }
  }, [date, measurementsHistory]);

  const handleSave = () => {
    const parsed = {};
    let hasValue = false;
    MEASUREMENT_FIELDS.forEach(({ key }) => {
      const v = parseFloat(values[key]);
      if (!isNaN(v) && v > 0) {
        parsed[key] = v;
        hasValue = true;
      }
    });
    if (hasValue) {
      logMeasurement(parsed, 'cm', date);
      onClose();
    } else {
      SoundManager.playTap();
    }
  };

  const hasAnyValue = MEASUREMENT_FIELDS.some(({ key }) => {
    const v = parseFloat(values[key]);
    return !isNaN(v) && v > 0;
  });

  return (
    <>
      <View style={styles.measurementFields}>
        {MEASUREMENT_FIELDS.map(({ key, label, icon, color, placeholder }) => (
          <View key={key} style={styles.measureField}>
            <View style={[styles.measureIconBg, { borderColor: color + '40', backgroundColor: color + '15' }]}>
              <MaterialCommunityIcons name={icon} size={20} color={color} />
            </View>
            <View style={styles.measureLabelWrap}>
              <Text style={[styles.measureLabel, { color }]}>{label}</Text>
              <Text style={styles.measureUnit}>cm</Text>
            </View>
            <TextInput
              style={[styles.measureInput, { borderColor: values[key] ? color + '60' : COLORS.surfaceBorder }]}
              value={values[key]}
              onChangeText={v => setValues(prev => ({ ...prev, [key]: v }))}
              keyboardType="decimal-pad"
              placeholder={placeholder}
              placeholderTextColor={COLORS.textMuted}
              maxLength={5}
            />
          </View>
        ))}
      </View>

      <TouchableOpacity
        style={[styles.saveButton, !hasAnyValue && styles.saveButtonDisabled]}
        onPress={handleSave}
        disabled={!hasAnyValue}
      >
        <LinearGradient
          colors={hasAnyValue ? [COLORS.accentDark, COLORS.accent] : [COLORS.surfaceBorder, COLORS.surfaceBorder]}
          start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }}
          style={styles.saveGradient}
        >
          <Text style={[styles.saveText, !hasAnyValue && { color: COLORS.textMuted }]}>
            SAVE MEASUREMENTS
          </Text>
        </LinearGradient>
      </TouchableOpacity>
    </>
  );
}

// ─── Root Modal ───────────────────────────────────────────────────────────────
export default function WeightLogModal({ visible, onClose }) {
  const [activeTab, setActiveTab] = useState(TAB_WEIGHT);
  const [date, setDate] = useState(getTodayString());
  const slideAnim = useRef(new Animated.Value(0)).current;

  // Reset to today every time the modal opens
  useEffect(() => {
    if (visible) {
      setDate(getTodayString());
      setActiveTab(TAB_WEIGHT);
      slideAnim.setValue(0);
    }
  }, [visible]);

  // Animate modal up/down with keyboard — no KAV so no double-animation blink
  useEffect(() => {
    const duration = Platform.OS === 'ios' ? 250 : 200;

    const onShow = (e) => {
      const kbHeight = e?.endCoordinates?.height ?? 280;
      // Shift up by half the keyboard height to keep modal visible and centered
      Animated.timing(slideAnim, {
        toValue: -(kbHeight / 2),
        duration,
        useNativeDriver: true,
      }).start();
    };

    const onHide = () => {
      Animated.timing(slideAnim, {
        toValue: 0,
        duration,
        useNativeDriver: true,
      }).start();
    };

    const showEvent = Platform.OS === 'ios' ? 'keyboardWillShow' : 'keyboardDidShow';
    const hideEvent = Platform.OS === 'ios' ? 'keyboardWillHide' : 'keyboardDidHide';

    const showSub = Keyboard.addListener(showEvent, onShow);
    const hideSub = Keyboard.addListener(hideEvent, onHide);
    return () => {
      showSub.remove();
      hideSub.remove();
    };
  }, [slideAnim]);

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      {/* Full-screen backdrop */}
      <TouchableWithoutFeedback onPress={() => { Keyboard.dismiss(); onClose(); }}>
        <View style={styles.backdrop} />
      </TouchableWithoutFeedback>

      {/* Animated container — translates with keyboard, no layout recalculations */}
      <Animated.View
        pointerEvents="box-none"
        style={[styles.centeredContainer, { transform: [{ translateY: slideAnim }] }]}
      >
        <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
          <View style={styles.modalContentWrapper}>
            <View style={[styles.modalContent, SHADOWS.dark]}>
              <LinearGradient
                colors={[COLORS.surface, COLORS.surfaceLight]}
                style={styles.modalGradient}
              >
                {/* Header */}
                <View style={styles.header}>
                  <View style={styles.headerTitleWrap}>
                    <MaterialCommunityIcons
                      name={activeTab === TAB_WEIGHT ? 'scale-bathroom' : 'tape-measure'}
                      size={22}
                      color={COLORS.accent}
                    />
                    <Text style={styles.title}>
                      {activeTab === TAB_WEIGHT ? 'LOG WEIGHT' : 'LOG MEASUREMENTS'}
                    </Text>
                  </View>
                  <TouchableOpacity onPress={onClose} style={styles.closeButton}>
                    <MaterialCommunityIcons name="close" size={22} color={COLORS.textSecondary} />
                  </TouchableOpacity>
                </View>

                {/* Tab Switcher */}
                <View style={styles.tabRow}>
                  <TouchableOpacity
                    style={[styles.tab, activeTab === TAB_WEIGHT && styles.tabActive]}
                    onPress={() => { SoundManager.playTap(); setActiveTab(TAB_WEIGHT); }}
                  >
                    <MaterialCommunityIcons
                      name="scale-bathroom"
                      size={15}
                      color={activeTab === TAB_WEIGHT ? COLORS.accent : COLORS.textMuted}
                    />
                    <Text style={[styles.tabText, activeTab === TAB_WEIGHT && styles.tabTextActive]}>
                      Weight
                    </Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={[styles.tab, activeTab === TAB_MEASUREMENTS && styles.tabActive]}
                    onPress={() => { SoundManager.playTap(); setActiveTab(TAB_MEASUREMENTS); }}
                  >
                    <MaterialCommunityIcons
                      name="tape-measure"
                      size={15}
                      color={activeTab === TAB_MEASUREMENTS ? COLORS.accent : COLORS.textMuted}
                    />
                    <Text style={[styles.tabText, activeTab === TAB_MEASUREMENTS && styles.tabTextActive]}>
                      Measurements
                    </Text>
                  </TouchableOpacity>
                </View>

                {/* Date Selector */}
                <DateSelector date={date} onChangeDate={setDate} />

                {/* Tab Content */}
                {activeTab === TAB_WEIGHT ? (
                  <WeightTab date={date} onClose={onClose} />
                ) : (
                  <MeasurementsTab date={date} onClose={onClose} />
                )}
              </LinearGradient>
            </View>
          </View>
        </TouchableWithoutFeedback>
      </Animated.View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  // Absolute backdrop covers the whole screen (dimmed background)
  backdrop: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0,0,0,0.78)',
  },
  // Centered container: absolute, full-screen, centers content — translateY moves it
  centeredContainer: {
    ...StyleSheet.absoluteFillObject,
    justifyContent: 'center',
    alignItems: 'center',
    padding: SPACING.base,
  },
  modalContentWrapper: {
    width: '100%',
    maxWidth: 420,
    alignSelf: 'center',
  },
  modalContent: {
    borderRadius: BORDER_RADIUS.xl,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: COLORS.surfaceBorder,
    width: '100%',
  },
  modalGradient: {
    padding: SPACING.xl,
  },

  // Header
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: SPACING.base,
  },
  headerTitleWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.sm,
  },
  title: {
    fontFamily: FONTS.heading,
    fontSize: FONT_SIZES.base,
    fontWeight: '700',
    color: COLORS.textPrimary,
    letterSpacing: 2,
  },
  closeButton: { padding: SPACING.xs },

  // Tabs
  tabRow: {
    flexDirection: 'row',
    backgroundColor: COLORS.background,
    borderRadius: BORDER_RADIUS.md,
    borderWidth: 1,
    borderColor: COLORS.surfaceBorder,
    padding: 3,
    marginBottom: SPACING.lg,
    gap: 3,
  },
  tab: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: SPACING.xs,
    paddingVertical: SPACING.sm,
    borderRadius: BORDER_RADIUS.sm,
  },
  tabActive: {
    backgroundColor: COLORS.accentGlow,
    borderWidth: 1,
    borderColor: COLORS.accent + '50',
  },
  tabText: {
    fontFamily: FONTS.heading,
    fontSize: FONT_SIZES.xs,
    fontWeight: '700',
    color: COLORS.textMuted,
    letterSpacing: 1,
  },
  tabTextActive: {
    color: COLORS.accent,
  },

  // Date selector
  dateSelector: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.xs,
    marginBottom: SPACING.lg,
    flexWrap: 'wrap',
  },
  dateChip: {
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.xs,
    borderRadius: BORDER_RADIUS.sm,
    backgroundColor: COLORS.surfaceLight,
    borderWidth: 1,
    borderColor: COLORS.surfaceBorder,
  },
  dateChipActive: {
    backgroundColor: COLORS.accentGlow,
    borderColor: COLORS.accent + '80',
  },
  dateChipText: {
    fontFamily: FONTS.heading,
    fontSize: FONT_SIZES.xs,
    color: COLORS.textMuted,
    fontWeight: '700',
  },
  dateChipTextActive: { color: COLORS.accent },
  dateDisplay: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.xs,
    marginLeft: 'auto',
    backgroundColor: COLORS.background,
    paddingHorizontal: SPACING.sm,
    paddingVertical: 4,
    borderRadius: BORDER_RADIUS.sm,
    borderWidth: 1,
    borderColor: COLORS.surfaceBorder,
  },
  dateInput: {
    fontFamily: FONTS.body,
    fontSize: FONT_SIZES.xs,
    color: COLORS.textSecondary,
    padding: 0,
    width: 82,
    textAlign: 'center',
  },

  // Weight tab
  inputArea: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: COLORS.background,
    borderRadius: BORDER_RADIUS.md,
    borderWidth: 1,
    borderColor: COLORS.surfaceBorder,
    marginBottom: SPACING.xl,
    paddingHorizontal: SPACING.lg,
    paddingVertical: SPACING.md,
  },
  bigInput: {
    flex: 1,
    fontFamily: FONTS.heading,
    fontSize: 48,
    fontWeight: '700',
    color: COLORS.textPrimary,
    textAlign: 'center',
    padding: 0,
    marginRight: SPACING.sm,
  },
  unitToggle: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.surfaceLight,
    paddingHorizontal: SPACING.sm,
    paddingVertical: SPACING.xs,
    borderRadius: BORDER_RADIUS.sm,
    gap: 4,
  },
  unitText: {
    fontFamily: FONTS.heading,
    fontSize: FONT_SIZES.md,
    fontWeight: '700',
    color: COLORS.accent,
  },

  // Measurement tab
  measurementFields: {
    gap: SPACING.sm,
    marginBottom: SPACING.xl,
  },
  measureField: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.background,
    borderRadius: BORDER_RADIUS.md,
    borderWidth: 1,
    borderColor: COLORS.surfaceBorder,
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.sm,
    gap: SPACING.md,
  },
  measureIconBg: {
    width: 38,
    height: 38,
    borderRadius: BORDER_RADIUS.md,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  measureLabelWrap: {
    flex: 1,
  },
  measureLabel: {
    fontFamily: FONTS.heading,
    fontSize: FONT_SIZES.sm,
    fontWeight: '700',
    letterSpacing: 0.5,
  },
  measureUnit: {
    fontFamily: FONTS.body,
    fontSize: FONT_SIZES.xs,
    color: COLORS.textMuted,
    marginTop: 1,
  },
  measureInput: {
    fontFamily: FONTS.heading,
    fontSize: FONT_SIZES.xl,
    fontWeight: '700',
    color: COLORS.textPrimary,
    textAlign: 'right',
    borderBottomWidth: 1.5,
    paddingBottom: 2,
    minWidth: 72,
    padding: 0,
  },

  // Save button (shared)
  saveButton: {
    borderRadius: BORDER_RADIUS.lg,
    overflow: 'hidden',
  },
  saveButtonDisabled: { opacity: 0.6 },
  saveGradient: {
    paddingVertical: SPACING.md,
    alignItems: 'center',
  },
  saveText: {
    fontFamily: FONTS.heading,
    fontSize: FONT_SIZES.md,
    fontWeight: '700',
    color: '#fff',
    letterSpacing: 2,
  },
});
