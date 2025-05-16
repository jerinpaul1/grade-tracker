import { createClient } from '@supabase/supabase-js'

const SUPABASE_URL = process.env.SUPABASE_URL
const SUPABASE_KEY = process.env.SUPABASE_KEY

const supabase = createClient(SUPABASE_URL, SUPABASE_KEY)
const userId = '7a073fc1-c486-4923-83ab-9ef0f76f4c73'  // replace with real auth logic

const form = document.getElementById('grade-form')
const subjectInput = document.getElementById('subject')
const gradeInput = document.getElementById('grade')
const messageEl = document.getElementById('message')
const listEl = document.getElementById('grades-list')

form.addEventListener('submit', async (e) => {
  e.preventDefault()
  const subject = subjectInput.value.trim()
  const grade = Number(gradeInput.value)

  if (!subject || isNaN(grade) || grade < 0 || grade > 100) {
    messageEl.textContent = 'Please enter a valid subject and grade (0–100).'
    return
  }

  form.querySelector('button').disabled = true
  messageEl.textContent = 'Saving…'

  try {
    const resp = await fetch('/.netlify/functions/saveGrades', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-user-id': userId
      },
      body: JSON.stringify({ subject, grade })
    })
    if (!resp.ok) throw new Error(await resp.text())
    messageEl.textContent = 'Grade saved!'
    subjectInput.value = ''
    gradeInput.value = ''
    await loadGrades()
  } catch (err) {
    messageEl.textContent = `Error: ${err.message}`
  } finally {
    form.querySelector('button').disabled = false
  }
})

async function loadGrades() {
  listEl.innerHTML = ''
  try {
    const resp = await fetch('/.netlify/functions/getGrades', {
      headers: { 'x-user-id': userId }
    })
    if (!resp.ok) throw new Error(await resp.text())
    const grades = await resp.json()
    grades.forEach(({ data, inserted_at }) => {
      const li = document.createElement('li')
      li.textContent = `${data.subject}: ${data.grade} (on ${new Date(inserted_at).toLocaleDateString()})`
      listEl.appendChild(li)
    })
  } catch (err) {
    messageEl.textContent = `Error loading grades: ${err.message}`
  }
}

// Initial load
loadGrades()
