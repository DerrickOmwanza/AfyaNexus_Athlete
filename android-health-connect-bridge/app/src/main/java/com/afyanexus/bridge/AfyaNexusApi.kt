package com.afyanexus.bridge

import org.json.JSONArray
import org.json.JSONObject
import java.io.BufferedReader
import java.io.OutputStreamWriter
import java.net.HttpURLConnection
import java.net.URL

class AfyaNexusApi {
    fun syncHealthConnect(serverUrl: String, token: String, payload: HealthConnectImportPayload): String {
        val connection = URL("${serverUrl.trimEnd('/')}/athlete/sources/health-connect/import")
            .openConnection() as HttpURLConnection

        connection.requestMethod = "POST"
        connection.setRequestProperty("Authorization", "Bearer $token")
        connection.setRequestProperty("Content-Type", "application/json")
        connection.doOutput = true

        OutputStreamWriter(connection.outputStream).use { writer ->
            writer.write(payload.toJson().toString())
        }

        val reader = if (connection.responseCode in 200..299) {
            connection.inputStream.bufferedReader()
        } else {
            connection.errorStream?.bufferedReader()
        }

        val body = reader?.use(BufferedReader::readText) ?: ""
        return "HTTP ${connection.responseCode}\n$body"
    }

    private fun HealthConnectImportPayload.toJson(): JSONObject {
        val json = JSONObject()
            .put("device_id", device_id)
            .put("training_sessions", JSONArray(training_sessions.map { it.toJson() }))
            .put("nutrition_entries", JSONArray(nutrition_entries.map { it.toJson() }))

        recovery?.let { json.put("recovery", it.toJson()) }
        wearable?.let { json.put("wearable", it.toJson()) }
        return json
    }

    private fun RecoveryPayload.toJson() = JSONObject()
        .put("date", date)
        .put("sleep_hours", sleep_hours)
        .put("soreness_level", soreness_level)
        .put("mood", mood)
        .put("numbness", numbness)
        .put("notes", notes)

    private fun WearablePayload.toJson() = JSONObject()
        .put("date", date)
        .put("heart_rate_avg", heart_rate_avg)
        .put("sleep_duration", sleep_duration)
        .put("steps", steps)

    private fun TrainingPayload.toJson() = JSONObject()
        .put("date", date)
        .put("workout_type", workout_type)
        .put("intensity", intensity)
        .put("duration_min", duration_min)
        .put("notes", notes)

    private fun NutritionPayload.toJson() = JSONObject()
        .put("date", date)
        .put("calories", calories)
        .put("protein_g", protein_g)
        .put("carbs_g", carbs_g)
        .put("fats_g", fats_g)
        .put("meal_notes", meal_notes)
}
