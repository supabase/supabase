defmodule Realtime.Crypto do
  @moduledoc """
  Encrypt and decrypt operations required by Realtime.

  AES-256-GCM ciphertext carries a `"g1:"` prefix, legacy AES-128-ECB ciphertext is bare base64.
  `:` is not in the base64 alphabet, so `decrypt!/1` picks the cipher from the value itself.

  New writes use GCM when `:db_enc_write_gcm` is set; `Realtime.Tenants.EncryptionReconciler`
  re-encrypts legacy values in place. Once nothing is on ECB, the ECB branch and `:db_enc_key` go.
  """

  require Logger

  @gcm_prefix "g1:"

  @type cipher :: :gcm | :ecb

  @doc """
  Encrypts the given text. Uses `:db_enc_write_gcm` to pick the cipher unless `:cipher` is given.
  """
  @spec encrypt!(binary(), [{:cipher, cipher()}]) :: binary()
  def encrypt!(text, opts \\ []) do
    case Keyword.get(opts, :cipher, default_cipher()) do
      :gcm -> encrypt_gcm!(text)
      :ecb -> encrypt_ecb!(text)
    end
  end

  @doc """
  Decrypts ciphertext produced by `encrypt!/2`, dispatching on the `"g1:"` prefix.
  """
  @spec decrypt!(binary()) :: binary()
  def decrypt!(@gcm_prefix <> base64_text), do: decrypt_gcm!(base64_text)
  def decrypt!(base64_text), do: decrypt_ecb!(base64_text)

  @doc """
  Whether the given ciphertext is AES-256-GCM.
  """
  @spec gcm?(binary()) :: boolean()
  def gcm?(@gcm_prefix <> _), do: true
  def gcm?(ciphertext) when is_binary(ciphertext), do: false

  @doc """
  Whether new writes should use AES-256-GCM. False when no GCM key is configured, so a self-hosted
  deployment without `DB_ENC_KEY_GCM` keeps working on the legacy cipher instead of failing.
  """
  @spec write_gcm?() :: boolean()
  def write_gcm?, do: gcm_requested?() and not is_nil(gcm_key())

  @doc """
  Logs a warning when GCM writes are asked for but no GCM key is configured, since the result is a
  silent fallback to the legacy cipher. Called once at boot.
  """
  @spec check_config() :: :ok
  def check_config do
    if gcm_requested?() and is_nil(gcm_key()),
      do: Logger.warning("DB_ENC_WRITE_GCM is set but DB_ENC_KEY_GCM is missing, continuing with AES-128-ECB")

    :ok
  end

  @doc """
  Re-encrypts a ciphertext as AES-256-GCM, whichever cipher it currently uses.
  """
  @spec re_encrypt!(binary()) :: binary()
  def re_encrypt!(ciphertext), do: ciphertext |> decrypt!() |> encrypt!(cipher: :gcm)

  @doc """
  Re-encrypts the given keys of a settings map as AES-256-GCM. Missing keys are left alone.
  """
  @spec re_encrypt_settings!(map(), [String.t()]) :: map()
  def re_encrypt_settings!(settings, keys) do
    for key <- keys, is_binary(settings[key]), reduce: settings do
      acc -> Map.put(acc, key, re_encrypt!(settings[key]))
    end
  end

  @doc """
  Whether any of the given keys of a settings map still holds a legacy AES-128-ECB ciphertext.
  """
  @spec legacy_settings?(map(), [String.t()]) :: boolean()
  def legacy_settings?(settings, keys) do
    Enum.any?(keys, &(is_binary(settings[&1]) and not gcm?(settings[&1])))
  end

  defp default_cipher do
    if write_gcm?(), do: :gcm, else: :ecb
  end

  defp gcm_requested?, do: Application.get_env(:realtime, :db_enc_write_gcm, false)
  defp gcm_key, do: Application.get_env(:realtime, :db_enc_key_gcm)
  defp ecb_key, do: Application.get_env(:realtime, :db_enc_key)

  defp encrypt_gcm!(text) do
    secret_key = gcm_key()
    iv = :crypto.strong_rand_bytes(12)
    {ciphertext, tag} = :crypto.crypto_one_time_aead(:aes_256_gcm, secret_key, iv, text, "", true)
    @gcm_prefix <> Base.encode64(iv <> tag <> ciphertext)
  end

  defp decrypt_gcm!(base64_text) do
    <<iv::binary-12, tag::binary-16, ciphertext::binary>> = Base.decode64!(base64_text)

    case :crypto.crypto_one_time_aead(:aes_256_gcm, gcm_key(), iv, ciphertext, "", tag, false) do
      :error -> raise "GCM decryption failed: ciphertext or authentication tag is invalid"
      plaintext when is_binary(plaintext) -> plaintext
    end
  end

  defp encrypt_ecb!(text) do
    :aes_128_ecb
    |> :crypto.crypto_one_time(ecb_key(), pad(text), true)
    |> Base.encode64()
  end

  defp decrypt_ecb!(base64_text) do
    :aes_128_ecb
    |> :crypto.crypto_one_time(ecb_key(), Base.decode64!(base64_text), false)
    |> unpad()
  end

  defp pad(data) do
    to_add = 16 - rem(byte_size(data), 16)
    data <> :binary.copy(<<to_add>>, to_add)
  end

  defp unpad(data) do
    to_remove = :binary.last(data)
    :binary.part(data, 0, byte_size(data) - to_remove)
  end
end
