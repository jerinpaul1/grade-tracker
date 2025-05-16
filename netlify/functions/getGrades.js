const { createClient } = require('@supabase/supabase-js');

exports.handler = async function () {
  const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_ANON_KEY);

  const { data, error } = await supabase
    .from('grades')
    .select('data')
    .order('id', { ascending: false })
    .limit(1);

  if (error) {
    return {
      statusCode: 500,
      body: JSON.stringify({ error: error.message }),
    };
  }

  return {
    statusCode: 200,
    body: JSON.stringify(data[0]?.data || {}),
  };
};
