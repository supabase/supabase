# Self-Hosted Authentication: Default Behavior

## Feature Flags
In self-hosted environments, the `authentication:sign_in_providers` feature is enabled by default. This ensures that the "Sign In / Providers" page functions correctly without requiring additional configuration.

## Overrides
Runtime overrides for feature flags can be applied via the `/api/enabled-features-overrides` endpoint. Ensure this endpoint is correctly configured to avoid unintended feature disablement.

## Testing
- Unit tests verify the behavior of `useAuthConfigQuery` and `AuthProvidersLayout`.
- E2E tests ensure the "Sign In / Providers" page renders correctly in self-hosted setups.

Refer to the [testing documentation](../tests/README.md) for more details.