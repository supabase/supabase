select realtime.check_equality_op('eq', 'text', 'aaa', 'aaa');
select realtime.check_equality_op('eq', 'text', 'aaa', 'bbb');
select realtime.check_equality_op('neq', 'text', 'aaa', 'aaa');
select realtime.check_equality_op('neq', 'text', 'aaa', 'bbb');
select realtime.check_equality_op('lt', 'text', 'aaa', 'bbb');
select realtime.check_equality_op('lt', 'text', 'bbb', 'aaa');
select realtime.check_equality_op('lt', 'text', 'bbb', 'bbb');
select realtime.check_equality_op('lte', 'text', 'aaa', 'bbb');
select realtime.check_equality_op('lte', 'text', 'bbb', 'aaa');
select realtime.check_equality_op('lte', 'text', 'bbb', 'bbb');
select realtime.check_equality_op('gt', 'text', 'aaa', 'bbb');
select realtime.check_equality_op('gt', 'text', 'bbb', 'aaa');
select realtime.check_equality_op('gt', 'text', 'bbb', 'bbb');
select realtime.check_equality_op('gte', 'text', 'aaa', 'bbb');
select realtime.check_equality_op('gte', 'text', 'bbb', 'aaa');
select realtime.check_equality_op('gte', 'text', 'bbb', 'bbb');
select realtime.check_equality_op('eq', 'bigint', '1', '1');
select realtime.check_equality_op('eq', 'bigint', '2', '1');
select realtime.check_equality_op('eq', 'bigint', '2', null);

select realtime.check_equality_op('eq','uuid','639f86b1-738b-43ed-bb09-c8d3f3bafa30','639f86b1-738b-43ed-bb09-c8d3f3bafa30');
select realtime.check_equality_op('eq','uuid','639f86b1-738b-43ed-bb09-c8d3f3bafa30','b423f213-ac24-402a-95ea-cf1d94d8e9f0');

select realtime.check_equality_op('in', 'bigint', '2', '{1,2,3}');
select realtime.check_equality_op('in', 'bigint', '4', '{1,2,3}');
