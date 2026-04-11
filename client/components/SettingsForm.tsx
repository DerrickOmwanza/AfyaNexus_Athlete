"use client";
import { useEffect, useRef, useState } from "react";
import api from "@/lib/api";
import { useAuth } from "@/context/AuthContext";
import { createClient } from "@supabase/supabase-js";
import { Camera, Loader2, CheckCircle, Eye, EyeOff } from "lucide-react";

const supabaseClient = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

interface AssignmentOption { id: number; name: string; }

const EVENTS = ["100m","200m","400m","800m","1500m","5000m","10000m","Marathon","Hurdles","Long Jump","High Jump","Shot Put","Javelin","Discus","Triathlon","Other"];

export default function SettingsForm() {
  const { user, setUserProfile } = useAuth();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [profile, setProfile] = useState({ name: "", email: "", specialization: "", coach_id: "", nutritionist_id: "" });
  const [avatarUrl, setAvatarUrl]   = useState<string | null>(null);
  const [avatarPreview, setAvatarPreview] = useState<string | null>(null);
  const [uploadingAvatar, setUploadingAvatar] = useState(false);
  const [avatarMsg, setAvatarMsg]   = useState("");
  const [avatarErr, setAvatarErr]   = useState("");

  const [coaches, setCoaches]             = useState<AssignmentOption[]>([]);
  const [nutritionists, setNutritionists] = useState<AssignmentOption[]>([]);
  const [loadingProfile, setLoadingProfile] = useState(true);

  const [profileMsg, setProfileMsg] = useState("");
  const [profileErr, setProfileErr] = useState("");
  const [savingProfile, setSavingProfile] = useState(false);

  const [passwords, setPasswords] = useState({ current_password: "", new_password: "", confirm_password: "" });
  const [passwordMsg, setPasswordMsg] = useState("");
  const [passwordErr, setPasswordErr] = useState("");
  const [savingPassword, setSavingPassword] = useState(false);
  const [showCurrent, setShowCurrent] = useState(false);
  const [showNew, setShowNew]         = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);

  useEffect(() => {
    Promise.all([
      api.get("/auth/profile"),
      user?.role === "athlete" ? api.get("/auth/onboarding-options") : Promise.resolve({ data: { coaches: [], nutritionists: [] } }),
    ])
      .then(([profileRes, optionsRes]) => {
        const u = profileRes.data.user;
        setProfile({
          name: u.name, email: u.email,
          specialization: u.specialization ?? "",
          coach_id: u.coach_id ? String(u.coach_id) : "",
          nutritionist_id: u.nutritionist_id ? String(u.nutritionist_id) : "",
        });
        setAvatarUrl(u.avatar_url ?? null);
        setCoaches(optionsRes.data.coaches ?? []);
        setNutritionists(optionsRes.data.nutritionists ?? []);
        // Sync avatar_url into localStorage so Sidebar/TopBar show it immediately
        const stored = localStorage.getItem("afyanexus_user");
        if (stored) {
          const parsed = JSON.parse(stored);
          if (parsed.avatar_url !== u.avatar_url) {
            setUserProfile({ ...parsed, avatar_url: u.avatar_url ?? null });
          }
        }
      })
      .finally(() => setLoadingProfile(false));
  }, []);

  // ── Avatar upload ──────────────────────────────────────────────────────────
  const handleAvatarChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 10 * 1024 * 1024) {
      setAvatarErr("Image must be under 10MB.");
      return;
    }
    if (!["image/jpeg", "image/png", "image/webp", "image/heic", "image/heif"].includes(file.type)) {
      setAvatarErr("Only JPG, PNG, WebP or HEIC images are allowed.");
      return;
    }

    // Show preview immediately
    const reader = new FileReader();
    reader.onload = (ev) => setAvatarPreview(ev.target?.result as string);
    reader.readAsDataURL(file);

    setUploadingAvatar(true);
    setAvatarErr(""); setAvatarMsg("");

    try {
      const ext      = file.name.split(".").pop();
      const fileName = `${user?.role}-${user?.id}-${Date.now()}.${ext}`;

      const { error: uploadError } = await supabaseClient.storage
        .from("avatars")
        .upload(fileName, file, { upsert: true });

      if (uploadError) throw new Error(uploadError.message);

      const { data: urlData } = supabaseClient.storage
        .from("avatars")
        .getPublicUrl(fileName);

      const publicUrl = urlData.publicUrl;

      const res = await api.put("/auth/avatar", { avatar_url: publicUrl });
      setAvatarUrl(publicUrl);
      setAvatarMsg("Profile photo updated.");

      const stored = localStorage.getItem("afyanexus_user");
      const parsed = stored ? JSON.parse(stored) : {};
      setUserProfile({ ...parsed, ...res.data.user });
    } catch (err: unknown) {
      const msg = (err as { response?: { data?: { error?: string } }; message?: string })?.response?.data?.error
        ?? (err as { message?: string })?.message
        ?? "Failed to upload photo.";
      setAvatarErr(msg);
      setAvatarPreview(null);
    } finally {
      setUploadingAvatar(false);
    }
  };

  // ── Profile save ───────────────────────────────────────────────────────────
  const handleProfileSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setProfileMsg(""); setProfileErr("");
    setSavingProfile(true);
    try {
      const res = await api.put("/auth/profile", {
        name: profile.name, email: profile.email,
        specialization: user?.role === "athlete" ? profile.specialization : undefined,
        coach_id: user?.role === "athlete" ? (profile.coach_id ? Number(profile.coach_id) : null) : undefined,
        nutritionist_id: user?.role === "athlete" ? (profile.nutritionist_id ? Number(profile.nutritionist_id) : null) : undefined,
      });
      setProfileMsg("Profile updated successfully.");
      const stored = localStorage.getItem("afyanexus_user");
      const parsed = stored ? JSON.parse(stored) : {};
      setUserProfile({ ...parsed, ...res.data.user });
    } catch (err: unknown) {
      const msg = (err as { response?: { data?: { error?: string } } })?.response?.data?.error;
      setProfileErr(msg || "Failed to update profile.");
    } finally {
      setSavingProfile(false);
    }
  };

  // ── Password save ──────────────────────────────────────────────────────────
  const handlePasswordSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setPasswordMsg(""); setPasswordErr("");
    if (passwords.new_password !== passwords.confirm_password) { setPasswordErr("New passwords do not match."); return; }
    if (passwords.new_password.length < 6) { setPasswordErr("New password must be at least 6 characters."); return; }
    setSavingPassword(true);
    try {
      await api.put("/auth/password", { current_password: passwords.current_password, new_password: passwords.new_password });
      setPasswordMsg("Password updated successfully.");
      setPasswords({ current_password: "", new_password: "", confirm_password: "" });
    } catch (err: unknown) {
      const msg = (err as { response?: { data?: { error?: string } } })?.response?.data?.error;
      setPasswordErr(msg || "Failed to update password.");
    } finally {
      setSavingPassword(false);
    }
  };

  const inputClass = "w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-brand-blue focus:border-transparent transition-all";

  if (loadingProfile) return <div className="text-sm text-gray-500 animate-pulse">Loading settings...</div>;

  const displayAvatar = avatarPreview ?? avatarUrl;
  const initials = user?.name?.split(" ").map((n) => n[0]).join("").toUpperCase().slice(0, 2) ?? "?";

  return (
    <div className="space-y-6 max-w-xl">
      <div>
        <h2 className="text-xl font-heading font-bold text-brand-dark">Settings</h2>
        <p className="text-sm text-brand-muted mt-0.5 capitalize">{user?.role} Portal — Manage your profile and security</p>
      </div>

      {/* ── Profile photo ──────────────────────────────────────────────────── */}
      <div className="bg-white rounded-2xl p-6 shadow-card border border-gray-100">
        <p className="text-sm font-heading font-semibold text-brand-dark mb-5">Profile Photo</p>

        <div className="flex items-center gap-6">
          {/* Avatar display */}
          <div className="relative shrink-0">
            <div className="w-20 h-20 rounded-full overflow-hidden border-2 border-gray-100 shadow-sm">
              {displayAvatar ? (
                <img src={displayAvatar} alt="Profile" className="w-full h-full object-cover" />
              ) : (
                <div className="w-full h-full bg-brand-blue flex items-center justify-center text-white font-heading font-bold text-xl">
                  {initials}
                </div>
              )}
            </div>
            {/* Upload overlay button */}
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              disabled={uploadingAvatar}
              className="absolute -bottom-1 -right-1 w-7 h-7 rounded-full bg-brand-green text-white flex items-center justify-center shadow-md hover:bg-emerald-500 transition-colors disabled:opacity-60"
            >
              {uploadingAvatar ? <Loader2 size={12} className="animate-spin" /> : <Camera size={12} />}
            </button>
            <input
              ref={fileInputRef}
              type="file"
              accept="image/jpeg,image/png,image/webp,image/heic,image/heif"
              className="hidden"
              onChange={handleAvatarChange}
            />
          </div>

          {/* Upload info */}
          <div className="flex-1">
            <p className="text-sm font-semibold text-brand-dark">
              {uploadingAvatar ? "Uploading..." : "Upload a profile photo"}
            </p>
            <p className="text-xs text-brand-muted mt-1">JPG, PNG, WebP or HEIC · Max 10MB</p>
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              disabled={uploadingAvatar}
              className="mt-3 px-4 py-1.5 text-xs font-semibold border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors disabled:opacity-60 text-brand-dark"
            >
              {uploadingAvatar ? "Uploading..." : "Choose Photo"}
            </button>
          </div>
        </div>

        {avatarMsg && (
          <div className="flex items-center gap-2 mt-4 text-brand-green text-xs font-medium">
            <CheckCircle size={13} /> {avatarMsg}
          </div>
        )}
        {avatarErr && (
          <p className="mt-3 text-red-500 text-xs">{avatarErr}</p>
        )}
      </div>

      {/* ── Profile info ───────────────────────────────────────────────────── */}
      <form onSubmit={handleProfileSave} className="bg-white rounded-2xl p-6 shadow-card border border-gray-100 space-y-4">
        <p className="text-sm font-heading font-semibold text-brand-dark">Profile Information</p>

        {profileMsg && (
          <div className="flex items-center gap-2 bg-green-50 border border-green-200 text-green-700 rounded-xl px-4 py-2.5 text-sm">
            <CheckCircle size={14} /> {profileMsg}
          </div>
        )}
        {profileErr && (
          <div className="bg-red-50 border border-red-200 text-red-700 rounded-xl px-4 py-2.5 text-sm">{profileErr}</div>
        )}

        <div>
          <label className="block text-sm font-semibold text-brand-dark mb-1.5">Full Name</label>
          <input type="text" required value={profile.name}
            onChange={(e) => setProfile({ ...profile, name: e.target.value })}
            className={inputClass} />
        </div>

        <div>
          <label className="block text-sm font-semibold text-brand-dark mb-1.5">Email Address</label>
          <input type="email" required value={profile.email}
            onChange={(e) => setProfile({ ...profile, email: e.target.value })}
            className={inputClass} />
        </div>

        {user?.role === "athlete" && (
          <>
            <div>
              <label className="block text-sm font-semibold text-brand-dark mb-1.5">
                Specialization <span className="text-brand-muted font-normal">(optional)</span>
              </label>
              <select value={profile.specialization}
                onChange={(e) => setProfile({ ...profile, specialization: e.target.value })}
                className={inputClass}>
                <option value="">Select your event</option>
                {EVENTS.map((s) => <option key={s} value={s}>{s}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-sm font-semibold text-brand-dark mb-1.5">
                Coach <span className="text-brand-muted font-normal">(optional)</span>
              </label>
              <select value={profile.coach_id}
                onChange={(e) => setProfile({ ...profile, coach_id: e.target.value })}
                className={inputClass}>
                <option value="">No coach selected</option>
                {coaches.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-sm font-semibold text-brand-dark mb-1.5">
                Nutritionist <span className="text-brand-muted font-normal">(optional)</span>
              </label>
              <select value={profile.nutritionist_id}
                onChange={(e) => setProfile({ ...profile, nutritionist_id: e.target.value })}
                className={inputClass}>
                <option value="">No nutritionist selected</option>
                {nutritionists.map((n) => <option key={n.id} value={n.id}>{n.name}</option>)}
              </select>
            </div>
          </>
        )}

        <div className="flex items-center justify-between pt-1">
          <p className="text-xs text-brand-muted capitalize">Role: {user?.role}</p>
          <button type="submit" disabled={savingProfile}
            className="bg-brand-blue text-white px-5 py-2 rounded-xl text-sm font-semibold hover:bg-blue-900 transition-colors disabled:opacity-60">
            {savingProfile ? "Saving..." : "Save Profile"}
          </button>
        </div>
      </form>

      {/* ── Change password ────────────────────────────────────────────────── */}
      <form onSubmit={handlePasswordSave} className="bg-white rounded-2xl p-6 shadow-card border border-gray-100 space-y-4">
        <p className="text-sm font-heading font-semibold text-brand-dark">Change Password</p>

        {passwordMsg && (
          <div className="flex items-center gap-2 bg-green-50 border border-green-200 text-green-700 rounded-xl px-4 py-2.5 text-sm">
            <CheckCircle size={14} /> {passwordMsg}
          </div>
        )}
        {passwordErr && (
          <div className="bg-red-50 border border-red-200 text-red-700 rounded-xl px-4 py-2.5 text-sm">{passwordErr}</div>
        )}

        {[
          { label: "Current Password",     key: "current_password", show: showCurrent, toggle: () => setShowCurrent(!showCurrent) },
          { label: "New Password",          key: "new_password",     show: showNew,     toggle: () => setShowNew(!showNew) },
          { label: "Confirm New Password",  key: "confirm_password", show: showConfirm, toggle: () => setShowConfirm(!showConfirm) },
        ].map((f) => (
          <div key={f.key}>
            <label className="block text-sm font-semibold text-brand-dark mb-1.5">{f.label}</label>
            <div className="relative">
              <input
                type={f.show ? "text" : "password"} required
                value={passwords[f.key as keyof typeof passwords]}
                onChange={(e) => setPasswords({ ...passwords, [f.key]: e.target.value })}
                className={inputClass + " pr-11"}
                placeholder="••••••••"
              />
              <button type="button" onClick={f.toggle}
                className="absolute right-3 top-2.5 text-gray-400 hover:text-brand-blue transition-colors">
                {f.show ? <EyeOff size={16} /> : <Eye size={16} />}
              </button>
            </div>
          </div>
        ))}

        <div className="flex justify-end pt-1">
          <button type="submit" disabled={savingPassword}
            className="bg-brand-orange text-white px-5 py-2 rounded-xl text-sm font-semibold hover:bg-orange-600 transition-colors disabled:opacity-60">
            {savingPassword ? "Updating..." : "Update Password"}
          </button>
        </div>
      </form>
    </div>
  );
}
