#!/bin/sh

# Set the release to work across nodes. If using the long name format like
# the one below (my_app@127.0.0.1), you need to also uncomment the
# RELEASE_DISTRIBUTION variable below. Must be "sname", "name" or "none".

# for Fly.io
ip=$(grep fly-local-6pn /etc/hosts | cut -f 1)

if [ "$AWS_EXECUTION_ENV" = "AWS_ECS_FARGATE" ]; then
  # for AWS ECS Fargate
  ip=$(curl -sf "${ECS_CONTAINER_METADATA_URI_V4}" \
      | jq -r '.Networks[].IPv6Addresses[]' \
      | grep -Ev '^f[cd]' \
      | head -1)
elif [ -n "${POD_IP}" ]; then
  # for kubernetes
  ip=${POD_IP}
fi

# default to localhost
if [ -z $ip ]; then
  ip=127.0.0.1
fi

# assign the value of NODE_NAME if it exists, else assign the value of FLY_APP_NAME,
# and if that doesn't exist either, assign "realtime" to node_name
node_name="${NODE_NAME:=${APP_NAME:=realtime}}"

export RELEASE_DISTRIBUTION=name
export RELEASE_NODE=$node_name@$ip
