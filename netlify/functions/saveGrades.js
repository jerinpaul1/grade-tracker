const { createClient } = require('@supabase/supabase-js')

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_KEY
)

exports.handler = async (event) => {
  try {
    const userId = event.headers['x-user-id']
    if (!userId) {
      return { statusCode: 400, body: 'Missing x-user-id header' }
    }

    const payload = JSON.parse(event.body)
    if (!payload.subject || typeof payload.grade !== 'number') {
      return { statusCode: 400, body: 'Bad payload' }
    }

    const { data, error } = await supabase
      .from('grades')
      .insert([{ user_id: userId, data: payload }])
      .select('id, data, inserted_at')

    if (error) throw error

    return {
      statusCode: 201,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data[0])
    }
  } catch (err) {
    return {
      statusCode: err.status || 500,
      body: JSON.stringify({ error: err.message })
    }
  }
}
