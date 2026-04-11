package com.afyanexus.bridge

import android.content.Context
import androidx.health.connect.client.HealthConnectClient
import androidx.health.connect.client.PermissionController
import androidx.health.connect.client.permission.HealthPermission
import androidx.health.connect.client.records.ExerciseSessionRecord
import androidx.health.connect.client.records.HeartRateRecord
import androidx.health.connect.client.records.NutritionRecord
import androidx.health.connect.client.records.SleepSessionRecord
import androidx.health.connect.client.records.StepsRecord
import androidx.health.connect.client.request.ReadRecordsRequest
import androidx.health.connect.client.time.TimeRangeFilter
import java.time.Instant
import java.time.ZoneOffset
import java.time.format.DateTimeFormatter
import kotlin.math.roundToInt

class HealthConnectBridge(private val context: Context) {
    private val client by lazy { HealthConnectClient.getOrCreate(context) }

    val permissions = setOf(
        HealthPermission.getReadPermission(ExerciseSessionRecord::class),
        HealthPermission.getReadPermission(HeartRateRecord::class),
        HealthPermission.getReadPermission(SleepSessionRecord::class),
        HealthPermission.getReadPermission(StepsRecord::class),
        HealthPermission.getReadPermission(NutritionRecord::class),
    )

    fun permissionContract() = PermissionController.createRequestPermissionResultContract()

    suspend fun collectLastSevenDaysPayload(): HealthConnectImportPayload {
        val endTime = Instant.now()
        val startTime = endTime.minusSeconds(7 * 24 * 60 * 60L)
        val timeRangeFilter = TimeRangeFilter.between(startTime, endTime)

        val sleepRecords = client.readRecords(
            ReadRecordsRequest(SleepSessionRecord::class, timeRangeFilter = timeRangeFilter)
        ).records

        val heartRateRecords = client.readRecords(
            ReadRecordsRequest(HeartRateRecord::class, timeRangeFilter = timeRangeFilter)
        ).records

        val stepRecords = client.readRecords(
            ReadRecordsRequest(StepsRecord::class, timeRangeFilter = timeRangeFilter)
        ).records

        val exerciseRecords = client.readRecords(
            ReadRecordsRequest(ExerciseSessionRecord::class, timeRangeFilter = timeRangeFilter)
        ).records

        val nutritionRecords = client.readRecords(
            ReadRecordsRequest(NutritionRecord::class, timeRangeFilter = timeRangeFilter)
        ).records

        val sleepHours = sleepRecords.maxByOrNull { it.endTime }?.let {
            java.time.Duration.between(it.startTime, it.endTime).toMinutes() / 60.0
        } ?: 7.0

        val averageHeartRate = heartRateRecords
            .flatMap { it.samples }
            .map { it.beatsPerMinute }
            .average()
            .takeIf { !it.isNaN() }
            ?.roundToInt() ?: 70

        val steps = stepRecords.sumOf { it.count.toInt() }

        val latestWorkout = exerciseRecords.maxByOrNull { it.endTime }
        val trainingPayload = latestWorkout?.let {
            listOf(
                TrainingPayload(
                    date = it.startTime.asIsoDate(),
                    workout_type = it.exerciseType.toString(),
                    intensity = 6,
                    duration_min = java.time.Duration.between(it.startTime, it.endTime).toMinutes().toInt().coerceAtLeast(1),
                    notes = "Imported from Android Health Connect native bridge",
                )
            )
        } ?: emptyList()

        val latestNutrition = nutritionRecords.maxByOrNull { it.endTime }
        val nutritionPayload = latestNutrition?.let {
            listOf(
                NutritionPayload(
                    date = it.startTime.asIsoDate(),
                    calories = it.energy?.inKilocalories ?: 2200.0,
                    protein_g = it.protein?.inGrams ?: 110.0,
                    carbs_g = it.totalCarbohydrate?.inGrams ?: 260.0,
                    fats_g = it.totalFat?.inGrams ?: 65.0,
                    meal_notes = "Imported from Android Health Connect native bridge",
                )
            )
        } ?: emptyList()

        val recoveryPayload = RecoveryPayload(
            date = endTime.asIsoDate(),
            sleep_hours = sleepHours,
            soreness_level = 3,
            mood = "Good",
            numbness = false,
            notes = "Imported from Android Health Connect native bridge",
        )

        val wearablePayload = WearablePayload(
            date = endTime.asIsoDate(),
            heart_rate_avg = averageHeartRate,
            sleep_duration = sleepHours,
            steps = steps,
        )

        return HealthConnectImportPayload(
            recovery = recoveryPayload,
            wearable = wearablePayload,
            training_sessions = trainingPayload,
            nutrition_entries = nutritionPayload,
        )
    }

    private fun Instant.asIsoDate(): String =
        DateTimeFormatter.ISO_LOCAL_DATE.format(this.atZone(ZoneOffset.UTC).toLocalDate())
}
