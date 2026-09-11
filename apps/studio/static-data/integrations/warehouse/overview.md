Supabase Warehouse keeps a copy of your database optimized for analytical queries. Applications keep using
Postgres for transactional workloads, while analytical tools connect to a separate FlightSQL endpoint.
This keeps the two paths independent, so analytical queries never run against your primary database.
