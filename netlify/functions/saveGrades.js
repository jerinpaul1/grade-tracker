const { createClient } = require('@supabase/supabase-js');

exports.handler = async function (event) {
  const supabase = createClient(process.env.gnhbmqgdupnzkbofotf.supabase.co, process.env.eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InRnbmhibXFnZHVwbnprYm9mb3RmIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDc0MDEyNTYsImV4cCI6MjA2Mjk3NzI1Nn0.gNk-pqah8xdmYjkY0qq217xoezqSVjVWsnasiXRmd1o);

  const gradesData = JSON.parse(event.body);

  const { error } = await supabase
    .from('grades')
    .insert([{ data: gradesData }]);

  if (error) {
    return {
      statusCode: 500,
      body: JSON.stringify({ error: error.message }),
    };
  }

  return {
    statusCode: 200,
    body: JSON.stringify({ message: 'Grades saved successfully.' }),
  };
};
