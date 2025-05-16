const { createClient } = require('@supabase/supabase-js');

exports.handler = async function () {
  const supabase = createClient(process.env.tgnhbmqgdupnzkbofotf.supabase.co , process.env.eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InRnbmhibXFnZHVwbnprYm9mb3RmIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDc0MDEyNTYsImV4cCI6MjA2Mjk3NzI1Nn0.gNk-pqah8xdmYjkY0qq217xoezqSVjVWsnasiXRmd1o);

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
