const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
  'https://tgnhbmqgdupnzkbofotf.supabase.co',
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

exports.handler = async (event) => {
  if (event.httpMethod !== 'POST') {
    return { statusCode: 405, body: 'Method not allowed' };
  }

  const token = event.headers.authorization?.replace('Bearer ', '');
  if (!token) {
    return {
      statusCode: 401,
      body: JSON.stringify({ error: 'Missing auth token' })
    };
  }

  const { data: user, error: userError } = await supabase.auth.getUser(token);
  if (userError || !user) {
    return {
      statusCode: 401,
      body: JSON.stringify({ error: 'Invalid token' })
    };
  }

  const body = JSON.parse(event.body);

  const { data: existing } = await supabase
    .from('grades')
    .select('id')
    .eq('user_id', user.id)
    .single();

  const result = existing
    ? await supabase.from('grades').update({ data: body }).eq('user_id', user.id)
    : await supabase.from('grades').insert({ user_id: user.id, data: body });

  if (result.error) {
    return {
      statusCode: 500,
      body: JSON.stringify({ error: result.error.message })
    };
  }

  return {
    statusCode: 200,
    body: JSON.stringify({ success: true })
  };
};
