const supabase = require('../config/supabase');
const {
  validateNutritionInput,
  validateRecoveryInput,
  validateTrainingInput,
  validateWearableInput,
} = require('../services/dataQualityService');
const { triggerPrediction } = require('../services/predictionService');

const normalizeDate = (value) => {
  if (!value) return new Date().toISOString().split('T')[0];
  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) return null;
  return parsed.toISOString().split('T')[0];
};

const importHealthConnect = async (req, res) => {
  const athleteId = req.user.id;
  const {
    device_id = 'ANDROID-HEALTH-CONNECT',
    recovery,
    training_sessions = [],
    nutrition_entries = [],
    wearable,
  } = req.body;

  if (!recovery && !wearable && training_sessions.length === 0 && nutrition_entries.length === 0) {
    return res.status(400).json({ error: 'Provide at least one Health Connect dataset to import.' });
  }

  const imported = {
    recovery: 0,
    training_sessions: 0,
    nutrition_entries: 0,
    wearable: 0,
  };
  const warnings = [];

  if (recovery) {
    const errors = validateRecoveryInput(recovery);
    if (errors.length > 0) return res.status(400).json({ error: errors[0], details: errors });

    const { error } = await supabase.from('recovery_logs').insert({
      athlete_id: athleteId,
      date: normalizeDate(recovery.date),
      sleep_hours: recovery.sleep_hours,
      soreness_level: recovery.soreness_level,
      mood: recovery.mood,
      numbness: recovery.numbness || false,
      notes: recovery.notes || 'Imported from Android Health Connect',
    });

    if (error) return res.status(500).json({ error: 'Failed to import Health Connect recovery data.' });
    imported.recovery += 1;
  }

  for (const session of training_sessions) {
    const errors = validateTrainingInput(session);
    if (errors.length > 0) return res.status(400).json({ error: errors[0], details: errors });

    const { error } = await supabase.from('training_logs').insert({
      athlete_id: athleteId,
      date: normalizeDate(session.date),
      workout_type: session.workout_type,
      intensity: session.intensity,
      duration_min: session.duration_min,
      notes: session.notes || 'Imported from Android Health Connect',
    });

    if (error) return res.status(500).json({ error: 'Failed to import Health Connect training data.' });
    imported.training_sessions += 1;
  }

  for (const entry of nutrition_entries) {
    const { errors, warnings: entryWarnings } = validateNutritionInput(entry);
    if (errors.length > 0) return res.status(400).json({ error: errors[0], details: errors });

    const { error } = await supabase.from('nutrition_logs').insert({
      athlete_id: athleteId,
      date: normalizeDate(entry.date),
      calories: entry.calories,
      protein_g: entry.protein_g ?? null,
      carbs_g: entry.carbs_g ?? null,
      fats_g: entry.fats_g ?? null,
      meal_notes: entry.meal_notes || 'Imported from Android Health Connect',
    });

    if (error) return res.status(500).json({ error: 'Failed to import Health Connect nutrition data.' });
    imported.nutrition_entries += 1;
    warnings.push(...entryWarnings);
  }

  if (wearable) {
    const errors = validateWearableInput({
      device_id,
      heart_rate_avg: wearable.heart_rate_avg,
      sleep_duration: wearable.sleep_duration,
      steps: wearable.steps,
    });
    if (errors.length > 0) return res.status(400).json({ error: errors[0], details: errors });

    const { data: athlete } = await supabase.from('athletes').select('device_id').eq('id', athleteId).single();

    const resolvedDeviceId = athlete?.device_id || device_id;

    if (!athlete?.device_id) {
      await supabase.from('athletes').update({ device_id: resolvedDeviceId }).eq('id', athleteId);
    }

    const { error } = await supabase.from('wearable_data').insert({
      athlete_id: athleteId,
      date: normalizeDate(wearable.date),
      heart_rate_avg: wearable.heart_rate_avg,
      sleep_duration: wearable.sleep_duration,
      steps: wearable.steps,
      device_id: resolvedDeviceId,
    });

    if (error) return res.status(500).json({ error: 'Failed to import Health Connect wearable data.' });
    imported.wearable += 1;
  }

  const prediction = await triggerPrediction(athleteId);

  res.status(201).json({
    message: 'Android Health Connect data imported successfully.',
    source: 'health_connect',
    imported,
    warnings,
    prediction,
  });
};

module.exports = { importHealthConnect };
