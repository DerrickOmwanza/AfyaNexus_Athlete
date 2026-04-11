"use client";
import { useEffect, useState } from "react";
import api from "@/lib/api";

interface WearableEntry {
  id: number;
  date: string;
  heart_rate_avg: number;
  sleep_duration: number;
  steps: number;
  device_id: string;
  synced_at: string;
  source_label?: string;
}

const DEFAULT_DEVICE = "70:0A:B7:00:86:D0";

export default function WearablePage() {
  const [deviceId, setDeviceId] = useState<string | null>(null);
  const [history, setHistory] = useState<WearableEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const [form, setForm] = useState({
    device_id: "", heart_rate_avg: "", sleep_duration: "", steps: "",
  });
  const [syncing, setSyncing] = useState(false);
  const [syncMsg, setSyncMsg] = useState("");
  const [syncError, setSyncError] = useState("");
  const [healthConnectForm, setHealthConnectForm] = useState({
    sleep_hours: "7.5",
    soreness_level: "3",
    mood: "Good",
    heart_rate_avg: "68",
    sleep_duration: "7.2",
    steps: "9100",
    workout_type: "Run",
    intensity: "6",
    duration_min: "45",
    calories: "2400",
    protein_g: "120",
    carbs_g: "280",
    fats_g: "70",
  });
  const [importingHealthConnect, setImportingHealthConnect] = useState(false);
  const [healthConnectMsg, setHealthConnectMsg] = useState("");
  const [healthConnectError, setHealthConnectError] = useState("");

  const fetchData = () => {
    api.get("/athlete/wearable")
      .then((res) => {
        setDeviceId(res.data.device_id);
        setHistory(res.data.history);
        setForm((f) => ({ ...f, device_id: res.data.device_id ?? DEFAULT_DEVICE }));
      })
      .catch(() => setError("Failed to load wearable data."))
      .finally(() => setLoading(false));
  };

  useEffect(() => { fetchData(); }, []);

  const handleSync = async (e: React.FormEvent) => {
    e.preventDefault();
    setSyncMsg("");
    setSyncError("");
    setSyncing(true);
    try {
      const res = await api.post("/athlete/wearable/sync", {
        device_id: form.device_id,
        heart_rate_avg: parseFloat(form.heart_rate_avg),
        sleep_duration: parseFloat(form.sleep_duration),
        steps: parseInt(form.steps),
      });
      setSyncMsg(
        res.data?.prediction?.triggered
          ? "Wearable data synced successfully and injury risk was recalculated."
          : "Wearable data synced successfully."
      );
      setForm((f) => ({ ...f, heart_rate_avg: "", sleep_duration: "", steps: "" }));
      fetchData();
    } catch (err: unknown) {
      const msg = (err as { response?: { data?: { error?: string } } })?.response?.data?.error;
      setSyncError(msg || "Sync failed. Please try again.");
    } finally {
      setSyncing(false);
    }
  };

  const handleHealthConnectImport = async (e: React.FormEvent) => {
    e.preventDefault();
    setHealthConnectMsg("");
    setHealthConnectError("");
    setImportingHealthConnect(true);

    try {
      const res = await api.post("/athlete/sources/health-connect/import", {
        device_id: "ANDROID-HEALTH-CONNECT",
        recovery: {
          sleep_hours: parseFloat(healthConnectForm.sleep_hours),
          soreness_level: parseInt(healthConnectForm.soreness_level),
          mood: healthConnectForm.mood,
          numbness: false,
          notes: "Imported from Android Health Connect demo flow",
        },
        wearable: {
          heart_rate_avg: parseInt(healthConnectForm.heart_rate_avg),
          sleep_duration: parseFloat(healthConnectForm.sleep_duration),
          steps: parseInt(healthConnectForm.steps),
        },
        training_sessions: [
          {
            workout_type: healthConnectForm.workout_type,
            intensity: parseInt(healthConnectForm.intensity),
            duration_min: parseInt(healthConnectForm.duration_min),
            notes: "Imported from Android Health Connect demo flow",
          },
        ],
        nutrition_entries: [
          {
            calories: parseFloat(healthConnectForm.calories),
            protein_g: parseFloat(healthConnectForm.protein_g),
            carbs_g: parseFloat(healthConnectForm.carbs_g),
            fats_g: parseFloat(healthConnectForm.fats_g),
            meal_notes: "Imported from Android Health Connect demo flow",
          },
        ],
      });

      setHealthConnectMsg(
        res.data?.prediction?.triggered
          ? "Android Health Connect data imported and injury risk was recalculated."
          : "Android Health Connect data imported successfully."
      );
      fetchData();
    } catch (err: unknown) {
      const msg = (err as { response?: { data?: { error?: string } } })?.response?.data?.error;
      setHealthConnectError(msg || "Health Connect import failed.");
    } finally {
      setImportingHealthConnect(false);
    }
  };

  if (loading) return <div className="text-sm text-gray-500 animate-pulse">Loading wearable data...</div>;
  if (error)   return <div className="text-sm text-red-500">{error}</div>;

  const latest = history[0] ?? null;

  return (
    <div className="space-y-6 max-w-2xl">
      <div>
        <h2 className="text-xl font-bold text-brand-dark">T70 Wearable Sync</h2>
        <p className="text-sm text-gray-500 mt-0.5">Sync your T70 smartwatch data to update your injury risk score.</p>
      </div>

      {/* Device status card */}
      <div className="bg-white rounded-xl p-5 shadow-sm border border-gray-100">
        <p className="text-xs text-gray-500 font-medium uppercase tracking-wide mb-3">Device Status</p>
        <div className="flex items-center gap-3">
          <div className={`w-2.5 h-2.5 rounded-full ${deviceId ? "bg-brand-green" : "bg-gray-300"}`} />
          <div>
            <p className="text-sm font-semibold text-brand-dark">
              {deviceId ? "Device Registered" : "No Device Registered"}
            </p>
            <p className="text-xs text-gray-400 font-mono mt-0.5">
              {deviceId ?? "First sync will register your device"}
            </p>
          </div>
        </div>
        {latest && (
          <div className="mt-4 pt-4 border-t border-gray-100 grid grid-cols-3 gap-4">
            <div>
              <p className="text-xs text-gray-500">Last Heart Rate</p>
              <p className="text-lg font-bold text-brand-blue">{latest.heart_rate_avg} <span className="text-xs font-normal text-gray-400">bpm</span></p>
            </div>
            <div>
              <p className="text-xs text-gray-500">Last Sleep</p>
              <p className="text-lg font-bold text-brand-blue">{latest.sleep_duration} <span className="text-xs font-normal text-gray-400">hrs</span></p>
            </div>
            <div>
              <p className="text-xs text-gray-500">Last Steps</p>
              <p className="text-lg font-bold text-brand-blue">{latest.steps?.toLocaleString()}</p>
            </div>
            <div className="col-span-3">
              <p className="text-xs text-gray-400">
                Last synced: {new Date(latest.date).toLocaleDateString("en-US", { weekday: "short", month: "short", day: "numeric", year: "numeric" })}
              </p>
            </div>
          </div>
        )}
      </div>

      {/* Sync messages */}
      {syncMsg && (
        <div className="bg-green-50 border border-green-200 text-green-700 rounded-lg px-4 py-3 text-sm">
          ✅ {syncMsg}
        </div>
      )}
      {syncError && (
        <div className="bg-red-50 border border-red-200 text-red-700 rounded-lg px-4 py-3 text-sm">
          {syncError}
        </div>
      )}
      {healthConnectMsg && (
        <div className="bg-green-50 border border-green-200 text-green-700 rounded-lg px-4 py-3 text-sm">
          ✅ {healthConnectMsg}
        </div>
      )}
      {healthConnectError && (
        <div className="bg-red-50 border border-red-200 text-red-700 rounded-lg px-4 py-3 text-sm">
          {healthConnectError}
        </div>
      )}

      {/* Sync form */}
      <form onSubmit={handleSync} className="bg-white rounded-xl p-6 shadow-sm border border-gray-100 space-y-5">
        <div>
          <p className="text-sm font-semibold text-brand-dark mb-1">Manual Sync</p>
          <p className="text-xs text-gray-400">
            Read the values from your T70 device and enter them below. Bluetooth auto-sync requires a native app bridge.
          </p>
        </div>

        {/* Device ID */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Device ID (Bluetooth Address)</label>
          <input
            type="text" required
            value={form.device_id}
            onChange={(e) => setForm({ ...form, device_id: e.target.value })}
            className="w-full border border-gray-200 rounded-lg px-4 py-2.5 text-sm font-mono focus:outline-none focus:ring-2 focus:ring-brand-blue"
            placeholder="e.g. 70:0A:B7:00:86:D0"
          />
          {!deviceId && (
            <p className="text-xs text-brand-orange mt-1">
              ⚠ No device registered yet — this sync will register your T70 device ID.
            </p>
          )}
        </div>

        {/* Metrics row */}
        <div className="grid grid-cols-3 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Heart Rate Avg</label>
            <div className="relative">
              <input
                type="number" min="30" max="220" step="1" required
                value={form.heart_rate_avg}
                onChange={(e) => setForm({ ...form, heart_rate_avg: e.target.value })}
                className="w-full border border-gray-200 rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-brand-blue"
                placeholder="72"
              />
              <span className="absolute right-3 top-2.5 text-xs text-gray-400">bpm</span>
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Sleep Duration</label>
            <div className="relative">
              <input
                type="number" min="0" max="24" step="0.5" required
                value={form.sleep_duration}
                onChange={(e) => setForm({ ...form, sleep_duration: e.target.value })}
                className="w-full border border-gray-200 rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-brand-blue"
                placeholder="7.5"
              />
              <span className="absolute right-3 top-2.5 text-xs text-gray-400">hrs</span>
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Step Count</label>
            <input
              type="number" min="0" step="1" required
              value={form.steps}
              onChange={(e) => setForm({ ...form, steps: e.target.value })}
              className="w-full border border-gray-200 rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-brand-blue"
              placeholder="8420"
            />
          </div>
        </div>

        <button
          type="submit" disabled={syncing}
          className="w-full bg-brand-blue text-white py-3 rounded-lg font-semibold hover:bg-blue-900 transition-colors disabled:opacity-60"
        >
          {syncing ? "Syncing..." : "Sync T70 Data"}
        </button>
      </form>

      <form onSubmit={handleHealthConnectImport} className="bg-white rounded-xl p-6 shadow-sm border border-gray-100 space-y-5">
        <div>
          <p className="text-sm font-semibold text-brand-dark mb-1">Android Health Connect Demo Import</p>
          <p className="text-xs text-gray-400">
            This simulates the Android Health Connect bridge. It imports recovery, wearable, training, and nutrition data in one sync flow.
          </p>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Sleep Hours</label>
            <input
              type="number"
              step="0.1"
              value={healthConnectForm.sleep_hours}
              onChange={(e) => setHealthConnectForm({ ...healthConnectForm, sleep_hours: e.target.value })}
              className="w-full border border-gray-200 rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-brand-green"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Soreness</label>
            <input
              type="number"
              min="1"
              max="10"
              value={healthConnectForm.soreness_level}
              onChange={(e) => setHealthConnectForm({ ...healthConnectForm, soreness_level: e.target.value })}
              className="w-full border border-gray-200 rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-brand-green"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Heart Rate Avg</label>
            <input
              type="number"
              value={healthConnectForm.heart_rate_avg}
              onChange={(e) => setHealthConnectForm({ ...healthConnectForm, heart_rate_avg: e.target.value })}
              className="w-full border border-gray-200 rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-brand-green"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Steps</label>
            <input
              type="number"
              value={healthConnectForm.steps}
              onChange={(e) => setHealthConnectForm({ ...healthConnectForm, steps: e.target.value })}
              className="w-full border border-gray-200 rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-brand-green"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Workout Type</label>
            <input
              type="text"
              value={healthConnectForm.workout_type}
              onChange={(e) => setHealthConnectForm({ ...healthConnectForm, workout_type: e.target.value })}
              className="w-full border border-gray-200 rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-brand-green"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Intensity</label>
            <input
              type="number"
              min="1"
              max="10"
              value={healthConnectForm.intensity}
              onChange={(e) => setHealthConnectForm({ ...healthConnectForm, intensity: e.target.value })}
              className="w-full border border-gray-200 rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-brand-green"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Duration (min)</label>
            <input
              type="number"
              value={healthConnectForm.duration_min}
              onChange={(e) => setHealthConnectForm({ ...healthConnectForm, duration_min: e.target.value })}
              className="w-full border border-gray-200 rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-brand-green"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Calories</label>
            <input
              type="number"
              value={healthConnectForm.calories}
              onChange={(e) => setHealthConnectForm({ ...healthConnectForm, calories: e.target.value })}
              className="w-full border border-gray-200 rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-brand-green"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Protein (g)</label>
            <input
              type="number"
              value={healthConnectForm.protein_g}
              onChange={(e) => setHealthConnectForm({ ...healthConnectForm, protein_g: e.target.value })}
              className="w-full border border-gray-200 rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-brand-green"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Carbs (g)</label>
            <input
              type="number"
              value={healthConnectForm.carbs_g}
              onChange={(e) => setHealthConnectForm({ ...healthConnectForm, carbs_g: e.target.value })}
              className="w-full border border-gray-200 rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-brand-green"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Fats (g)</label>
            <input
              type="number"
              value={healthConnectForm.fats_g}
              onChange={(e) => setHealthConnectForm({ ...healthConnectForm, fats_g: e.target.value })}
              className="w-full border border-gray-200 rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-brand-green"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Mood</label>
            <select
              value={healthConnectForm.mood}
              onChange={(e) => setHealthConnectForm({ ...healthConnectForm, mood: e.target.value })}
              className="w-full border border-gray-200 rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-brand-green"
            >
              {["Excellent", "Good", "Neutral", "Tired", "Anxious", "Poor"].map((mood) => (
                <option key={mood} value={mood}>{mood}</option>
              ))}
            </select>
          </div>
        </div>

        <button
          type="submit"
          disabled={importingHealthConnect}
          className="w-full bg-brand-green text-white py-3 rounded-lg font-semibold hover:bg-emerald-600 transition-colors disabled:opacity-60"
        >
          {importingHealthConnect ? "Importing..." : "Import Android Health Connect Data"}
        </button>
      </form>

      {/* Sync history */}
      {history.length > 0 && (
        <div className="bg-white rounded-xl shadow-sm border border-gray-100">
          <p className="text-sm font-semibold text-brand-dark px-5 py-4 border-b border-gray-100">
            Sync History — Last 10 Entries
          </p>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-left text-xs text-gray-500 border-b border-gray-100">
                  <th className="px-5 py-3 font-medium">Date</th>
                  <th className="px-5 py-3 font-medium">Heart Rate</th>
                  <th className="px-5 py-3 font-medium">Sleep</th>
                  <th className="px-5 py-3 font-medium">Steps</th>
                  <th className="px-5 py-3 font-medium">Source</th>
                </tr>
              </thead>
              <tbody>
                {history.map((h) => (
                  <tr key={h.id} className="border-b border-gray-50 last:border-0 hover:bg-gray-50">
                    <td className="px-5 py-3 text-gray-600">
                      {new Date(h.date).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}
                    </td>
                    <td className="px-5 py-3 font-medium text-brand-blue">{h.heart_rate_avg} bpm</td>
                    <td className="px-5 py-3 text-gray-600">{h.sleep_duration}h</td>
                    <td className="px-5 py-3 text-gray-600">{h.steps?.toLocaleString()}</td>
                    <td className="px-5 py-3 text-gray-500 text-xs">{h.source_label ?? "Wearable Sync"}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* T70 device info */}
      <div className="bg-blue-50 border border-blue-100 rounded-xl p-4">
        <p className="text-xs font-semibold text-brand-blue mb-2">T70 Device Reference</p>
        <div className="grid grid-cols-2 gap-x-6 gap-y-1 text-xs text-gray-600">
          <span className="text-gray-400">Model</span><span>T70 Smartwatch</span>
          <span className="text-gray-400">Bluetooth</span><span className="font-mono">70:0A:B7:00:86:D0</span>
          <span className="text-gray-400">FCC ID</span><span className="font-mono">2BEJG-T70</span>
          <span className="text-gray-400">Connectivity</span><span>Bluetooth Low Energy (BLE)</span>
          <span className="text-gray-400">Firmware</span><span>V00621</span>
        </div>
      </div>
    </div>
  );
}
