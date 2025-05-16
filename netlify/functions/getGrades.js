const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
  'https://tgnhbmqgdupnzkbofotf.supabase.co',
  process.env.eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InRnbmhibXFnZHVwbnprYm9mb3RmIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc0NzQwMTI1NiwiZXhwIjoyMDYyOTc3MjU2fQ.Do_77abJm010MsVH3FXkbY-UKmeQVsWokQ2Qe0MKtvY
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
