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

    const { data, error } = await supabase
      .from('grades')
      .select('id, data, inserted_at')
      .eq('user_id', userId)
      .order('inserted_at', { ascending: false })

    if (error) throw error

    return {
      statusCode: 200,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data)
    }
  } catch (err) {
    return {
      statusCode: err.status || 500,
      body: JSON.stringify({ error: err.message })
    }
  }
}
