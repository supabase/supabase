const express = require('express');
const app = express();
const port = 9000;

app.use(express.json());

// Health check endpoint
app.get('/health', (req, res) => {
  res.status(200).json({ status: 'healthy' });
});

// Default route
app.get('/', (req, res) => {
  res.json({ message: 'Edge Functions Service Running' });
});

app.listen(port, '0.0.0.0', () => {
  console.log(`Edge Functions service listening on port ${port}`);
});
