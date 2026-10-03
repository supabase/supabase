// Copyright 2018-2024 the Deno authors. All rights reserved. MIT license.
use std::future::Future;
use std::io;
use std::net::SocketAddr;
use std::pin::Pin;
use std::task::Poll;
use std::task::{self};
use std::vec;

use hickory_resolver::name_server::TokioConnectionProvider;
use hyper_util::client::legacy::connect::dns::GaiResolver;
use hyper_util::client::legacy::connect::dns::Name;
use tokio::task::JoinHandle;
use tower::Service;

#[derive(Clone, Debug)]
pub enum Resolver {
  /// A resolver using blocking `getaddrinfo` calls in a threadpool.
  Gai(GaiResolver),
  /// hickory-resolver's userspace resolver.
  Hickory(hickory_resolver::Resolver<TokioConnectionProvider>),
}

impl Default for Resolver {
  fn default() -> Self {
    Self::gai()
  }
}

impl Resolver {
  pub fn gai() -> Self {
    Self::Gai(GaiResolver::new())
  }

  /// Create a [`AsyncResolver`] from system conf.
  pub fn hickory() -> Result<Self, hickory_resolver::ResolveError> {
    Ok(Self::Hickory(
      hickory_resolver::Resolver::tokio_from_system_conf()?,
    ))
  }

  pub fn hickory_from_resolver(
    resolver: hickory_resolver::Resolver<TokioConnectionProvider>,
  ) -> Self {
    Self::Hickory(resolver)
  }
}

type SocketAddrs = vec::IntoIter<SocketAddr>;

pub struct ResolveFut {
  inner: JoinHandle<Result<SocketAddrs, io::Error>>,
}

impl Future for ResolveFut {
  type Output = Result<SocketAddrs, io::Error>;

  fn poll(
    mut self: Pin<&mut Self>,
    cx: &mut task::Context<'_>,
  ) -> Poll<Self::Output> {
    Pin::new(&mut self.inner).poll(cx).map(|res| match res {
      Ok(Ok(addrs)) => Ok(addrs),
      Ok(Err(e)) => Err(e),
      Err(join_err) => {
        if join_err.is_cancelled() {
          Err(io::Error::new(io::ErrorKind::Interrupted, join_err))
        } else {
          Err(io::Error::new(io::ErrorKind::Other, join_err))
        }
      }
    })
  }
}

impl Service<Name> for Resolver {
  type Response = SocketAddrs;
  type Error = io::Error;
  type Future = ResolveFut;

  fn poll_ready(
    &mut self,
    _cx: &mut task::Context<'_>,
  ) -> Poll<Result<(), io::Error>> {
    Poll::Ready(Ok(()))
  }

  fn call(&mut self, name: Name) -> Self::Future {
    let task = match self {
      Resolver::Gai(gai_resolver) => {
        let mut resolver = gai_resolver.clone();
        tokio::spawn(async move {
          let result = resolver.call(name).await?;
          let x: Vec<_> = result.into_iter().collect();
          let iter: SocketAddrs = x.into_iter();
          Ok(iter)
        })
      }
      Resolver::Hickory(async_resolver) => {
        let resolver = async_resolver.clone();
        tokio::spawn(async move {
          let result = resolver.lookup_ip(name.as_str()).await?;

          let x: Vec<_> =
            result.into_iter().map(|x| SocketAddr::new(x, 0)).collect();
          let iter: SocketAddrs = x.into_iter();
          Ok(iter)
        })
      }
    };
    ResolveFut { inner: task }
  }
}
