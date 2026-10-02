defmodule Realtime.CryptoTest do
  use ExUnit.Case, async: true

  alias Realtime.Crypto

  describe "encrypt!/2 and decrypt!/1" do
    test "round-trips a GCM value" do
      assert Crypto.decrypt!(Crypto.encrypt!("my-super-secret-jwt-value", cipher: :gcm)) ==
               "my-super-secret-jwt-value"
    end

    test "round-trips a legacy ECB value" do
      assert Crypto.decrypt!(Crypto.encrypt!("my-super-secret-jwt-value", cipher: :ecb)) ==
               "my-super-secret-jwt-value"
    end

    test "round-trips ECB values of every block-boundary length" do
      for length <- [1, 15, 16, 17, 28, 29, 31, 32, 33, 48] do
        plaintext = String.duplicate("a", length)
        assert Crypto.decrypt!(Crypto.encrypt!(plaintext, cipher: :ecb)) == plaintext
      end
    end

    test "defaults to GCM when :db_enc_write_gcm is set" do
      assert Crypto.write_gcm?()
      assert Crypto.gcm?(Crypto.encrypt!("my-secret"))
    end

    test "GCM is non-deterministic - a fresh random IV is used every call" do
      refute Crypto.encrypt!("my-secret", cipher: :gcm) == Crypto.encrypt!("my-secret", cipher: :gcm)
    end

    test "tampering with a GCM ciphertext or tag is rejected" do
      "g1:" <> encoded = Crypto.encrypt!("my-secret", cipher: :gcm)
      <<iv::binary-12, tag::binary-16, ciphertext::binary>> = Base.decode64!(encoded)
      tampered = "g1:" <> Base.encode64(<<iv::binary, tag::binary, "x", ciphertext::binary>>)

      assert_raise RuntimeError, ~r/GCM decryption failed/, fn -> Crypto.decrypt!(tampered) end
    end
  end

  describe "gcm?/1" do
    test "distinguishes GCM from legacy ciphertext by prefix" do
      assert Crypto.gcm?(Crypto.encrypt!("my-secret", cipher: :gcm))
      refute Crypto.gcm?(Crypto.encrypt!("my-secret", cipher: :ecb))
    end

    test "no legacy ciphertext can carry the prefix - `:` is not in the base64 alphabet" do
      for length <- 1..64 do
        refute Crypto.gcm?(Crypto.encrypt!(String.duplicate("a", length), cipher: :ecb))
      end
    end
  end

  describe "re_encrypt!/1" do
    test "moves a legacy value to GCM, preserving the plaintext" do
      legacy = Crypto.encrypt!("my-secret", cipher: :ecb)
      migrated = Crypto.re_encrypt!(legacy)

      assert Crypto.gcm?(migrated)
      assert Crypto.decrypt!(migrated) == "my-secret"
    end

    test "is a no-op on plaintext for an already-GCM value" do
      assert "my-secret" |> Crypto.encrypt!(cipher: :gcm) |> Crypto.re_encrypt!() |> Crypto.decrypt!() ==
               "my-secret"
    end
  end

  describe "re_encrypt_settings!/2" do
    test "re-encrypts only the given keys" do
      settings = %{"db_password" => Crypto.encrypt!("pass", cipher: :ecb), "region" => "us-east-1"}

      assert %{"db_password" => password, "region" => "us-east-1"} =
               Crypto.re_encrypt_settings!(settings, ["db_password"])

      assert Crypto.gcm?(password)
      assert Crypto.decrypt!(password) == "pass"
    end

    test "leaves keys absent from settings untouched" do
      assert Crypto.re_encrypt_settings!(%{"region" => "us-east-1"}, ["db_password"]) == %{
               "region" => "us-east-1"
             }
    end
  end

  describe "legacy_settings?/2" do
    test "is true when any given key still holds legacy ciphertext" do
      settings = %{
        "db_password" => Crypto.encrypt!("pass", cipher: :gcm),
        "db_user" => Crypto.encrypt!("user", cipher: :ecb)
      }

      assert Crypto.legacy_settings?(settings, ["db_password", "db_user"])
      refute Crypto.legacy_settings?(settings, ["db_password"])
    end

    test "ignores keys absent from settings" do
      refute Crypto.legacy_settings?(%{"region" => "us-east-1"}, ["db_password"])
    end
  end
end
