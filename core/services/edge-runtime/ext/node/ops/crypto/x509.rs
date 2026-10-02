// Copyright 2018-2024 the Deno authors. All rights reserved. MIT license.

use deno_core::op2;

use x509_parser::der_parser::asn1_rs::Any;
use x509_parser::der_parser::asn1_rs::Tag;
use x509_parser::der_parser::oid::Oid;
pub use x509_parser::error::X509Error;
use x509_parser::extensions;
use x509_parser::pem;
use x509_parser::prelude::*;

use super::KeyObjectHandle;

use std::ops::Deref;
use yoke::Yoke;
use yoke::Yokeable;

use digest::Digest;

enum CertificateSources {
  Der(Box<[u8]>),
  Pem(pem::Pem),
}

#[derive(Yokeable)]
struct CertificateView<'a> {
  cert: X509Certificate<'a>,
}

pub(crate) struct Certificate {
  inner: Yoke<CertificateView<'static>, Box<CertificateSources>>,
}

impl deno_core::GarbageCollected for Certificate {}

impl Certificate {
  fn fingerprint<D: Digest>(&self) -> Option<String> {
    if let CertificateSources::Pem(pem) = self.inner.backing_cart().as_ref() {
      let mut hasher = D::new();
      hasher.update(&pem.contents);
      let bytes = hasher.finalize();
      // OpenSSL returns colon separated upper case hex values.
      let mut hex = String::with_capacity(bytes.len() * 2);
      for byte in bytes {
        hex.push_str(&format!("{:02X}:", byte));
      }
      hex.pop();
      Some(hex)
    } else {
      None
    }
  }
}

impl<'a> Deref for CertificateView<'a> {
  type Target = X509Certificate<'a>;

  fn deref(&self) -> &Self::Target {
    &self.cert
  }
}

#[op2]
#[cppgc]
pub fn op_node_x509_parse(
  #[buffer] buf: &[u8],
) -> Result<Certificate, X509Error> {
  let source = match pem::parse_x509_pem(buf) {
    Ok((_, pem)) => CertificateSources::Pem(pem),
    Err(_) => CertificateSources::Der(buf.to_vec().into_boxed_slice()),
  };

  let inner =
    Yoke::<CertificateView<'static>, Box<CertificateSources>>::try_attach_to_cart(
      Box::new(source),
      |source| {
        let cert = match source {
          CertificateSources::Pem(pem) => pem.parse_x509()?,
          CertificateSources::Der(buf) => {
            X509Certificate::from_der(buf).map(|(_, cert)| cert)?
          }
        };
        Ok::<_, X509Error>(CertificateView { cert })
      },
    )?;

  Ok(Certificate { inner })
}

#[op2(fast)]
pub fn op_node_x509_ca(#[cppgc] cert: &Certificate) -> bool {
  let cert = cert.inner.get().deref();
  cert.is_ca()
}

#[op2(fast)]
pub fn op_node_x509_check_email(
  #[cppgc] cert: &Certificate,
  #[string] email: &str,
) -> bool {
  let cert = cert.inner.get().deref();
  let subject = cert.subject();
  if subject
    .iter_email()
    .any(|e| e.as_str().unwrap_or("") == email)
  {
    return true;
  }

  let subject_alt = cert
    .extensions()
    .iter()
    .find(|e| e.oid == x509_parser::oid_registry::OID_X509_EXT_SUBJECT_ALT_NAME)
    .and_then(|e| match e.parsed_extension() {
      extensions::ParsedExtension::SubjectAlternativeName(s) => Some(s),
      _ => None,
    });

  if let Some(subject_alt) = subject_alt {
    for name in &subject_alt.general_names {
      if let extensions::GeneralName::RFC822Name(n) = name {
        if *n == email {
          return true;
        }
      }
    }
  }

  false
}

#[op2]
#[string]
pub fn op_node_x509_fingerprint(#[cppgc] cert: &Certificate) -> Option<String> {
  cert.fingerprint::<sha1::Sha1>()
}

#[op2]
#[string]
pub fn op_node_x509_fingerprint256(
  #[cppgc] cert: &Certificate,
) -> Option<String> {
  cert.fingerprint::<sha2::Sha256>()
}

#[op2]
#[string]
pub fn op_node_x509_fingerprint512(
  #[cppgc] cert: &Certificate,
) -> Option<String> {
  cert.fingerprint::<sha2::Sha512>()
}

#[op2]
#[string]
pub fn op_node_x509_get_issuer(
  #[cppgc] cert: &Certificate,
) -> Result<String, X509Error> {
  let cert = cert.inner.get().deref();
  x509name_to_string(cert.issuer(), oid_registry())
}

#[op2]
#[string]
pub fn op_node_x509_get_subject(
  #[cppgc] cert: &Certificate,
) -> Result<String, X509Error> {
  let cert = cert.inner.get().deref();
  x509name_to_string(cert.subject(), oid_registry())
}

#[op2]
#[cppgc]
pub fn op_node_x509_public_key(
  #[cppgc] cert: &Certificate,
) -> Result<KeyObjectHandle, super::keys::X509PublicKeyError> {
  let cert = cert.inner.get().deref();
  let public_key = &cert.tbs_certificate.subject_pki;

  KeyObjectHandle::new_x509_public_key(public_key)
}

// Attempt to convert attribute to string. If type is not a string, return value is the hex
// encoding of the attribute value
fn attribute_value_to_string(
  attr: &Any,
  _attr_type: &Oid,
) -> Result<String, X509Error> {
  // TODO: replace this with helper function, when it is added to asn1-rs
  match attr.tag() {
    Tag::NumericString
    | Tag::BmpString
    | Tag::VisibleString
    | Tag::PrintableString
    | Tag::GeneralString
    | Tag::ObjectDescriptor
    | Tag::GraphicString
    | Tag::T61String
    | Tag::VideotexString
    | Tag::Utf8String
    | Tag::Ia5String => {
      let s = core::str::from_utf8(attr.data)
        .map_err(|_| X509Error::InvalidAttributes)?;
      Ok(s.to_owned())
    }
    _ => {
      // type is not a string, get slice and convert it to base64
      Ok(data_encoding::HEXUPPER.encode(attr.as_bytes()))
    }
  }
}

fn x509name_to_string(
  name: &X509Name,
  oid_registry: &oid_registry::OidRegistry,
) -> Result<String, x509_parser::error::X509Error> {
  // Lifted from https://github.com/rusticata/x509-parser/blob/4d618c2ed6b1fc102df16797545895f7c67ee0fe/src/x509.rs#L543-L566
  // since it's a private function (Copyright 2017 Pierre Chifflier)
  name.iter_rdn().try_fold(String::new(), |acc, rdn| {
    rdn
      .iter()
      .try_fold(String::new(), |acc2, attr| {
        let val_str =
          attribute_value_to_string(attr.attr_value(), attr.attr_type())?;
        // look ABBREV, and if not found, use shortname
        let abbrev = match oid2abbrev(attr.attr_type(), oid_registry) {
          Ok(s) => String::from(s),
          _ => format!("{:?}", attr.attr_type()),
        };
        let rdn = format!("{}={}", abbrev, val_str);
        match acc2.len() {
          0 => Ok(rdn),
          _ => Ok(acc2 + " + " + rdn.as_str()),
        }
      })
      .map(|v| match acc.len() {
        0 => v,
        _ => acc + "\n" + v.as_str(),
      })
  })
}

#[op2]
#[string]
pub fn op_node_x509_get_valid_from(#[cppgc] cert: &Certificate) -> String {
  let cert = cert.inner.get().deref();
  cert.validity().not_before.to_string()
}

#[op2]
#[string]
pub fn op_node_x509_get_valid_to(#[cppgc] cert: &Certificate) -> String {
  let cert = cert.inner.get().deref();
  cert.validity().not_after.to_string()
}

#[op2]
#[string]
pub fn op_node_x509_get_serial_number(#[cppgc] cert: &Certificate) -> String {
  let cert = cert.inner.get().deref();
  let mut s = cert.serial.to_str_radix(16);
  s.make_ascii_uppercase();
  s
}

#[op2(fast)]
pub fn op_node_x509_key_usage(#[cppgc] cert: &Certificate) -> u16 {
  let cert = cert.inner.get().deref();
  let key_usage = cert
    .extensions()
    .iter()
    .find(|e| e.oid == x509_parser::oid_registry::OID_X509_EXT_KEY_USAGE)
    .and_then(|e| match e.parsed_extension() {
      extensions::ParsedExtension::KeyUsage(k) => Some(k),
      _ => None,
    });

  key_usage.map(|k| k.flags).unwrap_or(0)
}
