package com.afyanexus.bridge

data class HealthConnectImportPayload(
    val device_id: String = "ANDROID-HEALTH-CONNECT",
    val recovery: RecoveryPayload?,
    val wearable: WearablePayload?,
    val training_sessions: List<TrainingPayload>,
    val nutrition_entries: List<NutritionPayload>,
)

data class RecoveryPayload(
    val date: String,
    val sleep_hours: Double,
    val soreness_level: Int,
    val mood: String,
    val numbness: Boolean,
    val notes: String,
)

data class WearablePayload(
    val date: String,
    val heart_rate_avg: Int,
    val sleep_duration: Double,
    val steps: Int,
)

data class TrainingPayload(
    val date: String,
    val workout_type: String,
    val intensity: Int,
    val duration_min: Int,
    val notes: String,
)

data class NutritionPayload(
    val date: String,
    val calories: Double,
    val protein_g: Double,
    val carbs_g: Double,
    val fats_g: Double,
    val meal_notes: String,
)
