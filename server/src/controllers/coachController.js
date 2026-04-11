const supabase = require('../config/supabase');
const {
  annotateRecoveryLog,
  annotateTrainingLog,
  annotateWearableRecord,
} = require('../services/sourceLabelService');

const getMyAthletes = async (req, res) => {
  const coachId = req.user.id;

  const { data: athletes, error } = await supabase
    .from('athletes')
    .select('id, name, email, specialization')
    .eq('coach_id', coachId);

  if (error) return res.status(500).json({ error: 'Failed to fetch athletes.' });

  // Attach latest injury prediction to each athlete
  const enriched = await Promise.all(
    athletes.map(async (a) => {
      const { data: pred } = await supabase
        .from('injury_predictions')
        .select('risk_score, risk_level, date')
        .eq('athlete_id', a.id)
        .order('created_at', { ascending: false })
        .limit(1)
        .single();
      return { ...a, latest_prediction: pred || null };
    })
  );

  res.json({ athletes: enriched });
};

const getAthleteDashboard = async (req, res) => {
  const coachId = req.user.id;
  const { athlete_id } = req.params;

  // RBAC: confirm this athlete belongs to this coach
  const { data: athlete } = await supabase
    .from('athletes')
    .select('id, name, email, specialization, coach_id')
    .eq('id', athlete_id)
    .single();

  if (!athlete || String(athlete.coach_id) !== String(coachId)) {
    return res.status(403).json({ error: 'Access denied. This athlete is not under your sponsorship.' });
  }

  const [
    { data: trainingLogs },
    { data: recoveryLogs },
    { data: predictions },
    { data: wearable },
  ] = await Promise.all([
    supabase.from('training_logs').select('*').eq('athlete_id', athlete_id).order('date', { ascending: false }).limit(14),
    supabase.from('recovery_logs').select('*').eq('athlete_id', athlete_id).order('date', { ascending: false }).limit(14),
    supabase.from('injury_predictions').select('*').eq('athlete_id', athlete_id).order('date', { ascending: false }).limit(14),
    supabase.from('wearable_data').select('*').eq('athlete_id', athlete_id).order('date', { ascending: false }).limit(7),
  ]);

  res.json({
    athlete,
    trainingLogs: (trainingLogs ?? []).map(annotateTrainingLog),
    recoveryLogs: (recoveryLogs ?? []).map(annotateRecoveryLog),
    predictions,
    wearable: (wearable ?? []).map(annotateWearableRecord),
  });
};

const getInjuryAlerts = async (req, res) => {
  const coachId = req.user.id;

  const { data: athletes } = await supabase
    .from('athletes')
    .select('id, name')
    .eq('coach_id', coachId);

  if (!athletes?.length) return res.json({ alerts: [] });

  const athleteIds = athletes.map((a) => a.id);

  const alerts = await Promise.all(
    athleteIds.map(async (id) => {
      const { data: pred } = await supabase
        .from('injury_predictions')
        .select('risk_score, risk_level, date')
        .eq('athlete_id', id)
        .order('created_at', { ascending: false })
        .limit(1)
        .single();

      const athlete = athletes.find((a) => a.id === id);
      return pred ? { athlete_id: id, name: athlete.name, ...pred } : null;
    })
  );

  res.json({ alerts: alerts.filter(Boolean) });
};

module.exports = { getMyAthletes, getAthleteDashboard, getInjuryAlerts };
