[Stripe](https://stripe.com/) is an API driven payment processing and subscription management platform.

The Stripe Wrapper is a foreign data wrapper which allows you to read and write data from Stripe within your Postgres database.

Foreign tables do not support Row Level Security.
Keep them in a private schema, or expose selected data through a security-definer function before using them through the Data API.
