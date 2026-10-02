.. _http_server:

HTTP Server
###########

The HTTP server is provided by `Warp <https://aosabook.org/en/posa/warp.html>`_.

Graceful shutdown
-----------------

PostgREST uses Warp's graceful shutdown, when a ``SIGTERM`` is received:

- It stops accepting new requests.
- Allows requests that are already in progress to finish.
- Closes idle ``Keep-Alive`` connections instead of waiting for them to expire.
- Responses sent during shutdown indicate that the connection should not be reused (e.g. for HTTP/1.x, it sends ``Connection: close``).

This allows PostgREST to shut down promptly without interrupting in-flight requests. Useful for zero-downtime upgrades and autoscaling/load-balancing under cloud environments (AWS ECS, Kubernetes).
