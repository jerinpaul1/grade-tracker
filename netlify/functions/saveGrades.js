// netlify/functions/saveGrades.js
const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

exports.handler = async (event) => {
  if (event.httpMethod !== 'POST') return { statusCode: 405, body: 'Method Not Allowed' };

  const auth = event.headers.authorization?.split(' ')[1];
  if (!auth) return { statusCode: 401, body: 'Missing token' };

  const { data: user, error: userErr } = await supabase.auth.getUser(auth);
  if (userErr || !user) return { statusCode: 401, body: 'Unauthorized' };

  const gradesData = JSON.parse(event.body);
  const { data: exists } = await supabase
    .from('grades')
    .select('user_id')
    .eq('user_id', user.id)
    .single();

  let result;
  if (exists) {
    result = await supabase
      .from('grades')
      .update({ data: gradesData })
      .eq('user_id', user.id);
  } else {
    result = await supabase
      .from('grades')
      .insert([{ user_id: user.id, data: gradesData }]);
  }

  if (result.error) return { statusCode: 500, body: result.error.message };
  return { statusCode: 200, body: JSON.stringify({ success: true }) };
};
