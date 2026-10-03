// Copyright 2018-2024 the Deno authors. All rights reserved. MIT license.

//! There are many types of errors in Deno:
//! - AnyError: a generic wrapper that can encapsulate any type of error.
//! - JsError: a container for the error message and stack trace for exceptions
//!   thrown in JavaScript code. We use this to pretty-print stack traces.
//! - Diagnostic: these are errors that originate in TypeScript's compiler.
//!   They're similar to JsError, in that they have line numbers. But
//!   Diagnostics are compile-time type errors, whereas JsErrors are runtime
//!   exceptions.

use crate::runtime::ops::permissions::PermissionError;
// use crate::ops::fs_events::FsEventsError;
// use crate::ops::http::HttpStartError;
// use crate::ops::os::OsError;
// use crate::ops::permissions::PermissionError;
// use crate::ops::process::CheckRunPermissionError;
// use crate::ops::process::ProcessError;
// use crate::ops::signal::SignalError;
// use crate::ops::tty::TtyError;
// use crate::ops::web_worker::SyncFetchError;
// use crate::ops::worker_host::CreateWorkerError;
// use deno_broadcast_channel::BroadcastChannelError;
// use deno_cache::CacheError;
// use deno_canvas::CanvasError;
use deno_core::error::AnyError;
use deno_core::serde_json;
use deno_core::url;
use deno_core::ModuleResolutionError;
// use deno_cron::CronError;
use deno_crypto::DecryptError;
use deno_crypto::EncryptError;
use deno_crypto::ExportKeyError;
use deno_crypto::GenerateKeyError;
use deno_crypto::ImportKeyError;
use deno_fetch::FetchError;
use deno_fetch::HttpClientCreateError;
// use deno_ffi::CallError;
// use deno_ffi::CallbackError;
// use deno_ffi::DlfcnError;
// use deno_ffi::IRError;
// use deno_ffi::ReprError;
// use deno_ffi::StaticError;
use deno_fs::FsOpsError;
use deno_fs::FsOpsErrorKind;
use deno_http::HttpError;
use deno_http::HttpNextError;
use deno_http::WebSocketUpgradeError;
use deno_io::fs::FsError;
// use deno_kv::KvCheckError;
// use deno_kv::KvError;
// use deno_kv::KvErrorKind;
// use deno_kv::KvMutationError;
// use deno_napi::NApiError;
use deno_net::ops::NetError;
use deno_permissions::ChildPermissionError;
use deno_permissions::NetDescriptorFromUrlParseError;
use deno_permissions::PathResolveError;
use deno_permissions::PermissionCheckError;
use deno_permissions::RunDescriptorParseError;
use deno_permissions::SysDescriptorParseError;
use deno_tls::TlsError;
use deno_web::BlobError;
use deno_web::CompressionError;
use deno_web::MessagePortError;
use deno_web::StreamResourceError;
use deno_web::WebError;
use deno_websocket::HandshakeError;
use deno_websocket::WebsocketError;
use deno_webstorage::WebStorageError;
// use rustyline::error::ReadlineError;
use std::env;
use std::error::Error;
use std::io;
use std::sync::Arc;

fn get_run_descriptor_parse_error(e: &RunDescriptorParseError) -> &'static str {
  match e {
    RunDescriptorParseError::Which(_) => "Error",
    RunDescriptorParseError::PathResolve(e) => get_path_resolve_error(e),
    RunDescriptorParseError::EmptyRunQuery => "Error",
  }
}

fn get_sys_descriptor_parse_error(e: &SysDescriptorParseError) -> &'static str {
  match e {
    SysDescriptorParseError::InvalidKind(_) => "TypeError",
    SysDescriptorParseError::Empty => "Error",
  }
}

fn get_path_resolve_error(e: &PathResolveError) -> &'static str {
  match e {
    PathResolveError::CwdResolve(e) => get_io_error_class(e),
    PathResolveError::EmptyPath => "Error",
  }
}

fn get_permission_error_class(e: &PermissionError) -> &'static str {
  match e {
    PermissionError::InvalidPermissionName(_) => "ReferenceError",
    PermissionError::PathResolve(e) => get_path_resolve_error(e),
    PermissionError::NetDescriptorParse(_) => "URIError",
    PermissionError::SysDescriptorParse(e) => get_sys_descriptor_parse_error(e),
    PermissionError::RunDescriptorParse(e) => get_run_descriptor_parse_error(e),
  }
}

fn get_permission_check_error_class(e: &PermissionCheckError) -> &'static str {
  match e {
    PermissionCheckError::PermissionDenied(_) => "NotCapable",
    PermissionCheckError::InvalidFilePath(_) => "URIError",
    PermissionCheckError::NetDescriptorForUrlParse(e) => match e {
      NetDescriptorFromUrlParseError::MissingHost(_) => "TypeError",
      NetDescriptorFromUrlParseError::Host(_) => "URIError",
    },
    PermissionCheckError::SysDescriptorParse(e) => {
      get_sys_descriptor_parse_error(e)
    }
    PermissionCheckError::PathResolve(e) => get_path_resolve_error(e),
    PermissionCheckError::HostParse(_) => "URIError",
  }
}

// fn get_dlopen_error_class(error: &dlopen2::Error) -> &'static str {
//   use dlopen2::Error::*;
//   match error {
//     NullCharacter(_) => "InvalidData",
//     OpeningLibraryError(ref e) => get_io_error_class(e),
//     SymbolGettingError(ref e) => get_io_error_class(e),
//     AddrNotMatchingDll(ref e) => get_io_error_class(e),
//     NullSymbol => "NotFound",
//   }
// }

fn get_env_var_error_class(error: &env::VarError) -> &'static str {
  use env::VarError::*;
  match error {
    NotPresent => "NotFound",
    NotUnicode(..) => "InvalidData",
  }
}

fn get_io_error_class(error: &io::Error) -> &'static str {
  use io::ErrorKind::*;
  match error.kind() {
    NotFound => "NotFound",
    PermissionDenied => "PermissionDenied",
    ConnectionRefused => "ConnectionRefused",
    ConnectionReset => "ConnectionReset",
    ConnectionAborted => "ConnectionAborted",
    NotConnected => "NotConnected",
    AddrInUse => "AddrInUse",
    AddrNotAvailable => "AddrNotAvailable",
    BrokenPipe => "BrokenPipe",
    AlreadyExists => "AlreadyExists",
    InvalidInput => "TypeError",
    InvalidData => "InvalidData",
    TimedOut => "TimedOut",
    Interrupted => "Interrupted",
    WriteZero => "WriteZero",
    UnexpectedEof => "UnexpectedEof",
    Other => "Error",
    WouldBlock => "WouldBlock",
    // Non-exhaustive enum - might add new variants
    // in the future
    kind => {
      let kind_str = kind.to_string();
      match kind_str.as_str() {
        "FilesystemLoop" => "FilesystemLoop",
        "IsADirectory" => "IsADirectory",
        "NetworkUnreachable" => "NetworkUnreachable",
        "NotADirectory" => "NotADirectory",
        _ => "Error",
      }
    }
  }
}

fn get_module_resolution_error_class(
  _: &ModuleResolutionError,
) -> &'static str {
  "URIError"
}

fn get_notify_error_class(error: &notify::Error) -> &'static str {
  use notify::ErrorKind::*;
  match error.kind {
    Generic(_) => "Error",
    Io(ref e) => get_io_error_class(e),
    PathNotFound => "NotFound",
    WatchNotFound => "NotFound",
    InvalidConfig(_) => "InvalidData",
    MaxFilesWatch => "Error",
  }
}

fn get_regex_error_class(error: &regex::Error) -> &'static str {
  use regex::Error::*;
  match error {
    Syntax(_) => "SyntaxError",
    CompiledTooBig(_) => "RangeError",
    _ => "Error",
  }
}

fn get_serde_json_error_class(
  error: &serde_json::error::Error,
) -> &'static str {
  use deno_core::serde_json::error::*;
  match error.classify() {
    Category::Io => error
      .source()
      .and_then(|e| e.downcast_ref::<io::Error>())
      .map(get_io_error_class)
      .unwrap(),
    Category::Syntax => "SyntaxError",
    Category::Data => "InvalidData",
    Category::Eof => "UnexpectedEof",
  }
}

fn get_url_parse_error_class(_error: &url::ParseError) -> &'static str {
  "URIError"
}

fn get_hyper_error_class(_error: &hyper::Error) -> &'static str {
  "Http"
}

fn get_hyper_util_error_class(
  _error: &hyper_util::client::legacy::Error,
) -> &'static str {
  "Http"
}

fn get_hyper_v014_error_class(_error: &hyper_v014::Error) -> &'static str {
  "Http"
}

#[cfg(unix)]
pub fn get_nix_error_class(error: &nix::Error) -> &'static str {
  match error {
    nix::Error::ECHILD => "NotFound",
    nix::Error::EINVAL => "TypeError",
    nix::Error::ENOENT => "NotFound",
    nix::Error::ENOTTY => "BadResource",
    nix::Error::EPERM => "PermissionDenied",
    nix::Error::ESRCH => "NotFound",
    nix::Error::ELOOP => "FilesystemLoop",
    nix::Error::ENOTDIR => "NotADirectory",
    nix::Error::ENETUNREACH => "NetworkUnreachable",
    nix::Error::EISDIR => "IsADirectory",
    nix::Error::UnknownErrno => "Error",
    &nix::Error::ENOTSUP => unreachable!(),
    _ => "Error",
  }
}

// fn get_webgpu_error_class(e: &deno_webgpu::InitError) -> &'static str {
//   match e {
//     deno_webgpu::InitError::Resource(e) => {
//       get_error_class_name(e).unwrap_or("Error")
//     }
//     deno_webgpu::InitError::InvalidAdapter(_) => "Error",
//     deno_webgpu::InitError::RequestDevice(_) => "DOMExceptionOperationError",
//     deno_webgpu::InitError::InvalidDevice(_) => "Error",
//   }
// }

// fn get_webgpu_buffer_error_class(
//   e: &deno_webgpu::buffer::BufferError,
// ) -> &'static str {
//   match e {
//     deno_webgpu::buffer::BufferError::Resource(e) => {
//       get_error_class_name(e).unwrap_or("Error")
//     }
//     deno_webgpu::buffer::BufferError::InvalidUsage => "TypeError",
//     deno_webgpu::buffer::BufferError::Access(_) => "DOMExceptionOperationError",
//   }
// }

// fn get_webgpu_bundle_error_class(
//   e: &deno_webgpu::bundle::BundleError,
// ) -> &'static str {
//   match e {
//     deno_webgpu::bundle::BundleError::Resource(e) => {
//       get_error_class_name(e).unwrap_or("Error")
//     }
//     deno_webgpu::bundle::BundleError::InvalidSize => "TypeError",
//   }
// }

// fn get_webgpu_byow_error_class(
//   e: &deno_webgpu::byow::ByowError,
// ) -> &'static str {
//   match e {
//     deno_webgpu::byow::ByowError::WebGPUNotInitiated => "TypeError",
//     deno_webgpu::byow::ByowError::InvalidParameters => "TypeError",
//     deno_webgpu::byow::ByowError::CreateSurface(_) => "Error",
//     deno_webgpu::byow::ByowError::InvalidSystem => "TypeError",
//     #[cfg(any(
//       target_os = "windows",
//       target_os = "linux",
//       target_os = "freebsd",
//       target_os = "openbsd"
//     ))]
//     deno_webgpu::byow::ByowError::NullWindow => "TypeError",
//     #[cfg(any(
//       target_os = "linux",
//       target_os = "freebsd",
//       target_os = "openbsd"
//     ))]
//     deno_webgpu::byow::ByowError::NullDisplay => "TypeError",
//     #[cfg(target_os = "macos")]
//     deno_webgpu::byow::ByowError::NSViewDisplay => "TypeError",
//   }
// }

// fn get_webgpu_render_pass_error_class(
//   e: &deno_webgpu::render_pass::RenderPassError,
// ) -> &'static str {
//   match e {
//     deno_webgpu::render_pass::RenderPassError::Resource(e) => {
//       get_error_class_name(e).unwrap_or("Error")
//     }
//     deno_webgpu::render_pass::RenderPassError::InvalidSize => "TypeError",
//   }
// }

// fn get_webgpu_surface_error_class(
//   e: &deno_webgpu::surface::SurfaceError,
// ) -> &'static str {
//   match e {
//     deno_webgpu::surface::SurfaceError::Resource(e) => {
//       get_error_class_name(e).unwrap_or("Error")
//     }
//     deno_webgpu::surface::SurfaceError::Surface(_) => "Error",
//     deno_webgpu::surface::SurfaceError::InvalidStatus => "Error",
//   }
// }

fn get_crypto_decrypt_error_class(e: &DecryptError) -> &'static str {
  match e {
    DecryptError::General(e) => get_crypto_shared_error_class(e),
    DecryptError::Pkcs1(_) => "Error",
    DecryptError::Failed => "DOMExceptionOperationError",
    DecryptError::InvalidLength => "TypeError",
    DecryptError::InvalidCounterLength => "TypeError",
    DecryptError::InvalidTagLength => "TypeError",
    DecryptError::InvalidKeyOrIv => "DOMExceptionOperationError",
    DecryptError::TooMuchData => "DOMExceptionOperationError",
    DecryptError::InvalidIvLength => "TypeError",
    DecryptError::Rsa(_) => "DOMExceptionOperationError",
  }
}

fn get_crypto_encrypt_error_class(e: &EncryptError) -> &'static str {
  match e {
    EncryptError::General(e) => get_crypto_shared_error_class(e),
    EncryptError::InvalidKeyOrIv => "DOMExceptionOperationError",
    EncryptError::Failed => "DOMExceptionOperationError",
    EncryptError::InvalidLength => "TypeError",
    EncryptError::InvalidIvLength => "TypeError",
    EncryptError::InvalidCounterLength => "TypeError",
    EncryptError::TooMuchData => "DOMExceptionOperationError",
  }
}

fn get_crypto_shared_error_class(e: &deno_crypto::SharedError) -> &'static str {
  match e {
    deno_crypto::SharedError::ExpectedValidPrivateKey => "TypeError",
    deno_crypto::SharedError::ExpectedValidPublicKey => "TypeError",
    deno_crypto::SharedError::ExpectedValidPrivateECKey => "TypeError",
    deno_crypto::SharedError::ExpectedValidPublicECKey => "TypeError",
    deno_crypto::SharedError::ExpectedPrivateKey => "TypeError",
    deno_crypto::SharedError::ExpectedPublicKey => "TypeError",
    deno_crypto::SharedError::ExpectedSecretKey => "TypeError",
    deno_crypto::SharedError::FailedDecodePrivateKey => {
      "DOMExceptionOperationError"
    }
    deno_crypto::SharedError::FailedDecodePublicKey => {
      "DOMExceptionOperationError"
    }
    deno_crypto::SharedError::UnsupportedFormat => {
      "DOMExceptionNotSupportedError"
    }
  }
}

fn get_crypto_ed25519_error_class(
  e: &deno_crypto::Ed25519Error,
) -> &'static str {
  match e {
    deno_crypto::Ed25519Error::FailedExport => "DOMExceptionOperationError",
    deno_crypto::Ed25519Error::Der(_) => "Error",
    deno_crypto::Ed25519Error::KeyRejected(_) => "Error",
  }
}

fn get_crypto_export_key_error_class(e: &ExportKeyError) -> &'static str {
  match e {
    ExportKeyError::General(e) => get_crypto_shared_error_class(e),
    ExportKeyError::Der(_) => "Error",
    ExportKeyError::UnsupportedNamedCurve => "DOMExceptionNotSupportedError",
  }
}

fn get_crypto_generate_key_error_class(e: &GenerateKeyError) -> &'static str {
  match e {
    GenerateKeyError::General(e) => get_crypto_shared_error_class(e),
    GenerateKeyError::BadPublicExponent => "DOMExceptionOperationError",
    GenerateKeyError::InvalidHMACKeyLength => "DOMExceptionOperationError",
    GenerateKeyError::FailedRSAKeySerialization => "DOMExceptionOperationError",
    GenerateKeyError::InvalidAESKeyLength => "DOMExceptionOperationError",
    GenerateKeyError::FailedRSAKeyGeneration => "DOMExceptionOperationError",
    GenerateKeyError::FailedECKeyGeneration => "DOMExceptionOperationError",
    GenerateKeyError::FailedKeyGeneration => "DOMExceptionOperationError",
  }
}

fn get_crypto_import_key_error_class(e: &ImportKeyError) -> &'static str {
  match e {
    ImportKeyError::General(e) => get_crypto_shared_error_class(e),
    ImportKeyError::InvalidModulus => "DOMExceptionDataError",
    ImportKeyError::InvalidPublicExponent => "DOMExceptionDataError",
    ImportKeyError::InvalidPrivateExponent => "DOMExceptionDataError",
    ImportKeyError::InvalidFirstPrimeFactor => "DOMExceptionDataError",
    ImportKeyError::InvalidSecondPrimeFactor => "DOMExceptionDataError",
    ImportKeyError::InvalidFirstCRTExponent => "DOMExceptionDataError",
    ImportKeyError::InvalidSecondCRTExponent => "DOMExceptionDataError",
    ImportKeyError::InvalidCRTCoefficient => "DOMExceptionDataError",
    ImportKeyError::InvalidB64Coordinate => "DOMExceptionDataError",
    ImportKeyError::InvalidRSAPublicKey => "DOMExceptionDataError",
    ImportKeyError::InvalidRSAPrivateKey => "DOMExceptionDataError",
    ImportKeyError::UnsupportedAlgorithm => "DOMExceptionDataError",
    ImportKeyError::PublicKeyTooLong => "DOMExceptionDataError",
    ImportKeyError::PrivateKeyTooLong => "DOMExceptionDataError",
    ImportKeyError::InvalidP256ECPoint => "DOMExceptionDataError",
    ImportKeyError::InvalidP384ECPoint => "DOMExceptionDataError",
    ImportKeyError::InvalidP521ECPoint => "DOMExceptionDataError",
    ImportKeyError::UnsupportedNamedCurve => "DOMExceptionDataError",
    ImportKeyError::CurveMismatch => "DOMExceptionDataError",
    ImportKeyError::InvalidKeyData => "DOMExceptionDataError",
    ImportKeyError::InvalidJWKPrivateKey => "DOMExceptionDataError",
    ImportKeyError::EllipticCurve(_) => "DOMExceptionDataError",
    ImportKeyError::ExpectedValidPkcs8Data => "DOMExceptionDataError",
    ImportKeyError::MalformedParameters => "DOMExceptionDataError",
    ImportKeyError::Spki(_) => "DOMExceptionDataError",
    ImportKeyError::InvalidP256ECSPKIData => "DOMExceptionDataError",
    ImportKeyError::InvalidP384ECSPKIData => "DOMExceptionDataError",
    ImportKeyError::InvalidP521ECSPKIData => "DOMExceptionDataError",
    ImportKeyError::Der(_) => "DOMExceptionDataError",
  }
}

fn get_crypto_x448_error_class(e: &deno_crypto::X448Error) -> &'static str {
  match e {
    deno_crypto::X448Error::FailedExport => "DOMExceptionOperationError",
    deno_crypto::X448Error::InvalidKeyLength => "DOMExceptionDataError",
    deno_crypto::X448Error::Der(_) => "Error",
  }
}

fn get_crypto_x25519_error_class(e: &deno_crypto::X25519Error) -> &'static str {
  match e {
    deno_crypto::X25519Error::FailedExport => "DOMExceptionOperationError",
    deno_crypto::X25519Error::InvalidKeyLength => "DOMExceptionDataError",
    deno_crypto::X25519Error::Der(_) => "Error",
  }
}

fn get_crypto_error_class(e: &deno_crypto::Error) -> &'static str {
  match e {
    deno_crypto::Error::Der(_) => "Error",
    deno_crypto::Error::JoinError(_) => "Error",
    deno_crypto::Error::MissingArgumentHash => "TypeError",
    deno_crypto::Error::MissingArgumentSaltLength => "TypeError",
    deno_crypto::Error::Other(e) => get_error_class_name(e).unwrap_or("Error"),
    deno_crypto::Error::UnsupportedAlgorithm => "TypeError",
    deno_crypto::Error::KeyRejected(_) => "Error",
    deno_crypto::Error::RSA(_) => "Error",
    deno_crypto::Error::Pkcs1(_) => "Error",
    deno_crypto::Error::Unspecified(_) => "Error",
    deno_crypto::Error::InvalidKeyFormat => "TypeError",
    deno_crypto::Error::MissingArgumentPublicKey => "TypeError",
    deno_crypto::Error::P256Ecdsa(_) => "Error",
    deno_crypto::Error::DecodePrivateKey => "TypeError",
    deno_crypto::Error::MissingArgumentNamedCurve => "TypeError",
    deno_crypto::Error::MissingArgumentInfo => "TypeError",
    deno_crypto::Error::HKDFLengthTooLarge => "DOMExceptionOperationError",
    deno_crypto::Error::General(e) => get_crypto_shared_error_class(e),
    deno_crypto::Error::Base64Decode(_) => "Error",
    deno_crypto::Error::DataInvalidSize => "TypeError",
    deno_crypto::Error::InvalidKeyLength => "TypeError",
    deno_crypto::Error::EncryptionError => "DOMExceptionOperationError",
    deno_crypto::Error::DecryptionError => "DOMExceptionOperationError",
    deno_crypto::Error::ArrayBufferViewLengthExceeded(_) => {
      "DOMExceptionQuotaExceededError"
    }
  }
}

// fn get_napi_error_class(e: &NApiError) -> &'static str {
//   match e {
//     NApiError::InvalidPath
//     | NApiError::LibLoading(_)
//     | NApiError::ModuleNotFound(_) => "TypeError",
//     NApiError::Permission(e) => get_permission_check_error_class(e),
//   }
// }

fn get_web_error_class(e: &WebError) -> &'static str {
  match e {
    WebError::Base64Decode => "DOMExceptionInvalidCharacterError",
    WebError::InvalidEncodingLabel(_) => "RangeError",
    WebError::BufferTooLong => "TypeError",
    WebError::ValueTooLarge => "RangeError",
    WebError::BufferTooSmall => "RangeError",
    WebError::DataInvalid => "TypeError",
    WebError::DataError(_) => "Error",
  }
}

fn get_web_compression_error_class(e: &CompressionError) -> &'static str {
  match e {
    CompressionError::UnsupportedFormat => "TypeError",
    CompressionError::ResourceClosed => "TypeError",
    CompressionError::IoTypeError(_) => "TypeError",
    CompressionError::Io(e) => get_io_error_class(e),
  }
}

fn get_web_message_port_error_class(e: &MessagePortError) -> &'static str {
  match e {
    MessagePortError::InvalidTransfer => "TypeError",
    MessagePortError::NotReady => "TypeError",
    MessagePortError::TransferSelf => "TypeError",
    MessagePortError::Canceled(e) => {
      let io_err: io::Error = e.to_owned().into();
      get_io_error_class(&io_err)
    }
    MessagePortError::Resource(e) => get_error_class_name(e).unwrap_or("Error"),
  }
}

fn get_web_stream_resource_error_class(
  e: &StreamResourceError,
) -> &'static str {
  match e {
    StreamResourceError::Canceled(e) => {
      let io_err: io::Error = e.to_owned().into();
      get_io_error_class(&io_err)
    }
    StreamResourceError::Js(_) => "TypeError",
  }
}

fn get_web_blob_error_class(e: &BlobError) -> &'static str {
  match e {
    BlobError::BlobPartNotFound => "TypeError",
    BlobError::SizeLargerThanBlobPart => "TypeError",
    BlobError::BlobURLsNotSupported => "TypeError",
    BlobError::Url(_) => "Error",
  }
}

// fn get_ffi_repr_error_class(e: &ReprError) -> &'static str {
//   match e {
//     ReprError::InvalidOffset => "TypeError",
//     ReprError::InvalidArrayBuffer => "TypeError",
//     ReprError::DestinationLengthTooShort => "RangeError",
//     ReprError::InvalidCString => "TypeError",
//     ReprError::CStringTooLong => "TypeError",
//     ReprError::InvalidBool => "TypeError",
//     ReprError::InvalidU8 => "TypeError",
//     ReprError::InvalidI8 => "TypeError",
//     ReprError::InvalidU16 => "TypeError",
//     ReprError::InvalidI16 => "TypeError",
//     ReprError::InvalidU32 => "TypeError",
//     ReprError::InvalidI32 => "TypeError",
//     ReprError::InvalidU64 => "TypeError",
//     ReprError::InvalidI64 => "TypeError",
//     ReprError::InvalidF32 => "TypeError",
//     ReprError::InvalidF64 => "TypeError",
//     ReprError::InvalidPointer => "TypeError",
//     ReprError::Permission(e) => get_permission_check_error_class(e),
//   }
// }

// fn get_ffi_dlfcn_error_class(e: &DlfcnError) -> &'static str {
//   match e {
//     DlfcnError::RegisterSymbol { .. } => "Error",
//     DlfcnError::Dlopen(_) => "Error",
//     DlfcnError::Permission(e) => get_permission_check_error_class(e),
//     DlfcnError::Other(e) => get_error_class_name(e).unwrap_or("Error"),
//   }
// }

// fn get_ffi_static_error_class(e: &StaticError) -> &'static str {
//   match e {
//     StaticError::Dlfcn(e) => get_ffi_dlfcn_error_class(e),
//     StaticError::InvalidTypeVoid => "TypeError",
//     StaticError::InvalidTypeStruct => "TypeError",
//     StaticError::Resource(e) => get_error_class_name(e).unwrap_or("Error"),
//   }
// }

// fn get_ffi_callback_error_class(e: &CallbackError) -> &'static str {
//   match e {
//     CallbackError::Resource(e) => get_error_class_name(e).unwrap_or("Error"),
//     CallbackError::Other(e) => get_error_class_name(e).unwrap_or("Error"),
//     CallbackError::Permission(e) => get_permission_check_error_class(e),
//   }
// }

// fn get_ffi_call_error_class(e: &CallError) -> &'static str {
//   match e {
//     CallError::IR(_) => "TypeError",
//     CallError::NonblockingCallFailure(_) => "Error",
//     CallError::InvalidSymbol(_) => "TypeError",
//     CallError::Permission(e) => get_permission_check_error_class(e),
//     CallError::Callback(e) => get_ffi_callback_error_class(e),
//     CallError::Resource(e) => get_error_class_name(e).unwrap_or("Error"),
//   }
// }

fn get_webstorage_class_name(e: &WebStorageError) -> &'static str {
  match e {
    WebStorageError::ContextNotSupported => "DOMExceptionNotSupportedError",
    WebStorageError::Sqlite(_) => "Error",
    WebStorageError::Io(e) => get_io_error_class(e),
    WebStorageError::StorageExceeded => "DOMExceptionQuotaExceededError",
  }
}

fn get_tls_error_class(e: &TlsError) -> &'static str {
  match e {
    TlsError::Rustls(_) => "Error",
    TlsError::UnableAddPemFileToCert(e) => get_io_error_class(e),
    TlsError::CertInvalid
    | TlsError::CertsNotFound
    | TlsError::KeysNotFound
    | TlsError::KeyDecode => "InvalidData",
  }
}

// pub fn get_cron_error_class(e: &CronError) -> &'static str {
//   match e {
//     CronError::Resource(e) => {
//       deno_core::error::get_custom_error_class(e).unwrap_or("Error")
//     }
//     CronError::NameExceeded(_) => "TypeError",
//     CronError::NameInvalid => "TypeError",
//     CronError::AlreadyExists => "TypeError",
//     CronError::TooManyCrons => "TypeError",
//     CronError::InvalidCron => "TypeError",
//     CronError::InvalidBackoff => "TypeError",
//     CronError::AcquireError(_) => "Error",
//     CronError::Other(e) => get_error_class_name(e).unwrap_or("Error"),
//   }
// }

// fn get_canvas_error(e: &CanvasError) -> &'static str {
//   match e {
//     CanvasError::UnsupportedColorType(_) => "TypeError",
//     CanvasError::Image(_) => "Error",
//   }
// }

// pub fn get_cache_error(error: &CacheError) -> &'static str {
//   match error {
//     CacheError::Sqlite(_) => "Error",
//     CacheError::JoinError(_) => "Error",
//     CacheError::Resource(err) => {
//       deno_core::error::get_custom_error_class(err).unwrap_or("Error")
//     }
//     CacheError::Other(e) => get_error_class_name(e).unwrap_or("Error"),
//     CacheError::Io(err) => get_io_error_class(err),
//   }
// }

// fn get_broadcast_channel_error(error: &BroadcastChannelError) -> &'static str {
//   match error {
//     BroadcastChannelError::Resource(err) => {
//       deno_core::error::get_custom_error_class(err).unwrap()
//     }
//     BroadcastChannelError::MPSCSendError(_) => "Error",
//     BroadcastChannelError::BroadcastSendError(_) => "Error",
//     BroadcastChannelError::Other(err) => {
//       get_error_class_name(err).unwrap_or("Error")
//     }
//   }
// }

fn get_fetch_error(error: &FetchError) -> &'static str {
  match error {
    FetchError::Resource(e) => get_error_class_name(e).unwrap_or("Error"),
    FetchError::Permission(e) => get_permission_check_error_class(e),
    FetchError::NetworkError => "TypeError",
    FetchError::FsNotGet(_) => "TypeError",
    FetchError::PathToUrl(_) => "TypeError",
    FetchError::InvalidUrl(_) => "TypeError",
    FetchError::InvalidHeaderName(_) => "TypeError",
    FetchError::InvalidHeaderValue(_) => "TypeError",
    FetchError::DataUrl(_) => "TypeError",
    FetchError::Base64(_) => "TypeError",
    FetchError::BlobNotFound => "TypeError",
    FetchError::SchemeNotSupported(_) => "TypeError",
    FetchError::RequestCanceled => "TypeError",
    FetchError::Http(_) => "Error",
    FetchError::ClientCreate(e) => get_http_client_create_error(e),
    FetchError::Url(e) => get_url_parse_error_class(e),
    FetchError::Method(_) => "TypeError",
    FetchError::ClientSend(_) => "TypeError",
    FetchError::RequestBuilderHook(_) => "TypeError",
    FetchError::Io(e) => get_io_error_class(e),
    FetchError::Hyper(e) => get_hyper_error_class(e),
  }
}

fn get_http_client_create_error(error: &HttpClientCreateError) -> &'static str {
  match error {
    HttpClientCreateError::Tls(_) => "TypeError",
    HttpClientCreateError::InvalidUserAgent(_) => "TypeError",
    HttpClientCreateError::InvalidProxyUrl => "TypeError",
    HttpClientCreateError::HttpVersionSelectionInvalid => "TypeError",
    HttpClientCreateError::RootCertStore(_) => "TypeError",
  }
}

fn get_websocket_error(error: &WebsocketError) -> &'static str {
  match error {
    WebsocketError::Resource(e) => get_error_class_name(e).unwrap_or("Error"),
    WebsocketError::Permission(e) => get_permission_check_error_class(e),
    WebsocketError::Url(e) => get_url_parse_error_class(e),
    WebsocketError::Io(e) => get_io_error_class(e),
    WebsocketError::WebSocket(_) => "TypeError",
    WebsocketError::ConnectionFailed(_) => "DOMExceptionNetworkError",
    WebsocketError::Uri(_) => "Error",
    WebsocketError::Canceled(e) => {
      let io_err: io::Error = e.to_owned().into();
      get_io_error_class(&io_err)
    }
  }
}

fn get_websocket_handshake_error(error: &HandshakeError) -> &'static str {
  match error {
    HandshakeError::RootStoreError(e) => {
      get_error_class_name(e).unwrap_or("Error")
    }
    HandshakeError::Tls(e) => get_tls_error_class(e),
    HandshakeError::MissingPath => "TypeError",
    HandshakeError::Http(_) => "Error",
    HandshakeError::InvalidHostname(_) => "TypeError",
    HandshakeError::Io(e) => get_io_error_class(e),
    HandshakeError::Rustls(_) => "Error",
    HandshakeError::H2(_) => "Error",
    HandshakeError::NoH2Alpn => "Error",
    HandshakeError::InvalidStatusCode(_) => "Error",
    HandshakeError::WebSocket(_) => "TypeError",
    HandshakeError::HeaderName(_) => "TypeError",
    HandshakeError::HeaderValue(_) => "TypeError",
  }
}

fn get_fs_ops_error(error: &FsOpsError) -> &'static str {
  use FsOpsErrorKind::*;
  match error.as_kind() {
    Io(e) => get_io_error_class(e),
    OperationError(e) => get_fs_error(&e.err),
    Permission(e) => get_permission_check_error_class(e),
    Resource(e) | Other(e) => get_error_class_name(e).unwrap_or("Error"),
    InvalidUtf8(_) => "InvalidData",
    StripPrefix(_) => "Error",
    Canceled(e) => {
      let io_err: io::Error = e.to_owned().into();
      get_io_error_class(&io_err)
    }
    InvalidSeekMode(_) => "TypeError",
    InvalidControlCharacter(_) => "Error",
    InvalidCharacter(_) => "Error",
    #[cfg(windows)]
    InvalidTrailingCharacter => "Error",
    NotCapableAccess { .. } => "NotCapable",
    NotCapable(_) => "NotCapable",
  }
}

// fn get_kv_error(error: &KvError) -> &'static str {
//   use KvErrorKind::*;
//   match error.as_kind() {
//     DatabaseHandler(e) | Resource(e) | Kv(e) => {
//       get_error_class_name(e).unwrap_or("Error")
//     }
//     TooManyRanges(_) => "TypeError",
//     TooManyEntries(_) => "TypeError",
//     TooManyChecks(_) => "TypeError",
//     TooManyMutations(_) => "TypeError",
//     TooManyKeys(_) => "TypeError",
//     InvalidLimit => "TypeError",
//     InvalidBoundaryKey => "TypeError",
//     KeyTooLargeToRead(_) => "TypeError",
//     KeyTooLargeToWrite(_) => "TypeError",
//     TotalMutationTooLarge(_) => "TypeError",
//     TotalKeyTooLarge(_) => "TypeError",
//     Io(e) => get_io_error_class(e),
//     QueueMessageNotFound => "TypeError",
//     StartKeyNotInKeyspace => "TypeError",
//     EndKeyNotInKeyspace => "TypeError",
//     StartKeyGreaterThanEndKey => "TypeError",
//     InvalidCheck(e) => match e {
//       KvCheckError::InvalidVersionstamp => "TypeError",
//       KvCheckError::Io(e) => get_io_error_class(e),
//     },
//     InvalidMutation(e) => match e {
//       KvMutationError::BigInt(_) => "Error",
//       KvMutationError::Io(e) => get_io_error_class(e),
//       KvMutationError::InvalidMutationWithValue(_) => "TypeError",
//       KvMutationError::InvalidMutationWithoutValue(_) => "TypeError",
//     },
//     InvalidEnqueue(e) => get_io_error_class(e),
//     EmptyKey => "TypeError",
//     ValueTooLarge(_) => "TypeError",
//     EnqueuePayloadTooLarge(_) => "TypeError",
//     InvalidCursor => "TypeError",
//     CursorOutOfBounds => "TypeError",
//     InvalidRange => "TypeError",
//   }
// }

fn get_net_error(error: &NetError) -> &'static str {
  match error {
    NetError::ListenerClosed => "BadResource",
    NetError::ListenerBusy => "Busy",
    NetError::SocketClosed => "BadResource",
    NetError::SocketClosedNotConnected => "NotConnected",
    NetError::SocketBusy => "Busy",
    NetError::Io(e) => get_io_error_class(e),
    NetError::AcceptTaskOngoing => "Busy",
    NetError::RootCertStore(e) | NetError::Resource(e) => {
      get_error_class_name(e).unwrap_or("Error")
    }
    NetError::Permission(e) => get_permission_check_error_class(e),
    NetError::NoResolvedAddress => "Error",
    NetError::AddrParse(_) => "Error",
    NetError::Map(e) => get_net_map_error(e),
    NetError::Canceled(e) => {
      let io_err: io::Error = e.to_owned().into();
      get_io_error_class(&io_err)
    }
    NetError::DnsNotFound(_) => "NotFound",
    NetError::DnsNotConnected(_) => "NotConnected",
    NetError::DnsTimedOut(_) => "TimedOut",
    NetError::Dns(_) => "Error",
    NetError::UnsupportedRecordType => "NotSupported",
    NetError::InvalidUtf8(_) => "InvalidData",
    NetError::UnexpectedKeyType => "Error",
    NetError::InvalidHostname(_) => "TypeError",
    NetError::TcpStreamBusy => "Busy",
    NetError::Rustls(_) => "Error",
    NetError::Tls(e) => get_tls_error_class(e),
    NetError::ListenTlsRequiresKey => "InvalidData",
    NetError::Reunite(_) => "Error",
  }
}

fn get_net_map_error(error: &deno_net::io::MapError) -> &'static str {
  match error {
    deno_net::io::MapError::Io(e) => get_io_error_class(e),
    deno_net::io::MapError::NoResources => "Error",
  }
}

fn get_child_permission_error(e: &ChildPermissionError) -> &'static str {
  match e {
    ChildPermissionError::Escalation => "NotCapable",
    ChildPermissionError::PathResolve(e) => get_path_resolve_error(e),
    ChildPermissionError::NetDescriptorParse(_) => "URIError",
    ChildPermissionError::EnvDescriptorParse(_) => "Error",
    ChildPermissionError::SysDescriptorParse(e) => {
      get_sys_descriptor_parse_error(e)
    }
    ChildPermissionError::RunDescriptorParse(e) => {
      get_run_descriptor_parse_error(e)
    }
  }
}

// fn get_create_worker_error(error: &CreateWorkerError) -> &'static str {
//   match error {
//     CreateWorkerError::ClassicWorkers => "DOMExceptionNotSupportedError",
//     CreateWorkerError::Permission(e) => get_child_permission_error(e),
//     CreateWorkerError::ModuleResolution(e) => {
//       get_module_resolution_error_class(e)
//     }
//     CreateWorkerError::Io(e) => get_io_error_class(e),
//     CreateWorkerError::MessagePort(e) => get_web_message_port_error_class(e),
//   }
// }

// fn get_tty_error(error: &TtyError) -> &'static str {
//   match error {
//     TtyError::Resource(e) | TtyError::Other(e) => {
//       get_error_class_name(e).unwrap_or("Error")
//     }
//     TtyError::Io(e) => get_io_error_class(e),
//     #[cfg(unix)]
//     TtyError::Nix(e) => get_nix_error_class(e),
//   }
// }

// fn get_readline_error(error: &ReadlineError) -> &'static str {
//   match error {
//     ReadlineError::Io(e) => get_io_error_class(e),
//     ReadlineError::Eof => "Error",
//     ReadlineError::Interrupted => "Error",
//     #[cfg(unix)]
//     ReadlineError::Errno(e) => get_nix_error_class(e),
//     ReadlineError::WindowResized => "Error",
//     #[cfg(windows)]
//     ReadlineError::Decode(_) => "Error",
//     #[cfg(windows)]
//     ReadlineError::SystemError(_) => "Error",
//     _ => "Error",
//   }
// }

// fn get_signal_error(error: &SignalError) -> &'static str {
//   match error {
//     SignalError::InvalidSignalStr(_) => "TypeError",
//     SignalError::InvalidSignalInt(_) => "TypeError",
//     SignalError::SignalNotAllowed(_) => "TypeError",
//     SignalError::Io(e) => get_io_error_class(e),
//   }
// }

// fn get_fs_events_error(error: &FsEventsError) -> &'static str {
//   match error {
//     FsEventsError::Resource(e) => get_error_class_name(e).unwrap_or("Error"),
//     FsEventsError::Permission(e) => get_permission_check_error_class(e),
//     FsEventsError::Notify(e) => get_notify_error_class(e),
//     FsEventsError::Canceled(e) => {
//       let io_err: io::Error = e.to_owned().into();
//       get_io_error_class(&io_err)
//     }
//   }
// }

// fn get_http_start_error(error: &HttpStartError) -> &'static str {
//   match error {
//     HttpStartError::TcpStreamInUse => "Busy",
//     HttpStartError::TlsStreamInUse => "Busy",
//     HttpStartError::UnixSocketInUse => "Busy",
//     HttpStartError::ReuniteTcp(_) => "Error",
//     #[cfg(unix)]
//     HttpStartError::ReuniteUnix(_) => "Error",
//     HttpStartError::Io(e) => get_io_error_class(e),
//     HttpStartError::Other(e) => get_error_class_name(e).unwrap_or("Error"),
//   }
// }

// fn get_process_error(error: &ProcessError) -> &'static str {
//   match error {
//     ProcessError::SpawnFailed { error, .. } => get_process_error(error),
//     ProcessError::FailedResolvingCwd(e) | ProcessError::Io(e) => {
//       get_io_error_class(e)
//     }
//     ProcessError::Permission(e) => get_permission_check_error_class(e),
//     ProcessError::Resource(e) => get_error_class_name(e).unwrap_or("Error"),
//     ProcessError::BorrowMut(_) => "Error",
//     ProcessError::Which(_) => "Error",
//     ProcessError::ChildProcessAlreadyTerminated => "TypeError",
//     ProcessError::Signal(e) => get_signal_error(e),
//     ProcessError::MissingCmd => "Error",
//     ProcessError::InvalidPid => "TypeError",
//     #[cfg(unix)]
//     ProcessError::Nix(e) => get_nix_error_class(e),
//     ProcessError::RunPermission(e) => match e {
//       CheckRunPermissionError::Permission(e) => {
//         get_permission_check_error_class(e)
//       }
//       CheckRunPermissionError::Other(e) => {
//         get_error_class_name(e).unwrap_or("Error")
//       }
//     },
//   }
// }

fn get_http_error(error: &HttpError) -> &'static str {
  match error {
    HttpError::Canceled(e) => {
      let io_err: io::Error = e.to_owned().into();
      get_io_error_class(&io_err)
    }
    HttpError::HyperV014(e) => get_hyper_v014_error_class(e),
    HttpError::InvalidHeaderName(_) => "Error",
    HttpError::InvalidHeaderValue(_) => "Error",
    HttpError::Http(_) => "Error",
    HttpError::ResponseHeadersAlreadySent => "Http",
    HttpError::ConnectionClosedWhileSendingResponse => "Http",
    HttpError::AlreadyInUse => "Http",
    HttpError::Io(e) => get_io_error_class(e),
    HttpError::NoResponseHeaders => "Http",
    HttpError::ResponseAlreadyCompleted => "Http",
    HttpError::UpgradeBodyUsed => "Http",
    HttpError::Resource(e) | HttpError::Other(e) => {
      get_error_class_name(e).unwrap_or("Error")
    }
  }
}

fn get_http_next_error(error: &HttpNextError) -> &'static str {
  match error {
    HttpNextError::Io(e) => get_io_error_class(e),
    HttpNextError::WebSocketUpgrade(e) => get_websocket_upgrade_error(e),
    HttpNextError::Hyper(e) => get_hyper_error_class(e),
    HttpNextError::JoinError(_) => "Error",
    HttpNextError::Canceled(e) => {
      let io_err: io::Error = e.to_owned().into();
      get_io_error_class(&io_err)
    }
    HttpNextError::UpgradeUnavailable(_) => "Error",
    HttpNextError::HttpPropertyExtractor(e) | HttpNextError::Resource(e) => {
      get_error_class_name(e).unwrap_or("Error")
    }
  }
}

fn get_websocket_upgrade_error(error: &WebSocketUpgradeError) -> &'static str {
  match error {
    WebSocketUpgradeError::InvalidHeaders => "Http",
    WebSocketUpgradeError::HttpParse(_) => "Error",
    WebSocketUpgradeError::Http(_) => "Error",
    WebSocketUpgradeError::Utf8(_) => "Error",
    WebSocketUpgradeError::InvalidHeaderName(_) => "Error",
    WebSocketUpgradeError::InvalidHeaderValue(_) => "Error",
    WebSocketUpgradeError::InvalidHttpStatusLine => "Http",
    WebSocketUpgradeError::UpgradeBufferAlreadyCompleted => "Http",
  }
}

fn get_fs_error(e: &FsError) -> &'static str {
  match &e {
    FsError::Io(e) => get_io_error_class(e),
    FsError::FileBusy => "Busy",
    FsError::NotSupported => "NotSupported",
    FsError::NotCapable(_) => "NotCapable",
  }
}

mod node {
  use super::get_error_class_name;
  use super::get_io_error_class;
  use super::get_permission_check_error_class;
  use super::get_serde_json_error_class;
  use super::get_url_parse_error_class;
  pub use ext_node::ops::blocklist::BlocklistError;
  pub use ext_node::ops::crypto::cipher::CipherContextError;
  pub use ext_node::ops::crypto::cipher::CipherError;
  pub use ext_node::ops::crypto::cipher::DecipherContextError;
  pub use ext_node::ops::crypto::cipher::DecipherError;
  pub use ext_node::ops::crypto::digest::HashError;
  pub use ext_node::ops::crypto::keys::AsymmetricPrivateKeyDerError;
  pub use ext_node::ops::crypto::keys::AsymmetricPrivateKeyError;
  pub use ext_node::ops::crypto::keys::AsymmetricPublicKeyDerError;
  pub use ext_node::ops::crypto::keys::AsymmetricPublicKeyError;
  pub use ext_node::ops::crypto::keys::AsymmetricPublicKeyJwkError;
  pub use ext_node::ops::crypto::keys::EcJwkError;
  pub use ext_node::ops::crypto::keys::EdRawError;
  pub use ext_node::ops::crypto::keys::ExportPrivateKeyPemError;
  pub use ext_node::ops::crypto::keys::ExportPublicKeyPemError;
  pub use ext_node::ops::crypto::keys::GenerateRsaPssError;
  pub use ext_node::ops::crypto::keys::RsaJwkError;
  pub use ext_node::ops::crypto::keys::RsaPssParamsParseError;
  pub use ext_node::ops::crypto::keys::X509PublicKeyError;
  pub use ext_node::ops::crypto::sign::KeyObjectHandlePrehashedSignAndVerifyError;
  pub use ext_node::ops::crypto::x509::X509Error;
  pub use ext_node::ops::crypto::DiffieHellmanError;
  pub use ext_node::ops::crypto::EcdhEncodePubKey;
  pub use ext_node::ops::crypto::EcdhError;
  pub use ext_node::ops::crypto::HkdfError;
  pub use ext_node::ops::crypto::Pbkdf2Error;
  pub use ext_node::ops::crypto::PrivateEncryptDecryptError;
  pub use ext_node::ops::crypto::ScryptAsyncError;
  pub use ext_node::ops::crypto::SignEd25519Error;
  pub use ext_node::ops::crypto::VerifyEd25519Error;
  pub use ext_node::ops::fs::FsError;
  pub use ext_node::ops::http2::Http2Error;
  pub use ext_node::ops::idna::IdnaError;
  pub use ext_node::ops::ipc::IpcError;
  pub use ext_node::ops::ipc::IpcJsonStreamError;
  use ext_node::ops::os::priority::PriorityError;
  pub use ext_node::ops::os::OsError;
  pub use ext_node::ops::require::RequireError;
  use ext_node::ops::require::RequireErrorKind;
  pub use ext_node::ops::worker_threads::WorkerThreadsFilenameError;
  pub use ext_node::ops::zlib::brotli::BrotliError;
  pub use ext_node::ops::zlib::mode::ModeError;
  pub use ext_node::ops::zlib::ZlibError;

  pub fn get_blocklist_error(error: &BlocklistError) -> &'static str {
    match error {
      BlocklistError::AddrParse(_) => "Error",
      BlocklistError::IpNetwork(_) => "Error",
      BlocklistError::InvalidAddress => "Error",
      BlocklistError::IpVersionMismatch => "Error",
    }
  }

  pub fn get_fs_error(error: &FsError) -> &'static str {
    match error {
      FsError::Permission(e) => get_permission_check_error_class(e),
      FsError::Io(e) => get_io_error_class(e),
      #[cfg(windows)]
      FsError::PathHasNoRoot => "Error",
      #[cfg(not(any(unix, windows)))]
      FsError::UnsupportedPlatform => "Error",
      FsError::Fs(e) => super::get_fs_error(e),
    }
  }

  pub fn get_idna_error(error: &IdnaError) -> &'static str {
    match error {
      IdnaError::InvalidInput => "RangeError",
      IdnaError::InputTooLong => "Error",
      IdnaError::IllegalInput => "RangeError",
    }
  }

  pub fn get_ipc_json_stream_error(error: &IpcJsonStreamError) -> &'static str {
    match error {
      IpcJsonStreamError::Io(e) => get_io_error_class(e),
      IpcJsonStreamError::SimdJson(_) => "Error",
    }
  }

  pub fn get_ipc_error(error: &IpcError) -> &'static str {
    match error {
      IpcError::Resource(e) => get_error_class_name(e).unwrap_or("Error"),
      IpcError::IpcJsonStream(e) => get_ipc_json_stream_error(e),
      IpcError::Canceled(e) => {
        let io_err: std::io::Error = e.to_owned().into();
        get_io_error_class(&io_err)
      }
      IpcError::SerdeJson(e) => get_serde_json_error_class(e),
    }
  }

  pub fn get_worker_threads_filename_error(
    error: &WorkerThreadsFilenameError,
  ) -> &'static str {
    match error {
      WorkerThreadsFilenameError::Permission(e) => {
        get_error_class_name(e).unwrap_or("Error")
      }
      WorkerThreadsFilenameError::UrlParse(e) => get_url_parse_error_class(e),
      WorkerThreadsFilenameError::InvalidRelativeUrl => "Error",
      WorkerThreadsFilenameError::UrlFromPathString => "Error",
      WorkerThreadsFilenameError::UrlToPathString => "Error",
      WorkerThreadsFilenameError::UrlToPath => "Error",
      WorkerThreadsFilenameError::FileNotFound(_) => "Error",
      WorkerThreadsFilenameError::Fs(e) => super::get_fs_error(e),
    }
  }

  pub fn get_require_error(error: &RequireError) -> &'static str {
    use RequireErrorKind::*;
    match error.as_kind() {
      UrlParse(e) => get_url_parse_error_class(e),
      Permission(e) => get_error_class_name(e).unwrap_or("Error"),
      PackageExportsResolve(_)
      | PackageJsonLoad(_)
      | ClosestPkgJson(_)
      | FilePathConversion(_)
      | UrlConversion(_)
      | ReadModule(_)
      | PackageImportsResolve(_) => "Error",
      Fs(e) | UnableToGetCwd(e) => super::get_fs_error(e),
    }
  }

  pub fn get_http2_error(error: &Http2Error) -> &'static str {
    match error {
      Http2Error::Resource(e) => get_error_class_name(e).unwrap_or("Error"),
      Http2Error::UrlParse(e) => get_url_parse_error_class(e),
      Http2Error::H2(_) => "Error",
    }
  }

  pub fn get_os_error(error: &OsError) -> &'static str {
    match error {
      OsError::Priority(e) => match e {
        PriorityError::Io(e) => get_io_error_class(e),
        #[cfg(windows)]
        PriorityError::InvalidPriority => "TypeError",
      },
      OsError::Permission(e) => get_permission_check_error_class(e),
      OsError::FailedToGetCpuInfo => "TypeError",
      OsError::FailedToGetUserInfo(e) => get_io_error_class(e),
    }
  }

  pub fn get_brotli_error(error: &BrotliError) -> &'static str {
    match error {
      BrotliError::InvalidEncoderMode => "TypeError",
      BrotliError::CompressFailed => "TypeError",
      BrotliError::DecompressFailed => "TypeError",
      BrotliError::Join(_) => "Error",
      BrotliError::Resource(e) => get_error_class_name(e).unwrap_or("Error"),
      BrotliError::Io(e) => get_io_error_class(e),
    }
  }

  pub fn get_mode_error(_: &ModeError) -> &'static str {
    "Error"
  }

  pub fn get_zlib_error(e: &ZlibError) -> &'static str {
    match e {
      ZlibError::NotInitialized => "TypeError",
      ZlibError::Mode(e) => get_mode_error(e),
      ZlibError::Other(e) => get_error_class_name(e).unwrap_or("Error"),
    }
  }

  pub fn get_crypto_cipher_context_error(
    e: &CipherContextError,
  ) -> &'static str {
    match e {
      CipherContextError::ContextInUse => "TypeError",
      CipherContextError::Cipher(e) => get_crypto_cipher_error(e),
      CipherContextError::Resource(e) => {
        get_error_class_name(e).unwrap_or("Error")
      }
    }
  }

  pub fn get_crypto_cipher_error(e: &CipherError) -> &'static str {
    match e {
      CipherError::InvalidIvLength => "TypeError",
      CipherError::InvalidKeyLength => "RangeError",
      CipherError::InvalidInitializationVector => "TypeError",
      CipherError::CannotPadInputData => "TypeError",
      CipherError::UnknownCipher(_) => "TypeError",
    }
  }

  pub fn get_crypto_decipher_context_error(
    e: &DecipherContextError,
  ) -> &'static str {
    match e {
      DecipherContextError::ContextInUse => "TypeError",
      DecipherContextError::Decipher(e) => get_crypto_decipher_error(e),
      DecipherContextError::Resource(e) => {
        get_error_class_name(e).unwrap_or("Error")
      }
    }
  }

  pub fn get_crypto_decipher_error(e: &DecipherError) -> &'static str {
    match e {
      DecipherError::InvalidIvLength => "TypeError",
      DecipherError::InvalidKeyLength => "RangeError",
      DecipherError::InvalidInitializationVector => "TypeError",
      DecipherError::CannotUnpadInputData => "TypeError",
      DecipherError::DataAuthenticationFailed => "TypeError",
      DecipherError::SetAutoPaddingFalseAes128GcmUnsupported => "TypeError",
      DecipherError::SetAutoPaddingFalseAes256GcmUnsupported => "TypeError",
      DecipherError::UnknownCipher(_) => "TypeError",
    }
  }

  pub fn get_x509_error(_: &X509Error) -> &'static str {
    "Error"
  }

  pub fn get_crypto_key_object_handle_prehashed_sign_and_verify_error(
    e: &KeyObjectHandlePrehashedSignAndVerifyError,
  ) -> &'static str {
    match e {
      KeyObjectHandlePrehashedSignAndVerifyError::InvalidDsaSignatureEncoding => "TypeError",
      KeyObjectHandlePrehashedSignAndVerifyError::KeyIsNotPrivate => "TypeError",
      KeyObjectHandlePrehashedSignAndVerifyError::DigestNotAllowedForRsaSignature(_) => "TypeError",
      KeyObjectHandlePrehashedSignAndVerifyError::FailedToSignDigestWithRsa => "Error",
      KeyObjectHandlePrehashedSignAndVerifyError::DigestNotAllowedForRsaPssSignature(_) => "TypeError",
      KeyObjectHandlePrehashedSignAndVerifyError::FailedToSignDigestWithRsaPss => "Error",
      KeyObjectHandlePrehashedSignAndVerifyError::FailedToSignDigestWithDsa => "TypeError",
      KeyObjectHandlePrehashedSignAndVerifyError::RsaPssHashAlgorithmUnsupported => "TypeError",
      KeyObjectHandlePrehashedSignAndVerifyError::PrivateKeyDisallowsUsage { .. } => "TypeError",
      KeyObjectHandlePrehashedSignAndVerifyError::FailedToSignDigest => "TypeError",
      KeyObjectHandlePrehashedSignAndVerifyError::X25519KeyCannotBeUsedForSigning => "TypeError",
      KeyObjectHandlePrehashedSignAndVerifyError::Ed25519KeyCannotBeUsedForPrehashedSigning => "TypeError",
      KeyObjectHandlePrehashedSignAndVerifyError::DhKeyCannotBeUsedForSigning => "TypeError",
      KeyObjectHandlePrehashedSignAndVerifyError::KeyIsNotPublicOrPrivate => "TypeError",
      KeyObjectHandlePrehashedSignAndVerifyError::InvalidDsaSignature => "TypeError",
      KeyObjectHandlePrehashedSignAndVerifyError::X25519KeyCannotBeUsedForVerification => "TypeError",
      KeyObjectHandlePrehashedSignAndVerifyError::Ed25519KeyCannotBeUsedForPrehashedVerification => "TypeError",
      KeyObjectHandlePrehashedSignAndVerifyError::DhKeyCannotBeUsedForVerification => "TypeError",
    }
  }

  pub fn get_crypto_hash_error(_: &HashError) -> &'static str {
    "Error"
  }

  pub fn get_asymmetric_public_key_jwk_error(
    e: &AsymmetricPublicKeyJwkError,
  ) -> &'static str {
    match e {
      AsymmetricPublicKeyJwkError::UnsupportedJwkEcCurveP224 => "TypeError",
      AsymmetricPublicKeyJwkError::JwkExportNotImplementedForKeyType => {
        "TypeError"
      }
      AsymmetricPublicKeyJwkError::KeyIsNotAsymmetricPublicKey => "TypeError",
    }
  }

  pub fn get_generate_rsa_pss_error(_: &GenerateRsaPssError) -> &'static str {
    "TypeError"
  }

  pub fn get_asymmetric_private_key_der_error(
    e: &AsymmetricPrivateKeyDerError,
  ) -> &'static str {
    match e {
      AsymmetricPrivateKeyDerError::KeyIsNotAsymmetricPrivateKey => "TypeError",
      AsymmetricPrivateKeyDerError::InvalidRsaPrivateKey => "TypeError",
      AsymmetricPrivateKeyDerError::ExportingNonRsaPrivateKeyAsPkcs1Unsupported => "TypeError",
      AsymmetricPrivateKeyDerError::InvalidEcPrivateKey => "TypeError",
      AsymmetricPrivateKeyDerError::ExportingNonEcPrivateKeyAsSec1Unsupported => "TypeError",
      AsymmetricPrivateKeyDerError::ExportingNonRsaPssPrivateKeyAsPkcs8Unsupported => "Error",
      AsymmetricPrivateKeyDerError::InvalidDsaPrivateKey => "TypeError",
      AsymmetricPrivateKeyDerError::InvalidX25519PrivateKey => "TypeError",
      AsymmetricPrivateKeyDerError::InvalidEd25519PrivateKey => "TypeError",
      AsymmetricPrivateKeyDerError::InvalidDhPrivateKey => "TypeError",
      AsymmetricPrivateKeyDerError::UnsupportedKeyType(_) => "TypeError",
    }
  }

  pub fn get_asymmetric_public_key_der_error(
    _: &AsymmetricPublicKeyDerError,
  ) -> &'static str {
    "TypeError"
  }

  pub fn get_export_public_key_pem_error(
    e: &ExportPublicKeyPemError,
  ) -> &'static str {
    match e {
      ExportPublicKeyPemError::AsymmetricPublicKeyDer(e) => {
        get_asymmetric_public_key_der_error(e)
      }
      ExportPublicKeyPemError::VeryLargeData => "TypeError",
      ExportPublicKeyPemError::Der(_) => "Error",
    }
  }

  pub fn get_export_private_key_pem_error(
    e: &ExportPrivateKeyPemError,
  ) -> &'static str {
    match e {
      ExportPrivateKeyPemError::AsymmetricPublicKeyDer(e) => {
        get_asymmetric_private_key_der_error(e)
      }
      ExportPrivateKeyPemError::VeryLargeData => "TypeError",
      ExportPrivateKeyPemError::Der(_) => "Error",
    }
  }

  pub fn get_x509_public_key_error(e: &X509PublicKeyError) -> &'static str {
    match e {
      X509PublicKeyError::X509(_) => "Error",
      X509PublicKeyError::Rsa(_) => "Error",
      X509PublicKeyError::Asn1(_) => "Error",
      X509PublicKeyError::Ec(_) => "Error",
      X509PublicKeyError::UnsupportedEcNamedCurve => "TypeError",
      X509PublicKeyError::MissingEcParameters => "TypeError",
      X509PublicKeyError::MalformedDssPublicKey => "TypeError",
      X509PublicKeyError::UnsupportedX509KeyType => "TypeError",
    }
  }

  pub fn get_rsa_jwk_error(e: &RsaJwkError) -> &'static str {
    match e {
      RsaJwkError::Base64(_) => "Error",
      RsaJwkError::Rsa(_) => "Error",
      RsaJwkError::MissingRsaPrivateComponent => "TypeError",
    }
  }

  pub fn get_ec_jwk_error(e: &EcJwkError) -> &'static str {
    match e {
      EcJwkError::Ec(_) => "Error",
      EcJwkError::UnsupportedCurve(_) => "TypeError",
    }
  }

  pub fn get_ed_raw_error(e: &EdRawError) -> &'static str {
    match e {
      EdRawError::Ed25519Signature(_) => "Error",
      EdRawError::InvalidEd25519Key => "TypeError",
      EdRawError::UnsupportedCurve => "TypeError",
    }
  }

  pub fn get_pbkdf2_error(e: &Pbkdf2Error) -> &'static str {
    match e {
      Pbkdf2Error::UnsupportedDigest(_) => "TypeError",
      Pbkdf2Error::Join(_) => "Error",
    }
  }

  pub fn get_scrypt_async_error(e: &ScryptAsyncError) -> &'static str {
    match e {
      ScryptAsyncError::Join(_) => "Error",
      ScryptAsyncError::Other(e) => get_error_class_name(e).unwrap_or("Error"),
    }
  }

  pub fn get_hkdf_error_error(e: &HkdfError) -> &'static str {
    match e {
      HkdfError::ExpectedSecretKey => "TypeError",
      HkdfError::HkdfExpandFailed => "TypeError",
      HkdfError::UnsupportedDigest(_) => "TypeError",
      HkdfError::Join(_) => "Error",
    }
  }

  pub fn get_rsa_pss_params_parse_error(
    _: &RsaPssParamsParseError,
  ) -> &'static str {
    "TypeError"
  }

  pub fn get_asymmetric_private_key_error(
    e: &AsymmetricPrivateKeyError,
  ) -> &'static str {
    match e {
      AsymmetricPrivateKeyError::InvalidPemPrivateKeyInvalidUtf8(_) => "TypeError",
      AsymmetricPrivateKeyError::InvalidEncryptedPemPrivateKey => "TypeError",
      AsymmetricPrivateKeyError::InvalidPemPrivateKey => "TypeError",
      AsymmetricPrivateKeyError::EncryptedPrivateKeyRequiresPassphraseToDecrypt => "TypeError",
      AsymmetricPrivateKeyError::InvalidPkcs1PrivateKey => "TypeError",
      AsymmetricPrivateKeyError::InvalidSec1PrivateKey => "TypeError",
      AsymmetricPrivateKeyError::UnsupportedPemLabel(_) => "TypeError",
      AsymmetricPrivateKeyError::RsaPssParamsParse(e) => get_rsa_pss_params_parse_error(e),
      AsymmetricPrivateKeyError::InvalidEncryptedPkcs8PrivateKey => "TypeError",
      AsymmetricPrivateKeyError::InvalidPkcs8PrivateKey => "TypeError",
      AsymmetricPrivateKeyError::Pkcs1PrivateKeyDoesNotSupportEncryptionWithPassphrase => "TypeError",
      AsymmetricPrivateKeyError::Sec1PrivateKeyDoesNotSupportEncryptionWithPassphrase => "TypeError",
      AsymmetricPrivateKeyError::UnsupportedEcNamedCurve => "TypeError",
      AsymmetricPrivateKeyError::InvalidPrivateKey => "TypeError",
      AsymmetricPrivateKeyError::InvalidDsaPrivateKey => "TypeError",
      AsymmetricPrivateKeyError::MalformedOrMissingNamedCurveInEcParameters => "TypeError",
      AsymmetricPrivateKeyError::UnsupportedKeyType(_) => "TypeError",
      AsymmetricPrivateKeyError::UnsupportedKeyFormat(_) => "TypeError",
      AsymmetricPrivateKeyError::InvalidX25519PrivateKey => "TypeError",
      AsymmetricPrivateKeyError::X25519PrivateKeyIsWrongLength => "TypeError",
      AsymmetricPrivateKeyError::InvalidEd25519PrivateKey => "TypeError",
      AsymmetricPrivateKeyError::MissingDhParameters => "TypeError",
      AsymmetricPrivateKeyError::UnsupportedPrivateKeyOid => "TypeError",
    }
  }

  pub fn get_asymmetric_public_key_error(
    e: &AsymmetricPublicKeyError,
  ) -> &'static str {
    match e {
      AsymmetricPublicKeyError::InvalidPemPrivateKeyInvalidUtf8(_) => {
        "TypeError"
      }
      AsymmetricPublicKeyError::InvalidPemPublicKey => "TypeError",
      AsymmetricPublicKeyError::InvalidPkcs1PublicKey => "TypeError",
      AsymmetricPublicKeyError::AsymmetricPrivateKey(e) => {
        get_asymmetric_private_key_error(e)
      }
      AsymmetricPublicKeyError::InvalidX509Certificate => "TypeError",
      AsymmetricPublicKeyError::X509(_) => "Error",
      AsymmetricPublicKeyError::X509PublicKey(e) => {
        get_x509_public_key_error(e)
      }
      AsymmetricPublicKeyError::UnsupportedPemLabel(_) => "TypeError",
      AsymmetricPublicKeyError::InvalidSpkiPublicKey => "TypeError",
      AsymmetricPublicKeyError::UnsupportedKeyType(_) => "TypeError",
      AsymmetricPublicKeyError::UnsupportedKeyFormat(_) => "TypeError",
      AsymmetricPublicKeyError::Spki(_) => "Error",
      AsymmetricPublicKeyError::Pkcs1(_) => "Error",
      AsymmetricPublicKeyError::RsaPssParamsParse(_) => "TypeError",
      AsymmetricPublicKeyError::MalformedDssPublicKey => "TypeError",
      AsymmetricPublicKeyError::MalformedOrMissingNamedCurveInEcParameters => {
        "TypeError"
      }
      AsymmetricPublicKeyError::MalformedOrMissingPublicKeyInEcSpki => {
        "TypeError"
      }
      AsymmetricPublicKeyError::Ec(_) => "Error",
      AsymmetricPublicKeyError::UnsupportedEcNamedCurve => "TypeError",
      AsymmetricPublicKeyError::MalformedOrMissingPublicKeyInX25519Spki => {
        "TypeError"
      }
      AsymmetricPublicKeyError::X25519PublicKeyIsTooShort => "TypeError",
      AsymmetricPublicKeyError::InvalidEd25519PublicKey => "TypeError",
      AsymmetricPublicKeyError::MissingDhParameters => "TypeError",
      AsymmetricPublicKeyError::MalformedDhParameters => "TypeError",
      AsymmetricPublicKeyError::MalformedOrMissingPublicKeyInDhSpki => {
        "TypeError"
      }
      AsymmetricPublicKeyError::UnsupportedPrivateKeyOid => "TypeError",
    }
  }

  pub fn get_private_encrypt_decrypt_error(
    e: &PrivateEncryptDecryptError,
  ) -> &'static str {
    match e {
      PrivateEncryptDecryptError::Pkcs8(_) => "Error",
      PrivateEncryptDecryptError::Spki(_) => "Error",
      PrivateEncryptDecryptError::Utf8(_) => "Error",
      PrivateEncryptDecryptError::Rsa(_) => "Error",
      PrivateEncryptDecryptError::UnknownPadding => "TypeError",
    }
  }

  pub fn get_ecdh_encode_pub_key_error(e: &EcdhEncodePubKey) -> &'static str {
    match e {
      EcdhEncodePubKey::InvalidPublicKey => "TypeError",
      EcdhEncodePubKey::UnsupportedCurve => "TypeError",
      EcdhEncodePubKey::Sec1(_) => "Error",
    }
  }

  pub fn get_ecdh_error(_: &EcdhError) -> &'static str {
    "TypeError"
  }

  pub fn get_diffie_hellman_error(_: &DiffieHellmanError) -> &'static str {
    "TypeError"
  }

  pub fn get_sign_ed25519_error(_: &SignEd25519Error) -> &'static str {
    "TypeError"
  }

  pub fn get_verify_ed25519_error(_: &VerifyEd25519Error) -> &'static str {
    "TypeError"
  }
}

// fn get_os_error(error: &OsError) -> &'static str {
//   match error {
//     OsError::Permission(e) => get_permission_check_error_class(e),
//     OsError::InvalidUtf8(_) => "InvalidData",
//     OsError::EnvEmptyKey => "TypeError",
//     OsError::EnvInvalidKey(_) => "TypeError",
//     OsError::EnvInvalidValue(_) => "TypeError",
//     OsError::Io(e) => get_io_error_class(e),
//     OsError::Var(e) => get_env_var_error_class(e),
//   }
// }

// fn get_sync_fetch_error(error: &SyncFetchError) -> &'static str {
//   match error {
//     SyncFetchError::BlobUrlsNotSupportedInContext => "TypeError",
//     SyncFetchError::Io(e) => get_io_error_class(e),
//     SyncFetchError::InvalidScriptUrl => "TypeError",
//     SyncFetchError::InvalidStatusCode(_) => "TypeError",
//     SyncFetchError::ClassicScriptSchemeUnsupportedInWorkers(_) => "TypeError",
//     SyncFetchError::InvalidUri(_) => "Error",
//     SyncFetchError::InvalidMimeType(_) => "DOMExceptionNetworkError",
//     SyncFetchError::MissingMimeType => "DOMExceptionNetworkError",
//     SyncFetchError::Fetch(e) => get_fetch_error(e),
//     SyncFetchError::Join(_) => "Error",
//     SyncFetchError::Other(e) => get_error_class_name(e).unwrap_or("Error"),
//   }
// }

pub fn get_error_class_name(e: &AnyError) -> Option<&'static str> {
  deno_core::error::get_custom_error_class(e)
    .or_else(|| {
      e.downcast_ref::<ChildPermissionError>()
        .map(get_child_permission_error)
    })
    .or_else(|| {
      e.downcast_ref::<PermissionCheckError>()
        .map(get_permission_check_error_class)
    })
    .or_else(|| {
      e.downcast_ref::<PermissionError>()
        .map(get_permission_error_class)
    })
    .or_else(|| e.downcast_ref::<FsError>().map(get_fs_error))
    .or_else(|| {
      e.downcast_ref::<node::BlocklistError>()
        .map(node::get_blocklist_error)
    })
    .or_else(|| e.downcast_ref::<node::FsError>().map(node::get_fs_error))
    .or_else(|| {
      e.downcast_ref::<node::IdnaError>()
        .map(node::get_idna_error)
    })
    .or_else(|| {
      e.downcast_ref::<node::IpcJsonStreamError>()
        .map(node::get_ipc_json_stream_error)
    })
    .or_else(|| e.downcast_ref::<node::IpcError>().map(node::get_ipc_error))
    .or_else(|| {
      e.downcast_ref::<node::WorkerThreadsFilenameError>()
        .map(node::get_worker_threads_filename_error)
    })
    .or_else(|| {
      e.downcast_ref::<node::RequireError>()
        .map(node::get_require_error)
    })
    .or_else(|| {
      e.downcast_ref::<node::Http2Error>()
        .map(node::get_http2_error)
    })
    .or_else(|| e.downcast_ref::<node::OsError>().map(node::get_os_error))
    .or_else(|| {
      e.downcast_ref::<node::BrotliError>()
        .map(node::get_brotli_error)
    })
    .or_else(|| {
      e.downcast_ref::<node::ModeError>()
        .map(node::get_mode_error)
    })
    .or_else(|| {
      e.downcast_ref::<node::ZlibError>()
        .map(node::get_zlib_error)
    })
    .or_else(|| {
      e.downcast_ref::<node::CipherError>()
        .map(node::get_crypto_cipher_error)
    })
    .or_else(|| {
      e.downcast_ref::<node::CipherContextError>()
        .map(node::get_crypto_cipher_context_error)
    })
    .or_else(|| {
      e.downcast_ref::<node::DecipherError>()
        .map(node::get_crypto_decipher_error)
    })
    .or_else(|| {
      e.downcast_ref::<node::DecipherContextError>()
        .map(node::get_crypto_decipher_context_error)
    })
    .or_else(|| {
      e.downcast_ref::<node::X509Error>()
        .map(node::get_x509_error)
    })
    .or_else(|| {
      e.downcast_ref::<node::KeyObjectHandlePrehashedSignAndVerifyError>()
        .map(node::get_crypto_key_object_handle_prehashed_sign_and_verify_error)
    })
    .or_else(|| {
      e.downcast_ref::<node::HashError>()
        .map(node::get_crypto_hash_error)
    })
    .or_else(|| {
      e.downcast_ref::<node::AsymmetricPublicKeyJwkError>()
        .map(node::get_asymmetric_public_key_jwk_error)
    })
    .or_else(|| {
      e.downcast_ref::<node::GenerateRsaPssError>()
        .map(node::get_generate_rsa_pss_error)
    })
    .or_else(|| {
      e.downcast_ref::<node::AsymmetricPrivateKeyDerError>()
        .map(node::get_asymmetric_private_key_der_error)
    })
    .or_else(|| {
      e.downcast_ref::<node::AsymmetricPublicKeyDerError>()
        .map(node::get_asymmetric_public_key_der_error)
    })
    .or_else(|| {
      e.downcast_ref::<node::ExportPublicKeyPemError>()
        .map(node::get_export_public_key_pem_error)
    })
    .or_else(|| {
      e.downcast_ref::<node::ExportPrivateKeyPemError>()
        .map(node::get_export_private_key_pem_error)
    })
    .or_else(|| {
      e.downcast_ref::<node::RsaJwkError>()
        .map(node::get_rsa_jwk_error)
    })
    .or_else(|| {
      e.downcast_ref::<node::EcJwkError>()
        .map(node::get_ec_jwk_error)
    })
    .or_else(|| {
      e.downcast_ref::<node::EdRawError>()
        .map(node::get_ed_raw_error)
    })
    .or_else(|| {
      e.downcast_ref::<node::Pbkdf2Error>()
        .map(node::get_pbkdf2_error)
    })
    .or_else(|| {
      e.downcast_ref::<node::ScryptAsyncError>()
        .map(node::get_scrypt_async_error)
    })
    .or_else(|| {
      e.downcast_ref::<node::HkdfError>()
        .map(node::get_hkdf_error_error)
    })
    .or_else(|| {
      e.downcast_ref::<node::RsaPssParamsParseError>()
        .map(node::get_rsa_pss_params_parse_error)
    })
    .or_else(|| {
      e.downcast_ref::<node::AsymmetricPrivateKeyError>()
        .map(node::get_asymmetric_private_key_error)
    })
    .or_else(|| {
      e.downcast_ref::<node::AsymmetricPublicKeyError>()
        .map(node::get_asymmetric_public_key_error)
    })
    .or_else(|| {
      e.downcast_ref::<node::PrivateEncryptDecryptError>()
        .map(node::get_private_encrypt_decrypt_error)
    })
    .or_else(|| {
      e.downcast_ref::<node::EcdhEncodePubKey>()
        .map(node::get_ecdh_encode_pub_key_error)
    })
    .or_else(|| {
      e.downcast_ref::<node::EcdhError>()
        .map(node::get_ecdh_error)
    })
    .or_else(|| {
      e.downcast_ref::<node::DiffieHellmanError>()
        .map(node::get_diffie_hellman_error)
    })
    .or_else(|| {
      e.downcast_ref::<node::SignEd25519Error>()
        .map(node::get_sign_ed25519_error)
    })
    .or_else(|| {
      e.downcast_ref::<node::VerifyEd25519Error>()
        .map(node::get_verify_ed25519_error)
    })
    // .or_else(|| e.downcast_ref::<NApiError>().map(get_napi_error_class))
    .or_else(|| e.downcast_ref::<WebError>().map(get_web_error_class))
    // .or_else(|| {
    //   e.downcast_ref::<CreateWorkerError>()
    //     .map(get_create_worker_error)
    // })
    // .or_else(|| e.downcast_ref::<TtyError>().map(get_tty_error))
    // .or_else(|| e.downcast_ref::<ReadlineError>().map(get_readline_error))
    // .or_else(|| e.downcast_ref::<SignalError>().map(get_signal_error))
    // .or_else(|| e.downcast_ref::<FsEventsError>().map(get_fs_events_error))
    // .or_else(|| e.downcast_ref::<HttpStartError>().map(get_http_start_error))
    // .or_else(|| e.downcast_ref::<ProcessError>().map(get_process_error))
    // .or_else(|| e.downcast_ref::<OsError>().map(get_os_error))
    // .or_else(|| e.downcast_ref::<SyncFetchError>().map(get_sync_fetch_error))
    .or_else(|| {
      e.downcast_ref::<CompressionError>()
        .map(get_web_compression_error_class)
    })
    .or_else(|| {
      e.downcast_ref::<MessagePortError>()
        .map(get_web_message_port_error_class)
    })
    .or_else(|| {
      e.downcast_ref::<StreamResourceError>()
        .map(get_web_stream_resource_error_class)
    })
    .or_else(|| e.downcast_ref::<BlobError>().map(get_web_blob_error_class))
    // .or_else(|| e.downcast_ref::<IRError>().map(|_| "TypeError"))
    // .or_else(|| e.downcast_ref::<ReprError>().map(get_ffi_repr_error_class))
    .or_else(|| e.downcast_ref::<HttpError>().map(get_http_error))
    .or_else(|| e.downcast_ref::<HttpNextError>().map(get_http_next_error))
    .or_else(|| {
      e.downcast_ref::<WebSocketUpgradeError>()
        .map(get_websocket_upgrade_error)
    })
    .or_else(|| e.downcast_ref::<FsOpsError>().map(get_fs_ops_error))
    // .or_else(|| {
    //   e.downcast_ref::<DlfcnError>()
    //     .map(get_ffi_dlfcn_error_class)
    // })
    // .or_else(|| {
    //   e.downcast_ref::<StaticError>()
    //     .map(get_ffi_static_error_class)
    // })
    // .or_else(|| {
    //   e.downcast_ref::<CallbackError>()
    //     .map(get_ffi_callback_error_class)
    // })
    // .or_else(|| e.downcast_ref::<CallError>().map(get_ffi_call_error_class))
    .or_else(|| e.downcast_ref::<TlsError>().map(get_tls_error_class))
    // .or_else(|| e.downcast_ref::<CronError>().map(get_cron_error_class))
    // .or_else(|| e.downcast_ref::<CanvasError>().map(get_canvas_error))
    // .or_else(|| e.downcast_ref::<CacheError>().map(get_cache_error))
    .or_else(|| e.downcast_ref::<WebsocketError>().map(get_websocket_error))
    .or_else(|| {
      e.downcast_ref::<HandshakeError>()
        .map(get_websocket_handshake_error)
    })
    // .or_else(|| e.downcast_ref::<KvError>().map(get_kv_error))
    .or_else(|| e.downcast_ref::<FetchError>().map(get_fetch_error))
    .or_else(|| {
      e.downcast_ref::<HttpClientCreateError>()
        .map(get_http_client_create_error)
    })
    .or_else(|| e.downcast_ref::<NetError>().map(get_net_error))
    .or_else(|| {
      e.downcast_ref::<deno_net::io::MapError>()
        .map(get_net_map_error)
    })
    // .or_else(|| {
    //   e.downcast_ref::<BroadcastChannelError>()
    //     .map(get_broadcast_channel_error)
    // })
    // .or_else(|| {
    //   e.downcast_ref::<deno_webgpu::InitError>()
    //     .map(get_webgpu_error_class)
    // })
    // .or_else(|| {
    //   e.downcast_ref::<deno_webgpu::buffer::BufferError>()
    //     .map(get_webgpu_buffer_error_class)
    // })
    // .or_else(|| {
    //   e.downcast_ref::<deno_webgpu::bundle::BundleError>()
    //     .map(get_webgpu_bundle_error_class)
    // })
    // .or_else(|| {
    //   e.downcast_ref::<deno_webgpu::byow::ByowError>()
    //     .map(get_webgpu_byow_error_class)
    // })
    // .or_else(|| {
    //   e.downcast_ref::<deno_webgpu::render_pass::RenderPassError>()
    //     .map(get_webgpu_render_pass_error_class)
    // })
    // .or_else(|| {
    //   e.downcast_ref::<deno_webgpu::surface::SurfaceError>()
    //     .map(get_webgpu_surface_error_class)
    // })
    .or_else(|| {
      e.downcast_ref::<DecryptError>()
        .map(get_crypto_decrypt_error_class)
    })
    .or_else(|| {
      e.downcast_ref::<EncryptError>()
        .map(get_crypto_encrypt_error_class)
    })
    .or_else(|| {
      e.downcast_ref::<deno_crypto::SharedError>()
        .map(get_crypto_shared_error_class)
    })
    .or_else(|| {
      e.downcast_ref::<deno_crypto::Ed25519Error>()
        .map(get_crypto_ed25519_error_class)
    })
    .or_else(|| {
      e.downcast_ref::<ExportKeyError>()
        .map(get_crypto_export_key_error_class)
    })
    .or_else(|| {
      e.downcast_ref::<GenerateKeyError>()
        .map(get_crypto_generate_key_error_class)
    })
    .or_else(|| {
      e.downcast_ref::<ImportKeyError>()
        .map(get_crypto_import_key_error_class)
    })
    .or_else(|| {
      e.downcast_ref::<deno_crypto::X448Error>()
        .map(get_crypto_x448_error_class)
    })
    .or_else(|| {
      e.downcast_ref::<deno_crypto::X25519Error>()
        .map(get_crypto_x25519_error_class)
    })
    .or_else(|| {
      e.downcast_ref::<deno_crypto::Error>()
        .map(get_crypto_error_class)
    })
    .or_else(|| {
      e.downcast_ref::<WebStorageError>()
        .map(get_webstorage_class_name)
    })
    .or_else(|| {
      e.downcast_ref::<deno_url::UrlPatternError>()
        .map(|_| "TypeError")
    })
    // .or_else(|| {
    //   e.downcast_ref::<dlopen2::Error>()
    //     .map(get_dlopen_error_class)
    // })
    .or_else(|| e.downcast_ref::<hyper::Error>().map(get_hyper_error_class))
    .or_else(|| {
      e.downcast_ref::<hyper_util::client::legacy::Error>()
        .map(get_hyper_util_error_class)
    })
    .or_else(|| {
      e.downcast_ref::<hyper_v014::Error>()
        .map(get_hyper_v014_error_class)
    })
    .or_else(|| {
      e.downcast_ref::<Arc<hyper_v014::Error>>()
        .map(|e| get_hyper_v014_error_class(e))
    })
    .or_else(|| {
      e.downcast_ref::<deno_core::Canceled>().map(|e| {
        let io_err: io::Error = e.to_owned().into();
        get_io_error_class(&io_err)
      })
    })
    .or_else(|| {
      e.downcast_ref::<env::VarError>()
        .map(get_env_var_error_class)
    })
    .or_else(|| e.downcast_ref::<io::Error>().map(get_io_error_class))
    .or_else(|| {
      e.downcast_ref::<ModuleResolutionError>()
        .map(get_module_resolution_error_class)
    })
    .or_else(|| {
      e.downcast_ref::<notify::Error>()
        .map(get_notify_error_class)
    })
    .or_else(|| e.downcast_ref::<regex::Error>().map(get_regex_error_class))
    .or_else(|| {
      e.downcast_ref::<serde_json::error::Error>()
        .map(get_serde_json_error_class)
    })
    .or_else(|| {
      e.downcast_ref::<url::ParseError>()
        .map(get_url_parse_error_class)
    })
    // .or_else(|| {
    //   e.downcast_ref::<deno_kv::sqlite::SqliteBackendError>()
    //     .map(|_| "TypeError")
    // })
    .or_else(|| {
      #[cfg(unix)]
      let maybe_get_nix_error_class =
        || e.downcast_ref::<nix::Error>().map(get_nix_error_class);
      #[cfg(not(unix))]
      let maybe_get_nix_error_class = || Option::<&'static str>::None;
      (maybe_get_nix_error_class)()
    })
}
