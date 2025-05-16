const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

exports.handler = async (event, context) => {
  const auth = context.clientContext?.user;
  if (!auth) return { statusCode: 401, body: "Not authenticated" };

  if (event.httpMethod !== 'POST')
    return { statusCode: 405, body: "Method Not Allowed" };

  const gradesData = JSON.parse(event.body);

  // Upsert on conflict user_id
  const { error } = await supabase
    .from('grades')
    .upsert(
      { user_id: auth.sub, data: gradesData },
      { onConflict: 'user_id' }
    );

  if (error) return { statusCode: 500, body: error.message };
  return { statusCode: 200, body: JSON.stringify({ success: true }) };
};
