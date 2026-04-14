const supabase = require('../config/supabase');
const {
  annotateNutritionLog,
  annotateTrainingLog,
} = require('../services/sourceLabelService');

const getMyAthletes = async (req, res) => {
  const nutritionistId = req.user.id;

  const { data: athletes, error } = await supabase
    .from('athletes')
    .select('id, name, email, specialization')
    .eq('nutritionist_id', nutritionistId);

  if (error) return res.status(500).json({ error: 'Failed to fetch athletes.' });

  if (!athletes || athletes.length === 0) return res.json({ athletes: [] });

  const athleteIds = athletes.map((a) => a.id);

  // Fetch latest prediction and diet plan count per athlete
  const [{ data: predictions }, { data: dietPlans }] = await Promise.all([
    supabase.from('injury_predictions').select('athlete_id, risk_score, risk_level').in('athlete_id', athleteIds).order('created_at', { ascending: false }),
    supabase.from('diet_plans').select('athlete_id').in('athlete_id', athleteIds),
  ]);

  // Keep only the latest prediction per athlete
  const latestPredMap: Record<number, { risk_score: number; risk_level: string }> = {};
  for (const p of (predictions ?? [])) {
    if (!latestPredMap[p.athlete_id]) latestPredMap[p.athlete_id] = p;
  }

  // Count diet plans per athlete
  const planCountMap: Record<number, number> = {};
  for (const p of (dietPlans ?? [])) {
    planCountMap[p.athlete_id] = (planCountMap[p.athlete_id] ?? 0) + 1;
  }

  const enriched = athletes.map((a) => ({
    ...a,
    latest_prediction: latestPredMap[a.id] ?? null,
    diet_plan_count:   planCountMap[a.id]   ?? 0,
  }));

  res.json({ athletes: enriched });
};

const getAthleteDashboard = async (req, res) => {
  const nutritionistId = req.user.id;
  const { athlete_id } = req.params;

  // RBAC: confirm this athlete is registered under this nutritionist
  const { data: athlete } = await supabase
    .from('athletes')
    .select('id, name, email, specialization, nutritionist_id')
    .eq('id', athlete_id)
    .single();

  if (!athlete || String(athlete.nutritionist_id) !== String(nutritionistId)) {
    return res.status(403).json({ error: 'Access denied. This athlete is not registered under you.' });
  }

  const [
    { data: nutritionLogs },
    { data: dietPlans },
    { data: trainingLogs },
    { data: latestPrediction },
  ] = await Promise.all([
    supabase.from('nutrition_logs').select('*').eq('athlete_id', athlete_id).order('date', { ascending: false }).limit(14),
    supabase.from('diet_plans').select('*').eq('athlete_id', athlete_id).eq('nutritionist_id', nutritionistId).order('created_at', { ascending: false }),
    supabase.from('training_logs').select('workout_type, intensity, duration_min, date').eq('athlete_id', athlete_id).order('date', { ascending: false }).limit(7),
    supabase.from('injury_predictions').select('risk_score, risk_level, date').eq('athlete_id', athlete_id).order('created_at', { ascending: false }).limit(1).single(),
  ]);

  res.json({
    athlete,
    nutritionLogs: (nutritionLogs ?? []).map(annotateNutritionLog),
    dietPlans,
    trainingLogs: (trainingLogs ?? []).map(annotateTrainingLog),
    latestPrediction,
  });
};

const createDietPlan = async (req, res) => {
  const nutritionistId = req.user.id;
  const { athlete_id, plan_name, recommendations } = req.body;

  // RBAC check
  const { data: athlete } = await supabase
    .from('athletes')
    .select('nutritionist_id')
    .eq('id', athlete_id)
    .single();

  if (!athlete || String(athlete.nutritionist_id) !== String(nutritionistId)) {
    return res.status(403).json({ error: 'Access denied. This athlete is not registered under you.' });
  }

  const { data, error } = await supabase
    .from('diet_plans')
    .insert({ nutritionist_id: nutritionistId, athlete_id, plan_name, recommendations })
    .select()
    .single();

  if (error) return res.status(500).json({ error: 'Failed to create diet plan.' });

  res.status(201).json({ message: 'Diet plan created.', data });
};

const getAllDietPlans = async (req, res) => {
  const nutritionistId = req.user.id;

  const { data: athletes, error: athleteError } = await supabase
    .from('athletes')
    .select('id, name, specialization')
    .eq('nutritionist_id', nutritionistId);

  if (athleteError) return res.status(500).json({ error: 'Failed to fetch athletes.' });

  if (!athletes || athletes.length === 0) return res.json({ athletes: [], dietPlans: [] });

  const athleteIds = athletes.map((a) => a.id);

  const { data: dietPlans, error: planError } = await supabase
    .from('diet_plans')
    .select('*')
    .in('athlete_id', athleteIds)
    .order('created_at', { ascending: false });

  if (planError) return res.status(500).json({ error: 'Failed to fetch diet plans.' });

  res.json({ athletes, dietPlans: dietPlans ?? [] });
};

module.exports = { getMyAthletes, getAthleteDashboard, createDietPlan, getAllDietPlans };
