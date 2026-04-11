const router = require('express').Router();
const { authenticate, authorizeRoles } = require('../middleware/auth');
const { getMyAthletes, getAthleteDashboard, createDietPlan, getAllDietPlans } = require('../controllers/nutritionistController');

router.use(authenticate, authorizeRoles('nutritionist'));

router.get('/athletes', getMyAthletes);
router.get('/athletes/:athlete_id/dashboard', getAthleteDashboard);
router.get('/diet-plans', getAllDietPlans);
router.post('/diet-plan', createDietPlan);

module.exports = router;
