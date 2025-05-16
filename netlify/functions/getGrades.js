const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
  'https://tgnhbmqgdupnzkbofotf.supabase.co',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InRnbmhibXFnZHVwbnprYm9mb3RmIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDc0MDEyNTYsImV4cCI6MjA2Mjk3NzI1Nn0.gNk-pqah8xdmYjkY0qq217xoezqSVjVWsnasiXRmd1o'
);

exports.handler = async function () {
  const { data, error } = await supabase
    .from('grades')
    .select('*')
    .single();

  return {
    statusCode: 200,
    body: JSON.stringify(data?.data || [])
  };
};
