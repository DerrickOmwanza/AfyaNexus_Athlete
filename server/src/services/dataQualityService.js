const ALLOWED_MOODS = ['Excellent', 'Good', 'Neutral', 'Tired', 'Anxious', 'Poor'];

const toNumber = (value) => {
  if (value === null || value === undefined || value === '') return null;
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : NaN;
};

const isWholeNumber = (value) => Number.isInteger(Number(value));

const validateRange = ({ field, value, min, max, integer = false }) => {
  if (value === null || value === undefined || value === '') {
    return `${field} is required.`;
  }

  const numeric = toNumber(value);
  if (Number.isNaN(numeric)) return `${field} must be a valid number.`;
  if (integer && !isWholeNumber(value)) return `${field} must be a whole number.`;
  if (numeric < min || numeric > max) return `${field} must be between ${min} and ${max}.`;
  return null;
};

const validateRecoveryInput = ({ sleep_hours, soreness_level, mood, numbness }) => {
  const errors = [
    validateRange({ field: 'sleep_hours', value: sleep_hours, min: 0, max: 24 }),
    validateRange({ field: 'soreness_level', value: soreness_level, min: 1, max: 10, integer: true }),
  ].filter(Boolean);

  if (!mood || !ALLOWED_MOODS.includes(mood)) {
    errors.push(`mood must be one of: ${ALLOWED_MOODS.join(', ')}.`);
  }

  if (typeof numbness !== 'undefined' && typeof numbness !== 'boolean') {
    errors.push('numbness must be a boolean.');
  }

  return errors;
};

const validateTrainingInput = ({ workout_type, intensity, duration_min }) => {
  const errors = [
    validateRange({ field: 'intensity', value: intensity, min: 1, max: 10, integer: true }),
    validateRange({ field: 'duration_min', value: duration_min, min: 1, max: 600, integer: true }),
  ].filter(Boolean);

  if (!workout_type || typeof workout_type !== 'string' || !workout_type.trim()) {
    errors.push('workout_type is required.');
  }

  return errors;
};

const buildNutritionWarnings = ({ calories, protein_g, carbs_g, fats_g }) => {
  const warnings = [];
  const protein = toNumber(protein_g) ?? 0;
  const carbs = toNumber(carbs_g) ?? 0;
  const fats = toNumber(fats_g) ?? 0;
  const totalCalories = toNumber(calories);

  if (Number.isFinite(totalCalories)) {
    const macroDerivedCalories = protein * 4 + carbs * 4 + fats * 9;
    if (macroDerivedCalories > 0 && Math.abs(macroDerivedCalories - totalCalories) > 150) {
      warnings.push(
        `Logged calories differ from macro-derived calories by ${Math.abs(macroDerivedCalories - totalCalories).toFixed(0)} kcal.`
      );
    }
  }

  if (Number.isFinite(totalCalories) && totalCalories < 800) {
    warnings.push('Daily calories are unusually low and may indicate an incomplete entry.');
  }

  return warnings;
};

const validateNutritionInput = ({ calories, protein_g, carbs_g, fats_g }) => {
  const errors = [
    validateRange({ field: 'calories', value: calories, min: 1, max: 20000 }),
  ].filter(Boolean);

  for (const [field, value] of Object.entries({ protein_g, carbs_g, fats_g })) {
    if (value === null || value === undefined || value === '') continue;
    const rangeError = validateRange({ field, value, min: 0, max: 2000 });
    if (rangeError) errors.push(rangeError);
  }

  return { errors, warnings: buildNutritionWarnings({ calories, protein_g, carbs_g, fats_g }) };
};

const validateWearableInput = ({ device_id, heart_rate_avg, sleep_duration, steps }) => {
  const errors = [
    validateRange({ field: 'heart_rate_avg', value: heart_rate_avg, min: 30, max: 220, integer: true }),
    validateRange({ field: 'sleep_duration', value: sleep_duration, min: 0, max: 24 }),
    validateRange({ field: 'steps', value: steps, min: 0, max: 150000, integer: true }),
  ].filter(Boolean);

  if (!device_id || typeof device_id !== 'string' || !device_id.trim()) {
    errors.push('device_id is required.');
  }

  return errors;
};

const compareRecoveryAndWearable = (recovery, wearable) => {
  const warnings = [];

  if (!recovery || !wearable) return warnings;

  if (
    Number.isFinite(recovery.sleep_hours) &&
    Number.isFinite(wearable.sleep_duration) &&
    Math.abs(Number(recovery.sleep_hours) - Number(wearable.sleep_duration)) > 2
  ) {
    warnings.push('Manual sleep entry differs significantly from wearable sleep duration.');
  }

  if (
    Number.isFinite(recovery.soreness_level) &&
    recovery.soreness_level >= 8 &&
    Number.isFinite(wearable.steps) &&
    wearable.steps >= 20000
  ) {
    warnings.push('High soreness with very high step count suggests recovery should be reviewed.');
  }

  return warnings;
};

module.exports = {
  compareRecoveryAndWearable,
  validateRecoveryInput,
  validateTrainingInput,
  validateNutritionInput,
  validateWearableInput,
};
