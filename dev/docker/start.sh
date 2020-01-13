#!/bin/bash

exec postgrest /etc/postgrest.conf &
/prod/rel/realtime/bin/realtime start &