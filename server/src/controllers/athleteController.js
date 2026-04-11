const supabase = require('../config/supabase');
const {
  compareRecoveryAndWearable,
  validateNutritionInput,
  validateRecoveryInput,
  validateTrainingInput,
} = require('../services/dataQualityService');
const { triggerPrediction } = require('../services/predictionService');
const {
  annotateNutritionLog,
  annotateRecoveryLog,
  annotateTrainingLog,
  annotateWearableRecord,
} = require('../services/sourceLabelService');

const getDashboard = async (req, res) => {
  const athleteId = req.user.id;

  const [
    { data: athlete },
    { data: recentRecovery },
    { data: recentTraining },
    { data: latestPrediction },
    { data: wearable },
  ] = await Promise.all([
    supabase.from('athletes').select('id, name, email, specialization').eq('id', athleteId).single(),
    supabase.from('recovery_logs').select('*').eq('athlete_id', athleteId).order('date', { ascending: false }).limit(7),
    supabase.from('training_logs').select('*').eq('athlete_id', athleteId).order('date', { ascending: false }).limit(7),
    supabase.from('injury_predictions').select('*').eq('athlete_id', athleteId).order('created_at', { ascending: false }).limit(1).single(),
    supabase.from('wearable_data').select('*').eq('athlete_id', athleteId).order('date', { ascending: false }).limit(1).single(),
  ]);

  const normalizedRecovery = (recentRecovery ?? []).map(annotateRecoveryLog);
  const normalizedTraining = (recentTraining ?? []).map(annotateTrainingLog);
  const normalizedWearable = wearable ? annotateWearableRecord(wearable) : null;

  const dataQuality = {
    warnings: compareRecoveryAndWearable(recentRecovery?.[0], wearable),
  };

  res.json({
    athlete,
    recentRecovery: normalizedRecovery,
    recentTraining: normalizedTraining,
    latestPrediction,
    wearable: normalizedWearable,
    dataQuality,
  });
};

const submitRecoveryLog = async (req, res) => {
  const { sleep_hours, soreness_level, mood, numbness, notes } = req.body;
  const athleteId = req.user.id;

  const errors = validateRecoveryInput({ sleep_hours, soreness_level, mood, numbness });
  if (errors.length > 0) {
    return res.status(400).json({ error: errors[0], details: errors });
  }

  const { data, error } = await supabase
    .from('recovery_logs')
    .insert({ athlete_id: athleteId, date: new Date().toISOString().split('T')[0], sleep_hours, soreness_level, mood, numbness: numbness || false, notes })
    .select()
    .single();

  if (error) return res.status(500).json({ error: 'Failed to save recovery log.' });

  const prediction = await triggerPrediction(athleteId);

  res.status(201).json({
    message: 'Recovery log saved.',
    data,
    prediction,
  });
};

const submitTrainingLog = async (req, res) => {
  const { workout_type, intensity, duration_min, notes } = req.body;
  const athleteId = req.user.id;

  const errors = validateTrainingInput({ workout_type, intensity, duration_min });
  if (errors.length > 0) {
    return res.status(400).json({ error: errors[0], details: errors });
  }

  const { data, error } = await supabase
    .from('training_logs')
    .insert({ athlete_id: athleteId, date: new Date().toISOString().split('T')[0], workout_type, intensity, duration_min, notes })
    .select()
    .single();

  if (error) return res.status(500).json({ error: 'Failed to save training log.' });

  const prediction = await triggerPrediction(athleteId);

  res.status(201).json({
    message: 'Training log saved.',
    data,
    prediction,
  });
};

const submitNutritionLog = async (req, res) => {
  const { calories, protein_g, carbs_g, fats_g, meal_notes } = req.body;
  const athleteId = req.user.id;

  const { errors, warnings } = validateNutritionInput({ calories, protein_g, carbs_g, fats_g });
  if (errors.length > 0) {
    return res.status(400).json({ error: errors[0], details: errors });
  }

  const { data, error } = await supabase
    .from('nutrition_logs')
    .insert({
      athlete_id: athleteId,
      date: new Date().toISOString().split('T')[0],
      calories,
      protein_g: protein_g ?? null,
      carbs_g: carbs_g ?? null,
      fats_g: fats_g ?? null,
      meal_notes: meal_notes ?? null,
    })
    .select()
    .single();

  if (error) return res.status(500).json({ error: 'Failed to save nutrition log.' });

  res.status(201).json({ message: 'Nutrition log saved.', data, warnings });
};

const getReports = async (req, res) => {
  const athleteId = req.user.id;

  const [
    { data: predictions },
    { data: trainingLogs },
    { data: recoveryLogs },
    { data: nutritionLogs },
  ] = await Promise.all([
    supabase.from('injury_predictions').select('risk_score, risk_level, date, created_at').eq('athlete_id', athleteId).order('date', { ascending: true }).limit(30),
    supabase.from('training_logs').select('date, workout_type, intensity, duration_min').eq('athlete_id', athleteId).order('date', { ascending: true }).limit(30),
    supabase.from('recovery_logs').select('date, sleep_hours, soreness_level, mood').eq('athlete_id', athleteId).order('date', { ascending: true }).limit(30),
    supabase.from('nutrition_logs').select('date, calories, protein_g, carbs_g, fats_g').eq('athlete_id', athleteId).order('date', { ascending: false }).limit(14),
  ]);

  res.json({
    predictions: predictions ?? [],
    trainingLogs: (trainingLogs ?? []).map(annotateTrainingLog),
    recoveryLogs: (recoveryLogs ?? []).map(annotateRecoveryLog),
    nutritionLogs: (nutritionLogs ?? []).map(annotateNutritionLog),
  });
};

const getWearable = async (req, res) => {
  const athleteId = req.user.id;

  const [
    { data: athlete },
    { data: history },
  ] = await Promise.all([
    supabase.from('athletes').select('device_id').eq('id', athleteId).single(),
    supabase.from('wearable_data').select('*').eq('athlete_id', athleteId).order('date', { ascending: false }).limit(10),
  ]);

  res.json({
    device_id: athlete?.device_id ?? null,
    history: (history ?? []).map(annotateWearableRecord),
  });
};

module.exports = { getDashboard, submitRecoveryLog, submitTrainingLog, submitNutritionLog, getReports, getWearable };
