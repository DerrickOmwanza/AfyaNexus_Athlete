const axios = require('axios');
const supabase = require('../config/supabase');

const triggerPrediction = async (athleteId) => {
  try {
    const { data: recovery } = await supabase
      .from('recovery_logs')
      .select('*')
      .eq('athlete_id', athleteId)
      .order('date', { ascending: false })
      .limit(1)
      .single();

    const { data: training } = await supabase
      .from('training_logs')
      .select('*')
      .eq('athlete_id', athleteId)
      .order('date', { ascending: false })
      .limit(1)
      .single();

    const { data: wearable } = await supabase
      .from('wearable_data')
      .select('*')
      .eq('athlete_id', athleteId)
      .order('date', { ascending: false })
      .limit(1)
      .single();

    if (!recovery && !training && !wearable) return { triggered: false };

    const response = await axios.post(`${process.env.ML_SERVICE_URL}/predict`, {
      sleep_hours: recovery?.sleep_hours ?? wearable?.sleep_duration ?? 7,
      soreness_level: recovery?.soreness_level ?? 3,
      mood: recovery?.mood ?? 'Good',
      numbness: recovery?.numbness ?? false,
      intensity: training?.intensity ?? 5,
      duration_min: training?.duration_min ?? 60,
      heart_rate_avg: wearable?.heart_rate_avg ?? 70,
    });

    const { risk_score, risk_level } = response.data;

    await supabase.from('injury_predictions').insert({
      athlete_id: athleteId,
      date: new Date().toISOString().split('T')[0],
      risk_score,
      risk_level,
      model_ver: 'v1.0-rule-based',
    });

    return { triggered: true, risk_score, risk_level };
  } catch {
    return { triggered: false };
  }
};

module.exports = { triggerPrediction };
