const supabase = require('../config/supabase');

// ── Post a comment (coach or nutritionist) ─────────────────────────────────
const postComment = async (req, res) => {
  const { id: authorId, role } = req.user;
  const { athlete_id } = req.params;
  const { message, context = 'general' } = req.body;

  if (!message?.trim()) {
    return res.status(400).json({ error: 'Message cannot be empty.' });
  }

  // RBAC — verify the athlete is linked to this coach/nutritionist
  const linkField = role === 'coach' ? 'coach_id' : 'nutritionist_id';
  const roleTable = role === 'coach' ? 'coaches' : 'nutritionists';

  const { data: athlete } = await supabase
    .from('athletes')
    .select(`id, name, ${linkField}`)
    .eq('id', athlete_id)
    .single();

  if (!athlete || String(athlete[linkField]) !== String(authorId)) {
    return res.status(403).json({ error: 'Access denied. This athlete is not linked to you.' });
  }

  // Fetch author name from their table
  const { data: author } = await supabase
    .from(roleTable)
    .select('name')
    .eq('id', authorId)
    .single();

  const { data, error } = await supabase
    .from('comments')
    .insert({
      athlete_id:  Number(athlete_id),
      author_id:   authorId,
      author_role: role,
      author_name: author?.name ?? role,
      message:     message.trim(),
      context,
    })
    .select()
    .single();

  if (error) return res.status(500).json({ error: 'Failed to post comment.' });

  res.status(201).json({ message: 'Comment posted.', data });
};

// ── Get comments for an athlete (coach/nutritionist view) ──────────────────
const getCommentsForAthlete = async (req, res) => {
  const { id: authorId, role } = req.user;
  const { athlete_id } = req.params;

  // RBAC check
  const linkField = role === 'coach' ? 'coach_id' : 'nutritionist_id';

  const { data: athlete } = await supabase
    .from('athletes')
    .select(`id, ${linkField}`)
    .eq('id', athlete_id)
    .single();

  if (!athlete || String(athlete[linkField]) !== String(authorId)) {
    return res.status(403).json({ error: 'Access denied.' });
  }

  const { data: comments } = await supabase
    .from('comments')
    .select('*')
    .eq('athlete_id', athlete_id)
    .eq('author_role', role)
    .order('created_at', { ascending: false })
    .limit(50);

  res.json({ comments: comments ?? [] });
};

// ── Get comments for the logged-in athlete (athlete view) ──────────────────
const getMyComments = async (req, res) => {
  const athleteId = req.user.id;

  const { data: comments } = await supabase
    .from('comments')
    .select('*')
    .eq('athlete_id', athleteId)
    .order('created_at', { ascending: false })
    .limit(50);

  res.json({ comments: comments ?? [] });
};

// ── Mark all comments as read for the logged-in athlete ───────────────────
const markCommentsRead = async (req, res) => {
  const athleteId = req.user.id;

  await supabase
    .from('comments')
    .update({ read_at: new Date().toISOString() })
    .eq('athlete_id', athleteId)
    .is('read_at', null);

  res.json({ message: 'Comments marked as read.' });
};

module.exports = { postComment, getCommentsForAthlete, getMyComments, markCommentsRead };
