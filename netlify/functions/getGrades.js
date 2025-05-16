const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
  'https://tgnhbmqgdupnzkbofotf.supabase.co',
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

exports.handler = async (event) => {
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

  const { data, error } = await supabase
    .from('grades')
    .select('data')
    .eq('user_id', user.id)
    .single();

  if (error && error.code !== 'PGRST116') {
    return {
      statusCode: 500,
      body: JSON.stringify({ error: error.message })
    };
  }

  return {
    statusCode: 200,
    body: JSON.stringify(data?.data || null)
  };
};
