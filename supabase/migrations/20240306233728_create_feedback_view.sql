create schema if not exists metrics;

create view metrics.feedback_response_aggregate
as select
  count(*) filter (where vote = 'yes') as yes,
  count(*) filter (where vote = 'no') as no
from feedback;