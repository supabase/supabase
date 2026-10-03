package crypto

import (
	"testing"

	mrand "math/rand"

	"github.com/gofrs/uuid"
	"github.com/stretchr/testify/assert"
)

func TestGenerateOtp(t *testing.T) {

	// Lock in current behavior.
	{
		mr := mrand.New(mrand.NewSource(0)) // #nosec G404
		tests := []struct {
			digits int
			exp    string
		}{
			{1, "1"}, {1, "4"}, {1, "2"}, {1, "0"},
			{2, "65"}, {2, "83"}, {2, "18"}, {2, "04"},
			{3, "883"}, {3, "110"}, {3, "677"}, {3, "744"},
			{4, "6157"}, {4, "8369"}, {4, "3385"}, {4, "1617"},
			{5, "69588"}, {5, "96393"}, {5, "57989"}, {5, "57681"},
			{6, "284024"}, {6, "554454"}, {6, "975571"}, {6, "053470"},
			{7, "7076089"}, {7, "6287428"}, {7, "3903112"}, {7, "3915653"},
			{8, "44800453"}, {8, "38979394"}, {8, "70448040"}, {8, "29351463"},
			{9, "526897122"}, {9, "047135939"}, {9, "351530466"}, {9, "381602894"},
			{10, "6834743966"}, {10, "2026285792"}, {10, "7189110983"}, {10, "4023217386"},
		}
		for idx, test := range tests {
			t.Logf("test #%02d - exp %v using %v digits", idx, test.exp, test.digits)
			otp := generateOtp(mr, test.digits)
			assert.Equal(t, test.digits, len(otp))
			assert.Equal(t, test.exp, otp)
		}
	}

	// and some heavily zero padded values
	{
		tests := []struct {
			digits int
			exp    string
			seed   int64
		}{
			{4, "0009", 5},
			{4, "0072", 133},
			{4, "0040", 203},
			{4, "0095", 551},
			{5, "00061", 248},
			{5, "00056", 977},
			{5, "00013", 981},
			{5, "00038", 2504},
			{6, "000056", 977},
			{6, "000094", 21852},
			{6, "000099", 30190},
			{6, "000012", 32646},
			{8, "00000374", 15749},
			{8, "00000995", 198113},
			{8, "00000271", 213316},
			{8, "00000612", 226219},
			{10, "0058477947", 1},
			{10, "0018825892", 79},
			{10, "0039133437", 148},
			{10, "0004026570", 248},
			{10, "0000007968", 1380744},
		}
		for idx, test := range tests {
			t.Logf("test #%02d - exp %v using %v digits (seed: %v)",
				idx, test.exp, test.digits, test.seed)
			mr := mrand.New(mrand.NewSource(test.seed)) // #nosec G404
			otp := generateOtp(mr, test.digits)
			assert.Equal(t, test.digits, len(otp))
			assert.Equal(t, test.exp, otp)
		}
	}
}

func TestEncryptedStringPositive(t *testing.T) {
	id := uuid.Must(uuid.NewV4()).String()

	es, err := NewEncryptedString(id, []byte("data"), "key-id", "pwFoiPyybQMqNmYVN0gUnpbfpGQV2sDv9vp0ZAxi_Y4")
	assert.NoError(t, err)

	assert.Equal(t, es.KeyID, "key-id")
	assert.Equal(t, es.Algorithm, "aes-gcm-hkdf")
	assert.Len(t, es.Data, 20)
	assert.Len(t, es.Nonce, 12)

	dec := ParseEncryptedString(es.String())

	assert.NotNil(t, dec)
	assert.Equal(t, dec.Algorithm, "aes-gcm-hkdf")
	assert.Len(t, dec.Data, 20)
	assert.Len(t, dec.Nonce, 12)

	decrypted, err := dec.Decrypt(id, map[string]string{
		"key-id": "pwFoiPyybQMqNmYVN0gUnpbfpGQV2sDv9vp0ZAxi_Y4",
	})

	assert.NoError(t, err)
	assert.Equal(t, []byte("data"), decrypted)
}

func TestParseEncryptedStringNegative(t *testing.T) {
	negativeExamples := []string{
		"not-an-encrypted-string",
		// not json
		"{{",
		// not parsable json
		`{"key_id":1}`,
		`{"alg":1}`,
		`{"data":"!!!"}`,
		`{"nonce":"!!!"}`,
		// not valid
		`{}`,
		`{"key_id":"key_id"}`,
		`{"key_id":"key_id","alg":"different","data":"AQAB=","nonce":"AQAB="}`,
	}

	for _, example := range negativeExamples {
		assert.Nil(t, ParseEncryptedString(example))
	}
}

func TestEncryptedStringDecryptNegative(t *testing.T) {
	id := uuid.Must(uuid.NewV4()).String()

	// short key
	_, err := NewEncryptedString(id, []byte("data"), "key-id", "short_key")
	assert.Error(t, err)

	// not base64
	_, err = NewEncryptedString(id, []byte("data"), "key-id", "!!!")
	assert.Error(t, err)

	es, err := NewEncryptedString(id, []byte("data"), "key-id", "pwFoiPyybQMqNmYVN0gUnpbfpGQV2sDv9vp0ZAxi_Y4")
	assert.NoError(t, err)

	dec := ParseEncryptedString(es.String())
	assert.NotNil(t, dec)

	_, err = dec.Decrypt(id, map[string]string{
		// empty map
	})
	assert.Error(t, err)

	// short key
	_, err = dec.Decrypt(id, map[string]string{
		"key-id": "AQAB",
	})
	assert.Error(t, err)

	// key not base64
	_, err = dec.Decrypt(id, map[string]string{
		"key-id": "!!!",
	})
	assert.Error(t, err)

	// bad key
	_, err = dec.Decrypt(id, map[string]string{
		"key-id": "xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx",
	})
	assert.Error(t, err)

	// bad tag for AEAD failure
	dec.Data[len(dec.Data)-1] += 1

	_, err = dec.Decrypt(id, map[string]string{
		"key-id": "pwFoiPyybQMqNmYVN0gUnpbfpGQV2sDv9vp0ZAxi_Y4",
	})
	assert.Error(t, err)
}

func TestSecureToken(t *testing.T) {
	assert.Equal(t, len(SecureAlphanumeric(22)), 22)
	assert.Equal(t, len(SecureAlphanumeric(7)), 8)
}
