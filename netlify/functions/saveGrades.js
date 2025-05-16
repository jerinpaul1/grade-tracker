const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
  process.env.tgnhbmqgdupnzkbofotf.supabase.co,
  process.env.eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InRnbmhibXFnZHVwbnprYm9mb3RmIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc0NzQwMTI1NiwiZXhwIjoyMDYyOTc3MjU2fQ.Do_77abJm010MsVH3FXkbY-UKmeQVsWokQ2Qe0MKtvY
);

exports.handler = async (event, context) => {
  const { user } = context.clientContext;
  if (!user) {
    return { statusCode: 401, body: 'Not authenticated' };
  }

  const { data: newGrades } = JSON.parse(event.body);

  const userId = user.sub;

  // Try to update
  const { error: updateError } = await supabase
    .from('grades')
    .update({ data: newGrades })
    .eq('user_id', userId);

  // If update failed (maybe row doesn't exist), try insert
  if (updateError) {
    const { error: insertError } = await supabase
      .from('grades')
      .insert([{ user_id: userId, data: newGrades }]);

    if (insertError) {
      return {
        statusCode: 500,
        body: JSON.stringify({ error: insertError.message }),
      };
    }
  }

  return {
    statusCode: 200,
    body: JSON.stringify({ success: true }),
  };
};
