const supabase = require('../config/supabase');
const { validateWearableInput } = require('../services/dataQualityService');
const { triggerPrediction } = require('../services/predictionService');

const syncWearable = async (req, res) => {
  const { device_id, heart_rate_avg, sleep_duration, steps } = req.body;
  const athleteId = req.user.id;

  const errors = validateWearableInput({ device_id, heart_rate_avg, sleep_duration, steps });
  if (errors.length > 0) {
    return res.status(400).json({ error: errors[0], details: errors });
  }

  // Verify device_id belongs to this athlete
  const { data: athlete } = await supabase
    .from('athletes')
    .select('device_id')
    .eq('id', athleteId)
    .single();

  if (athlete?.device_id && athlete.device_id !== device_id) {
    return res.status(403).json({ error: 'Device not registered to this athlete account.' });
  }

  // If no device registered yet, save it
  if (!athlete?.device_id) {
    await supabase.from('athletes').update({ device_id }).eq('id', athleteId);
  }

  const { data, error } = await supabase
    .from('wearable_data')
    .insert({
      athlete_id: athleteId,
      date: new Date().toISOString().split('T')[0],
      heart_rate_avg,
      sleep_duration,
      steps,
      device_id,
    })
    .select()
    .single();

  if (error) return res.status(500).json({ error: 'Failed to save wearable data.' });

  const prediction = await triggerPrediction(athleteId);

  res.status(201).json({
    message: 'Wearable data synced successfully.',
    data,
    prediction,
  });
};

module.exports = { syncWearable };
