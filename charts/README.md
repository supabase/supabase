# Supabase for Kubernetes with Helm 3

This directory contains the configurations and scripts required to run Supabase inside a Kubernetes cluster.

## Disclamer

We use [bitnami/postgres](https://github.com/bitnami/charts/tree/master/bitnami/postgresql) to create and manage the Postgres database. This permit you to use replication if needed but you'll have to use the Postgres image provided Bitnami or build your own on top of it. You can also choose to use other databases provider like [StackGres](https://stackgres.io/) or [Postgres Operator](https://github.com/zalando/postgres-operator).

For the moment we are using a root container to permit the installation of the missing `pgjwt` and `wal2json` extension inside the `initdbScripts`. This is considered a security issue, but you can use your own Postgres image instead with the extension already installed to prevent this. We provide an example of `Dockerfile`for this purpose, you can use [ours](https://hub.docker.com/r/tdeoliv/supabase-bitnami-postgres) or build and host it on your own.

The database configuration we provide is an example using only one master. If you want to go to production, we highly recommend you to use a replicated database.

## How to use in local

> For this section we're using Minikube and Docker to create a Kubernetes cluster

You'll first need to replace the secrets and endpoints with correct values inside the `values.template.yaml`.

You can create a copy of this file and update the following values:

- `your-super-secret-jwt-token-with-at-least-32-characters-long`: With a generated secret key (`openssl rand 64 | base64`).
- `JWT_ANON_KEY`: A JWT signed with the key above and the role `anon`.
- `JWT_SERVICE_KEY`: A JWT signed with the key above and the role `service_role`. You can use the [JWT Tool](https://supabase.com/docs/guides/hosting/overview#api-keys) to generate your keys.
- `MY_VERY_HARD_PASSWORD_FOR_DATABASE`: Postgres root password for the created database.
- `RELEASE_NAME`: Name used for helm release.
- `NAMESPACE`: Namespace used for the helm release.

Considering that the database is local to the cluster you can use the following pattern: `RELEASE_NAME-database.NAMESPACE_NAME.svc.cluster.local`

```bash
helm install RELEASE_NAME charts/supabase --namespace NAMESPACE -f charts/supabase/values.yaml -f charts/supabase/values.example.yaml --create-namespace
```

The first deployment can take some time to complete. You can view the status of the pods using:

```bash
kubectl get pod -n NAMESPACE
```

### Tunnel with Minikube

When the installation will be complete you'll be able to create a tunnel using minikube:

```bash
minikube tunnel
```

If you just use the `value.example.yaml` file, you can access the API or the Studio App using the following endpoints:

- <http://api.localhost>
- <http://studio.localhost>

## How to use in production

We didn't provide a complete configuration to go production because of the multiple possibility.

But here are the important points you have to think about:

- Use a replicated version of the Postgres database.
- Add SSL to the Postgres database.
- Add SSL configuration to the ingresses endpoints using either the `cert-manager` or a LoadBalancer provider.
- Change the domain used in the ingresses endpoints.
- Generate a new secure JWT Secret.

## Troubleshooting

### Ingress Controller and Ingress Class

Depending on your Kubernetes version you might want to fill the `className` property instead of the `kubernetes.io/ingress.class` annotations. For example:

```yml
kong:
  ingress:
    enabled: 'true'
    className: "nginx"
    annotations:
      nginx.ingress.kubernetes.io/rewrite-target: /
```

###
