const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

exports.handler = async (event, context) => {
  const auth = context.clientContext?.user;
  if (!auth) {
    return { statusCode: 401, body: "Not authenticated" };
  }

  if (event.httpMethod !== 'POST') {
    return { statusCode: 405, body: "Method Not Allowed" };
  }

  const gradesData = JSON.parse(event.body);

  // 1) See if a row exists for this user
  const { data: existing, error: selectError } = await supabase
    .from('grades')
    .select('id')
    .eq('user_id', auth.sub)
    .single();

  if (selectError && selectError.code !== 'PGRST116') {
    // some real error
    return { statusCode: 500, body: selectError.message };
  }

  // 2) If exists, update. If not, insert.
  let result;
  if (existing && existing.id) {
    result = await supabase
      .from('grades')
      .update({ data: gradesData })
      .eq('user_id', auth.sub);
  } else {
    result = await supabase
      .from('grades')
      .insert([{ user_id: auth.sub, data: gradesData }]);
  }

  if (result.error) {
    return { statusCode: 500, body: result.error.message };
  }

  return { statusCode: 200, body: JSON.stringify({ success: true }) };
};
