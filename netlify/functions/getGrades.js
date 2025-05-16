const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

exports.handler = async (event, context) => {
  const auth = context.clientContext?.user;
  if (!auth) return { statusCode: 401, body: "Not authenticated" };

  const { data, error } = await supabase
    .from('grades')
    .select('data')
    .eq('user_id', auth.sub)
    .single();

  if (error && error.code !== 'PGRST116')
    return { statusCode: 500, body: error.message };

  return { statusCode: 200, body: JSON.stringify(data?.data || { years: [] }) };
};
