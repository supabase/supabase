export const USAGE_APPROACHING_THRESHOLD = 0.8

export const CANCELLATION_REASONS = [
  {
    value: 'I was just exploring, or it was a hobby/student project.',
  },
  {
    value: 'I was not satisfied with the customer support I received.',
    label: 'Could you tell us more about your experience with our support team?',
  },
  {
    value: 'Supabase is missing a specific feature I need.',
    label: 'What specific feature(s) are we missing?',
  },
  {
    value: 'I found it difficult to use or build with.',
    label: 'What specific parts of Supabase did you find difficult or frustrating?',
  },
  {
    value: 'Performance or reliability insufficient.',
    label:
      'Could you tell us more about the specific issues you encountered (e.g., UI bugs, API latency, downtime)?',
  },
  {
    value: 'My project was cancelled or put on hold.',
  },
  {
    value: 'Too expensive',
    label: 'We appreciate your perspective on our pricing, what aspects of the cost felt too high?',
  },
  {
    value: 'The pricing is unpredictable and hard to budget for.',
    label:
      'Which aspects of our pricing model made it difficult for you to predict your monthly costs?',
  },
  {
    value: 'My company went out of business or was acquired.',
  },
  {
    value: 'I lost trust in the company or its future direction.',
    label:
      'Building and maintaining your trust is our highest priority, could you please share the specific event or reason that led to this loss of trust?',
  },
]
