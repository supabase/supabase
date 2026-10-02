#!/usr/bin/env bash

# This test script expects that a `postgrest` executable with profiling enabled
# is on the PATH.

set -Eeuo pipefail

pgrPort=49421

export PGRST_DB_ANON_ROLE="postgrest_test_anonymous"
export PGRST_DB_POOL="1"
export PGRST_SERVER_HOST="127.0.0.1"
export PGRST_SERVER_PORT="$pgrPort"
export PGRST_JWT_SECRET="reallyreallyreallyreallyverysafe"
export PGRST_DB_CONFIG="false"

trap "kill 0" int term exit

currentTest=1
failedTests=0
result(){ echo "$1 $currentTest $2"; currentTest=$(( currentTest + 1 )); }
ok(){ result 'ok' "- $1"; }
ko(){ result 'not ok' "- $1"; failedTests=$(( failedTests + 1 )); }

pgrStart(){ postgrest +RTS -p -h > /dev/null 2>&1 & pgrPID="$!"; }
pgrStop(){ kill "$pgrPID" 2>/dev/null; }

checkPgrStarted(){
  while pgrStarted && test "$(rootStatus)" -ne 200
  do
    sleep 1
  done
}
pgrStarted(){ kill -0 "$pgrPID" 2>/dev/null; }
rootStatus(){
  curl -s -o /dev/null -I -w '%{http_code}' "http://localhost:$pgrPort/"
}

jsonKeyTest(){
  pgrStart
  checkPgrStarted
  factor=$(( 3*$(numfmt --from=si "$1")/4 )) # 3/4 on $1 is need to maintain the specified size because of base64
  payload="{\"blob\" : \"$(dd if=/dev/zero bs=$factor count=1 status=none | base64)\"}"
  httpStatus=$(echo "$payload" | curl -s -H "Content-Type: application/json" --request "$2" -d @- -w '%{http_code}' http://localhost:"$pgrPort""$3" | tr -d '"')
  if test "$httpStatus" -ge 200 && test "$httpStatus" -lt 210
  then
    pgrStop
    while [ ! -s postgrest.prof ]
    do
      sleep 1
    done
    BYTES_FMT=$(< postgrest.prof grep -o -P '(?<=alloc =).*(?=bytes)' | tr -d ' ')
    BYTES=$(echo "$BYTES_FMT" | tr -d ',')
    MAX_BYTES=$(numfmt --from=si "$4")
    if test "$BYTES" -le "$MAX_BYTES"
    then
      ok "$2 $3: with a json key of $1 the memory usage($BYTES_FMT bytes) is less than $4"
    else
      ko "$2 $3: with a json key of $1 the memory usage($BYTES_FMT bytes) is more than $4"
    fi
  else
    pgrStop
    ko "$2 $3: request failed with http $httpStatus"
  fi
}

postJsonArrayTest(){
  pgrStart
  checkPgrStarted
  arr=()
  arr+=('[')
  for i in $(seq 1 $(("$1" - 1)))
  do
    arr+=("{\"id\": $i, \"body\": \"xxxxxxx\"},")
  done
  arr+=("{\"id\": $1, \"body\": \"xxxxxxx\"}")
  arr+=(']')
  payload="${arr[*]}"
  httpStatus=$(echo "$payload" | curl -s -H "Content-Type: application/json" -d @- -w '%{http_code}' http://localhost:"$pgrPort""$2" | tr -d '"')
  if test "$httpStatus" -ge 200 && test "$httpStatus" -lt 210
  then
    pgrStop
    while [ ! -s postgrest.prof ]
    do
      sleep 1
    done
    BYTES_FMT=$(< postgrest.prof grep -o -P '(?<=alloc =).*(?=bytes)' | tr -d ' ')
    BYTES=$(echo "$BYTES_FMT" | tr -d ',')
    MAX_BYTES=$(numfmt --from=si "$3")
    PAYLOAD_SIZE=$(echo "$payload" | wc -c | numfmt --to=si)
    if test "$BYTES" -le "$MAX_BYTES"
    then
      ok "POST $2: with a json payload of $PAYLOAD_SIZE that has $1 array values the memory usage($BYTES_FMT bytes) is less than $3"
    else
      ko "POST $2: with a json payload of $PAYLOAD_SIZE that has $1 array values the memory usage($BYTES_FMT bytes) is more than $3"
    fi
  else
    pgrStop
    ko "POST $2: request failed with http $httpStatus"
  fi
}

echo "Running memory usage tests.."

jsonKeyTest "1M" "POST" "/rpc/leak?columns=blob" "22M"
jsonKeyTest "1M" "POST" "/leak?columns=blob" "22M"
jsonKeyTest "1M" "PATCH" "/leak?id=eq.1&columns=blob" "22M"

jsonKeyTest "10M" "POST" "/rpc/leak?columns=blob" "32M"
jsonKeyTest "10M" "POST" "/leak?columns=blob" "32M"
jsonKeyTest "10M" "PATCH" "/leak?id=eq.1&columns=blob" "50M"

jsonKeyTest "50M" "POST" "/rpc/leak?columns=blob" "78M"
jsonKeyTest "50M" "POST" "/leak?columns=blob" "78M"
jsonKeyTest "50M" "PATCH" "/leak?id=eq.1&columns=blob" "78M"

postJsonArrayTest "1000" "/perf_articles?columns=id,body" "21M"
postJsonArrayTest "10000" "/perf_articles?columns=id,body" "22M"
postJsonArrayTest "100000" "/perf_articles?columns=id,body" "25M"

trap - int term exit

exit $failedTests
