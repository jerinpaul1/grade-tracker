// netlify/functions/getGrades.js
const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

exports.handler = async (event) => {
  const auth = event.headers.authorization?.split(' ')[1];
  if (!auth) return { statusCode: 401, body: 'Missing token' };

  // Use the JWT to identify the user
  const { data: user, error: userErr } = await supabase.auth.getUser(auth);
  if (userErr || !user) return { statusCode: 401, body: 'Unauthorized' };

  const { data, error } = await supabase
    .from('grades')
    .select('data')
    .eq('user_id', user.id)
    .single();

  if (error && error.code !== 'PGRST116') {
    return { statusCode: 500, body: error.message };
  }

  return {
    statusCode: 200,
    body: JSON.stringify(data?.data || { years: [] })
  };
};
