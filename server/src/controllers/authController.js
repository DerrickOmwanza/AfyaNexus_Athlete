const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const crypto = require('crypto');
const nodemailer = require('nodemailer');
const supabase = require('../config/supabase');

// Maps each role to its Supabase table
const ROLE_TABLE = {
  athlete: 'athletes',
  coach: 'coaches',
  nutritionist: 'nutritionists',
};

const validateAthleteAssignments = async ({ coach_id, nutritionist_id }) => {
  const errors = [];

  if (coach_id !== undefined && coach_id !== null && coach_id !== '') {
    const { data: coach } = await supabase.from('coaches').select('id').eq('id', coach_id).single();
    if (!coach) errors.push('Selected coach does not exist.');
  }

  if (nutritionist_id !== undefined && nutritionist_id !== null && nutritionist_id !== '') {
    const { data: nutritionist } = await supabase.from('nutritionists').select('id').eq('id', nutritionist_id).single();
    if (!nutritionist) errors.push('Selected nutritionist does not exist.');
  }

  return errors;
};

const getOnboardingOptions = async (_req, res) => {
  const [{ data: coaches }, { data: nutritionists }] = await Promise.all([
    supabase.from('coaches').select('id, name').order('name', { ascending: true }),
    supabase.from('nutritionists').select('id, name').order('name', { ascending: true }),
  ]);

  res.json({
    coaches: coaches ?? [],
    nutritionists: nutritionists ?? [],
  });
};

const register = async (req, res) => {
  const { name, email, password, role, specialization, coach_id, nutritionist_id } = req.body;

  if (!ROLE_TABLE[role]) {
    return res.status(400).json({ error: 'Invalid role. Must be athlete, coach, or nutritionist.' });
  }

  // Check if email already exists in that role's table
  const { data: existing } = await supabase
    .from(ROLE_TABLE[role])
    .select('id')
    .eq('email', email)
    .single();

  if (existing) {
    return res.status(409).json({ error: 'An account with this email already exists.' });
  }

  const password_hash = await bcrypt.hash(password, 12);

  const insertData = { name, email, password_hash };
  if (role === 'athlete') {
    const assignmentErrors = await validateAthleteAssignments({ coach_id, nutritionist_id });
    if (assignmentErrors.length > 0) {
      return res.status(400).json({ error: assignmentErrors[0], details: assignmentErrors });
    }

    if (specialization) insertData.specialization = specialization;
    if (coach_id) insertData.coach_id = Number(coach_id);
    if (nutritionist_id) insertData.nutritionist_id = Number(nutritionist_id);
  }

  const { data: newUser, error } = await supabase
    .from(ROLE_TABLE[role])
    .insert(insertData)
    .select(role === 'athlete' ? 'id, name, email, coach_id, nutritionist_id' : 'id, name, email')
    .single();

  if (error) {
    return res.status(500).json({ error: 'Registration failed. Please try again.' });
  }

  const token = jwt.sign(
    { id: newUser.id, email: newUser.email, role },
    process.env.JWT_SECRET,
    { expiresIn: process.env.JWT_EXPIRES_IN }
  );

  res.status(201).json({
    message: 'Registration successful.',
    token,
    user: {
      id: newUser.id,
      name: newUser.name,
      email: newUser.email,
      role,
      coach_id: newUser.coach_id ?? null,
      nutritionist_id: newUser.nutritionist_id ?? null,
    },
  });
};

const login = async (req, res) => {
  const { email, password, role } = req.body;

  if (!ROLE_TABLE[role]) {
    return res.status(400).json({ error: 'Invalid role.' });
  }

  const { data: user } = await supabase
    .from(ROLE_TABLE[role])
    .select(role === 'athlete'
      ? 'id, name, email, password_hash, specialization, coach_id, nutritionist_id'
      : 'id, name, email, password_hash'
    )
    .eq('email', email)
    .single();

  if (!user) {
    return res.status(401).json({ error: 'Invalid email or password.' });
  }

  const isMatch = await bcrypt.compare(password, user.password_hash);
  if (!isMatch) {
    return res.status(401).json({ error: 'Invalid email or password.' });
  }

  const token = jwt.sign(
    { id: user.id, email: user.email, role },
    process.env.JWT_SECRET,
    { expiresIn: process.env.JWT_EXPIRES_IN }
  );

  res.json({
    message: 'Login successful.',
    token,
    user: {
      id: user.id,
      name: user.name,
      email: user.email,
      role,
      specialization: user.specialization ?? null,
      coach_id: user.coach_id ?? null,
      nutritionist_id: user.nutritionist_id ?? null,
    },
  });
};

const getProfile = async (req, res) => {
  const { id, role } = req.user;
  const selectFields = role === 'athlete'
    ? 'id, name, email, specialization, coach_id, nutritionist_id, avatar_url'
    : 'id, name, email, avatar_url';

  const { data: user, error } = await supabase
    .from(ROLE_TABLE[role])
    .select(selectFields)
    .eq('id', id)
    .single();

  if (error || !user) return res.status(404).json({ error: 'Profile not found.' });

  res.json({ user: { ...user, role } });
};

const updateProfile = async (req, res) => {
  const { id, role } = req.user;
  const { name, email, coach_id, nutritionist_id, specialization } = req.body;

  if (!name && !email && specialization === undefined && coach_id === undefined && nutritionist_id === undefined) {
    return res.status(400).json({ error: 'Provide at least one field to update.' });
  }

  const updates = {};
  if (name)  updates.name  = name;
  if (email) updates.email = email;
  if (role === 'athlete') {
    const assignmentErrors = await validateAthleteAssignments({ coach_id, nutritionist_id });
    if (assignmentErrors.length > 0) {
      return res.status(400).json({ error: assignmentErrors[0], details: assignmentErrors });
    }

    if (specialization !== undefined) updates.specialization = specialization || null;
    if (coach_id !== undefined) updates.coach_id = coach_id ? Number(coach_id) : null;
    if (nutritionist_id !== undefined) updates.nutritionist_id = nutritionist_id ? Number(nutritionist_id) : null;
  }

  const selectFields = role === 'athlete'
    ? 'id, name, email, specialization, coach_id, nutritionist_id, avatar_url'
    : 'id, name, email, avatar_url';

  const { data, error } = await supabase
    .from(ROLE_TABLE[role])
    .update(updates)
    .eq('id', id)
    .select(selectFields)
    .single();

  if (error) return res.status(500).json({ error: 'Failed to update profile.' });

  res.json({ message: 'Profile updated successfully.', user: { ...data, role } });
};

const updatePassword = async (req, res) => {
  const { id, role } = req.user;
  const { current_password, new_password } = req.body;

  if (!current_password || !new_password) {
    return res.status(400).json({ error: 'Both current and new password are required.' });
  }

  const { data: user } = await supabase
    .from(ROLE_TABLE[role])
    .select('password_hash')
    .eq('id', id)
    .single();

  if (!user) return res.status(404).json({ error: 'User not found.' });

  const isMatch = await bcrypt.compare(current_password, user.password_hash);
  if (!isMatch) return res.status(401).json({ error: 'Current password is incorrect.' });

  const password_hash = await bcrypt.hash(new_password, 12);

  const { error } = await supabase
    .from(ROLE_TABLE[role])
    .update({ password_hash })
    .eq('id', id);

  if (error) return res.status(500).json({ error: 'Failed to update password.' });

  res.json({ message: 'Password updated successfully.' });
};

const forgotPassword = async (req, res) => {
  const { email, role } = req.body;

  if (!ROLE_TABLE[role]) {
    return res.status(400).json({ error: 'Invalid role.' });
  }

  // Check user exists
  const { data: user } = await supabase
    .from(ROLE_TABLE[role])
    .select('id, name, email')
    .eq('email', email)
    .single();

  // Always return success to prevent email enumeration
  if (!user) {
    return res.json({ message: 'If that email exists, a reset link has been sent.' });
  }

  // Generate secure token — 24hr expiry stored in UTC
  const token = crypto.randomBytes(32).toString('hex');
  const expires_at = new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString();

  // Invalidate any existing tokens for this email
  await supabase
    .from('password_reset_tokens')
    .update({ used: true })
    .eq('email', email)
    .eq('role', role)
    .eq('used', false);

  // Store new token
  await supabase.from('password_reset_tokens').insert({ email, role, token, expires_at });

  // Send email
  const resetUrl = `${process.env.CLIENT_URL}/reset-password?token=${token}&role=${role}`;

  const transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: { user: process.env.EMAIL_USER, pass: process.env.EMAIL_PASS },
  });

  try {
    await transporter.sendMail({
      from: `"AfyaNexus" <${process.env.EMAIL_USER}>`,
      to: email,
      subject: 'AfyaNexus — Password Reset Request',
      html: `
        <div style="font-family: Inter, Arial, sans-serif; max-width: 480px; margin: 0 auto; padding: 32px; background: #F3F4F6; border-radius: 12px;">
          <div style="text-align: center; margin-bottom: 24px;">
            <h1 style="color: #1E3A8A; font-size: 24px; margin: 0;">AfyaNexus</h1>
            <p style="color: #6B7280; font-size: 13px; margin: 4px 0 0;">Athlete Management System</p>
          </div>
          <div style="background: #ffffff; border-radius: 10px; padding: 28px;">
            <h2 style="color: #111827; font-size: 18px; margin: 0 0 12px;">Password Reset Request</h2>
            <p style="color: #374151; font-size: 14px; line-height: 1.6;">Hi ${user.name},</p>
            <p style="color: #374151; font-size: 14px; line-height: 1.6;">We received a request to reset your AfyaNexus password. Click the button below to set a new password. This link expires in <strong>1 hour</strong>.</p>
            <div style="text-align: center; margin: 28px 0;">
              <a href="${resetUrl}" style="background: #10B981; color: #ffffff; padding: 14px 32px; border-radius: 8px; text-decoration: none; font-weight: 600; font-size: 14px; display: inline-block;">Reset My Password</a>
            </div>
            <p style="color: #6B7280; font-size: 12px;">If you did not request this, you can safely ignore this email. Your password will not change.</p>
            <p style="color: #9CA3AF; font-size: 11px; margin-top: 16px; word-break: break-all;">Or copy this link: ${resetUrl}</p>
          </div>
          <p style="color: #9CA3AF; font-size: 11px; text-align: center; margin-top: 16px;">AfyaNexus © 2026 · Capstone Project v1.0</p>
        </div>
      `,
    });
  } catch {
    return res.status(500).json({ error: 'Failed to send reset email. Please try again.' });
  }

  res.json({ message: 'If that email exists, a reset link has been sent.' });
};

const resetPassword = async (req, res) => {
  const { token, new_password } = req.body;

  if (!token || !new_password) {
    return res.status(400).json({ error: 'Token and new password are required.' });
  }
  if (new_password.length < 6) {
    return res.status(400).json({ error: 'Password must be at least 6 characters.' });
  }

  // Find valid token
  const { data: resetToken } = await supabase
    .from('password_reset_tokens')
    .select('*')
    .eq('token', token)
    .eq('used', false)
    .gt('expires_at', new Date().toISOString())
    .single();

  if (!resetToken) {
    return res.status(400).json({ error: 'Invalid or expired reset link. Please request a new one.' });
  }

  // Update password
  const password_hash = await bcrypt.hash(new_password, 12);

  const { error } = await supabase
    .from(ROLE_TABLE[resetToken.role])
    .update({ password_hash })
    .eq('email', resetToken.email);

  if (error) return res.status(500).json({ error: 'Failed to reset password. Please try again.' });

  // Mark token as used
  await supabase
    .from('password_reset_tokens')
    .update({ used: true })
    .eq('token', token);

  res.json({ message: 'Password reset successfully. You can now sign in.' });
};

const uploadAvatar = async (req, res) => {
  const { id, role } = req.user;
  const { avatar_url } = req.body;

  if (!avatar_url) return res.status(400).json({ error: 'avatar_url is required.' });

  const selectFields = role === 'athlete'
    ? 'id, name, email, specialization, coach_id, nutritionist_id, avatar_url'
    : 'id, name, email, avatar_url';

  const { data, error } = await supabase
    .from(ROLE_TABLE[role])
    .update({ avatar_url })
    .eq('id', id)
    .select(selectFields)
    .single();

  if (error) return res.status(500).json({ error: 'Failed to update avatar.' });

  res.json({ message: 'Avatar updated successfully.', user: { ...data, role } });
};

module.exports = { register, login, getProfile, updateProfile, updatePassword, getOnboardingOptions, forgotPassword, resetPassword, uploadAvatar };
