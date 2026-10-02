select id_encode(1001); -- Result: jNl
select id_encode(1234567, 'This is my salt'); -- Result: Pdzxp
select id_encode(1234567, 'This is my salt', 10); -- Result: PlRPdzxpR7
select id_encode(1234567, 'This is my salt', 10, 'abcdefghijABCDxFGHIJ1234567890'); -- Result: 3GJ956J9B9
select id_decode('PlRPdzxpR7', 'This is my salt', 10); -- Result: 1234567
select id_decode('3GJ956J9B9', 'This is my salt', 10, 'abcdefghijABCDxFGHIJ1234567890'); -- Result: 1234567
