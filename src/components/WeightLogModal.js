import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Modal,
  TouchableOpacity,
  KeyboardAvoidingView,
  Platform,
  TouchableWithoutFeedback,
  Keyboard,
  TextInput,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { COLORS, FONTS, FONT_SIZES, SPACING, BORDER_RADIUS, SHADOWS } from '../theme';
import { usePlayer } from '../store/PlayerContext';
import { getTodayString } from '../utils/quests';
import SoundManager from '../utils/SoundManager';

export default function WeightLogModal({ visible, onClose }) {
  const { weightHistory, logWeight } = usePlayer();
  const [weight, setWeight] = useState('');
  const [unit, setUnit] = useState('kg');
  const [date, setDate] = useState(getTodayString());

  // Load weight for the selected date
  useEffect(() => {
    if (visible) {
      const logForDate = weightHistory.find((entry) => entry.date === date);
      if (logForDate) {
        setWeight(logForDate.weight.toString());
        setUnit(logForDate.unit || 'kg');
      } else {
        setWeight('');
        if (weightHistory.length > 0) {
          setUnit(weightHistory[0].unit || 'kg');
        }
      }
    }
  }, [visible, date, weightHistory]);

  const handleSave = () => {
    const parsedWeight = parseFloat(weight);
    if (!isNaN(parsedWeight) && parsedWeight > 0) {
      logWeight(parsedWeight, unit, date);
      onClose();
    } else {
      SoundManager.playTap();
    }
  };

  const setToday = () => {
    SoundManager.playTap();
    setDate(getTodayString());
  };

  const setYesterday = () => {
    SoundManager.playTap();
    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);
    setDate(yesterday.toISOString().split('T')[0]);
  };

  const toggleUnit = () => {
    SoundManager.playTap();
    setUnit((prev) => (prev === 'kg' ? 'lbs' : 'kg'));
    // Optionally convert value if there's already one entered
    if (weight) {
      const val = parseFloat(weight);
      if (!isNaN(val)) {
        if (unit === 'kg') {
          setWeight((val * 2.20462).toFixed(1));
        } else {
          setWeight((val / 2.20462).toFixed(1));
        }
      }
    }
  };

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
        <View style={styles.modalOverlay}>
          <KeyboardAvoidingView
            behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
            style={styles.modalContentWrapper}
          >
            <View style={[styles.modalContent, SHADOWS.dark]}>
              <LinearGradient
                colors={[COLORS.surface, COLORS.surfaceLight]}
                style={styles.modalGradient}
              >
                {/* Header */}
                <View style={styles.header}>
                  <View style={styles.headerTitleWrap}>
                    <MaterialCommunityIcons name="scale-bathroom" size={24} color={COLORS.accent} />
                    <Text style={styles.title}>LOG DAILY WEIGHT</Text>
                  </View>
                  <TouchableOpacity onPress={onClose} style={styles.closeButton}>
                    <MaterialCommunityIcons name="close" size={24} color={COLORS.textSecondary} />
                  </TouchableOpacity>
                </View>

                {/* Date Selection */}
                <View style={styles.dateSelector}>
                  <TouchableOpacity 
                    style={[styles.dateChip, date === getTodayString() && styles.dateChipActive]} 
                    onPress={setToday}
                  >
                    <Text style={[styles.dateChipText, date === getTodayString() && styles.dateChipTextActive]}>TODAY</Text>
                  </TouchableOpacity>
                  <TouchableOpacity 
                    style={[styles.dateChip, date !== getTodayString() && styles.dateChipActive]} 
                    onPress={setYesterday}
                  >
                    <Text style={[styles.dateChipText, date !== getTodayString() && styles.dateChipTextActive]}>YESTERDAY</Text>
                  </TouchableOpacity>
                  
                  <View style={styles.dateDisplay}>
                    <MaterialCommunityIcons name="calendar-edit" size={16} color={COLORS.textMuted} />
                    <TextInput
                      style={styles.dateInput}
                      value={date}
                      onChangeText={setDate}
                      placeholder="YYYY-MM-DD"
                      placeholderTextColor={COLORS.textMuted}
                      maxLength={10}
                    />
                  </View>
                </View>

                {/* Input Area */}
                <View style={styles.inputArea}>
                  <TextInput
                    style={styles.weightInput}
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

                {/* Save Button */}
                <TouchableOpacity
                  style={[styles.saveButton, !weight && styles.saveButtonDisabled]}
                  onPress={handleSave}
                  disabled={!weight}
                >
                  <LinearGradient
                    colors={
                      weight ? [COLORS.accentDark, COLORS.accent] : [COLORS.surfaceBorder, COLORS.surfaceBorder]
                    }
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 0 }}
                    style={styles.saveGradient}
                  >
                    <Text style={[styles.saveText, !weight && { color: COLORS.textMuted }]}>
                      UPDATE WEIGHT
                    </Text>
                  </LinearGradient>
                </TouchableOpacity>
              </LinearGradient>
            </View>
          </KeyboardAvoidingView>
        </View>
      </TouchableWithoutFeedback>
    </Modal>
  );
}

const styles = StyleSheet.create({
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.75)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: SPACING.base,
  },
  modalContentWrapper: {
    width: '100%',
    maxWidth: 400,
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
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: SPACING.xl,
  },
  headerTitleWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.sm,
  },
  title: {
    fontFamily: FONTS.heading,
    fontSize: FONT_SIZES.lg,
    fontWeight: '700',
    color: COLORS.textPrimary,
    letterSpacing: 2,
  },
  closeButton: {
    padding: SPACING.xs,
  },
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
    fontFamily: FONTS.bodyMedium,
    fontSize: FONT_SIZES.xs,
    color: COLORS.textMuted,
    fontWeight: '700',
  },
  dateChipTextActive: {
    color: COLORS.accent,
  },
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
    width: 80,
    textAlign: 'center',
  },
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
  weightInput: {
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
  saveButton: {
    borderRadius: BORDER_RADIUS.lg,
    overflow: 'hidden',
  },
  saveButtonDisabled: {
    opacity: 0.7,
  },
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
