# generates a file to be used by the vegeta load testing tool

# It includes a worst case scenario for the JWT cache:
# - all requests will have a unique JWT so no cache hits
# - all jwts have an expiration that will be long enough to be
#   valid at time of request but short enough that already
#   validated jwts will expire later during the loadtest run
# - the above guarantees JWT cache purging will happen
# - we want this to track resource consumption in the worst case

# And a more normal scenario where non-expiring JWTs are picked
# from an array
import time
import argparse
import random
import jwcrypto.jwt as jwt
from pathlib import Path

URL = "http://postgrest"

secret_key = "reallyreallyreallyreallyverysafe"


def generate_target(
    now: int,
    key: jwt.JWK,
) -> list[str]:
    """Generate a target using an HS256 or RS256 JWT"""
    headers = {
        "sub": f"user_{random.getrandbits(32)}",
        "iat": now,
    }

    claims = {
        "role": "postgrest_test_author",
    }

    headers["alg"] = "RS256" if key.get("kty") == "RSA" else "HS256"

    token = jwt.JWT(headers, claims)
    token.make_signed_token(key)

    return [
        f"OPTIONS {URL}/authors_only?{headers["alg"]}",
        f"Authorization: Bearer {token.serialize()}",
        "",  # blank line to separate requests
    ]


def main():
    parser = argparse.ArgumentParser(
        description="Generate Vegeta targets with unique JWTs"
    )
    parser.add_argument(
        "generated_path",
        metavar="GENERATED_PATH",
        help="Path to write the generated files",
        type=Path,
    )

    args = parser.parse_args()

    targets_path = args.generated_path / "gen_targets.http"

    hs = jwt.JWK.from_password(secret_key)
    rsa = jwt.JWK.generate(kty="RSA", size=4096)

    jwks = jwt.JWKSet()
    jwks.add(hs)
    jwks.add(rsa)

    jwks_path = args.generated_path / "gen_jwks.json"

    # Technically, this exports the private keys, because HS does not have the concept
    # of a public key. This is not a problem for tests, though, PostgREST can verify
    # tokens with the private key just as well.
    jwks_path.write_text(jwks.export())
    print(f"Created JWKSet on {jwks_path}")

    ntargets = 1000

    print(f"Generating {ntargets} targets...")

    now = int(time.time())

    lines = []

    for i in range(ntargets):
        target = generate_target(now, hs if i % 2 == 0 else rsa)
        lines.extend(target)

    with open(targets_path, "w") as f:
        f.write("\n".join(lines))

    print(f"Created {ntargets} targets", end=" ")


if __name__ == "__main__":
    main()
