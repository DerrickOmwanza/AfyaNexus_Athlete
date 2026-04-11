const test = require('node:test');
const assert = require('node:assert/strict');

const {
  compareRecoveryAndWearable,
  validateNutritionInput,
  validateRecoveryInput,
  validateTrainingInput,
  validateWearableInput,
} = require('../src/services/dataQualityService');

test('validateRecoveryInput rejects invalid ranges and moods', () => {
  const errors = validateRecoveryInput({
    sleep_hours: 30,
    soreness_level: 11,
    mood: 'Amazing',
    numbness: 'sometimes',
  });

  assert.ok(errors.length >= 4);
});

test('validateTrainingInput accepts valid training payload', () => {
  const errors = validateTrainingInput({
    workout_type: 'Sprint',
    intensity: 8,
    duration_min: 70,
  });

  assert.equal(errors.length, 0);
});

test('validateNutritionInput emits warning when macros do not reconcile with calories', () => {
  const result = validateNutritionInput({
    calories: 1200,
    protein_g: 200,
    carbs_g: 200,
    fats_g: 100,
  });

  assert.equal(result.errors.length, 0);
  assert.ok(result.warnings.length > 0);
});

test('validateWearableInput rejects impossible wearable metrics', () => {
  const errors = validateWearableInput({
    device_id: '',
    heart_rate_avg: 400,
    sleep_duration: -2,
    steps: -100,
  });

  assert.ok(errors.length >= 4);
});

test('compareRecoveryAndWearable flags large mismatch between manual and wearable sleep', () => {
  const warnings = compareRecoveryAndWearable(
    { sleep_hours: 4, soreness_level: 3 },
    { sleep_duration: 7.5, steps: 6000 }
  );

  assert.ok(warnings.some((warning) => warning.includes('sleep entry differs')));
});
