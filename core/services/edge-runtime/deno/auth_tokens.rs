// Copyright 2018-2024 the Deno authors. All rights reserved. MIT license.

use base64::prelude::BASE64_STANDARD;
use base64::Engine;
use deno_core::ModuleSpecifier;
use log::debug;
use log::error;
use std::borrow::Cow;
use std::fmt;
use std::net::IpAddr;
use std::net::Ipv4Addr;
use std::net::Ipv6Addr;
use std::net::SocketAddr;
use std::str::FromStr;

#[derive(Debug, Clone, PartialEq, Eq)]
pub enum AuthTokenData {
  Bearer(String),
  Basic { username: String, password: String },
}

#[derive(Debug, Clone, PartialEq, Eq)]
pub struct AuthToken {
  host: AuthDomain,
  token: AuthTokenData,
}

impl fmt::Display for AuthToken {
  fn fmt(&self, f: &mut fmt::Formatter) -> fmt::Result {
    match &self.token {
      AuthTokenData::Bearer(token) => write!(f, "Bearer {token}"),
      AuthTokenData::Basic { username, password } => {
        let credentials = format!("{username}:{password}");
        write!(f, "Basic {}", BASE64_STANDARD.encode(credentials))
      }
    }
  }
}

/// A structure which contains bearer tokens that can be used when sending
/// requests to websites, intended to authorize access to private resources
/// such as remote modules.
#[derive(Debug, Clone)]
pub struct AuthTokens(Vec<AuthToken>);

/// An authorization domain, either an exact or suffix match.
#[derive(Debug, Clone, PartialEq, Eq)]
pub enum AuthDomain {
  Ip(IpAddr),
  IpPort(SocketAddr),
  /// Suffix match, no dot. May include a port.
  Suffix(Cow<'static, str>),
}

impl<T: ToString> From<T> for AuthDomain {
  fn from(value: T) -> Self {
    let s = value.to_string().to_lowercase();
    if let Ok(ip) = SocketAddr::from_str(&s) {
      return AuthDomain::IpPort(ip);
    };
    if s.starts_with('[') && s.ends_with(']') {
      if let Ok(ip) = Ipv6Addr::from_str(&s[1..s.len() - 1]) {
        return AuthDomain::Ip(ip.into());
      }
    } else if let Ok(ip) = Ipv4Addr::from_str(&s) {
      return AuthDomain::Ip(ip.into());
    }
    if let Some(s) = s.strip_prefix('.') {
      AuthDomain::Suffix(Cow::Owned(s.to_owned()))
    } else {
      AuthDomain::Suffix(Cow::Owned(s))
    }
  }
}

impl AuthDomain {
  pub fn matches(&self, specifier: &ModuleSpecifier) -> bool {
    let Some(host) = specifier.host_str() else {
      return false;
    };
    match *self {
      Self::Ip(ip) => {
        let AuthDomain::Ip(parsed) = AuthDomain::from(host) else {
          return false;
        };
        ip == parsed && specifier.port().is_none()
      }
      Self::IpPort(ip) => {
        let AuthDomain::Ip(parsed) = AuthDomain::from(host) else {
          return false;
        };
        ip.ip() == parsed && specifier.port() == Some(ip.port())
      }
      Self::Suffix(ref suffix) => {
        let hostname = if let Some(port) = specifier.port() {
          Cow::Owned(format!("{}:{}", host, port))
        } else {
          Cow::Borrowed(host)
        };

        if suffix.len() == hostname.len() {
          return suffix == &hostname;
        }

        // If it's a suffix match, ensure a dot
        if hostname.ends_with(suffix.as_ref())
          && hostname.ends_with(&format!(".{suffix}"))
        {
          return true;
        }

        false
      }
    }
  }
}

impl AuthTokens {
  /// Create a new set of tokens based on the provided string. It is intended
  /// that the string be the value of an environment variable and the string is
  /// parsed for token values.  The string is expected to be a semi-colon
  /// separated string, where each value is `{token}@{hostname}`.
  pub fn new(maybe_tokens_str: Option<String>) -> Self {
    let mut tokens = Vec::new();
    if let Some(tokens_str) = maybe_tokens_str {
      for token_str in tokens_str.trim().split(';') {
        if token_str.contains('@') {
          let mut iter = token_str.rsplitn(2, '@');
          let host = AuthDomain::from(iter.next().unwrap());
          let token = iter.next().unwrap();
          if token.contains(':') {
            let mut iter = token.rsplitn(2, ':');
            let password = iter.next().unwrap().to_owned();
            let username = iter.next().unwrap().to_owned();
            tokens.push(AuthToken {
              host,
              token: AuthTokenData::Basic { username, password },
            });
          } else {
            tokens.push(AuthToken {
              host,
              token: AuthTokenData::Bearer(token.to_string()),
            });
          }
        } else {
          error!("Badly formed auth token discarded.");
        }
      }
      debug!("Parsed {} auth token(s).", tokens.len());
    }

    Self(tokens)
  }

  /// Attempt to match the provided specifier to the tokens in the set.  The
  /// matching occurs from the right of the hostname plus port, irrespective of
  /// scheme.  For example `https://www.deno.land:8080/` would match a token
  /// with a host value of `deno.land:8080` but not match `www.deno.land`.  The
  /// matching is case insensitive.
  pub fn get(&self, specifier: &ModuleSpecifier) -> Option<AuthToken> {
    self.0.iter().find_map(|t| {
      if t.host.matches(specifier) {
        Some(t.clone())
      } else {
        None
      }
    })
  }
}
