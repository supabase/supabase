select
  pgmq.create('Foo');

select
  *
from
  pgmq.send(
    queue_name:='Foo',
    msg:='{"foo": "bar1"}'
  );


