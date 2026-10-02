package conf

import (
	"crypto/x509"
	"encoding/base64"
	"fmt"
	"math/big"
	"testing"

	"github.com/stretchr/testify/require"
)

func TestSAMLConfiguration(t *testing.T) {
	t.Run("String", func(t *testing.T) {
		// string disabled
		{
			cfg := &SAMLConfiguration{Enabled: false}
			const expStr = "SAMLConfiguration(Enabled: false)"
			require.Equal(t, expStr, fmt.Sprintf("%v", cfg))
			require.Equal(t, expStr, fmt.Sprintf("%#v", cfg))
		}

		// string enabled
		{
			cfg := &SAMLConfiguration{Enabled: true}
			const expStr = "SAMLConfiguration(Enabled: true)"
			require.Equal(t, expStr, fmt.Sprintf("%v", cfg))
			require.Equal(t, expStr, fmt.Sprintf("%#v", cfg))
		}

		// string (nil)
		{
			var cfg *SAMLConfiguration
			const expStr = "(*SAMLConfiguration)(nil)"
			require.Equal(t, expStr, fmt.Sprintf("%v", cfg))
			require.Equal(t, expStr, fmt.Sprintf("%#v", cfg))
		}
	})

	t.Run("PopulateFields", func(t *testing.T) {
		c := &SAMLConfiguration{
			Enabled:    true,
			PrivateKey: validPrivateKey,
		}
		err := c.PopulateFields("https://projectref.supabase.co")
		require.NoError(t, err)

		isSet := (c.Certificate.KeyUsage & x509.KeyUsageDataEncipherment) != 0
		require.False(t, isSet)
		require.NotNil(t, c.RSAPrivateKey)
		require.NotNil(t, c.RSAPublicKey)
		require.NotNil(t, c.Certificate)
	})

	t.Run("PopulateFieldsEncryptedAssertions", func(t *testing.T) {
		c := &SAMLConfiguration{
			Enabled:                  true,
			PrivateKey:               validPrivateKey,
			AllowEncryptedAssertions: true,
		}
		err := c.PopulateFields("https://projectref.supabase.co")
		require.NoError(t, err)

		isSet := (c.Certificate.KeyUsage & x509.KeyUsageDataEncipherment) != 0
		require.True(t, isSet)
		require.NotNil(t, c.RSAPrivateKey)
		require.NotNil(t, c.RSAPublicKey)
		require.NotNil(t, c.Certificate)
	})

	t.Run("PopulateFieldsInvalidExternalURL", func(t *testing.T) {
		c := &SAMLConfiguration{
			Enabled:    true,
			PrivateKey: "invalidprivatekey",
		}
		err := c.PopulateFields("\n")
		require.Error(t, err)
	})

	t.Run("PopulateFieldsInvalidx509", func(t *testing.T) {
		c := &SAMLConfiguration{
			Enabled:    true,
			PrivateKey: validPrivateKey,
		}
		err := c.PopulateFields("http://invalid\nhost/foo")
		require.Error(t, err)
	})

	t.Run("PopulateFieldsInvalidPKCS1", func(t *testing.T) {
		c := &SAMLConfiguration{
			Enabled:    true,
			PrivateKey: base64.StdEncoding.EncodeToString([]byte("INVALID")),
		}
		err := c.PopulateFields("https://projectref.supabase.co")
		require.Error(t, err)
	})

	t.Run("PopulateFieldInvalidCreateCertificate", func(t *testing.T) {
		c := &SAMLConfiguration{
			Enabled:    true,
			PrivateKey: validPrivateKey,
		}
		certTemplate, err := c.populateFields("https://projectref.supabase.co")
		require.NoError(t, err)

		certTemplate.SerialNumber = big.NewInt(-1)
		err = c.createCertificate(certTemplate)
		require.Error(t, err)
	})

	t.Run("PopulateFieldInvalidCertificateDer", func(t *testing.T) {
		c := &SAMLConfiguration{
			Enabled:    true,
			PrivateKey: validPrivateKey,
		}
		err := c.PopulateFields("https://projectref.supabase.co")
		require.NoError(t, err)

		err = c.parseCertificateDer([]byte{0x0, 0x0})
		require.Error(t, err)
	})
}

func TestSAMLConfigurationValidate(t *testing.T) {
	invalidExamples := []*SAMLConfiguration{
		{
			Enabled:    true,
			PrivateKey: "",
		},
		{
			Enabled:    true,
			PrivateKey: "InvalidBase64!",
		},
		{
			Enabled:                  true,
			PrivateKey:               validPrivateKey,
			RelayStateValidityPeriod: -1,
		},
		{
			Enabled:     true,
			PrivateKey:  validPrivateKey,
			ExternalURL: "\n",
		},
		{
			Enabled:    true,
			PrivateKey: base64.StdEncoding.EncodeToString([]byte("not PKCS#1")),
		},
		{
			Enabled:    true,
			PrivateKey: base64.StdEncoding.EncodeToString([]byte("not PKCS#1")),
		},
		{
			// RSA 1024 key
			Enabled:    true,
			PrivateKey: "MIICXQIBAAKBgQDFa3SgzWZpcoONv3Iq3FxNieks2u2TmykxxxeggI9aNpHpuCzwGQO8wqXGVvFNlkE3GSPcz7rklzfyj577Z47lfWdBP1OAefralA3tS2mafqpZ32JwDynX4as+xauLVdP4iOR96b3L2eOb6rDpr4wBJuNqO533xsjcbNPINEDkSwIDAQABAoGASggBtEtSHDjVHFKufWQlOO5+glOWw8Nrrz75nTaYizvre7mVIHRA8ogLolT4KCAwVHkY+bTsYMxULqGs/JnY+40suHECYQ2u76PTQlvJnhJANGtCxuV4lSK6B8QBJhjGExsnAOwMMKz0p5kVftx2GA+/Rz2De7DR9keNECjcAAECQQDtr5cdkEdnIffvi782843EvX/g8615AKZeUYVUl0gVXujjpIVZXDtytPHINvIW1Z2mOm2rlJukwiKYYJ8IjsxlAkEA1KGbJ9EI6AOUcnpy7FYdGkbINTDngCqVOoaddlHS+1SaofpYXZPueXXIqIG3viksxmq/Q0IY6+JRkGo/RpGq7wJARD+BAqok9oYYbR4RX7P7ZxyKlYsiqnX3T2nVAP8XYZuI/6SD7a7AGyW9ryGnzcq0o8BvMS9QqbRcvqgvwgNOyQJBAL2ZVMaOSIjKGGZz9WHz74Nstj1n3CWW0vYa7vGASMc/S5s/pefbbvvzIPfQo0z3XiuXJ/ELUTmU1vIVK1L7tRUCQQCsuE7xckZ8H/523jdWWy9zZVP1z4c5dVLDR5RY+YQNForgb6kkSv4Gzn/FRUOxqn2MEWJLla31D4EuS+XKuwZR",
		},
		{
			// RSA 2048 with 0x11 as public exponent
			Enabled:    true,
			PrivateKey: "MIIEowIBAAKCAQEAyMvTanPoiorCpIQCl70qXF34FIPOkKaInr1vw+3/0nik5CDUo761E02uTrK4/8JXr5NLGmy/fQmagNsBOdKewciRB3xxs+sPNncptG4rpCBjxSJdVl+mYZaw2kdvFY7TvNTlr7qG1Q0kV/3lBgpMlyM9OqBrjuG0UUzB5hlg08KLNflkQAkoJGWNVWULi2VceP3I3QsH9uNUQkgaM9Z6rl0BaRAkobHTTvquAqqj1AlNmSh24rrIbV4hYcNnesIpG4+LDd8XfpOwTp+jUl8akF6xcRBJjiPDJGN9ety29DcCxjo2i0b+TWYU+Pex08uOeOdulsgecbIVxLUEgRHcFQIBEQKCAQBefgkjCV5fUFuYtpfO75t2ws8Ytn9TITE7pHDUrDwmz1ynlvqnaM2uuyTZvYQ8HzhSn6rfQjv+mxuH7pcqRP9qQEQ/whdjuekKkm36jjKnlsWJ8g3OSyEe3YBmuDRGYVSVGOSO7l2Rb5ih4OQ/E+fOpyvfWoz38b5EYFs/GwBjpgJG+9cdCLYKOax8WDifWkjHdrogAlE8do/QF6RZoSvhAbRkpuxYActmKU8rIORrq8dLidSjBG2aoRH+RCN4ONZ3R4iHbYF2zWfqDFdSIX64kChaOZVhtTyTnF7/1v4VF3UwByEs8hTSckFH2jW6T7RZoatpgsv5zx/roRPDBWNRAoGBAPGphQwX9GF56XVmqD9rQMD9a0FuGCNGgiFkt2OUTFKmr4rTNVE8uJqEXjQwbybTnF2iJ1ApL1zNHg0cpnpMt7ZpcWG4Bu2UsXlwBL/ZwY4Spk6tHNdTsg/wuoWRSIGNanNS6CI5EUA4cxGNUt0G+dF4LaMHZuIAU7avs+kwDMzHAoGBANS1nS8KYkPUwYlmgVPNhMDTtjvq7fgP5UFDXnlhE6rJidc/+B0p9WiRhLGWlZebn+h2fELfIgK3qc4IzCHOkar0pic2D3bNbboNQKnqFl81hg0EORTK0JJ5/K4J61l5+rZtQu3Ss1HVwDiy9SKg6F3CQj9PK0r+hjtAStFSmZxDAoGBAMcEEzciyUE3OLsJP0NJRGKylJA8jFlJH99D4lIBqEQQzMyt76xQH45O5Cr6teO9U5hna6ttNhAwcxnbW+w/LeGEAwUuI9K2sEXjx60NrnUATLlDRO2QOElc1ddolhBWV6pERrLFlbxquR2DcWq6c2E1yzr3CW7TF8OfwVagCoqFAoGBAK8sJxeuMs5y+bxyiJ9d9NsItDFYD0TBy9tkqCe5W32W6fyPCJB86Df/XjflbCKAKVYHOSgDDPMt1yIlXNCL/326arbhOeld4eSDYm3P1jBKMijWTSAujaXN3yXqDRyCkjvhgmmAV3CR6Zga5/5mZQHrRZ2MfgGGUG0HxSTanJ7NAoGBAOhZBGtFsBdtEawvCh4Z8NaMC2nU+Ru9hEsZSy6rZQrPvja9aBUk5QUdh04TYtu8PzQ1EghZy71rtwDAvxXWJ1mWcZn0kD06tZKudmZpMVXCp3SFah6DDUCFSmQ2U60yh6XOzpS2+Z97Ngi02UFph8sSQA6Dl/lmaf4bfQHCYc5Z",
		},
	}

	for i, example := range invalidExamples {
		err := example.Validate()
		require.Error(t, err, "Invalid example %d was regarded as valid", i)
	}

	validExamples := []*SAMLConfiguration{
		{
			Enabled: false,
		},
		{
			// RSA 2048
			Enabled:    true,
			PrivateKey: validPrivateKey,
		},
		{
			// RSA 3072
			Enabled:    true,
			PrivateKey: "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",
		},
		{
			// RSA 4096
			Enabled:    true,
			PrivateKey: "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",
		},
	}

	for i, example := range validExamples {
		err := example.Validate()
		require.NoError(t, err, "Valid example %d was regarded as invalid", i)
	}
}

func TestSAMLConfigurationNextKey(t *testing.T) {
	const externalURL = "https://projectref.supabase.co"

	t.Run("Absent", func(t *testing.T) {
		c := &SAMLConfiguration{
			Enabled:    true,
			PrivateKey: validPrivateKey,
		}
		require.NoError(t, c.PopulateFields(externalURL))
		require.Nil(t, c.CertificateNext)
		require.Nil(t, c.RSAPrivateKeyNext)
		require.Nil(t, c.RSAPublicKeyNext)
	})

	t.Run("Valid", func(t *testing.T) {
		c := &SAMLConfiguration{
			Enabled:        true,
			PrivateKey:     validPrivateKey,
			PrivateKeyNext: validPrivateKeyNext,
		}
		require.NoError(t, c.PopulateFields(externalURL))
		require.NotNil(t, c.RSAPrivateKeyNext)
		require.NotNil(t, c.RSAPublicKeyNext)
		require.NotNil(t, c.CertificateNext)
		require.NotEqual(t, c.Certificate.Raw, c.CertificateNext.Raw, "next cert should be distinct from primary cert")
	})

	t.Run("SameAsCurrent", func(t *testing.T) {
		c := &SAMLConfiguration{
			Enabled:        true,
			PrivateKey:     validPrivateKey,
			PrivateKeyNext: validPrivateKey,
		}
		require.NoError(t, c.Validate())
		require.NoError(t, c.PopulateFields(externalURL))
		require.NotNil(t, c.CertificateNext)
	})
}

func TestSAMLConfigurationValidateNextKey(t *testing.T) {
	invalidExamples := []*SAMLConfiguration{
		{
			Enabled:        true,
			PrivateKey:     validPrivateKey,
			PrivateKeyNext: "InvalidBase64!",
		},
		{
			Enabled:        true,
			PrivateKey:     validPrivateKey,
			PrivateKeyNext: base64.StdEncoding.EncodeToString([]byte("not PKCS#1")),
		},
		{
			Enabled:        true,
			PrivateKey:     validPrivateKey,
			PrivateKeyNext: invalidRSA1024Key,
		},
		{
			Enabled:        true,
			PrivateKey:     validPrivateKey,
			PrivateKeyNext: invalidWrongExponentKey,
		},
	}

	for i, example := range invalidExamples {
		err := example.Validate()
		require.Error(t, err, "Invalid next key example %d was regarded as valid", i)
	}
}

func TestSAMLConfigurationDeterministicCertificate(t *testing.T) {
	a := &SAMLConfiguration{
		Enabled:    true,
		PrivateKey: "MIIEowIBAAKCAQEAt7dS8iM5MsQ+1mVkNpoaUnL8BCdxSrSx8jsSnvqN/GIJ4ipqbdrTgLpFVklVTqfaa5CykGVEV577l6AWkpkm2p7SvSkCQglmyAMMjY9glmztytAnfBpm+cQ6ZVTHC4XKlUG1aJigEuXPcZUU3FiBHWEuV2huYy2bLOtIY1v9N0i2v61QCdG+SM/Yb5t86KzApRl7VyHqquge6vvRuchfF0msv/2LW32hwxg3Gt4zkAF0SJqCCcfAPZ9pQwmbdUhoX16dRFU98nyIvuR8LH/wONZe/YyywFFHDEwkFa4XEzjCEm+AD+xvK7eEu55w21xB8JKMLEBy8uRuI3bIEG4pawIDAQABAoIBADw4IT4xgYw8e4R3U7P6K2qfOjB6ZU5hkHqgFmh6JJR35ll2IdDEi9OEOzofa5EOwC/GDGH8b7xw5nM7DGsdPHko2lca3BydTE1/glvchYKJTiDOvkKVvO9d/O4+Lch/IHpwQXB5pu7K2YaXoXDgqeHhevk3yAdGabj9norDGmtGIeU/x1hialKbw6L080CdbxpjeAsM/w+G/VtwvyOKYFBYxBflRW+sS8UeclVqKRAvaXKd1JGleWzH3hFZyFI54x5LyyjPI1JyVXRjNbf8xcS6eRaN849grL1+wBxEs/lQFn4JLhAcNi912iJ3lhxvkNleXZw7B7JAM8x4wUbK7zECgYEA6SYmu3YH8XuLUfT8MMCp+ETjPkNMOJGQmTXOkW6zuXP3J8iCPIxtuz09cGIro+yJU23yPUzOVCDZMmnMWBmkoTKAFoFL9TX0Eyqn/t1MD77i3NdkMp16yI5fwOO6yX1bZgLiG00W2E5/IGgNfTtEafU/mre95JBnTgxS3sAvz8UCgYEAybjfBVt+1X0vSVAGKYHI9wtzoSx3dIGE8G5LIchPTdNDZ0ke0QCRffhyCGKy6bPos0P2z5nLgWSePBPZQowpwZiQVXdWE05ID641E2zGULdYL1yVHDt6tVTpSzTAy89BiS1G8HvgpQyaBTmvmF11Fyd/YbrDxEIHN+qQdDkM928CgYEA4lJ4ksz21QF6sqpADQtZc3lbplspqFgVp8RFq4Nsz3+00lefpSskcff2phuGBXBdtjEqTzs5pwzkCj4NcRAjcZ9WG4KTu4sOTXTA83TamwZPrtUfnMqmH/2lEdd+wI0BpjryRlJE9ODuIwUe4wwfU0QQ5B2tJizPO0JXR4gEYYkCgYBzqidm4QGm1DLq7JG79wkObmiMv/x2t1VMr1ExO7QNQdfiP1EGMjc6bdyk5kMEMf5527yHaP4BYXpBpHfs6oV+1kXcW6LlSvuS0iboznQgECDmd0WgfJJtqxRh5QuvUVWYnHeSqNU0jjc6S8tdqCjdb+5gUUCzJdERxNOzcIr4zQKBgAqcBQwlWy0PdlZ06JhJUYlwX1pOU8mWPz9LIF0wrSm9LEtAl37zZJaD3uscvk/fCixAGHOktkDGVO7aUYIAlX9iD49huGkeRTn9tz7Wanw6am04Xj0y7H1oPPV7k5nJ4s9AOWq/gkZEhrRIis2anAczsx1YHSjq/M05+AbuRzvs",
	}

	b := &SAMLConfiguration{
		Enabled:    a.Enabled,
		PrivateKey: a.PrivateKey,
	}

	err := a.PopulateFields("https://projectref.supabase.co")
	require.NoError(t, err)

	err = b.PopulateFields("https://projectref.supabase.co")
	require.NoError(t, err)

	require.Equal(t, a.Certificate.Raw, b.Certificate.Raw, "Certificate generation should be deterministic")
}

const (
	validPrivateKey = "MIIEowIBAAKCAQEAsBuxTUWFrfy0qYXaqNSeVWcJOd6TQ4+4b/3N4p/58r1d/kMU+K+BGR+tF0GKHGYngTF6puvNDff2wgW3dp3LUSMjxOhC3sK0uL90vd+IR6v1EDDGLyQNo6EjP/x5Gp/PcL2s6hZb8iLBEq4FksPnEhWqf9Nsmgf1YPJV4AvaaWe3oBFo9zJobSs3etTVitc3qEH2DpgYFtrCKhMWv5qoZtZTyZRE3LU3rvInDgYw6HDGF1G4y4Fvah6VpRmTdyMR81r1tCLmGvk61QJp7i4HteazQ6Raqh2EZ1sH/UfEp8mrwYRaRdgLDQ/Q6/YlO8NTQwzp6YwwAybhMBnOrABLCQIDAQABAoIBADqobq0DPByQsIhKmmNjtn1RvYP1++0kANXknuAeUv2kT5tyMpkGtCRvJZM6dEszR3NDzMuufPVrI1jK2Kn8sw0KfE6I4kUaa2Gh+7uGqfjdcNn8tPZctuJKuNgGOzxAALNXqjGqUuPa6Z5UMm0JLX0blFfRTzoa7oNlFG9040H6CRjJQQGfYyPS8xeo+RUR009sK/222E5jz6ThIiCrOU/ZGm5Ws9y3AAIASqJd9QPy7qxKoFZ1qKZ/cDaf1txCKq9VBXH6ypZoU1dQibhyLCIJ3tYapBtV4p8V12oHhITXb6Vbo1P9bQSVz+2rQ0nJkjdXX/N4aHE01ecbu8MpMxUCgYEA5P4ZCAdpkTaOSJi7GyL4AcZ5MN26eifFnRO/tbmw07f6vi//vdqzC9T7kxmZ8e1OvhX5OMGNb3nsXm78WgS2EVLTkaTInG6XhlOeYj9BHAQZDBr7rcAxrVQxVgaGDiZpYun++kXw+39iq3gxuYuC9mM0AQze3SjTRIM9WWXJSqMCgYEAxODfXcWMk2P/WfjE3u+8fhjc3cvqyWSyThEZC9YzpN59dL73SE7BRkMDyZO19fFvVO9mKsRfsTio0ceC5XQOO6hUxAm4gAEvMpeapQgXTxIxF5FAQ0vGmBMxT+xg7lX8HTTJX/UCttKo3BdIJQeTf8bKVzJCoLFh8Rcv5qI6umMCgYAEuj44DTcfuVmcpBKQz9sA5mEQIjO8W9/Xi1XU4Z2F8XFqxcDo4X/6yY3cDpZACV8ry3ZWtqA94e2AUZhCH4DGwMf/ZMCDgkD8k/NcIeQtOORvfIsfni0oX+mY1g+kcSSR1zTdY95CwvF9isC0DO5KOegT8XkUZchezLrSgqhyMwKBgQCvS0mWRH6V/UMu6MDhfrNl0t1U3mt+RZo8yBx03ZO+CBvMBvxF9VlBJgoJQOuSwBVQmpdtHMvXD4vAvNNfWaYSmB5hLgaIcoWDlliq+DlIvfnX8gw13xJD9VLCxsTHcOe5WXazaYOxJIAU9uXVkplR+73NRYLtcQKzluGfiHKh4QKBgFpPtOqcAbkMsV+1qPYvvvX7E4+l52Odb4tbxGBYV8tzCqMRETqMPVxFWwsj+EQ8lyAu15rCRH7DKHVK5zL6JvIZEjt0tptKqSL2o3ovS6y3DmD6t+YpvjKME7a+vunOoJWe9pWl3wZmodfyZMpAdDLvDGhPR7Jlhun41tbMMaQF"

	// A second valid RSA 2048 key used to test the "next key" rotation feature.
	// This is the key used in TestSAMLConfigurationDeterministicCertificate.
	validPrivateKeyNext = "MIIEowIBAAKCAQEAt7dS8iM5MsQ+1mVkNpoaUnL8BCdxSrSx8jsSnvqN/GIJ4ipqbdrTgLpFVklVTqfaa5CykGVEV577l6AWkpkm2p7SvSkCQglmyAMMjY9glmztytAnfBpm+cQ6ZVTHC4XKlUG1aJigEuXPcZUU3FiBHWEuV2huYy2bLOtIY1v9N0i2v61QCdG+SM/Yb5t86KzApRl7VyHqquge6vvRuchfF0msv/2LW32hwxg3Gt4zkAF0SJqCCcfAPZ9pQwmbdUhoX16dRFU98nyIvuR8LH/wONZe/YyywFFHDEwkFa4XEzjCEm+AD+xvK7eEu55w21xB8JKMLEBy8uRuI3bIEG4pawIDAQABAoIBADw4IT4xgYw8e4R3U7P6K2qfOjB6ZU5hkHqgFmh6JJR35ll2IdDEi9OEOzofa5EOwC/GDGH8b7xw5nM7DGsdPHko2lca3BydTE1/glvchYKJTiDOvkKVvO9d/O4+Lch/IHpwQXB5pu7K2YaXoXDgqeHhevk3yAdGabj9norDGmtGIeU/x1hialKbw6L080CdbxpjeAsM/w+G/VtwvyOKYFBYxBflRW+sS8UeclVqKRAvaXKd1JGleWzH3hFZyFI54x5LyyjPI1JyVXRjNbf8xcS6eRaN849grL1+wBxEs/lQFn4JLhAcNi912iJ3lhxvkNleXZw7B7JAM8x4wUbK7zECgYEA6SYmu3YH8XuLUfT8MMCp+ETjPkNMOJGQmTXOkW6zuXP3J8iCPIxtuz09cGIro+yJU23yPUzOVCDZMmnMWBmkoTKAFoFL9TX0Eyqn/t1MD77i3NdkMp16yI5fwOO6yX1bZgLiG00W2E5/IGgNfTtEafU/mre95JBnTgxS3sAvz8UCgYEAybjfBVt+1X0vSVAGKYHI9wtzoSx3dIGE8G5LIchPTdNDZ0ke0QCRffhyCGKy6bPos0P2z5nLgWSePBPZQowpwZiQVXdWE05ID641E2zGULdYL1yVHDt6tVTpSzTAy89BiS1G8HvgpQyaBTmvmF11Fyd/YbrDxEIHN+qQdDkM928CgYEA4lJ4ksz21QF6sqpADQtZc3lbplspqFgVp8RFq4Nsz3+00lefpSskcff2phuGBXBdtjEqTzs5pwzkCj4NcRAjcZ9WG4KTu4sOTXTA83TamwZPrtUfnMqmH/2lEdd+wI0BpjryRlJE9ODuIwUe4wwfU0QQ5B2tJizPO0JXR4gEYYkCgYBzqidm4QGm1DLq7JG79wkObmiMv/x2t1VMr1ExO7QNQdfiP1EGMjc6bdyk5kMEMf5527yHaP4BYXpBpHfs6oV+1kXcW6LlSvuS0iboznQgECDmd0WgfJJtqxRh5QuvUVWYnHeSqNU0jjc6S8tdqCjdb+5gUUCzJdERxNOzcIr4zQKBgAqcBQwlWy0PdlZ06JhJUYlwX1pOU8mWPz9LIF0wrSm9LEtAl37zZJaD3uscvk/fCixAGHOktkDGVO7aUYIAlX9iD49huGkeRTn9tz7Wanw6am04Xj0y7H1oPPV7k5nJ4s9AOWq/gkZEhrRIis2anAczsx1YHSjq/M05+AbuRzvs"

	// RSA 1024 key — too short, used to verify rejection.
	invalidRSA1024Key = "MIICXQIBAAKBgQDFa3SgzWZpcoONv3Iq3FxNieks2u2TmykxxxeggI9aNpHpuCzwGQO8wqXGVvFNlkE3GSPcz7rklzfyj577Z47lfWdBP1OAefralA3tS2mafqpZ32JwDynX4as+xauLVdP4iOR96b3L2eOb6rDpr4wBJuNqO533xsjcbNPINEDkSwIDAQABAoGASggBtEtSHDjVHFKufWQlOO5+glOWw8Nrrz75nTaYizvre7mVIHRA8ogLolT4KCAwVHkY+bTsYMxULqGs/JnY+40suHECYQ2u76PTQlvJnhJANGtCxuV4lSK6B8QBJhjGExsnAOwMMKz0p5kVftx2GA+/Rz2De7DR9keNECjcAAECQQDtr5cdkEdnIffvi782843EvX/g8615AKZeUYVUl0gVXujjpIVZXDtytPHINvIW1Z2mOm2rlJukwiKYYJ8IjsxlAkEA1KGbJ9EI6AOUcnpy7FYdGkbINTDngCqVOoaddlHS+1SaofpYXZPueXXIqIG3viksxmq/Q0IY6+JRkGo/RpGq7wJARD+BAqok9oYYbR4RX7P7ZxyKlYsiqnX3T2nVAP8XYZuI/6SD7a7AGyW9ryGnzcq0o8BvMS9QqbRcvqgvwgNOyQJBAL2ZVMaOSIjKGGZz9WHz74Nstj1n3CWW0vYa7vGASMc/S5s/pefbbvvzIPfQo0z3XiuXJ/ELUTmU1vIVK1L7tRUCQQCsuE7xckZ8H/523jdWWy9zZVP1z4c5dVLDR5RY+YQNForgb6kkSv4Gzn/FRUOxqn2MEWJLla31D4EuS+XKuwZR"

	// RSA 2048 with public exponent 0x11 instead of 0x10001 — used to verify exponent check.
	invalidWrongExponentKey = "MIIEowIBAAKCAQEAyMvTanPoiorCpIQCl70qXF34FIPOkKaInr1vw+3/0nik5CDUo761E02uTrK4/8JXr5NLGmy/fQmagNsBOdKewciRB3xxs+sPNncptG4rpCBjxSJdVl+mYZaw2kdvFY7TvNTlr7qG1Q0kV/3lBgpMlyM9OqBrjuG0UUzB5hlg08KLNflkQAkoJGWNVWULi2VceP3I3QsH9uNUQkgaM9Z6rl0BaRAkobHTTvquAqqj1AlNmSh24rrIbV4hYcNnesIpG4+LDd8XfpOwTp+jUl8akF6xcRBJjiPDJGN9ety29DcCxjo2i0b+TWYU+Pex08uOeOdulsgecbIVxLUEgRHcFQIBEQKCAQBefgkjCV5fUFuYtpfO75t2ws8Ytn9TITE7pHDUrDwmz1ynlvqnaM2uuyTZvYQ8HzhSn6rfQjv+mxuH7pcqRP9qQEQ/whdjuekKkm36jjKnlsWJ8g3OSyEe3YBmuDRGYVSVGOSO7l2Rb5ih4OQ/E+fOpyvfWoz38b5EYFs/GwBjpgJG+9cdCLYKOax8WDifWkjHdrogAlE8do/QF6RZoSvhAbRkpuxYActmKU8rIORrq8dLidSjBG2aoRH+RCN4ONZ3R4iHbYF2zWfqDFdSIX64kChaOZVhtTyTnF7/1v4VF3UwByEs8hTSckFH2jW6T7RZoatpgsv5zx/roRPDBWNRAoGBAPGphQwX9GF56XVmqD9rQMD9a0FuGCNGgiFkt2OUTFKmr4rTNVE8uJqEXjQwbybTnF2iJ1ApL1zNHg0cpnpMt7ZpcWG4Bu2UsXlwBL/ZwY4Spk6tHNdTsg/wuoWRSIGNanNS6CI5EUA4cxGNUt0G+dF4LaMHZuIAU7avs+kwDMzHAoGBANS1nS8KYkPUwYlmgVPNhMDTtjvq7fgP5UFDXnlhE6rJidc/+B0p9WiRhLGWlZebn+h2fELfIgK3qc4IzCHOkar0pic2D3bNbboNQKnqFl81hg0EORTK0JJ5/K4J61l5+rZtQu3Ss1HVwDiy9SKg6F3CQj9PK0r+hjtAStFSmZxDAoGBAMcEEzciyUE3OLsJP0NJRGKylJA8jFlJH99D4lIBqEQQzMyt76xQH45O5Cr6teO9U5hna6ttNhAwcxnbW+w/LeGEAwUuI9K2sEXjx60NrnUATLlDRO2QOElc1ddolhBWV6pERrLFlbxquR2DcWq6c2E1yzr3CW7TF8OfwVagCoqFAoGBAK8sJxeuMs5y+bxyiJ9d9NsItDFYD0TBy9tkqCe5W32W6fyPCJB86Df/XjflbCKAKVYHOSgDDPMt1yIlXNCL/326arbhOeld4eSDYm3P1jBKMijWTSAujaXN3yXqDRyCkjvhgmmAV3CR6Zga5/5mZQHrRZ2MfgGGUG0HxSTanJ7NAoGBAOhZBGtFsBdtEawvCh4Z8NaMC2nU+Ru9hEsZSy6rZQrPvja9aBUk5QUdh04TYtu8PzQ1EghZy71rtwDAvxXWJ1mWcZn0kD06tZKudmZpMVXCp3SFah6DDUCFSmQ2U60yh6XOzpS2+Z97Ngi02UFph8sSQA6Dl/lmaf4bfQHCYc5Z"
)
