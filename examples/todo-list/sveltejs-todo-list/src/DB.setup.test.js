const supabase = require('./_testHelper')
describe('DB', () => {
  it('has users setup?', async () => {
    const { body: users } = await supabase.from('users').select(`
      *
  `)
    expect(users.length).toBeGreaterThanOrEqual(0)
  })

  it('has lists setup?', async () => {
    const { body: lists } = await supabase.from('lists').select(`
      *
  `)
    expect(lists.length).toBeGreaterThanOrEqual(0)
  })

  it('has tasks setup?', async () => {
    const { body: tasks } = await supabase.from('tasks').select(`
      *
  `)
    expect(tasks.length).toBeGreaterThanOrEqual(0)
  })
})
