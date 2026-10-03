# Changelog

## [2.197.0](https://github.com/supabase/auth/compare/v2.196.0...v2.197.0) (2026-09-03)


### Features

* fix golangci-lint errors ([#2776](https://github.com/supabase/auth/issues/2776)) ([5e372a9](https://github.com/supabase/auth/commit/5e372a96c05b001871f41260b2f35bdefc5d68fb))
* **mfa:** add recovery code crypto primitives ([e3ab2df](https://github.com/supabase/auth/commit/e3ab2dfeb8d144be414a1a650ad6b4cbdd3e6a5d))
* **mfa:** add recovery code factor model support ([cb30720](https://github.com/supabase/auth/commit/cb30720732a153c4c59992031c1c8359211e1b25))
* **mfa:** add recovery codes configuration ([507e2ab](https://github.com/supabase/auth/commit/507e2abbac3a294a4368edc730b7f064672ea340))
* **mfa:** add recovery codes delete endpoint ([0907af9](https://github.com/supabase/auth/commit/0907af9bd6be3c76f472c40a7dcc0dc34abeffaf))
* **mfa:** add recovery codes regenerate endpoint ([4c82af9](https://github.com/supabase/auth/commit/4c82af989a4c8bcf6233ef6e052aeb4e8805c9d7))
* **mfa:** add recovery codes status and generate endpoints ([6607756](https://github.com/supabase/auth/commit/6607756c37af44686fa79d4e4e39556ffdfafea2))
* **mfa:** add recovery codes verify endpoint ([92a1569](https://github.com/supabase/auth/commit/92a156932c3f2a154a24613c2a56b95c8cea0fac))
* **mfa:** add schema for recovery codes factor ([#2725](https://github.com/supabase/auth/issues/2725)) ([5e4bec6](https://github.com/supabase/auth/commit/5e4bec6847bb47162f28c4c3ad02af0f51b748f1))
* **mfa:** recovery code storage model ([270d02f](https://github.com/supabase/auth/commit/270d02f083a5e50337094b3056df6b575c83f515))
* **mfa:** recovery codes API errors ([41f0498](https://github.com/supabase/auth/commit/41f04986b6af7fdffc270af56cb53b8627177778))
* **mfa:** recovery codes audit log events ([20b4c05](https://github.com/supabase/auth/commit/20b4c0539b0e78f57f22145337818bb0d6657a81))
* **mfa:** recovery codes metering ([63d8d83](https://github.com/supabase/auth/commit/63d8d83e9f16c0d43e2e8090fad845627345729a))
* **oauth:** emit login metering events for OAuth server token exchanges ([#2749](https://github.com/supabase/auth/issues/2749)) ([719db0b](https://github.com/supabase/auth/commit/719db0b75c79168fd2d75046fa48c09cacf7780b))
* **otp:** add expires_at column to one_time_tokens table ([#2765](https://github.com/supabase/auth/issues/2765)) ([05d9aec](https://github.com/supabase/auth/commit/05d9aece5bf87e4135c9ec6706a4079ffaed1112))
* **scim:** add scim_users, scim_tokens tables ([#2745](https://github.com/supabase/auth/issues/2745)) ([9c8b7ee](https://github.com/supabase/auth/commit/9c8b7eeba9d9baa68429790e17388e5b8eef305d))

## [2.196.0](https://github.com/supabase/auth/compare/v2.195.0...v2.196.0) (2026-08-12)


### Features

* **admin:** create an email identity when an admin sets a first password ([f369cfa](https://github.com/supabase/auth/commit/f369cfa6a2b651e19b1247a8a67bf6a124c03984))
* **auditlogs:** introduce identity linked action ([2d4680e](https://github.com/supabase/auth/commit/2d4680ef054bedc898da1dbac1b6a7cb9cf5b5af))
* **conf:** add experimental flag for creating an email identity on password set ([8f19669](https://github.com/supabase/auth/commit/8f19669492e17e219bfda5a264a0af3f11940ffb))
* create an email identity when a user adds their first password ([3afa027](https://github.com/supabase/auth/commit/3afa027c5cd0709ae82b46b461c8addbfd527be9))
* **scim:** Add /ResourceTypes and /Schemas ([#2664](https://github.com/supabase/auth/issues/2664)) ([0fb56ca](https://github.com/supabase/auth/commit/0fb56ca93fcbe033bc2b0309bafbd86ef97aa468))
* **scim:** implement `/scim/v2/ServiceProviderConfig` ([#2662](https://github.com/supabase/auth/issues/2662)) ([3ac3620](https://github.com/supabase/auth/commit/3ac362071760982ad9064b67e5f5e514ab7b2a89))
* **scim:** render SCIM errors in RFC 7644 form ([#2661](https://github.com/supabase/auth/issues/2661)) ([dc5bf8e](https://github.com/supabase/auth/commit/dc5bf8e843852d35fb0503ad7974c4ca71f80a85))


### Bug Fixes

* **auditlogs:** add IP address to IdentityUnlinkAction entires ([1a3a477](https://github.com/supabase/auth/commit/1a3a4773f1c59c3aa25d2d06b5be0c734f391a1a))
* **auditlogs:** add missing IdentityUnlinkAction action ([9c45038](https://github.com/supabase/auth/commit/9c45038bb27079ac9dc31aa3ee41f69eebfb6f16))
* **auditlogs:** add missing UserReauthenticateAction action ([dcc140f](https://github.com/supabase/auth/commit/dcc140f1fd7dd4d529c8ee116970a087cc4761d5))
* clear pending phone change when the user's email is replaced ([5ce63bb](https://github.com/supabase/auth/commit/5ce63bbe251970ac3eb2bbfb160f5954563db4fd))
* correctly update email confirmation when an identity is unlinked ([e2fae4c](https://github.com/supabase/auth/commit/e2fae4cffc5763fc56d70a5a70c3bc8bd19f0bfe))
* **mailer:** send identity unlinked notification to pre-unlink email ([#2692](https://github.com/supabase/auth/issues/2692)) ([2399fe5](https://github.com/supabase/auth/commit/2399fe5875cf0718eec54b614c3b2a227277c1b5))
* **oauth:** ignore unsupported signing alg in JWKS ([#2696](https://github.com/supabase/auth/issues/2696)) ([713a0d9](https://github.com/supabase/auth/commit/713a0d9e37a0a12b9d0e97d8b9919addffa2356e))
* revoke outstanding email tokens when the user's email is replaced ([cf74a14](https://github.com/supabase/auth/commit/cf74a14fd7ed94645d318162f803bcb73da60662))
* unlinking an identity should respect the autoconfirm behaviour ([83df1d9](https://github.com/supabase/auth/commit/83df1d930f61fd64c3ea0578de182f09d82b13d4))
* use provider constants ([d6dec26](https://github.com/supabase/auth/commit/d6dec2640f047a42873e64ccec2f7288043d511f))

## [2.195.0](https://github.com/supabase/auth/compare/v2.194.0...v2.195.0) (2026-07-30)


### Features

* gate SCIM router behind an experimental feature flag ([#2639](https://github.com/supabase/auth/issues/2639)) ([0fde049](https://github.com/supabase/auth/commit/0fde049ae7e60cdfa41daa6a52e7a1eb003f8733))


### Bug Fixes

* accept offline_access OAuth scope for MCP refresh clients ([#2630](https://github.com/supabase/auth/issues/2630)) ([059b86c](https://github.com/supabase/auth/commit/059b86c41fb622959c2cc8a82662462492f1e217))
* **auditlogs:** add missing events to docs ([3e5d493](https://github.com/supabase/auth/commit/3e5d4935f3594fd4c90263c4b04c50482c9a09f8))
* **auditlogs:** remove unused mfa code audit log events ([2909344](https://github.com/supabase/auth/commit/2909344fac21e1355a0a9f1c8316af654ec5aff3))
* **auditlogs:** remove unused recovery codes audit log events ([d4ca02a](https://github.com/supabase/auth/commit/d4ca02acf217c1949fea5a356d855aac9dfeea5c))
* persist last_sign_in_at on v2 refresh token issuance ([#2655](https://github.com/supabase/auth/issues/2655)) ([fc654b0](https://github.com/supabase/auth/commit/fc654b05e7a02a6a8c375b3a7895bcd563b790ca))
* reject AT from banned users ([#2642](https://github.com/supabase/auth/issues/2642)) ([b6878c2](https://github.com/supabase/auth/commit/b6878c2fa63f805dbd27436c36ba7ebbc2b7e44d))
* update google.golang.org/grpc to v1.82.1 ([#2651](https://github.com/supabase/auth/issues/2651)) ([4a596c0](https://github.com/supabase/auth/commit/4a596c0d556e7bed6874f87af18aab3f4fb4efa1))

## [2.194.0](https://github.com/supabase/auth/compare/v2.193.1...v2.194.0) (2026-07-27)


### Features

* add cursor-based pagination for admin users list ([#2633](https://github.com/supabase/auth/issues/2633)) ([76e2aac](https://github.com/supabase/auth/commit/76e2aace4899f71bfc6038c8a00c913936a4561e))
* add optional override for custom provider redirect URIs ([#2641](https://github.com/supabase/auth/issues/2641)) ([67c55c0](https://github.com/supabase/auth/commit/67c55c00789d69505881e3143dc248a2a1d2ab55))


### Bug Fixes

* consolidate error logs into single log entry ([#2635](https://github.com/supabase/auth/issues/2635)) ([47b3d94](https://github.com/supabase/auth/commit/47b3d9429f22412a01c0e7a02aaa76156a9ea7e7))
* **deps:** bump otel versions for vulncheck ([#2648](https://github.com/supabase/auth/issues/2648)) ([4c2d691](https://github.com/supabase/auth/commit/4c2d691f7c2d2cebe7d4c9b37d78cd2fb564ea53))
* upgrade to x/text@v0.39.0 GO-2026-5970 ([#2636](https://github.com/supabase/auth/issues/2636)) ([66421c6](https://github.com/supabase/auth/commit/66421c6f77bc045fb83dab1fc38d97158418f5aa))

## [2.193.1](https://github.com/supabase/auth/compare/v2.193.0...v2.193.1) (2026-07-16)


### Bug Fixes

* build darwin-arm64 release binaries with GOOS=darwin ([#2618](https://github.com/supabase/auth/issues/2618)) ([318b4d1](https://github.com/supabase/auth/commit/318b4d166ffc407e661dc99580082758a9b4e885))
* ensure legacy refresh token revoked ([#2624](https://github.com/supabase/auth/issues/2624)) ([8748000](https://github.com/supabase/auth/commit/87480005e2c3a16e35e5f6eacb97ea22b82ac9a5))
* **oauth:** prevent authorization-code replay race at /oauth/token ([#2612](https://github.com/supabase/auth/issues/2612)) ([bdbf01e](https://github.com/supabase/auth/commit/bdbf01eb99ac8750bfa6ec06626002673cf5479d))
* **siwe:** return false instead of panicking on malformed signatures ([#2625](https://github.com/supabase/auth/issues/2625)) ([c3005a4](https://github.com/supabase/auth/commit/c3005a47c20240d21772bb5103843b15bbc472bb))

## [2.193.0](https://github.com/supabase/auth/compare/v2.192.0...v2.193.0) (2026-07-07)


### Features

* **linking:** add experimental provider linking-domain groups ([#2604](https://github.com/supabase/auth/issues/2604)) ([c4f6964](https://github.com/supabase/auth/commit/c4f69649a0d95a86648b23657795b5430894f472))


### Bug Fixes

* downgrade session AAL after admin deletion of factor ([#2607](https://github.com/supabase/auth/issues/2607)) ([4d1d660](https://github.com/supabase/auth/commit/4d1d660674ce15d9858cc220a3deda0cf0088077))
* **mfa:** use AMR method (not factor type) when downgrading sessions to AAL1 ([#2615](https://github.com/supabase/auth/issues/2615)) ([dfe62d0](https://github.com/supabase/auth/commit/dfe62d0fcc047099614c2eaff4b4d20d807671d9))

## [2.192.0](https://github.com/supabase/auth/compare/v2.191.0...v2.192.0) (2026-06-29)


### Features

* **custom-oauth:** add per-provider custom_claims_allowlist ([#2576](https://github.com/supabase/auth/issues/2576)) ([acecb06](https://github.com/supabase/auth/commit/acecb063b0d089d6329af04171b3bc3903508c3b))


### Bug Fixes

* **tests:** rely on error codes for hooks tests to work across PG backends ([ee91c5f](https://github.com/supabase/auth/commit/ee91c5fd31ce3fd6721cb40ae1795ba702b8c9b8))
* **vulncheck:** ignore GO-2026-5004 (pgx/v4, not reachable) ([#2602](https://github.com/supabase/auth/issues/2602)) ([f1cc16f](https://github.com/supabase/auth/commit/f1cc16fbd54b41623b8d39b0663d410ebbe9c9e6))

## [2.191.0](https://github.com/supabase/auth/compare/v2.190.0...v2.191.0) (2026-06-17)


### Features

* add RS256 signing keys backed by AWS KMS ([#2571](https://github.com/supabase/auth/issues/2571)) ([983f59a](https://github.com/supabase/auth/commit/983f59ac2e61de30533d108c08593a4eec5a0f61))
* **saml:** support zero-downtime SP key rotation  ([#2575](https://github.com/supabase/auth/issues/2575)) ([5b95ff8](https://github.com/supabase/auth/commit/5b95ff82f6745d25be5eb66d4843d7362c2582a8))

## [2.190.0](https://github.com/supabase/auth/compare/v2.189.0...v2.190.0) (2026-06-11)


### Features

* add -failfast to make test command ([#2553](https://github.com/supabase/auth/issues/2553)) ([bec1dd0](https://github.com/supabase/auth/commit/bec1dd022c3ae7a97c70249949f40056f4c06071))
* **conf:** add JSON config file support ([#2540](https://github.com/supabase/auth/issues/2540)) ([e63fef9](https://github.com/supabase/auth/commit/e63fef9c71a3287aee6fcc7c595ad82797e357cd))
* create tools directory for deterministic builds ([#2522](https://github.com/supabase/auth/issues/2522)) ([52cf3d9](https://github.com/supabase/auth/commit/52cf3d9bc2b6cbd971f4c85b81cd1e9a8bf9e381))
* **custom-oidc:** support non-standard discovery URLs ([#2573](https://github.com/supabase/auth/issues/2573)) ([3dacc64](https://github.com/supabase/auth/commit/3dacc6410202e832de2044a5dff1cc8bae8065bd))
* fix the vulncheck-filter to parse the text format instead ([#2525](https://github.com/supabase/auth/issues/2525)) ([4136d49](https://github.com/supabase/auth/commit/4136d49ebdee4e35fb9c9713f33bd5664b959431))
* fork github.com/joho/godotenv into internal/conf/envparse ([#2521](https://github.com/supabase/auth/issues/2521)) ([cda62a9](https://github.com/supabase/auth/commit/cda62a9c215ea1b8eb7ab281e0db549a2c9e4b46))


### Bug Fixes

* Azure issuer validation ([#2560](https://github.com/supabase/auth/issues/2560)) ([a39858b](https://github.com/supabase/auth/commit/a39858b6e9d194198005eceff9e707c0cd3118e1))
* catch cancelation errors in bg workers & servers ([#2530](https://github.com/supabase/auth/issues/2530)) ([77f5918](https://github.com/supabase/auth/commit/77f5918c0646433e67aec9e2e560168a50d844c3))
* check session state for admin tokens ([#2555](https://github.com/supabase/auth/issues/2555)) ([c5969ed](https://github.com/supabase/auth/commit/c5969ed897f2fefc2af386e78eb15b68b214ef0d))
* **config:** warn on invalid WebAuthn config instead of erroring ([#2545](https://github.com/supabase/auth/issues/2545)) ([ca0b154](https://github.com/supabase/auth/commit/ca0b1547f77f5261458a6e91ca2ccb2c0e907ca7))
* **custom-oidc:** strip trailing slashes from issuer ([#2570](https://github.com/supabase/auth/issues/2570)) ([169ad67](https://github.com/supabase/auth/commit/169ad67533ccad633d69ecb69e768888449d5090))
* **Dockerfile:** ensure forks exists on fs before make deps ([#2567](https://github.com/supabase/auth/issues/2567)) ([01f136d](https://github.com/supabase/auth/commit/01f136de0101c40f5033958c6b50d59dd084ee45))
* **mailer:** include SiteURL in notification template data ([#2532](https://github.com/supabase/auth/issues/2532)) ([dc015da](https://github.com/supabase/auth/commit/dc015da420a3b9255f152b9d6dd7e17718d6e550))
* **oauth-server:** serialize concurrent authorize/consent with row-level lock ([#2512](https://github.com/supabase/auth/issues/2512)) ([c816cfe](https://github.com/supabase/auth/commit/c816cfeec75c8521f8e25260de7073c7236a9ac9))
* **passkeys:** delete webauthn creds when user is soft-deleted ([#2564](https://github.com/supabase/auth/issues/2564)) ([7e1c060](https://github.com/supabase/auth/commit/7e1c0603cb4a1f6bf7e862a4154f558918a1a870))
* **passkeys:** enforce AAL checks on passkey registration and deletion ([#2565](https://github.com/supabase/auth/issues/2565)) ([7e6f2e4](https://github.com/supabase/auth/commit/7e6f2e473e5d4ac8bb09bb06c55cc2ed4e20a102))
* source WebAuthn RP config from env vars ([#2490](https://github.com/supabase/auth/issues/2490)) ([63949ca](https://github.com/supabase/auth/commit/63949cace4028679ec00192819fb66a5dc0f56f0))
* when version is empty set to 0.0.0 ([#2531](https://github.com/supabase/auth/issues/2531)) ([a3b7c8c](https://github.com/supabase/auth/commit/a3b7c8c54d2a22bc6f9566591d94a9e07bbc7cc3))

## [2.189.0](https://github.com/supabase/auth/compare/v2.188.1...v2.189.0) (2026-04-23)


### Features

* add PKCE support for `/resend` ([#2401](https://github.com/supabase/auth/issues/2401)) ([2af904a](https://github.com/supabase/auth/commit/2af904a2bcd78ee3b64b9e29424dfa78e9616233))
* improve parallelization in github workflows and Makefile ([#2436](https://github.com/supabase/auth/issues/2436)) ([9d0c4b3](https://github.com/supabase/auth/commit/9d0c4b3f8859a4d1b5a48ce5962a5fa9accdae61))
* **passkeys:** add CAPTCHA to options endpoint for authentication ([#2416](https://github.com/supabase/auth/issues/2416)) ([c7b58be](https://github.com/supabase/auth/commit/c7b58be5cc520dcc0963ec3346807561c176624b))
* support live reloading of individual rate limits ([#2469](https://github.com/supabase/auth/issues/2469)) ([d03d796](https://github.com/supabase/auth/commit/d03d796162779d51ce58bf1b56b0991ec86700bc))


### Bug Fixes

* ensure identities are returned in a consistent order across DB engines ([#2465](https://github.com/supabase/auth/issues/2465)) ([e49a3e5](https://github.com/supabase/auth/commit/e49a3e5e5dd5a75abdaa0a52a62f644470737e3a))
* ensure SSO providers tests are order-independent ([#2466](https://github.com/supabase/auth/issues/2466)) ([983ade6](https://github.com/supabase/auth/commit/983ade65789fce94cb632d154905d594181389a2))
* exempt PKCE recovery sessions from require-current-password check ([#2502](https://github.com/supabase/auth/issues/2502)) ([7f88985](https://github.com/supabase/auth/commit/7f889859787c72f59ea8b820d9d0f388965252ff))
* **indexworker:** skip index creation on OrioleDB ([#2481](https://github.com/supabase/auth/issues/2481)) ([dd56ae9](https://github.com/supabase/auth/commit/dd56ae91eb5bf64519ff650b58066338fd1a9b20))
* **passkeys:** modify the passkeys request and response shapes ([#2475](https://github.com/supabase/auth/issues/2475)) ([2d8f2b6](https://github.com/supabase/auth/commit/2d8f2b6168cfc753f55c7bd157bfda6ef05af007))
* prevent reuse of flow state ([#2483](https://github.com/supabase/auth/issues/2483)) ([88dcb2d](https://github.com/supabase/auth/commit/88dcb2d290a7c06cfff707ddf918b08f25ec141c))
* return JSON response for unmatched routes instead of plain text ([#2457](https://github.com/supabase/auth/issues/2457)) ([7337e21](https://github.com/supabase/auth/commit/7337e21c288c93951cfef3b60c1988ead296c4b7))

## [2.188.1](https://github.com/supabase/auth/compare/v2.188.0...v2.188.1) (2026-03-19)


### Bug Fixes

* remove make all from release workflow ([#2433](https://github.com/supabase/auth/issues/2433)) ([036e723](https://github.com/supabase/auth/commit/036e7239fe3666cc192f77712b7648c3369bf0f8))

## [2.188.0](https://github.com/supabase/auth/compare/v2.187.0...v2.188.0) (2026-03-17)


### Features

* cache OIDC discovery documents for providers ([#2389](https://github.com/supabase/auth/issues/2389)) ([40d07b5](https://github.com/supabase/auth/commit/40d07b5f50ec4dce5c5a27e405097bc90c027000))
* enable custom providers by default ([#2427](https://github.com/supabase/auth/issues/2427)) ([291cdad](https://github.com/supabase/auth/commit/291cdad62dd3209589324d8ce78021fe649a3521))
* modernize IsNotFoundError handler to support errors.Is ([#2392](https://github.com/supabase/auth/issues/2392)) ([ab7c9f9](https://github.com/supabase/auth/commit/ab7c9f98a7fd98f0ff29d1f97784fc9e4dbfc87c))
* **oauth-server:** allow updating `token_endpoint_auth_method` for OAuth clients ([#2391](https://github.com/supabase/auth/issues/2391)) ([1280dc1](https://github.com/supabase/auth/commit/1280dc1ad75fce6e69bfa15c262c4b637c0720b5))
* **passkeys:** add admin endpoints to list and delete passkeys ([f109550](https://github.com/supabase/auth/commit/f109550fdc9a3fb227534a067e4c9b999728fdef))
* **passkeys:** add audit, metering, webauthn primitives ([039b569](https://github.com/supabase/auth/commit/039b569cd2cb1541d9b7d1b93bfb7b4d8996e820))
* **passkeys:** add configuration, error codes, and schemas ([0a5eb95](https://github.com/supabase/auth/commit/0a5eb957407f007099608a032e540401fc186d0f))
* **passkeys:** add discoverable credential auth flow ([#2411](https://github.com/supabase/auth/issues/2411)) ([1bc68ea](https://github.com/supabase/auth/commit/1bc68ea59c0ac7d4f7d61b2d1888054f32459a44))
* **passkeys:** add management endpoints ([#2413](https://github.com/supabase/auth/issues/2413)) ([5b3218e](https://github.com/supabase/auth/commit/5b3218e0993dc35df44ee7c52af67d13d6c4717e))
* **passkeys:** add rate limiter on the `/options` endpoint for authentication ([#2422](https://github.com/supabase/auth/issues/2422)) ([30b3aeb](https://github.com/supabase/auth/commit/30b3aeb464e6728a9d95af783d8eccfce1448d0c))
* **passkeys:** derive friendly name from AAGUID ([#2415](https://github.com/supabase/auth/issues/2415)) ([e00ff1a](https://github.com/supabase/auth/commit/e00ff1a4a644b03bc6fef86bfc93cc1356828d1e))
* **passkeys:** progressive enrollment flow ([61ae2aa](https://github.com/supabase/auth/commit/61ae2aa17bdf9f234d61a631d71467cbf1d12f4e))


### Bug Fixes

* add MaxBytesReader middleware to limit request body size to 1MB ([#2402](https://github.com/supabase/auth/issues/2402)) ([6f0b2eb](https://github.com/supabase/auth/commit/6f0b2ebc8c7bb96735cb6432923b3618ffb81a5c))
* bump Go to v1.25.8 ([#2412](https://github.com/supabase/auth/issues/2412)) ([a2e357f](https://github.com/supabase/auth/commit/a2e357f878805b9227002294e6d878279949b4b1))
* **passkeys:** construct configuration env var correctly ([dba676e](https://github.com/supabase/auth/commit/dba676ef9c1087e509006c01893d9f8d9d3bbb37))
* **passkeys:** enforce passkey cap during registration verify ([9868df6](https://github.com/supabase/auth/commit/9868df617af0cccd9f88ba71600058eeb31024ea))
* **passkeys:** return 204 when deleting a passkey ([7d90fb8](https://github.com/supabase/auth/commit/7d90fb8f983560d6a3469725980ab999e5ed2cc1))
* **passkeys:** sign_count should be uint32 ([e509e3a](https://github.com/supabase/auth/commit/e509e3a80e075ccb92f738000bb592f475487a3c))

## [2.187.0](https://github.com/supabase/auth/compare/v2.186.0...v2.187.0) (2026-02-23)


### Features

* add metadata field to all hooks ([#2365](https://github.com/supabase/auth/issues/2365)) ([c675749](https://github.com/supabase/auth/commit/c67574946d1e11c7986d2c868336df0cefbe3452))
* check current password on change ([#2364](https://github.com/supabase/auth/issues/2364)) ([33b87ae](https://github.com/supabase/auth/commit/33b87ae0671aba2e9b4df0ef1d5d1e7906c32129))
* **indexworker:** add max users threshold for rollout ([#2374](https://github.com/supabase/auth/issues/2374)) ([a2066c6](https://github.com/supabase/auth/commit/a2066c6a340fd3ebcaa0a816ab06ee3d6b1afad7))
* **metrics:** added a gauge with version information ([#2375](https://github.com/supabase/auth/issues/2375)) ([911ad0b](https://github.com/supabase/auth/commit/911ad0bae0b65b878acd05208e733f480c76b22f))
* support custom oauth & oidc providers ([#2357](https://github.com/supabase/auth/issues/2357)) ([53021f6](https://github.com/supabase/auth/commit/53021f66597439c14ebb869e567ab4742afd0142))


### Bug Fixes

* case-insensitive Bearer token scheme matching ([#2387](https://github.com/supabase/auth/issues/2387)) ([36d712d](https://github.com/supabase/auth/commit/36d712d27f66721adf58a93ffb9e43d5cc915eca))
* correctly parse JWT ValidMethods from env by enabling split_words ([#2334](https://github.com/supabase/auth/issues/2334)) ([a6076bc](https://github.com/supabase/auth/commit/a6076bc39f63cfca94e2330957031d4f63a4b68e))
* flaky index worker test ([#2366](https://github.com/supabase/auth/issues/2366)) ([961a7e6](https://github.com/supabase/auth/commit/961a7e620109d554ae81ca8227a5107671679982))
* **hooks:** propagate error objects from hook calls ([#2380](https://github.com/supabase/auth/issues/2380)) ([3ca1e88](https://github.com/supabase/auth/commit/3ca1e88df06e7096c8ebb3e1bedf291654f4c66e))
* session upgrade percentage should be based on session, not request ([#2371](https://github.com/supabase/auth/issues/2371)) ([510e68b](https://github.com/supabase/auth/commit/510e68b803ba9110df969c7548ccad85c84f0eb6))

## [2.186.0](https://github.com/supabase/auth/compare/v2.185.0...v2.186.0) (2026-01-28)


### Features

* Add email send operation metrics ([#2311](https://github.com/supabase/auth/issues/2311)) ([0096575](https://github.com/supabase/auth/commit/00965758762301875df2d7e4e552b2346bc09236))
* add Supabase Auth identifier to OAuth redirect URLs ([#2299](https://github.com/supabase/auth/issues/2299)) ([2d3dbc6](https://github.com/supabase/auth/commit/2d3dbc652c1beb47c2eade28b45e94f6e2c56982))
* log sb-auth-user-id, sb-auth-session-id, ... on sign in not just refresh token ([#2342](https://github.com/supabase/auth/issues/2342)) ([a486ada](https://github.com/supabase/auth/commit/a486ada3683bb078b8f396a5ba2e606826f0044b))
* **oauth-server:** store and enforce token_endpoint_auth_method ([#2300](https://github.com/supabase/auth/issues/2300)) ([bcd6cd5](https://github.com/supabase/auth/commit/bcd6cd590a47e963b7afe615c889f62d28cb94a2))
* replace JWT OAuth state with `flow_state.id` UUID ([#2331](https://github.com/supabase/auth/issues/2331)) ([645654d](https://github.com/supabase/auth/commit/645654df63a3da7929840659c065f6a9cdd4ba96))
* upgrade existing sessions to v2 refresh tokens though config value ([#2356](https://github.com/supabase/auth/issues/2356)) ([6fb0e8a](https://github.com/supabase/auth/commit/6fb0e8adc104e3b9119b79506997e29bbb2ca9a2))


### Bug Fixes

* reloader unittest races on writeWg ([#2352](https://github.com/supabase/auth/issues/2352)) ([088b714](https://github.com/supabase/auth/commit/088b7149d6857cfe65e4338c1ee9e079688f8c92))
* update migration version ([#2343](https://github.com/supabase/auth/issues/2343)) ([61ef4db](https://github.com/supabase/auth/commit/61ef4dbb5146c4379d495c2fb77c7ade753d1f3b))

## [2.185.0](https://github.com/supabase/auth/compare/v2.184.0...v2.185.0) (2026-01-12)


### Features

* Add Sb-Forwarded-For header and IP-based rate limiting ([#2295](https://github.com/supabase/auth/issues/2295)) ([e8f679b](https://github.com/supabase/auth/commit/e8f679b9e8fcd8cb543ed43cd9cd6a73bbbf4fa7))
* allow amr claim to be array of strings or objects ([#2274](https://github.com/supabase/auth/issues/2274)) ([607da43](https://github.com/supabase/auth/commit/607da43b697b0af1de0da5f966f5b63ff033fefb))
* reset main branch to 2.185.0 ([#2325](https://github.com/supabase/auth/issues/2325)) ([b9d0500](https://github.com/supabase/auth/commit/b9d050029ce90efc083f08a1e8df629faf20e8cd))
* Treat rate limit header value as comma-separated list ([#2282](https://github.com/supabase/auth/issues/2282)) ([5f2e279](https://github.com/supabase/auth/commit/5f2e2792560d57dd14fbf3e69c133a7ec8518c4d))


### Bug Fixes

* additional provider and issuer checks ([#2326](https://github.com/supabase/auth/issues/2326)) ([cb79a74](https://github.com/supabase/auth/commit/cb79a7414e8b2bff30113bdf2b9ec6d6e93c1146))
* check each type independently ([#2290](https://github.com/supabase/auth/issues/2290)) ([d9de0af](https://github.com/supabase/auth/commit/d9de0af3a173ae3e9ab0219c07652675f8be1761))
* fix the wrong error return value ([#1950](https://github.com/supabase/auth/issues/1950)) ([e2dfb5d](https://github.com/supabase/auth/commit/e2dfb5d4222e5edc569b54d057db9ed4375a19d8))
* **indexworker:** remove pg_trgm extension ([#2301](https://github.com/supabase/auth/issues/2301)) ([c553b10](https://github.com/supabase/auth/commit/c553b10e5f3b7a8c430b20babe0e7c96178b1c91))
* **oauth-server:** allow custom URI schemes in client redirect URIs ([#2298](https://github.com/supabase/auth/issues/2298)) ([ea72f57](https://github.com/supabase/auth/commit/ea72f57f99633b33cc7b30b4a0b74ed8314b71e6))
* tighten email validation rules ([#2304](https://github.com/supabase/auth/issues/2304)) ([33bb372](https://github.com/supabase/auth/commit/33bb37203ae54c7ddecb6373122fae4b4fd38682))

## [2.184.0](https://github.com/supabase/auth/compare/v2.183.0...v2.184.0) (2025-12-08)


### Features

* increment refresh token counter by 2 for mfa verify ([#2284](https://github.com/supabase/auth/issues/2284)) ([2a38668](https://github.com/supabase/auth/commit/2a3866854fe7cb58a6cb84e7a82ce5d07bb920ee))
* load template cache at startup for fault tolerance ([#2261](https://github.com/supabase/auth/issues/2261)) ([511c3a4](https://github.com/supabase/auth/commit/511c3a4e12819d313840cd5342ae6a76d4708cfc))
* **oauth:** add support for X/Twitter v2 provider ([#2275](https://github.com/supabase/auth/issues/2275)) ([7f36eb0](https://github.com/supabase/auth/commit/7f36eb053286038d01ba1650dd48a15508550ce0))

## [2.183.0](https://github.com/supabase/auth/compare/v2.182.1...v2.183.0) (2025-11-20)


### Features

* async, concurrent index creation for users table ([#2239](https://github.com/supabase/auth/issues/2239)) ([a1146bf](https://github.com/supabase/auth/commit/a1146bf7eecb35e237350dda7ae62328cbb5acfe))
* **indexworker:** use `auth_trgm` extension if available ([#2263](https://github.com/supabase/auth/issues/2263)) ([05daa43](https://github.com/supabase/auth/commit/05daa437131bd220e01a0e33df75f4b9afa72bb6))
* **oauthserver:** add OpenID Connect support ([#2250](https://github.com/supabase/auth/issues/2250)) ([162788f](https://github.com/supabase/auth/commit/162788ff960c060318324f11f673c09c0da41d5e))
* **oauthserver:** update oauth grant list & authorization details response structure ([#2247](https://github.com/supabase/auth/issues/2247)) ([137ea92](https://github.com/supabase/auth/commit/137ea92c00a0c1a7654fb8bcf0c1b5313901349f))
* **oauthserver:** use `NewOAuthServerAuthorizationParams` & configurable ttl for authorization ([#2254](https://github.com/supabase/auth/issues/2254)) ([61632f8](https://github.com/supabase/auth/commit/61632f8c0401b6c816ea7427d351ec623ce5258f))


### Bug Fixes

* **indexworker:** detect which schema `pg_trgm` exists in ([#2260](https://github.com/supabase/auth/issues/2260)) ([4be12b3](https://github.com/supabase/auth/commit/4be12b3e7c0a30b1e289ab81348548f72ab32ba5))
* look for refresh token on mfa verification only in v1 ([#2249](https://github.com/supabase/auth/issues/2249)) ([2906b24](https://github.com/supabase/auth/commit/2906b2424d0aa804031e66cf92f008289b8a9c77))
* mfa verify now works with refresh token algorithm v2 ([#2246](https://github.com/supabase/auth/issues/2246)) ([4e8275f](https://github.com/supabase/auth/commit/4e8275f915c4d84186d17b41c86a9277055a55e4))
* **social-auth:** default to current_user:read for Figma provider ([#2195](https://github.com/supabase/auth/issues/2195)) ([f409d11](https://github.com/supabase/auth/commit/f409d118ebb958c12f2395c0bf4fb9590ab6c0af))

## [2.182.1](https://github.com/supabase/auth/compare/v2.182.0...v2.182.1) (2025-11-05)


### Bug Fixes

* japanese dot example fix ([#2243](https://github.com/supabase/auth/issues/2243)) ([3a5f4b2](https://github.com/supabase/auth/commit/3a5f4b211a0f50bd1957f5a41467fc5aa6a01ca6))

## [2.182.0](https://github.com/supabase/auth/compare/v2.181.0...v2.182.0) (2025-11-05)


### Features

* **oauthserver:** add authorization list and revoke endpoints ([#2232](https://github.com/supabase/auth/issues/2232)) ([cc640b2](https://github.com/supabase/auth/commit/cc640b277989d57b39f3805cd9433ef4fe16bf83))


### Bug Fixes

* hostname can be empty with redirect urls ([#2241](https://github.com/supabase/auth/issues/2241)) ([f5a4cba](https://github.com/supabase/auth/commit/f5a4cbac73de28cc4b04c5c9725b70517cb131d3))

## [2.181.0](https://github.com/supabase/auth/compare/v2.180.0...v2.181.0) (2025-10-31)


### Features

* add `.well-known/openid-configuration` ([#2197](https://github.com/supabase/auth/issues/2197)) ([9a8d0df](https://github.com/supabase/auth/commit/9a8d0df63bb5089e1705f9d970669bfc97ed345e))
* add `auth_migration` annotation for the migrations ([#2234](https://github.com/supabase/auth/issues/2234)) ([b276d0b](https://github.com/supabase/auth/commit/b276d0bcf4d1ee08fce8c2f7146423e9aaf34dfb))
* add advisor to notify you when to double the max connection pool ([#2167](https://github.com/supabase/auth/issues/2167)) ([a72f5d9](https://github.com/supabase/auth/commit/a72f5d95795ac070e248007c0c38196f47ea5046))
* add after-user-created hook ([#2169](https://github.com/supabase/auth/issues/2169)) ([bd80df8](https://github.com/supabase/auth/commit/bd80df8a888a7de023557a97b65b21419d3029e7))
* add support for account changes notifications in email send hook ([#2192](https://github.com/supabase/auth/issues/2192)) ([6b382ae](https://github.com/supabase/auth/commit/6b382ae3a96bbe052395bdfa30fb49f717e5ad68))
* email address changed notification ([#2181](https://github.com/supabase/auth/issues/2181)) ([047f851](https://github.com/supabase/auth/commit/047f85136c9223ca99cb0169ba82343088fbbfd8))
* identity linked/unlinked notifications ([#2185](https://github.com/supabase/auth/issues/2185)) ([7d46936](https://github.com/supabase/auth/commit/7d46936e145479be1e508b52549c7fca3c59fc2f))
* introduce v2 refresh token algorithm ([#2216](https://github.com/supabase/auth/issues/2216)) ([dea5b8e](https://github.com/supabase/auth/commit/dea5b8e5353ea240c658b030325432ce512f18a8))
* MFA factor enrollment notifications ([#2183](https://github.com/supabase/auth/issues/2183)) ([53db712](https://github.com/supabase/auth/commit/53db712f0c3ffae6d61ea3ddcff5e8d7a33639b9))
* notify users when their phone number has changed ([#2184](https://github.com/supabase/auth/issues/2184)) ([21f3070](https://github.com/supabase/auth/commit/21f30702a62d722bce32972d4b2fcef1da6e2177))
* **oauthserver:** add OAuth client admin update endpoint ([#2231](https://github.com/supabase/auth/issues/2231)) ([6296a5a](https://github.com/supabase/auth/commit/6296a5a226b3c60bcd9d20786750a808af9cd529))
* properly handle redirect url fragments and unusual hostnames ([#2200](https://github.com/supabase/auth/issues/2200)) ([aa0ac5b](https://github.com/supabase/auth/commit/aa0ac5b9a8af26d4b779e48ec4da2ab06a6dc15e))
* store latest challenge/attestation data ([#2179](https://github.com/supabase/auth/issues/2179)) ([01ebce1](https://github.com/supabase/auth/commit/01ebce1bf01b563105d653ff168a16e72c12d481))
* support percentage based db limits with reload support ([#2177](https://github.com/supabase/auth/issues/2177)) ([1731466](https://github.com/supabase/auth/commit/1731466903539569ec5b308db4e39eb33c653b94))
* webauthn support schema changes, update openapi.yaml ([#2163](https://github.com/supabase/auth/issues/2163)) ([68cb8d2](https://github.com/supabase/auth/commit/68cb8d2ba3ded878c68d7cb76465bfaaac58436a))


### Bug Fixes

* gosec incorrectly warns about accessing signature[64] ([#2222](https://github.com/supabase/auth/issues/2222)) ([bca6626](https://github.com/supabase/auth/commit/bca66268dc4f81821c194a26dcf76209d1c696de))
* **openapi:** add missing OAuth client registration fields ([#2227](https://github.com/supabase/auth/issues/2227)) ([cf39a8a](https://github.com/supabase/auth/commit/cf39a8ae2cc386f2672f0ecbb8d84dd77f04e56f))

## [2.180.0](https://github.com/supabase/auth/compare/v2.179.0...v2.180.0) (2025-09-23)


### Features

* add OAuth client type ([#2152](https://github.com/supabase/auth/issues/2152)) ([b118f1f](https://github.com/supabase/auth/commit/b118f1f00c3c846095c25c34092e38aeebfdf2db))
* add phone to sms webhook payload ([#2160](https://github.com/supabase/auth/issues/2160)) ([d475ac1](https://github.com/supabase/auth/commit/d475ac1f20a0814f59d4bc1370801f915a9ba4d4))
* background template reloading p1 - baseline decomposition ([#2148](https://github.com/supabase/auth/issues/2148)) ([746c937](https://github.com/supabase/auth/commit/746c937f7c57ba256d942df334ab9ee354509587))
* config reloading with fsnotify, poller fallback, and signals ([#2161](https://github.com/supabase/auth/issues/2161)) ([c77d512](https://github.com/supabase/auth/commit/c77d51203fc52c1c9a9f7dc56ca1c076e018fc54))
* enhance issuer URL validation in OAuth server metadata ([#2164](https://github.com/supabase/auth/issues/2164)) ([a9424d2](https://github.com/supabase/auth/commit/a9424d25909e074db395b620dc9999724bf4a03c))
* implement OAuth2 authorization endpoint ([#2107](https://github.com/supabase/auth/issues/2107)) ([5318552](https://github.com/supabase/auth/commit/53185526b07cb2c27f6a81782a6c24610e39d6fe))
* **oauth2:** add `/oauth/token` endpoint ([#2159](https://github.com/supabase/auth/issues/2159)) ([a89a0b0](https://github.com/supabase/auth/commit/a89a0b054e87fee4e193aab4fff7677b56775386))
* **oauth2:** add admin endpoint to regenerate OAuth client secrets ([#2170](https://github.com/supabase/auth/issues/2170)) ([0bd1c28](https://github.com/supabase/auth/commit/0bd1c285aaf3bbb3f3d6e2e131aabfe5cabf0fa5))
* **oauth2:** return redirect_uri on GET authorization ([#2175](https://github.com/supabase/auth/issues/2175)) ([b0a0c3e](https://github.com/supabase/auth/commit/b0a0c3e48c8c8686d4cc3f82abd2ed326c297614))
* **oauth2:** use `id` field as the public client_id ([#2154](https://github.com/supabase/auth/issues/2154)) ([86b7de4](https://github.com/supabase/auth/commit/86b7de45c9432ea6ee9bd7c7e9cfe96e038fe2bc))
* **openapi:** add OAuth 2.1 server endpoints and clarify OAuth modes ([#2165](https://github.com/supabase/auth/issues/2165)) ([1f804a2](https://github.com/supabase/auth/commit/1f804a2795012a1a165ff07afdb9dd98ad8ff291))
* password changed email notification ([#2176](https://github.com/supabase/auth/issues/2176)) ([fe0fd04](https://github.com/supabase/auth/commit/fe0fd04c9f5558d0165a94c7c080fb15c036d08f))
* support `transfer_sub` in apple id tokens ([#2162](https://github.com/supabase/auth/issues/2162)) ([8a71006](https://github.com/supabase/auth/commit/8a71006486027c0850a58ec6e94f62a1607d1d48))


### Bug Fixes

* ensure request context exists in API db operations ([#2171](https://github.com/supabase/auth/issues/2171)) ([060a992](https://github.com/supabase/auth/commit/060a99278d8e3ec4a78ca61b95a9acf0e7052948))
* **makefile:** remove invalid @ symbol from shell commands ([#2168](https://github.com/supabase/auth/issues/2168)) ([e6afe45](https://github.com/supabase/auth/commit/e6afe4529859e1ee92ed5c259e04c9fe56de22cf))
* **oauth2:** switch to Origin header for request validation ([#2174](https://github.com/supabase/auth/issues/2174)) ([42bc9ab](https://github.com/supabase/auth/commit/42bc9ab7db24ce1902fef21ba5e90a2128617669))

## [2.179.0](https://github.com/supabase/auth/compare/v2.178.0...v2.179.0) (2025-08-28)


### Features

* add oauth2 client support ([#2098](https://github.com/supabase/auth/issues/2098)) ([8fae015](https://github.com/supabase/auth/commit/8fae01581d122bba95a3742dc212284f9a21dc4d))
* experimental own linking domains per provider ([#2119](https://github.com/supabase/auth/issues/2119)) ([747bf3b](https://github.com/supabase/auth/commit/747bf3b15fd9e371c9330e75fe2e5de8b89ce14d))
* fetch email from snapchat oauth provider if available for consistency ([#2110](https://github.com/supabase/auth/issues/2110)) ([7507822](https://github.com/supabase/auth/commit/750782246e736093131ba2eb1015fc73083d99ab))
* implement link identity with oidc / native sign in ([#2108](https://github.com/supabase/auth/issues/2108)) ([5f0ec87](https://github.com/supabase/auth/commit/5f0ec8709231c57b57aa06160e18bc9e52ec9002))
* implements email-less accounts with oauth ([#2105](https://github.com/supabase/auth/issues/2105)) ([9a61dae](https://github.com/supabase/auth/commit/9a61dae788311a086ce8e72b52c21e031857adf7))
* introduce request-scoped background tasks & async mail sending ([#2126](https://github.com/supabase/auth/issues/2126)) ([2c8ea61](https://github.com/supabase/auth/commit/2c8ea6113ae7381106ed7c67d7a45f7ef87195c7))
* refactor mailer client wiring and add validation wrapper ([#2130](https://github.com/supabase/auth/issues/2130)) ([68c40a6](https://github.com/supabase/auth/commit/68c40a6a494029d8d704b14abbe85171a7dc8d12))
* support multiple `aud` for the external providers ([#2117](https://github.com/supabase/auth/issues/2117)) ([ca5792e](https://github.com/supabase/auth/commit/ca5792e41a48f20a395646015c28ce272355bf63))
* use `slices.Contains` instead of for loops ([#2111](https://github.com/supabase/auth/issues/2111)) ([9f22682](https://github.com/supabase/auth/commit/9f2268263118713d3390ce4617ccf21bc2c031eb))


### Bug Fixes

* add `id-token` permission to ci ([#2143](https://github.com/supabase/auth/issues/2143)) ([79209c0](https://github.com/supabase/auth/commit/79209c0e35afa82ec8822a343108d6a690e14229))
* add missing param ([#2125](https://github.com/supabase/auth/issues/2125)) ([c0b75f6](https://github.com/supabase/auth/commit/c0b75f66229410e6e5fbc7cd1ae9066cec54c5d7))
* change s3 artifact upload role ([#2145](https://github.com/supabase/auth/issues/2145)) ([767e371](https://github.com/supabase/auth/commit/767e37131aa01bf6cb27dbc62b2928e7cc701893))
* remove requirement of empty content-type on 204 ([#2128](https://github.com/supabase/auth/issues/2128)) ([ecc97e0](https://github.com/supabase/auth/commit/ecc97e0fac7cb1bd736ef6db435a0a5fb224e954))
* run release-please again ([#2144](https://github.com/supabase/auth/issues/2144)) ([2560f14](https://github.com/supabase/auth/commit/2560f14ef6ee35f84b7c592290647e0d1c8a3932))
* stripped binary now includes version ([#2147](https://github.com/supabase/auth/issues/2147)) ([609f169](https://github.com/supabase/auth/commit/609f169f505a1f5750fbbf5e9d477cfb4d879eff))
* update copyright year in LICENSE ([#2142](https://github.com/supabase/auth/issues/2142)) ([67fe0b0](https://github.com/supabase/auth/commit/67fe0b0230b147048dc2b9f546df72af5b3bc362))

## [2.178.0](https://github.com/supabase/auth/compare/v2.177.0...v2.178.0) (2025-08-05)


### Features

* add sign in with ethereum ([#2069](https://github.com/supabase/auth/issues/2069)) ([079b242](https://github.com/supabase/auth/commit/079b2427b8ed312880b60e89cc79b716fe9ae73d))
* add support for managing SSO providers by resource_id ([#2081](https://github.com/supabase/auth/issues/2081)) ([5ca4489](https://github.com/supabase/auth/commit/5ca44893964d3b12a24ea26302b23f4976f768a0))
* log all audit events separately to prevent missing events ([#2086](https://github.com/supabase/auth/issues/2086)) ([3b666f5](https://github.com/supabase/auth/commit/3b666f51f56db778848730d74ac140f02b0cb522))
* skip nonce check for Facebook Limited Login auth ([#2082](https://github.com/supabase/auth/issues/2082)) ([f1b15ff](https://github.com/supabase/auth/commit/f1b15ffdb9b1f1af873a147fdb5d039382becb2e))
* support ledger solana offchain message signing ([#2093](https://github.com/supabase/auth/issues/2093)) ([4c94443](https://github.com/supabase/auth/commit/4c944431558aaca3c945c472dc5a27077f6dfa75))

## [2.177.0](https://github.com/supabase/auth/compare/v2.176.1...v2.177.0) (2025-07-05)


### Features

* add option to disable writing to `audit_log_entries` ([#2073](https://github.com/supabase/auth/issues/2073)) ([80758dd](https://github.com/supabase/auth/commit/80758dd880b82e9b96d7185d9d0a0850b8c6f19d))
* add snapchat provider ([#2071](https://github.com/supabase/auth/issues/2071)) ([fca8ea4](https://github.com/supabase/auth/commit/fca8ea4a701eafb587438a159e19f5488c82a178))
* enhance login analytics ([#2078](https://github.com/supabase/auth/issues/2078)) ([1aed4a2](https://github.com/supabase/auth/commit/1aed4a27fdc54d9c4d01f17d49dcaadb25400f18))
* fallback to jwt secret if alg is `HS256` and the `kid` is not recognized ([#2072](https://github.com/supabase/auth/issues/2072)) ([8fa99bd](https://github.com/supabase/auth/commit/8fa99bd6cab91c0bf093fdcdb912054113ea66ba))
* ignore `aud` claim from admin jwt (`service_role` never had one) ([#2070](https://github.com/supabase/auth/issues/2070)) ([57eddcb](https://github.com/supabase/auth/commit/57eddcb45ce97004c26f6d65351447d7dc654162))


### Bug Fixes

* add missing provider info to signedup audit logs ([#2061](https://github.com/supabase/auth/issues/2061)) ([c6e0cbe](https://github.com/supabase/auth/commit/c6e0cbefe5b609ac3362c23d0f7cb9d9bb04abc9))
* **auditlog:** keep writing to logs even postgres is disabled ([#2076](https://github.com/supabase/auth/issues/2076)) ([b89bc32](https://github.com/supabase/auth/commit/b89bc32de5adc9d458e7f95ad9b08a99604c70d8))
* do not log fatal when http server successfully closes ([#2065](https://github.com/supabase/auth/issues/2065)) ([1f7de6c](https://github.com/supabase/auth/commit/1f7de6c65f31ef0bbb80899369989b13ab5a517f))
* invites should send another email when user exists ([#2058](https://github.com/supabase/auth/issues/2058)) ([96469bd](https://github.com/supabase/auth/commit/96469bd01b9c37f938aabdb0434a054a111cf963))
* use `appleid.apple.com` as default issuer ([#2068](https://github.com/supabase/auth/issues/2068)) ([963a781](https://github.com/supabase/auth/commit/963a781ee525ef893ec545583e7d385c02995518))
* use `split_words` config option for `AuditLog` ([#2075](https://github.com/supabase/auth/issues/2075)) ([7ecb234](https://github.com/supabase/auth/commit/7ecb234c3d66459c92ba16fd69ed7eb933c4b8a7))

## [2.176.1](https://github.com/supabase/auth/compare/v2.176.0...v2.176.1) (2025-06-11)


### Bug Fixes

* new `odic.Provider` for apple with insecure issuer url context ([#2055](https://github.com/supabase/auth/issues/2055)) ([23d69f1](https://github.com/supabase/auth/commit/23d69f1c450b4a24a262cb25112e68408857a3b2))
* skip apple oidc issuer check ([#2053](https://github.com/supabase/auth/issues/2053)) ([1c6f18e](https://github.com/supabase/auth/commit/1c6f18e6e573ae1da6875f51d8613992ced057a2))

## [2.176.0](https://github.com/supabase/auth/compare/v2.175.0...v2.176.0) (2025-06-11)


### Features

* Add custom claims from Keycloak user token ([#1917](https://github.com/supabase/auth/issues/1917)) ([1365aaa](https://github.com/supabase/auth/commit/1365aaa45569fc9e7c3497e744e0e80cf237d617))


### Bug Fixes

* accept ID tokens from all `account.apple.com` and `appleid.apple.com` ([#2050](https://github.com/supabase/auth/issues/2050)) ([82aa167](https://github.com/supabase/auth/commit/82aa167cae01658b5319914f3412d78876955106))

## [2.175.0](https://github.com/supabase/auth/compare/v2.174.0...v2.175.0) (2025-06-03)


### Features

* hooks round 5 (Option 2) - add before-user-created hook ([#2034](https://github.com/supabase/auth/issues/2034)) ([b53f6b0](https://github.com/supabase/auth/commit/b53f6b0d0e056bf3e84884847ab4608ffc9efd61))


### Bug Fixes

* email-sendhook - bug in email change verification ([#2044](https://github.com/supabase/auth/issues/2044)) ([be20654](https://github.com/supabase/auth/commit/be20654ec3af21b93a8d7482a5673b5c8c60ac8a))

## [2.174.0](https://github.com/supabase/auth/compare/v2.173.0...v2.174.0) (2025-05-23)


### Features

* hooks round 2 - remove indirection and simplify error handling ([#2025](https://github.com/supabase/auth/issues/2025)) ([26e23f0](https://github.com/supabase/auth/commit/26e23f05acd1e1a959c3e04764a569ea0364d947))
* hooks round 4 - update tests to use require package ([#2030](https://github.com/supabase/auth/issues/2030)) ([aaf93df](https://github.com/supabase/auth/commit/aaf93df50ebfb489c6335e2c1b846dc5cee18767))


### Bug Fixes

* amr claim should contain provider_id for sso method ([#2033](https://github.com/supabase/auth/issues/2033)) ([33741e1](https://github.com/supabase/auth/commit/33741e18d2e0adb691e650355337924f9ccfd91f))

## [2.173.0](https://github.com/supabase/auth/compare/v2.172.1...v2.173.0) (2025-05-17)


### Features

* add support packages for end-to-end testing ([#2021](https://github.com/supabase/auth/issues/2021)) ([269ddfe](https://github.com/supabase/auth/commit/269ddfe18718ae74535f7227eb75f67667275140))


### Bug Fixes

* add `supafast` tarball for upgrading auth via supabase-admin-api ([#2009](https://github.com/supabase/auth/issues/2009)) ([9b55785](https://github.com/supabase/auth/commit/9b557855a3ab80ee93ab95159055a444bff53f01))
* allow HTTP with localhost in solana ([#2027](https://github.com/supabase/auth/issues/2027)) ([3ee02f0](https://github.com/supabase/auth/commit/3ee02f085df206dcd3e6fa79f2d583148ebc52b8))
* fix `supafast` tarball generation ([#2011](https://github.com/supabase/auth/issues/2011)) ([88bb2c0](https://github.com/supabase/auth/commit/88bb2c0638863f94f9f0d7f4ca88ba04929dfd55))

## [2.172.1](https://github.com/supabase/auth/compare/v2.172.0...v2.172.1) (2025-05-05)


### Bug Fixes

* use redirect URL as-is for mobile apps ([#2007](https://github.com/supabase/auth/issues/2007)) ([b36cdcd](https://github.com/supabase/auth/commit/b36cdcdb90b8f0a96aba9572e2643c0dee3bdd9c))

## [2.172.0](https://github.com/supabase/auth/compare/v2.171.0...v2.172.0) (2025-05-04)


### Features

* fix large group claim handling in azure id tokens ([#1995](https://github.com/supabase/auth/issues/1995)) ([2f323fe](https://github.com/supabase/auth/commit/2f323fe3ce2c1d24343d822ac093f28fdda3a4a9))
* use `global_user_id` over `sub` for `vercel_marketplace` issuer ([#1990](https://github.com/supabase/auth/issues/1990)) ([f94f97e](https://github.com/supabase/auth/commit/f94f97e8d3e530d730d9352a14b477fd33548df2))


### Bug Fixes

* azure overage claims start with single `_` not two ([#1999](https://github.com/supabase/auth/issues/1999)) ([29f3440](https://github.com/supabase/auth/commit/29f3440d6376fac22568284d5b417836bf335a74))
* remove azure claim overage code. ([#2005](https://github.com/supabase/auth/issues/2005)) ([63dce14](https://github.com/supabase/auth/commit/63dce14488f92d9e0e67028cd0ae6e002ebf532a))
* resolving azure overage claim should include `api-version=1.6` query parameter ([#2000](https://github.com/supabase/auth/issues/2000)) ([44890d0](https://github.com/supabase/auth/commit/44890d0a6df903e765bcde509231a78f61890bec))
* upgrade godotenv to v1.5.1 to fix multiline file loading ([#1997](https://github.com/supabase/auth/issues/1997)) ([f2af4b2](https://github.com/supabase/auth/commit/f2af4b250dc7d351ee8d0ede3a814439cac43fee))

## [2.171.0](https://github.com/supabase/auth/compare/v2.170.0...v2.171.0) (2025-04-14)


### Features

* add sign in with solana (EIP-4361) support ([#1918](https://github.com/supabase/auth/issues/1918)) ([d121546](https://github.com/supabase/auth/commit/d1215464d4c81bb6e2e210df81ba0263d90ffb64))
* allow invalid config directories ([#1969](https://github.com/supabase/auth/issues/1969)) ([6b842f6](https://github.com/supabase/auth/commit/6b842f6b304bba5f886c6bf8b5675d914f881a2d))
* allow limiting lifespan of low-aal sessions ([#1942](https://github.com/supabase/auth/issues/1942)) ([d7a9ca6](https://github.com/supabase/auth/commit/d7a9ca62a7a09edd864f0b968c1882f5e464e662))
* Block specific outgoing mail servers ([#1971](https://github.com/supabase/auth/issues/1971)) ([091aef9](https://github.com/supabase/auth/commit/091aef945a764ee8d3b80ae8c5ed5d88dd582d03))
* refactor hooks out of api package ([#1976](https://github.com/supabase/auth/issues/1976)) ([c5904c0](https://github.com/supabase/auth/commit/c5904c05d9dce4366e6527aa40e439a3c8c460bb))
* separate web3 rate limits from other `/token?grant_type=...` ([#1985](https://github.com/supabase/auth/issues/1985)) ([8b23382](https://github.com/supabase/auth/commit/8b233820e41fedd18338eb37345ecbb0beb350ce))


### Bug Fixes

* explicit permisions on actions ([#1978](https://github.com/supabase/auth/issues/1978)) ([06e9ead](https://github.com/supabase/auth/commit/06e9ead3e09e77631597a953a535cb93dd006c7f))
* propagate error when when confirming phone ([#1939](https://github.com/supabase/auth/issues/1939)) ([e882b42](https://github.com/supabase/auth/commit/e882b42f3929ab2e587a41ba6593edaf237e5535))
* redirects must not be to ip addresses ([#1984](https://github.com/supabase/auth/issues/1984)) ([347e23a](https://github.com/supabase/auth/commit/347e23a98c2ee362620d2711d12a76d7bc266a8f))
* sanitize redirect URL (remove fragment, query) before pattern matching ([#1974](https://github.com/supabase/auth/issues/1974)) ([ccf20d7](https://github.com/supabase/auth/commit/ccf20d724f31871b71292e0ea867c48e2cdfdbcb))

## [2.170.0](https://github.com/supabase/auth/compare/v2.169.0...v2.170.0) (2025-03-06)


### Features

* improvements to config reloader, 100% coverage ([#1933](https://github.com/supabase/auth/issues/1933)) ([21c2256](https://github.com/supabase/auth/commit/21c2256806ab4950e9bfc0af0472a64f7d9112a7))
* increase test coverage in conf package to 100% ([#1937](https://github.com/supabase/auth/issues/1937)) ([bc57c1c](https://github.com/supabase/auth/commit/bc57c1c25769905b29bfc9e89bf3d6b65b1030ea))


### Bug Fixes

* enable SO_REUSEPORT in listener config ([#1936](https://github.com/supabase/auth/issues/1936)) ([a474b80](https://github.com/supabase/auth/commit/a474b80cc1075eb32a7e72a05b0cdb561e61770b))
* ignore not found error to check for pkce prefix later ([#1929](https://github.com/supabase/auth/issues/1929)) ([fbbebcc](https://github.com/supabase/auth/commit/fbbebccd5da21ea22323e6f8f853df9168c4c41e))
* log version & migration count ([#1934](https://github.com/supabase/auth/issues/1934)) ([8078cdc](https://github.com/supabase/auth/commit/8078cdc6f275c97d84c0ba20963327af900b84d0))
* update figma token endpoint ([#1952](https://github.com/supabase/auth/issues/1952)) ([18fbbb5](https://github.com/supabase/auth/commit/18fbbb53de04c024b6de829e390145a8452d7ab2))
* use sys/unix instead of syscall ([#1953](https://github.com/supabase/auth/issues/1953)) ([4a6d9bc](https://github.com/supabase/auth/commit/4a6d9bcade28db3c7a6c2c610600665190c9a925))

## [2.169.0](https://github.com/supabase/auth/compare/v2.168.0...v2.169.0) (2025-01-27)


### Features

* add an optional burstable rate limiter ([#1924](https://github.com/supabase/auth/issues/1924)) ([1f06f58](https://github.com/supabase/auth/commit/1f06f58e1434b91612c0d96c8c0435d26570f3e2))
* cover 100% of crypto with tests ([#1892](https://github.com/supabase/auth/issues/1892)) ([174198e](https://github.com/supabase/auth/commit/174198e56f8e9b8470a717d0021c626130288d2e))


### Bug Fixes

* convert refreshed_at to UTC before updating ([#1916](https://github.com/supabase/auth/issues/1916)) ([a4c692f](https://github.com/supabase/auth/commit/a4c692f6cb1b8bf4c47ea012872af5ce93382fbf))
* correct casing of API key authentication in openapi.yaml ([0cfd177](https://github.com/supabase/auth/commit/0cfd177b8fb1df8f62e84fbd3761ef9f90c384de))
* improve invalid channel error message returned ([#1908](https://github.com/supabase/auth/issues/1908)) ([f72f0ee](https://github.com/supabase/auth/commit/f72f0eee328fa0aa041155f5f5dc305f0874d2bf))
* improve saml assertion logging ([#1915](https://github.com/supabase/auth/issues/1915)) ([d6030cc](https://github.com/supabase/auth/commit/d6030ccd271a381e2a6ababa11a5beae4b79e5c3))

## [2.168.0](https://github.com/supabase/auth/compare/v2.167.0...v2.168.0) (2025-01-06)


### Features

* set `email_verified` to true on all identities with the verified email ([#1902](https://github.com/supabase/auth/issues/1902)) ([307892f](https://github.com/supabase/auth/commit/307892f85b39150074fbb80b9c8f45ac3312aae2))

## [2.167.0](https://github.com/supabase/auth/compare/v2.166.0...v2.167.0) (2024-12-24)


### Features

* fix argon2 parsing and comparison ([#1887](https://github.com/supabase/auth/issues/1887)) ([9dbe6ef](https://github.com/supabase/auth/commit/9dbe6ef931ae94e621d55a5f7aea4b7ee0449949))

## [2.166.0](https://github.com/supabase/auth/compare/v2.165.0...v2.166.0) (2024-12-23)


### Features

* switch to googleapis/release-please-action, bump to 2.166.0 ([#1883](https://github.com/supabase/auth/issues/1883)) ([11a312f](https://github.com/supabase/auth/commit/11a312fcf77771b3732f2f439078225895df7a85))


### Bug Fixes

* check if session is nil ([#1873](https://github.com/supabase/auth/issues/1873)) ([fd82601](https://github.com/supabase/auth/commit/fd82601917adcd9f8c38263953eb1ef098b26b7f))
* email_verified field not being updated on signup confirmation ([#1868](https://github.com/supabase/auth/issues/1868)) ([483463e](https://github.com/supabase/auth/commit/483463e49eec7b2974cca05eadca6b933b2145b5))
* handle user banned error code ([#1851](https://github.com/supabase/auth/issues/1851)) ([a6918f4](https://github.com/supabase/auth/commit/a6918f49baee42899b3ae1b7b6bc126d84629c99))
* Revert "fix: revert fallback on btree indexes when hash is unavailable" ([#1859](https://github.com/supabase/auth/issues/1859)) ([9fe5b1e](https://github.com/supabase/auth/commit/9fe5b1eebfafb385d6b5d10196aeb2a1964ab296))
* skip cleanup for non-2xx status ([#1877](https://github.com/supabase/auth/issues/1877)) ([f572ced](https://github.com/supabase/auth/commit/f572ced3699c7f920deccce1a3539299541ec94c))

## [2.165.1](https://github.com/supabase/auth/compare/v2.165.0...v2.165.1) (2024-12-06)


### Bug Fixes

* allow setting the mailer service headers as strings ([#1861](https://github.com/supabase/auth/issues/1861)) ([7907b56](https://github.com/supabase/auth/commit/7907b566228f7e2d76049b44cfe0cc808c109100))

## [2.165.0](https://github.com/supabase/auth/compare/v2.164.0...v2.165.0) (2024-12-05)


### Features

* add email validation function to lower bounce rates ([#1845](https://github.com/supabase/auth/issues/1845)) ([2c291f0](https://github.com/supabase/auth/commit/2c291f0356f3e91063b6b43bf2a21625b0ce0ebd))
* use embedded migrations for `migrate` command ([#1843](https://github.com/supabase/auth/issues/1843)) ([e358da5](https://github.com/supabase/auth/commit/e358da5f0e267725a77308461d0a4126436fc537))


### Bug Fixes

* fallback on btree indexes when hash is unavailable ([#1856](https://github.com/supabase/auth/issues/1856)) ([b33bc31](https://github.com/supabase/auth/commit/b33bc31c07549dc9dc221100995d6f6b6754fd3a))
* return the error code instead of status code ([#1855](https://github.com/supabase/auth/issues/1855)) ([834a380](https://github.com/supabase/auth/commit/834a380d803ae9ce59ce5ee233fa3a78a984fe68))
* revert fallback on btree indexes when hash is unavailable ([#1858](https://github.com/supabase/auth/issues/1858)) ([1c7202f](https://github.com/supabase/auth/commit/1c7202ff835856562ee66b33be131eca769acf1d))
* update ip mismatch error message ([#1849](https://github.com/supabase/auth/issues/1849)) ([49fbbf0](https://github.com/supabase/auth/commit/49fbbf03917a1085c58e9a1ff76c247ae6bb9ca7))

## [2.164.0](https://github.com/supabase/auth/compare/v2.163.2...v2.164.0) (2024-11-13)


### Features

* return validation failed error if captcha request was not json ([#1815](https://github.com/supabase/auth/issues/1815)) ([26d2e36](https://github.com/supabase/auth/commit/26d2e36bba29eb8a6ddba556acfd0820f3bfde5d))


### Bug Fixes

* add error codes to refresh token flow ([#1824](https://github.com/supabase/auth/issues/1824)) ([4614dc5](https://github.com/supabase/auth/commit/4614dc54ab1dcb5390cfed05441e7888af017d92))
* add test coverage for rate limits with 0 permitted events ([#1834](https://github.com/supabase/auth/issues/1834)) ([7c3cf26](https://github.com/supabase/auth/commit/7c3cf26cfe2a3e4de579d10509945186ad719855))
* correct web authn aaguid column naming ([#1826](https://github.com/supabase/auth/issues/1826)) ([0a589d0](https://github.com/supabase/auth/commit/0a589d04e1cd9310cb260d329bc8beb050adf8da))
* default to files:read scope for Figma provider ([#1831](https://github.com/supabase/auth/issues/1831)) ([9ce2857](https://github.com/supabase/auth/commit/9ce28570bf3da9571198d44d693c7ad7038cde33))
* improve error messaging for http hooks ([#1821](https://github.com/supabase/auth/issues/1821)) ([fa020d0](https://github.com/supabase/auth/commit/fa020d0fc292d5c381c57ecac6666d9ff657e4c4))
* make drop_uniqueness_constraint_on_phone idempotent ([#1817](https://github.com/supabase/auth/issues/1817)) ([158e473](https://github.com/supabase/auth/commit/158e4732afa17620cdd89c85b7b57569feea5c21))
* possible panic if refresh token has a null session_id ([#1822](https://github.com/supabase/auth/issues/1822)) ([a7129df](https://github.com/supabase/auth/commit/a7129df4e1d91a042b56ff1f041b9c6598825475))
* rate limits of 0 take precedence over MAILER_AUTO_CONFIRM ([#1837](https://github.com/supabase/auth/issues/1837)) ([cb7894e](https://github.com/supabase/auth/commit/cb7894e1119d27d527dedcca22d8b3d433beddac))

## [2.163.2](https://github.com/supabase/auth/compare/v2.163.1...v2.163.2) (2024-10-22)


### Bug Fixes

* ignore rate limits for autoconfirm ([#1810](https://github.com/supabase/auth/issues/1810)) ([9ce2340](https://github.com/supabase/auth/commit/9ce23409f960a8efa55075931138624cb681eca5))

## [2.163.1](https://github.com/supabase/auth/compare/v2.163.0...v2.163.1) (2024-10-22)


### Bug Fixes

* external host validation ([#1808](https://github.com/supabase/auth/issues/1808)) ([4f6a461](https://github.com/supabase/auth/commit/4f6a4617074e61ba3b31836ccb112014904ce97c)), closes [#1228](https://github.com/supabase/auth/issues/1228)

## [2.163.0](https://github.com/supabase/auth/compare/v2.162.2...v2.163.0) (2024-10-15)


### Features

* add mail header support via `GOTRUE_SMTP_HEADERS` with `$messageType` ([#1804](https://github.com/supabase/auth/issues/1804)) ([99d6a13](https://github.com/supabase/auth/commit/99d6a134c44554a8ad06695e1dff54c942c8335d))
* add MFA for WebAuthn ([#1775](https://github.com/supabase/auth/issues/1775)) ([8cc2f0e](https://github.com/supabase/auth/commit/8cc2f0e14d06d0feb56b25a0278fda9e213b6b5a))
* configurable email and sms rate limiting ([#1800](https://github.com/supabase/auth/issues/1800)) ([5e94047](https://github.com/supabase/auth/commit/5e9404717e1c962ab729cde150ef5b40ea31a6e8))
* mailer logging ([#1805](https://github.com/supabase/auth/issues/1805)) ([9354b83](https://github.com/supabase/auth/commit/9354b83a48a3edcb49197c997a1e96efc80c5383))
* preserve rate limiters in memory across configuration reloads ([#1792](https://github.com/supabase/auth/issues/1792)) ([0a3968b](https://github.com/supabase/auth/commit/0a3968b02b9f044bfb7e5ebc71dca970d2bb7807))


### Bug Fixes

* add twilio verify support on mfa ([#1714](https://github.com/supabase/auth/issues/1714)) ([aeb5d8f](https://github.com/supabase/auth/commit/aeb5d8f8f18af60ce369cab5714979ac0c208308))
* email header setting no longer misleading ([#1802](https://github.com/supabase/auth/issues/1802)) ([3af03be](https://github.com/supabase/auth/commit/3af03be6b65c40f3f4f62ce9ab989a20d75ae53a))
* enforce authorized address checks on send email only ([#1806](https://github.com/supabase/auth/issues/1806)) ([c0c5b23](https://github.com/supabase/auth/commit/c0c5b23728c8fb633dae23aa4b29ed60e2691a2b))
* fix `getExcludedColumns` slice allocation ([#1788](https://github.com/supabase/auth/issues/1788)) ([7f006b6](https://github.com/supabase/auth/commit/7f006b63c8d7e28e55a6d471881e9c118df80585))
* Fix reqPath for bypass check for verify EP ([#1789](https://github.com/supabase/auth/issues/1789)) ([646dc66](https://github.com/supabase/auth/commit/646dc66ea8d59a7f78bf5a5e55d9b5065a718c23))
* inline mailme package for easy development ([#1803](https://github.com/supabase/auth/issues/1803)) ([fa6f729](https://github.com/supabase/auth/commit/fa6f729a027eff551db104550fa626088e00bc15))

## [2.162.2](https://github.com/supabase/auth/compare/v2.162.1...v2.162.2) (2024-10-05)


### Bug Fixes

* refactor mfa validation into functions ([#1780](https://github.com/supabase/auth/issues/1780)) ([410b8ac](https://github.com/supabase/auth/commit/410b8acdd659fc4c929fe57a9e9dba4c76da305d))
* upgrade ci Go version ([#1782](https://github.com/supabase/auth/issues/1782)) ([97a48f6](https://github.com/supabase/auth/commit/97a48f6daaa2edda5b568939cbb1007ccdf33cfc))
* validateEmail should normalise emails ([#1790](https://github.com/supabase/auth/issues/1790)) ([2e9b144](https://github.com/supabase/auth/commit/2e9b144a0cbf2d26d3c4c2eafbff1899a36aeb3b))

## [2.162.1](https://github.com/supabase/auth/compare/v2.162.0...v2.162.1) (2024-10-03)


### Bug Fixes

* bypass check for token & verify endpoints ([#1785](https://github.com/supabase/auth/issues/1785)) ([9ac2ea0](https://github.com/supabase/auth/commit/9ac2ea0180826cd2f65e679524aabfb10666e973))

## [2.162.0](https://github.com/supabase/auth/compare/v2.161.0...v2.162.0) (2024-09-27)


### Features

* add support for migration of firebase scrypt passwords ([#1768](https://github.com/supabase/auth/issues/1768)) ([ba00f75](https://github.com/supabase/auth/commit/ba00f75c28d6708ddf8ee151ce18f2d6193689ef))


### Bug Fixes

* apply authorized email restriction to non-admin routes ([#1778](https://github.com/supabase/auth/issues/1778)) ([1af203f](https://github.com/supabase/auth/commit/1af203f92372e6db12454a0d319aad8ce3d149e7))
* magiclink failing due to passwordStrength check ([#1769](https://github.com/supabase/auth/issues/1769)) ([7a5411f](https://github.com/supabase/auth/commit/7a5411f1d4247478f91027bc4969cbbe95b7774c))

## [2.161.0](https://github.com/supabase/auth/compare/v2.160.0...v2.161.0) (2024-09-24)


### Features

* add `x-sb-error-code` header, show error code in logs ([#1765](https://github.com/supabase/auth/issues/1765)) ([ed91c59](https://github.com/supabase/auth/commit/ed91c59aa332738bd0ac4b994aeec2cdf193a068))
* add webauthn configuration variables ([#1773](https://github.com/supabase/auth/issues/1773)) ([77d5897](https://github.com/supabase/auth/commit/77d58976ae624dbb7f8abee041dd4557aab81109))
* config reloading ([#1771](https://github.com/supabase/auth/issues/1771)) ([6ee0091](https://github.com/supabase/auth/commit/6ee009163bfe451e2a0b923705e073928a12c004))


### Bug Fixes

* add additional information around errors for missing content type header ([#1576](https://github.com/supabase/auth/issues/1576)) ([c2b2f96](https://github.com/supabase/auth/commit/c2b2f96f07c97c15597cd972b1cd672238d87cdc))
* add token to hook payload for non-secure email change ([#1763](https://github.com/supabase/auth/issues/1763)) ([7e472ad](https://github.com/supabase/auth/commit/7e472ad72042e86882dab3fddce9fafa66a8236c))
* update aal requirements to update user ([#1766](https://github.com/supabase/auth/issues/1766)) ([25d9874](https://github.com/supabase/auth/commit/25d98743f6cc2cca2b490a087f468c8556ec5e44))
* update mfa admin methods ([#1774](https://github.com/supabase/auth/issues/1774)) ([567ea7e](https://github.com/supabase/auth/commit/567ea7ebd18eacc5e6daea8adc72e59e94459991))
* user sanitization should clean up email change info too ([#1759](https://github.com/supabase/auth/issues/1759)) ([9d419b4](https://github.com/supabase/auth/commit/9d419b400f0637b10e5c235b8fd5bac0d69352bd))

## [2.160.0](https://github.com/supabase/auth/compare/v2.159.2...v2.160.0) (2024-09-02)


### Features

* add authorized email address support ([#1757](https://github.com/supabase/auth/issues/1757)) ([f3a28d1](https://github.com/supabase/auth/commit/f3a28d182d193cf528cc72a985dfeaf7ecb67056))
* add option to disable magic links ([#1756](https://github.com/supabase/auth/issues/1756)) ([2ad0737](https://github.com/supabase/auth/commit/2ad07373aa9239eba94abdabbb01c9abfa8c48de))
* add support for saml encrypted assertions ([#1752](https://github.com/supabase/auth/issues/1752)) ([c5480ef](https://github.com/supabase/auth/commit/c5480ef83248ec2e7e3d3d87f92f43f17161ed25))


### Bug Fixes

* apply shared limiters before email / sms is sent ([#1748](https://github.com/supabase/auth/issues/1748)) ([bf276ab](https://github.com/supabase/auth/commit/bf276ab49753642793471815727559172fea4efc))
* simplify WaitForCleanup ([#1747](https://github.com/supabase/auth/issues/1747)) ([0084625](https://github.com/supabase/auth/commit/0084625ad0790dd7c14b412d932425f4b84bb4c8))

## [2.159.2](https://github.com/supabase/auth/compare/v2.159.1...v2.159.2) (2024-08-28)


### Bug Fixes

* allow anonymous user to update password ([#1739](https://github.com/supabase/auth/issues/1739)) ([2d51956](https://github.com/supabase/auth/commit/2d519569d7b8540886d0a64bf3e561ef5f91eb63))
* hide hook name ([#1743](https://github.com/supabase/auth/issues/1743)) ([7e38f4c](https://github.com/supabase/auth/commit/7e38f4cf37768fe2adf92bbd0723d1d521b3d74c))
* remove server side cookie token methods ([#1742](https://github.com/supabase/auth/issues/1742)) ([c6efec4](https://github.com/supabase/auth/commit/c6efec4cbc950e01e1fd06d45ed821bd27c2ad08))

## [2.159.1](https://github.com/supabase/auth/compare/v2.159.0...v2.159.1) (2024-08-23)


### Bug Fixes

* return oauth identity when user is created ([#1736](https://github.com/supabase/auth/issues/1736)) ([60cfb60](https://github.com/supabase/auth/commit/60cfb6063afa574dfe4993df6b0e087d4df71309))

## [2.159.0](https://github.com/supabase/auth/compare/v2.158.1...v2.159.0) (2024-08-21)


### Features

* Vercel marketplace OIDC ([#1731](https://github.com/supabase/auth/issues/1731)) ([a9ff361](https://github.com/supabase/auth/commit/a9ff3612196af4a228b53a8bfb9c11785bcfba8d))


### Bug Fixes

* add error codes to password login flow ([#1721](https://github.com/supabase/auth/issues/1721)) ([4351226](https://github.com/supabase/auth/commit/435122627a0784f1c5cb76d7e08caa1f6259423b))
* change phone constraint to per user ([#1713](https://github.com/supabase/auth/issues/1713)) ([b9bc769](https://github.com/supabase/auth/commit/b9bc769b93b6e700925fcbc1ebf8bf9678034205))
* custom SMS does not work with Twilio Verify ([#1733](https://github.com/supabase/auth/issues/1733)) ([dc2391d](https://github.com/supabase/auth/commit/dc2391d15f2c0725710aa388cd32a18797e6769c))
* ignore errors if transaction has closed already ([#1726](https://github.com/supabase/auth/issues/1726)) ([53c11d1](https://github.com/supabase/auth/commit/53c11d173a79ae5c004871b1b5840c6f9425a080))
* redirect invalid state errors to site url ([#1722](https://github.com/supabase/auth/issues/1722)) ([b2b1123](https://github.com/supabase/auth/commit/b2b11239dc9f9bd3c85d76f6c23ee94beb3330bb))
* remove TOTP field for phone enroll response ([#1717](https://github.com/supabase/auth/issues/1717)) ([4b04327](https://github.com/supabase/auth/commit/4b043275dd2d94600a8138d4ebf4638754ed926b))
* use signing jwk to sign oauth state ([#1728](https://github.com/supabase/auth/issues/1728)) ([66fd0c8](https://github.com/supabase/auth/commit/66fd0c8434388bbff1e1bf02f40517aca0e9d339))

## [2.158.1](https://github.com/supabase/auth/compare/v2.158.0...v2.158.1) (2024-08-05)


### Bug Fixes

* add last_challenged_at field to mfa factors ([#1705](https://github.com/supabase/auth/issues/1705)) ([29cbeb7](https://github.com/supabase/auth/commit/29cbeb799ff35ce528bfbd01b7103a24903d8061))
* allow enabling sms hook without setting up sms provider ([#1704](https://github.com/supabase/auth/issues/1704)) ([575e88a](https://github.com/supabase/auth/commit/575e88ac345adaeb76ab6aae077307fdab9cda3c))
* drop the MFA_ENABLED config ([#1701](https://github.com/supabase/auth/issues/1701)) ([078c3a8](https://github.com/supabase/auth/commit/078c3a8adcd51e57b68ab1b582549f5813cccd14))
* enforce uniqueness on verified phone numbers ([#1693](https://github.com/supabase/auth/issues/1693)) ([70446cc](https://github.com/supabase/auth/commit/70446cc11d70b0493d742fe03f272330bb5b633e))
* expose `X-Supabase-Api-Version` header in CORS ([#1612](https://github.com/supabase/auth/issues/1612)) ([6ccd814](https://github.com/supabase/auth/commit/6ccd814309dca70a9e3585543887194b05d725d3))
* include factor_id in query ([#1702](https://github.com/supabase/auth/issues/1702)) ([ac14e82](https://github.com/supabase/auth/commit/ac14e82b33545466184da99e99b9d3fe5f3876d9))
* move is owned by check to load factor ([#1703](https://github.com/supabase/auth/issues/1703)) ([701a779](https://github.com/supabase/auth/commit/701a779cf092e777dd4ad4954dc650164b09ab32))
* refactor TOTP MFA into separate methods ([#1698](https://github.com/supabase/auth/issues/1698)) ([250d92f](https://github.com/supabase/auth/commit/250d92f9a18d38089d1bf262ef9088022a446965))
* remove check for content-length ([#1700](https://github.com/supabase/auth/issues/1700)) ([81b332d](https://github.com/supabase/auth/commit/81b332d2f48622008469d2c5a9b130465a65f2a3))
* remove FindFactorsByUser ([#1707](https://github.com/supabase/auth/issues/1707)) ([af8e2dd](https://github.com/supabase/auth/commit/af8e2dda15a1234a05e7d2d34d316eaa029e0912))
* update openapi spec for MFA (Phone)  ([#1689](https://github.com/supabase/auth/issues/1689)) ([a3da4b8](https://github.com/supabase/auth/commit/a3da4b89820c37f03ea128889616aca598d99f68))

## [2.158.0](https://github.com/supabase/auth/compare/v2.157.0...v2.158.0) (2024-07-31)


### Features

* add hook log entry with `run_hook` action ([#1684](https://github.com/supabase/auth/issues/1684)) ([46491b8](https://github.com/supabase/auth/commit/46491b867a4f5896494417391392a373a453fa5f))
* MFA (Phone) ([#1668](https://github.com/supabase/auth/issues/1668)) ([ae091aa](https://github.com/supabase/auth/commit/ae091aa942bdc5bc97481037508ec3bb4079d859))


### Bug Fixes

* maintain backward compatibility for asymmetric JWTs ([#1690](https://github.com/supabase/auth/issues/1690)) ([0ad1402](https://github.com/supabase/auth/commit/0ad1402444348e47e1e42be186b3f052d31be824))
* MFA NewFactor to default to creating unverfied factors ([#1692](https://github.com/supabase/auth/issues/1692)) ([3d448fa](https://github.com/supabase/auth/commit/3d448fa73cb77eb8511dbc47bfafecce4a4a2150))
* minor spelling errors ([#1688](https://github.com/supabase/auth/issues/1688)) ([6aca52b](https://github.com/supabase/auth/commit/6aca52b56f8a6254de7709c767b9a5649f1da248)), closes [#1682](https://github.com/supabase/auth/issues/1682)
* treat `GOTRUE_MFA_ENABLED` as meaning TOTP enabled on enroll and verify ([#1694](https://github.com/supabase/auth/issues/1694)) ([8015251](https://github.com/supabase/auth/commit/8015251400bd52cbdad3ea28afb83b1cdfe816dd))
* update mfa phone migration to be idempotent ([#1687](https://github.com/supabase/auth/issues/1687)) ([fdff1e7](https://github.com/supabase/auth/commit/fdff1e703bccf93217636266f1862bd0a9205edb))

## [2.157.0](https://github.com/supabase/auth/compare/v2.156.0...v2.157.0) (2024-07-26)


### Features

* add asymmetric jwt support ([#1674](https://github.com/supabase/auth/issues/1674)) ([c7a2be3](https://github.com/supabase/auth/commit/c7a2be347b301b666e99adc3d3fed78c5e287c82))

## [2.156.0](https://github.com/supabase/auth/compare/v2.155.6...v2.156.0) (2024-07-25)


### Features

* add is_anonymous claim to Auth hook jsonschema ([#1667](https://github.com/supabase/auth/issues/1667)) ([f9df65c](https://github.com/supabase/auth/commit/f9df65c91e226084abfa2e868ab6bab892d16d2f))


### Bug Fixes

* restrict autoconfirm email change to anonymous users ([#1679](https://github.com/supabase/auth/issues/1679)) ([b57e223](https://github.com/supabase/auth/commit/b57e2230102280ed873acf70be1aeb5a2f6f7a4f))

## [2.155.6](https://github.com/supabase/auth/compare/v2.155.5...v2.155.6) (2024-07-22)


### Bug Fixes

* use deep equal ([#1672](https://github.com/supabase/auth/issues/1672)) ([8efd57d](https://github.com/supabase/auth/commit/8efd57dab40346762a04bac61b314ce05d6fa69c))

## [2.155.5](https://github.com/supabase/auth/compare/v2.155.4...v2.155.5) (2024-07-19)


### Bug Fixes

* check password max length in checkPasswordStrength ([#1659](https://github.com/supabase/auth/issues/1659)) ([1858c93](https://github.com/supabase/auth/commit/1858c93bba6f5bc41e4c65489f12c1a0786a1f2b))
* don't update attribute mapping if nil ([#1665](https://github.com/supabase/auth/issues/1665)) ([7e67f3e](https://github.com/supabase/auth/commit/7e67f3edbf81766df297a66f52a8e472583438c6))
* refactor mfa models and add observability to loadFactor ([#1669](https://github.com/supabase/auth/issues/1669)) ([822fb93](https://github.com/supabase/auth/commit/822fb93faab325ba3d4bb628dff43381d68d0b5d))

## [2.155.4](https://github.com/supabase/auth/compare/v2.155.3...v2.155.4) (2024-07-17)


### Bug Fixes

* treat empty string as nil in `encrypted_password` ([#1663](https://github.com/supabase/auth/issues/1663)) ([f99286e](https://github.com/supabase/auth/commit/f99286eaed505daf3db6f381265ef6024e7e36d2))

## [2.155.3](https://github.com/supabase/auth/compare/v2.155.2...v2.155.3) (2024-07-12)


### Bug Fixes

* serialize jwt as string ([#1657](https://github.com/supabase/auth/issues/1657)) ([98d8324](https://github.com/supabase/auth/commit/98d83245e40d606438eb0afdbf474276179fd91d))

## [2.155.2](https://github.com/supabase/auth/compare/v2.155.1...v2.155.2) (2024-07-12)


### Bug Fixes

* improve session error logging ([#1655](https://github.com/supabase/auth/issues/1655)) ([5a6793e](https://github.com/supabase/auth/commit/5a6793ee8fce7a089750fe10b3b63bb0a19d6d21))
* omit empty string from name & use case-insensitive equality for comparing SAML attributes ([#1654](https://github.com/supabase/auth/issues/1654)) ([bf5381a](https://github.com/supabase/auth/commit/bf5381a6b1c686955dc4e39fe5fb806ffd309563))
* set rate limit log level to warn ([#1652](https://github.com/supabase/auth/issues/1652)) ([10ca9c8](https://github.com/supabase/auth/commit/10ca9c806e4b67a371897f1b3f93c515764c4240))

## [2.155.1](https://github.com/supabase/auth/compare/v2.155.0...v2.155.1) (2024-07-04)


### Bug Fixes

* apply mailer autoconfirm config to update user email ([#1646](https://github.com/supabase/auth/issues/1646)) ([a518505](https://github.com/supabase/auth/commit/a5185058e72509b0781e0eb59910ecdbb8676fee))
* check for empty aud string ([#1649](https://github.com/supabase/auth/issues/1649)) ([42c1d45](https://github.com/supabase/auth/commit/42c1d4526b98203664d4a22c23014ecd0b4951f9))
* return proper error if sms rate limit is exceeded ([#1647](https://github.com/supabase/auth/issues/1647)) ([3c8d765](https://github.com/supabase/auth/commit/3c8d7656431ac4b2e80726b7c37adb8f0c778495))

## [2.155.0](https://github.com/supabase/auth/compare/v2.154.2...v2.155.0) (2024-07-03)


### Features

* add `password_hash` and `id` fields to admin create user ([#1641](https://github.com/supabase/auth/issues/1641)) ([20d59f1](https://github.com/supabase/auth/commit/20d59f10b601577683d05bcd7d2128ff4bc462a0))


### Bug Fixes

* improve mfa verify logs ([#1635](https://github.com/supabase/auth/issues/1635)) ([d8b47f9](https://github.com/supabase/auth/commit/d8b47f9d3f0dc8f97ad1de49e45f452ebc726481))
* invited users should have a temporary password generated ([#1644](https://github.com/supabase/auth/issues/1644)) ([3f70d9d](https://github.com/supabase/auth/commit/3f70d9d8974d0e9c437c51e1312ad17ce9056ec9))
* upgrade golang-jwt to v5 ([#1639](https://github.com/supabase/auth/issues/1639)) ([2cb97f0](https://github.com/supabase/auth/commit/2cb97f080fa4695766985cc4792d09476534be68))
* use pointer for `user.EncryptedPassword` ([#1637](https://github.com/supabase/auth/issues/1637)) ([bbecbd6](https://github.com/supabase/auth/commit/bbecbd61a46b0c528b1191f48d51f166c06f4b16))

## [2.154.2](https://github.com/supabase/auth/compare/v2.154.1...v2.154.2) (2024-06-24)


### Bug Fixes

* publish to ghcr.io/supabase/auth ([#1626](https://github.com/supabase/auth/issues/1626)) ([930aa3e](https://github.com/supabase/auth/commit/930aa3edb633823d4510c2aff675672df06f1211)), closes [#1625](https://github.com/supabase/auth/issues/1625)
* revert define search path in auth functions ([#1634](https://github.com/supabase/auth/issues/1634)) ([155e87e](https://github.com/supabase/auth/commit/155e87ef8129366d665968f64d1fc66676d07e16))
* update MaxFrequency error message to reflect number of seconds ([#1540](https://github.com/supabase/auth/issues/1540)) ([e81c25d](https://github.com/supabase/auth/commit/e81c25d19551fdebfc5197d96bc220ddb0f8227b))

## [2.154.1](https://github.com/supabase/auth/compare/v2.154.0...v2.154.1) (2024-06-17)


### Bug Fixes

* add ip based limiter ([#1622](https://github.com/supabase/auth/issues/1622)) ([06464c0](https://github.com/supabase/auth/commit/06464c013571253d1f18f7ae5e840826c4bd84a7))
* admin user update should update is_anonymous field ([#1623](https://github.com/supabase/auth/issues/1623)) ([f5c6fcd](https://github.com/supabase/auth/commit/f5c6fcd9c3fee0f793f96880a8caebc5b5cb0916))

## [2.154.0](https://github.com/supabase/auth/compare/v2.153.0...v2.154.0) (2024-06-12)


### Features

* add max length check for email ([#1508](https://github.com/supabase/auth/issues/1508)) ([f9c13c0](https://github.com/supabase/auth/commit/f9c13c0ad5c556bede49d3e0f6e5f58ca26161c3))
* add support for Slack OAuth V2 ([#1591](https://github.com/supabase/auth/issues/1591)) ([bb99251](https://github.com/supabase/auth/commit/bb992519cdf7578dc02cd7de55e2e6aa09b4c0f3))
* encrypt sensitive columns ([#1593](https://github.com/supabase/auth/issues/1593)) ([e4a4758](https://github.com/supabase/auth/commit/e4a475820b2dc1f985bd37df15a8ab9e781626f5))
* upgrade otel to v1.26 ([#1585](https://github.com/supabase/auth/issues/1585)) ([cdd13ad](https://github.com/supabase/auth/commit/cdd13adec02eb0c9401bc55a2915c1005d50dea1))
* use largest avatar from spotify instead ([#1210](https://github.com/supabase/auth/issues/1210)) ([4f9994b](https://github.com/supabase/auth/commit/4f9994bf792c3887f2f45910b11a9c19ee3a896b)), closes [#1209](https://github.com/supabase/auth/issues/1209)


### Bug Fixes

* define search path in auth functions ([#1616](https://github.com/supabase/auth/issues/1616)) ([357bda2](https://github.com/supabase/auth/commit/357bda23cb2abd12748df80a9d27288aa548534d))
* enable rls & update grants for auth tables ([#1617](https://github.com/supabase/auth/issues/1617)) ([28967aa](https://github.com/supabase/auth/commit/28967aa4b5db2363cc581c9da0d64e974eb7b64c))

## [2.153.0](https://github.com/supabase/auth/compare/v2.152.0...v2.153.0) (2024-06-04)


### Features

* add SAML specific external URL config ([#1599](https://github.com/supabase/auth/issues/1599)) ([b352719](https://github.com/supabase/auth/commit/b3527190560381fafe9ba2fae4adc3b73703024a))
* add support for verifying argon2i and argon2id passwords ([#1597](https://github.com/supabase/auth/issues/1597)) ([55409f7](https://github.com/supabase/auth/commit/55409f797bea55068a3fafdddd6cfdb78feba1b4))
* make the email client explicity set the format to be HTML ([#1149](https://github.com/supabase/auth/issues/1149)) ([53e223a](https://github.com/supabase/auth/commit/53e223abdf29f4abcad13f99baf00daedcb00c3f))


### Bug Fixes

* call write header in write if not written ([#1598](https://github.com/supabase/auth/issues/1598)) ([0ef7eb3](https://github.com/supabase/auth/commit/0ef7eb30619d4c365e06a94a79b9cb0333d792da))
* deadlock issue with timeout middleware write ([#1595](https://github.com/supabase/auth/issues/1595)) ([6c9fbd4](https://github.com/supabase/auth/commit/6c9fbd4bd5623c729906fca7857ab508166a3056))
* improve token OIDC logging ([#1606](https://github.com/supabase/auth/issues/1606)) ([5262683](https://github.com/supabase/auth/commit/526268311844467664e89c8329e5aaee817dbbaf))
* update contributing to use v1.22 ([#1609](https://github.com/supabase/auth/issues/1609)) ([5894d9e](https://github.com/supabase/auth/commit/5894d9e41e7681512a9904ad47082a705e948c98))

## [2.152.0](https://github.com/supabase/auth/compare/v2.151.0...v2.152.0) (2024-05-22)


### Features

* new timeout writer implementation ([#1584](https://github.com/supabase/auth/issues/1584)) ([72614a1](https://github.com/supabase/auth/commit/72614a1fce27888f294772b512f8e31c55a36d87))
* remove legacy lookup in users for one_time_tokens (phase II) ([#1569](https://github.com/supabase/auth/issues/1569)) ([39ca026](https://github.com/supabase/auth/commit/39ca026035f6c61d206d31772c661b326c2a424c))
* update chi version ([#1581](https://github.com/supabase/auth/issues/1581)) ([c64ae3d](https://github.com/supabase/auth/commit/c64ae3dd775e8fb3022239252c31b4ee73893237))
* update openapi spec with identity and is_anonymous fields ([#1573](https://github.com/supabase/auth/issues/1573)) ([86a79df](https://github.com/supabase/auth/commit/86a79df9ecfcf09fda0b8e07afbc41154fbb7d9d))


### Bug Fixes

* improve logging structure ([#1583](https://github.com/supabase/auth/issues/1583)) ([c22fc15](https://github.com/supabase/auth/commit/c22fc15d2a8383e95a2364f383dfa7dce5f5df88))
* sms verify should update is_anonymous field ([#1580](https://github.com/supabase/auth/issues/1580)) ([e5f98cb](https://github.com/supabase/auth/commit/e5f98cb9e24ecebb0b7dc88c495fd456cc73fcba))
* use api_external_url domain as localname ([#1575](https://github.com/supabase/auth/issues/1575)) ([ed2b490](https://github.com/supabase/auth/commit/ed2b4907244281e4c54aaef74b1f4c8a8e3d97c9))

## [2.151.0](https://github.com/supabase/auth/compare/v2.150.1...v2.151.0) (2024-05-06)


### Features

* refactor one-time tokens for performance ([#1558](https://github.com/supabase/auth/issues/1558)) ([d1cf8d9](https://github.com/supabase/auth/commit/d1cf8d9096e9183d7772b73031de8ecbd66e912b))


### Bug Fixes

* do call send sms hook when SMS autoconfirm is enabled ([#1562](https://github.com/supabase/auth/issues/1562)) ([bfe4d98](https://github.com/supabase/auth/commit/bfe4d988f3768b0407526bcc7979fb21d8cbebb3))
* format test otps ([#1567](https://github.com/supabase/auth/issues/1567)) ([434a59a](https://github.com/supabase/auth/commit/434a59ae387c35fd6629ec7c674d439537e344e5))
* log final writer error instead of handling ([#1564](https://github.com/supabase/auth/issues/1564)) ([170bd66](https://github.com/supabase/auth/commit/170bd6615405afc852c7107f7358dfc837bad737))

## [2.150.1](https://github.com/supabase/auth/compare/v2.150.0...v2.150.1) (2024-04-28)


### Bug Fixes

* add db conn max idle time setting ([#1555](https://github.com/supabase/auth/issues/1555)) ([2caa7b4](https://github.com/supabase/auth/commit/2caa7b4d75d2ff54af20f3e7a30a8eeec8cbcda9))

## [2.150.0](https://github.com/supabase/auth/compare/v2.149.0...v2.150.0) (2024-04-25)


### Features

* add support for Azure CIAM login ([#1541](https://github.com/supabase/auth/issues/1541)) ([1cb4f96](https://github.com/supabase/auth/commit/1cb4f96bdc7ef3ef995781b4cf3c4364663a2bf3))
* add timeout middleware ([#1529](https://github.com/supabase/auth/issues/1529)) ([f96ff31](https://github.com/supabase/auth/commit/f96ff31040b28e3a7373b4fd41b7334eda1b413e))
* allow for postgres and http functions on each extensibility point ([#1528](https://github.com/supabase/auth/issues/1528)) ([348a1da](https://github.com/supabase/auth/commit/348a1daee24f6e44b14c018830b748e46d34b4c2))
* merge provider metadata on link account ([#1552](https://github.com/supabase/auth/issues/1552)) ([bd8b5c4](https://github.com/supabase/auth/commit/bd8b5c41dd544575e1a52ccf1ef3f0fdee67458c))
* send over user in SendSMS Hook instead of UserID ([#1551](https://github.com/supabase/auth/issues/1551)) ([d4d743c](https://github.com/supabase/auth/commit/d4d743c2ae9490e1b3249387e3b0d60df6913c68))


### Bug Fixes

* return error if session id does not exist ([#1538](https://github.com/supabase/auth/issues/1538)) ([91e9eca](https://github.com/supabase/auth/commit/91e9ecabe33a1c022f8e82a6050c22a7ca42de48))

## [2.149.0](https://github.com/supabase/auth/compare/v2.148.0...v2.149.0) (2024-04-15)


### Features

* refactor generate accesss token to take in request ([#1531](https://github.com/supabase/auth/issues/1531)) ([e4f2b59](https://github.com/supabase/auth/commit/e4f2b59e8e1f8158b6461a384349f1a32cc1bf9a))


### Bug Fixes

* linkedin_oidc provider error ([#1534](https://github.com/supabase/auth/issues/1534)) ([4f5e8e5](https://github.com/supabase/auth/commit/4f5e8e5120531e5a103fbdda91b51cabcb4e1a8c))
* revert patch for linkedin_oidc provider error ([#1535](https://github.com/supabase/auth/issues/1535)) ([58ef4af](https://github.com/supabase/auth/commit/58ef4af0b4224b78cd9e59428788d16a8d31e562))
* update linkedin issuer url ([#1536](https://github.com/supabase/auth/issues/1536)) ([10d6d8b](https://github.com/supabase/auth/commit/10d6d8b1eafa504da2b2a351d1f64a3a832ab1b9))

## [2.148.0](https://github.com/supabase/auth/compare/v2.147.1...v2.148.0) (2024-04-10)


### Features

* add array attribute mapping for SAML ([#1526](https://github.com/supabase/auth/issues/1526)) ([7326285](https://github.com/supabase/auth/commit/7326285c8af5c42e5c0c2d729ab224cf33ac3a1f))

## [2.147.1](https://github.com/supabase/auth/compare/v2.147.0...v2.147.1) (2024-04-09)


### Bug Fixes

* add validation and proper decoding on send email hook ([#1520](https://github.com/supabase/auth/issues/1520)) ([e19e762](https://github.com/supabase/auth/commit/e19e762e3e29729a1d1164c65461427822cc87f1))
* remove deprecated LogoutAllRefreshTokens ([#1519](https://github.com/supabase/auth/issues/1519)) ([35533ea](https://github.com/supabase/auth/commit/35533ea100669559e1209ecc7b091db3657234d9))

## [2.147.0](https://github.com/supabase/auth/compare/v2.146.0...v2.147.0) (2024-04-05)


### Features

* add send email Hook ([#1512](https://github.com/supabase/auth/issues/1512)) ([cf42e02](https://github.com/supabase/auth/commit/cf42e02ec63779f52b1652a7413f64994964c82d))

## [2.146.0](https://github.com/supabase/auth/compare/v2.145.0...v2.146.0) (2024-04-03)


### Features

* add custom sms hook ([#1474](https://github.com/supabase/auth/issues/1474)) ([0f6b29a](https://github.com/supabase/auth/commit/0f6b29a46f1dcbf92aa1f7cb702f42e7640f5f93))
* forbid generating an access token without a session ([#1504](https://github.com/supabase/auth/issues/1504)) ([795e93d](https://github.com/supabase/auth/commit/795e93d0afbe94bcd78489a3319a970b7bf8e8bc))


### Bug Fixes

* add cleanup statement for anonymous users ([#1497](https://github.com/supabase/auth/issues/1497)) ([cf2372a](https://github.com/supabase/auth/commit/cf2372a177796b829b72454e7491ce768bf5a42f))
* generate signup link should not error ([#1514](https://github.com/supabase/auth/issues/1514)) ([4fc3881](https://github.com/supabase/auth/commit/4fc388186ac7e7a9a32ca9b963a83d6ac2eb7603))
* move all EmailActionTypes to mailer package ([#1510](https://github.com/supabase/auth/issues/1510)) ([765db08](https://github.com/supabase/auth/commit/765db08582669a1b7f054217fa8f0ed45804c0b5))
* refactor mfa and aal update methods ([#1503](https://github.com/supabase/auth/issues/1503)) ([31a5854](https://github.com/supabase/auth/commit/31a585429bf248aa919d94c82c7c9e0c1c695461))
* rename from CustomSMSProvider to SendSMS ([#1513](https://github.com/supabase/auth/issues/1513)) ([c0bc37b](https://github.com/supabase/auth/commit/c0bc37b44effaebb62ba85102f072db07fe57e48))

## [2.145.0](https://github.com/supabase/gotrue/compare/v2.144.0...v2.145.0) (2024-03-26)


### Features

* add error codes ([#1377](https://github.com/supabase/gotrue/issues/1377)) ([e4beea1](https://github.com/supabase/gotrue/commit/e4beea1cdb80544b0581f1882696a698fdf64938))
* add kakao OIDC ([#1381](https://github.com/supabase/gotrue/issues/1381)) ([b5566e7](https://github.com/supabase/gotrue/commit/b5566e7ac001cc9f2bac128de0fcb908caf3a5ed))
* clean up expired factors ([#1371](https://github.com/supabase/gotrue/issues/1371)) ([5c94207](https://github.com/supabase/gotrue/commit/5c9420743a9aef0675f823c30aa4525b4933836e))
* configurable NameID format for SAML provider ([#1481](https://github.com/supabase/gotrue/issues/1481)) ([ef405d8](https://github.com/supabase/gotrue/commit/ef405d89e69e008640f275bc37f8ec02ad32da40))
* HTTP Hook - Add custom envconfig decoding for HTTP Hook Secrets ([#1467](https://github.com/supabase/gotrue/issues/1467)) ([5b24c4e](https://github.com/supabase/gotrue/commit/5b24c4eb05b2b52c4177d5f41cba30cb68495c8c))
* refactor PKCE FlowState to reduce duplicate code ([#1446](https://github.com/supabase/gotrue/issues/1446)) ([b8d0337](https://github.com/supabase/gotrue/commit/b8d0337922c6712380f6dc74f7eac9fb71b1ae48))


### Bug Fixes

* add http support for https hooks on localhost ([#1484](https://github.com/supabase/gotrue/issues/1484)) ([5c04104](https://github.com/supabase/gotrue/commit/5c04104bf77a9c2db46d009764ec3ec3e484fc09))
* cleanup panics due to bad inactivity timeout code ([#1471](https://github.com/supabase/gotrue/issues/1471)) ([548edf8](https://github.com/supabase/gotrue/commit/548edf898161c9ba9a136fc99ec2d52a8ba1f856))
* **docs:** remove bracket on file name for broken link ([#1493](https://github.com/supabase/gotrue/issues/1493)) ([96f7a68](https://github.com/supabase/gotrue/commit/96f7a68a5479825e31106c2f55f82d5b2c007c0f))
* impose expiry on auth code instead of magic link ([#1440](https://github.com/supabase/gotrue/issues/1440)) ([35aeaf1](https://github.com/supabase/gotrue/commit/35aeaf1b60dd27a22662a6d1955d60cc907b55dd))
* invalidate email, phone OTPs on password change ([#1489](https://github.com/supabase/gotrue/issues/1489)) ([960a4f9](https://github.com/supabase/gotrue/commit/960a4f94f5500e33a0ec2f6afe0380bbc9562500))
* move creation of flow state into function ([#1470](https://github.com/supabase/gotrue/issues/1470)) ([4392a08](https://github.com/supabase/gotrue/commit/4392a08d68d18828005d11382730117a7b143635))
* prevent user email side-channel leak on verify ([#1472](https://github.com/supabase/gotrue/issues/1472)) ([311cde8](https://github.com/supabase/gotrue/commit/311cde8d1e82f823ae26a341e068034d60273864))
* refactor email sending functions ([#1495](https://github.com/supabase/gotrue/issues/1495)) ([285c290](https://github.com/supabase/gotrue/commit/285c290adf231fea7ca1dff954491dc427cf18e2))
* refactor factor_test to centralize setup ([#1473](https://github.com/supabase/gotrue/issues/1473)) ([c86007e](https://github.com/supabase/gotrue/commit/c86007e59684334b5e8c2285c36094b6eec89442))
* refactor mfa challenge and tests ([#1469](https://github.com/supabase/gotrue/issues/1469)) ([6c76f21](https://github.com/supabase/gotrue/commit/6c76f21cee5dbef0562c37df6a546939affb2f8d))
* Resend SMS when duplicate SMS sign ups are made ([#1490](https://github.com/supabase/gotrue/issues/1490)) ([73240a0](https://github.com/supabase/gotrue/commit/73240a0b096977703e3c7d24a224b5641ce47c81))
* unlink identity bugs ([#1475](https://github.com/supabase/gotrue/issues/1475)) ([73e8d87](https://github.com/supabase/gotrue/commit/73e8d8742de3575b3165a707b5d2f486b2598d9d))

## [2.144.0](https://github.com/supabase/gotrue/compare/v2.143.0...v2.144.0) (2024-03-04)


### Features

* add configuration for custom sms sender hook ([#1428](https://github.com/supabase/gotrue/issues/1428)) ([1ea56b6](https://github.com/supabase/gotrue/commit/1ea56b62d47edb0766d9e445406ecb43d387d920))
* anonymous sign-ins  ([#1460](https://github.com/supabase/gotrue/issues/1460)) ([130df16](https://github.com/supabase/gotrue/commit/130df165270c69c8e28aaa1b9421342f997c1ff3))
* clean up test setup in MFA tests ([#1452](https://github.com/supabase/gotrue/issues/1452)) ([7185af8](https://github.com/supabase/gotrue/commit/7185af8de4a269cdde2629054d222333d3522ebe))
* pass transaction to `invokeHook`, fixing pool exhaustion ([#1465](https://github.com/supabase/gotrue/issues/1465)) ([b536d36](https://github.com/supabase/gotrue/commit/b536d368f35adb31f937169e3f093d28352fa7be))
* refactor resource owner password grant ([#1443](https://github.com/supabase/gotrue/issues/1443)) ([e63ad6f](https://github.com/supabase/gotrue/commit/e63ad6ff0f67d9a83456918a972ecb5109125628))
* use dummy instance id to improve performance on refresh token queries ([#1454](https://github.com/supabase/gotrue/issues/1454)) ([656474e](https://github.com/supabase/gotrue/commit/656474e1b9ff3d5129190943e8c48e456625afe5))


### Bug Fixes

* expose `provider` under `amr` in access token ([#1456](https://github.com/supabase/gotrue/issues/1456)) ([e9f38e7](https://github.com/supabase/gotrue/commit/e9f38e76d8a7b93c5c2bb0de918a9b156155f018))
* improve MFA QR Code resilience so as to support providers like 1Password ([#1455](https://github.com/supabase/gotrue/issues/1455)) ([6522780](https://github.com/supabase/gotrue/commit/652278046c9dd92f5cecd778735b058ef3fb41c7))
* refactor request params to use generics ([#1464](https://github.com/supabase/gotrue/issues/1464)) ([e1cdf5c](https://github.com/supabase/gotrue/commit/e1cdf5c4b5c1bf467094f4bdcaa2e42a5cc51c20))
* revert refactor resource owner password grant ([#1466](https://github.com/supabase/gotrue/issues/1466)) ([fa21244](https://github.com/supabase/gotrue/commit/fa21244fa929709470c2e1fc4092a9ce947399e7))
* update file name so migration to Drop IP Address is applied ([#1447](https://github.com/supabase/gotrue/issues/1447)) ([f29e89d](https://github.com/supabase/gotrue/commit/f29e89d7d2c48ee8fd5bf8279a7fa3db0ad4d842))

## [2.143.0](https://github.com/supabase/gotrue/compare/v2.142.0...v2.143.0) (2024-02-19)


### Features

* calculate aal without transaction ([#1437](https://github.com/supabase/gotrue/issues/1437)) ([8dae661](https://github.com/supabase/gotrue/commit/8dae6614f1a2b58819f94894cef01e9f99117769))


### Bug Fixes

* deprecate hooks  ([#1421](https://github.com/supabase/gotrue/issues/1421)) ([effef1b](https://github.com/supabase/gotrue/commit/effef1b6ecc448b7927eff23df8d5b509cf16b5c))
* error should be an IsNotFoundError ([#1432](https://github.com/supabase/gotrue/issues/1432)) ([7f40047](https://github.com/supabase/gotrue/commit/7f40047aec3577d876602444b1d88078b2237d66))
* populate password verification attempt hook ([#1436](https://github.com/supabase/gotrue/issues/1436)) ([f974bdb](https://github.com/supabase/gotrue/commit/f974bdb58340395955ca27bdd26d57062433ece9))
* restrict mfa enrollment to aal2 if verified factors are present ([#1439](https://github.com/supabase/gotrue/issues/1439)) ([7e10d45](https://github.com/supabase/gotrue/commit/7e10d45e54010d38677f4c3f2f224127688eb9a2))
* update phone if autoconfirm is enabled ([#1431](https://github.com/supabase/gotrue/issues/1431)) ([95db770](https://github.com/supabase/gotrue/commit/95db770c5d2ecca4a1e960a8cb28ded37cccc100))
* use email change email in identity ([#1429](https://github.com/supabase/gotrue/issues/1429)) ([4d3b9b8](https://github.com/supabase/gotrue/commit/4d3b9b8841b1a5fa8f3244825153cc81a73ba300))

## [2.142.0](https://github.com/supabase/gotrue/compare/v2.141.0...v2.142.0) (2024-02-14)


### Features

* alter tag to use raw ([#1427](https://github.com/supabase/gotrue/issues/1427)) ([53cfe5d](https://github.com/supabase/gotrue/commit/53cfe5de57d4b5ab6e8e2915493856ecd96f4ede))
* update README.md to trigger release ([#1425](https://github.com/supabase/gotrue/issues/1425)) ([91e0e24](https://github.com/supabase/gotrue/commit/91e0e245f5957ebce13370f79fd4a6be8108ed80))

## [2.141.0](https://github.com/supabase/gotrue/compare/v2.140.0...v2.141.0) (2024-02-13)


### Features

* drop sha hash tag ([#1422](https://github.com/supabase/gotrue/issues/1422)) ([76853ce](https://github.com/supabase/gotrue/commit/76853ce6d45064de5608acc8100c67a8337ba791))
* prefix release with v ([#1424](https://github.com/supabase/gotrue/issues/1424)) ([9d398cd](https://github.com/supabase/gotrue/commit/9d398cd75fca01fb848aa88b4f545552e8b5751a))

## [2.140.0](https://github.com/supabase/gotrue/compare/v2.139.2...v2.140.0) (2024-02-13)


### Features

* deprecate existing webhook implementation ([#1417](https://github.com/supabase/gotrue/issues/1417)) ([5301e48](https://github.com/supabase/gotrue/commit/5301e481b0c7278c18b4578a5b1aa8d2256c2f5d))
* update publish.yml checkout repository so there is access to Dockerfile ([#1419](https://github.com/supabase/gotrue/issues/1419)) ([7cce351](https://github.com/supabase/gotrue/commit/7cce3518e8c9f1f3f93e4f6a0658ee08771c4f1c))

## [2.139.2](https://github.com/supabase/gotrue/compare/v2.139.1...v2.139.2) (2024-02-08)


### Bug Fixes

* improve perf in account linking ([#1394](https://github.com/supabase/gotrue/issues/1394)) ([8eedb95](https://github.com/supabase/gotrue/commit/8eedb95dbaa310aac464645ec91d6a374813ab89))
* OIDC provider validation log message ([#1380](https://github.com/supabase/gotrue/issues/1380)) ([27e6b1f](https://github.com/supabase/gotrue/commit/27e6b1f9a4394c5c4f8dff9a8b5529db1fc67af9))
* only create or update the email / phone identity after it's been verified ([#1403](https://github.com/supabase/gotrue/issues/1403)) ([2d20729](https://github.com/supabase/gotrue/commit/2d207296ec22dd6c003c89626d255e35441fd52d))
* only create or update the email / phone identity after it's been verified (again) ([#1409](https://github.com/supabase/gotrue/issues/1409)) ([bc6a5b8](https://github.com/supabase/gotrue/commit/bc6a5b884b43fe6b8cb924d3f79999fe5bfe7c5f))
* unmarshal is_private_email correctly ([#1402](https://github.com/supabase/gotrue/issues/1402)) ([47df151](https://github.com/supabase/gotrue/commit/47df15113ce8d86666c0aba3854954c24fe39f7f))
* use `pattern` for semver docker image tags ([#1411](https://github.com/supabase/gotrue/issues/1411)) ([14a3aeb](https://github.com/supabase/gotrue/commit/14a3aeb6c3f46c8d38d98cc840112dfd0278eeda))


### Reverts

* "fix: only create or update the email / phone identity after i… ([#1407](https://github.com/supabase/gotrue/issues/1407)) ([ff86849](https://github.com/supabase/gotrue/commit/ff868493169a0d9ac18b66058a735197b1df5b9b))
