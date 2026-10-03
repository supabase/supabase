package crypto

import (
	"context"
	"strings"
	"testing"

	"github.com/stretchr/testify/assert"
)

func TestArgon2(t *testing.T) {
	// all of these hash the `test` string with various parameters

	examples := []string{
		"$argon2i$v=19$m=16,t=2,p=1$bGJRWThNOHJJTVBSdHl2dQ$NfEnUOuUpb7F2fQkgFUG4g",
		"$argon2id$v=19$m=32,t=3,p=2$SFVpOWJ0eXhjRzVkdGN1RQ$RXnb8rh7LaDcn07xsssqqulZYXOM/EUCEFMVcAcyYVk",
	}

	for _, example := range examples {
		assert.NoError(t, CompareHashAndPassword(context.Background(), example, "test"))
	}

	for _, example := range examples {
		assert.Error(t, CompareHashAndPassword(context.Background(), example, "test1"))
	}

	negativeExamples := []string{
		// 2d
		"$argon2d$v=19$m=16,t=2,p=1$bGJRWThNOHJJTVBSdHl2dQ$NfEnUOuUpb7F2fQkgFUG4g",
		// v=16
		"$argon2id$v=16$m=16,t=2,p=1$bGJRWThNOHJJTVBSdHl2dQ$NfEnUOuUpb7F2fQkgFUG4g",
		// data
		"$argon2id$v=19$m=16,t=2,p=1,data=abc$bGJRWThNOHJJTVBSdHl2dQ$NfEnUOuUpb7F2fQkgFUG4g",
		// keyid
		"$argon2id$v=19$m=16,t=2,p=1,keyid=abc$bGJRWThNOHJJTVBSdHl2dQ$NfEnUOuUpb7F2fQkgFUG4g",
		// m larger than 32 bits
		"$argon2id$v=19$m=4294967297,t=2,p=1$bGJRWThNOHJJTVBSdHl2dQ$NfEnUOuUpb7F2fQkgFUG4g",
		// m exceeds the 1 GiB limit
		"$argon2id$v=19$m=1048577,t=2,p=1$bGJRWThNOHJJTVBSdHl2dQ$NfEnUOuUpb7F2fQkgFUG4g",
		// t larger than 32 bits
		"$argon2id$v=19$m=16,t=4294967297,p=1$bGJRWThNOHJJTVBSdHl2dQ$NfEnUOuUpb7F2fQkgFUG4g",
		// t exceeds the limit of 20
		"$argon2id$v=19$m=16,t=21,p=1$bGJRWThNOHJJTVBSdHl2dQ$NfEnUOuUpb7F2fQkgFUG4g",
		// p larger than 8 bits
		"$argon2id$v=19$m=16,t=2,p=256$bGJRWThNOHJJTVBSdHl2dQ$NfEnUOuUpb7F2fQkgFUG4g",
		// p exceeds the limit of 16
		"$argon2id$v=19$m=16,t=2,p=17$bGJRWThNOHJJTVBSdHl2dQ$NfEnUOuUpb7F2fQkgFUG4g",
		// argon2 prefix but not a well-formed argon2 hash
		"$argon2id$v=19$m=16,t=2",
		// salt not Base64
		"$argon2id$v=19$m=16,t=2,p=1$!!!$NfEnUOuUpb7F2fQkgFUG4g",
		// hash not Base64
		"$argon2id$v=19$m=16,t=2,p=1$bGJRWThNOHJJTVBSdHl2dQ$!!!",
		// salt empty
		"$argon2id$v=19$m=16,t=2,p=1$$NfEnUOuUpb7F2fQkgFUG4g",
		// hash empty
		"$argon2id$v=19$m=16,t=2,p=1$bGJRWThNOHJJTVBSdHl2dQ$",
	}

	for _, example := range negativeExamples {
		assert.Error(t, CompareHashAndPassword(context.Background(), example, "test"))
	}
}

func TestGeneratePassword(t *testing.T) {
	tests := []struct {
		name          string
		requiredChars []string
		length        int
	}{
		{
			name:          "Valid password generation",
			requiredChars: []string{"ABC", "123", "@#$"},
			length:        12,
		},
		{
			name:          "Empty required chars",
			requiredChars: []string{},
			length:        8,
		},
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			got := GeneratePassword(tt.requiredChars, tt.length)

			if len(got) != tt.length {
				t.Errorf("GeneratePassword() returned password of length %d, want %d", len(got), tt.length)
			}

			// Check if all required characters are present
			for _, chars := range tt.requiredChars {
				found := false
				for _, c := range got {
					if strings.ContainsRune(chars, c) {
						found = true
						break
					}
				}
				if !found && len(chars) > 0 {
					t.Errorf("GeneratePassword() missing required character from set %s", chars)
				}
			}
		})
	}

	// Check for duplicates passwords
	passwords := make(map[string]bool)
	for i := 0; i < 30; i++ {
		p := GeneratePassword([]string{"ABC", "123", "@#$"}, 30)

		if passwords[p] {
			t.Errorf("GeneratePassword() generated duplicate password: %s", p)
		}
		passwords[p] = true
	}
}

func TestFirebaseScrypt(t *testing.T) {
	// all of these use the `mytestpassword` string as the valid one

	examples := []string{
		"$fbscrypt$v=1,n=14,r=8,p=1,ss=Bw==,sk=ou9tdYTGyYm8kuR6Dt0Bp0kDuAYoXrK16mbZO4yGwAn3oLspjnN0/c41v8xZnO1n14J3MjKj1b2g6AUCAlFwMw==$C0sHCg9ek77hsg==$zKVTMvnWVw5BBOZNUdnsalx4c4c7y/w7IS5p6Ut2+CfEFFlz37J9huyQfov4iizN8dbjvEJlM5tQaJP84+hfTw==",
	}

	for _, example := range examples {
		assert.NoError(t, CompareHashAndPassword(context.Background(), example, "mytestpassword"))
	}

	for _, example := range examples {
		assert.Error(t, CompareHashAndPassword(context.Background(), example, "mytestpassword1"))
	}

	negativeExamples := []string{
		// v not 1
		"$fbscrypt$v=2,n=14,r=8,p=1,ss=Bw==,sk=ou9tdYTGyYm8kuR6Dt0Bp0kDuAYoXrK16mbZO4yGwAn3oLspjnN0/c41v8xZnO1n14J3MjKj1b2g6AUCAlFwMw==$C0sHCg9ek77hsg==$zKVTMvnWVw5BBOZNUdnsalx4c4c7y/w7IS5p6Ut2+CfEFFlz37J9huyQfov4iizN8dbjvEJlM5tQaJP84+hfTw==",
		// n not 32 bits
		"$fbscrypt$v=1,n=4294967297,r=8,p=1,ss=Bw==,sk=ou9tdYTGyYm8kuR6Dt0Bp0kDuAYoXrK16mbZO4yGwAn3oLspjnN0/c41v8xZnO1n14J3MjKj1b2g6AUCAlFwMw==$C0sHCg9ek77hsg==$zKVTMvnWVw5BBOZNUdnsalx4c4c7y/w7IS5p6Ut2+CfEFFlz37J9huyQfov4iizN8dbjvEJlM5tQaJP84+hfTw==",
		// n is 0
		"$fbscrypt$v=1,n=0,r=8,p=1,ss=Bw==,sk=ou9tdYTGyYm8kuR6Dt0Bp0kDuAYoXrK16mbZO4yGwAn3oLspjnN0/c41v8xZnO1n14J3MjKj1b2g6AUCAlFwMw==$C0sHCg9ek77hsg==$zKVTMvnWVw5BBOZNUdnsalx4c4c7y/w7IS5p6Ut2+CfEFFlz37J9huyQfov4iizN8dbjvEJlM5tQaJP84+hfTw==",
		// rounds is not 64 bits
		"$fbscrypt$v=1,n=14,r=18446744073709551617,p=1,ss=Bw==,sk=ou9tdYTGyYm8kuR6Dt0Bp0kDuAYoXrK16mbZO4yGwAn3oLspjnN0/c41v8xZnO1n14J3MjKj1b2g6AUCAlFwMw==$C0sHCg9ek77hsg==$zKVTMvnWVw5BBOZNUdnsalx4c4c7y/w7IS5p6Ut2+CfEFFlz37J9huyQfov4iizN8dbjvEJlM5tQaJP84+hfTw==",
		// rounds is 0
		"$fbscrypt$v=1,n=14,r=0,p=1,ss=Bw==,sk=ou9tdYTGyYm8kuR6Dt0Bp0kDuAYoXrK16mbZO4yGwAn3oLspjnN0/c41v8xZnO1n14J3MjKj1b2g6AUCAlFwMw==$C0sHCg9ek77hsg==$zKVTMvnWVw5BBOZNUdnsalx4c4c7y/w7IS5p6Ut2+CfEFFlz37J9huyQfov4iizN8dbjvEJlM5tQaJP84+hfTw==",
		// threads is not 8 bits
		"$fbscrypt$v=1,n=14,r=8,p=256,ss=Bw==,sk=ou9tdYTGyYm8kuR6Dt0Bp0kDuAYoXrK16mbZO4yGwAn3oLspjnN0/c41v8xZnO1n14J3MjKj1b2g6AUCAlFwMw==$C0sHCg9ek77hsg==$zKVTMvnWVw5BBOZNUdnsalx4c4c7y/w7IS5p6Ut2+CfEFFlz37J9huyQfov4iizN8dbjvEJlM5tQaJP84+hfTw==",
		// threads is 0
		"$fbscrypt$v=1,n=14,r=8,p=0,ss=Bw==,sk=ou9tdYTGyYm8kuR6Dt0Bp0kDuAYoXrK16mbZO4yGwAn3oLspjnN0/c41v8xZnO1n14J3MjKj1b2g6AUCAlFwMw==$C0sHCg9ek77hsg==$zKVTMvnWVw5BBOZNUdnsalx4c4c7y/w7IS5p6Ut2+CfEFFlz37J9huyQfov4iizN8dbjvEJlM5tQaJP84+hfTw==",
		// hash is not base64
		"$fbscrypt$v=1,n=14,r=8,p=1,ss=Bw==,sk=ou9tdYTGyYm8kuR6Dt0Bp0kDuAYoXrK16mbZO4yGwAn3oLspjnN0/c41v8xZnO1n14J3MjKj1b2g6AUCAlFwMw==$C0sHCg9ek77hsg==$!!!",
		// salt is not base64
		"$fbscrypt$v=1,n=14,r=8,p=1,ss=Bw==,sk=ou9tdYTGyYm8kuR6Dt0Bp0kDuAYoXrK16mbZO4yGwAn3oLspjnN0/c41v8xZnO1n14J3MjKj1b2g6AUCAlFwMw==$!!!$zKVTMvnWVw5BBOZNUdnsalx4c4c7y/w7IS5p6Ut2+CfEFFlz37J9huyQfov4iizN8dbjvEJlM5tQaJP84+hfTw==",
		// signer key is not base64
		"$fbscrypt$v=1,n=14,r=8,p=1,ss=Bw==,sk=!!!$C0sHCg9ek77hsg==$zKVTMvnWVw5BBOZNUdnsalx4c4c7y/w7IS5p6Ut2+CfEFFlz37J9huyQfov4iizN8dbjvEJlM5tQaJP84+hfTw==",
		// salt separator is not base64
		"$fbscrypt$v=1,n=14,r=8,p=1,ss=!!!,sk=ou9tdYTGyYm8kuR6Dt0Bp0kDuAYoXrK16mbZO4yGwAn3oLspjnN0/c41v8xZnO1n14J3MjKj1b2g6AUCAlFwMw==$C0sHCg9ek77hsg==$zKVTMvnWVw5BBOZNUdnsalx4c4c7y/w7IS5p6Ut2+CfEFFlz37J9huyQfov4iizN8dbjvEJlM5tQaJP84+hfTw==",
	}

	for _, example := range negativeExamples {
		assert.Error(t, CompareHashAndPassword(context.Background(), example, "mytestpassword"))
	}
}

func TestBcrypt(t *testing.T) {
	// all use the `test` password

	examples := []string{
		"$2y$04$mIJxfrCaEI3GukZe11CiXublhEFanu5.ododkll1WphfSp6pn4zIu",
		"$2y$10$srNl09aPtc2qr.0Vl.NtjekJRt/NxRxYQm3qd3OvfcKsJgVnr6.Ve",
	}

	for _, example := range examples {
		assert.NoError(t, CompareHashAndPassword(context.Background(), example, "test"))
	}

	for _, example := range examples {
		assert.Error(t, CompareHashAndPassword(context.Background(), example, "test1"))
	}

	negativeExamples := []string{
		"not-a-hash",
	}
	for _, example := range negativeExamples {
		assert.Error(t, CompareHashAndPassword(context.Background(), example, "test"))
	}
}
