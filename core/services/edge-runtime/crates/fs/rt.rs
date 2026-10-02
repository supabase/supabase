use once_cell::sync::Lazy;

pub static IO_RT: Lazy<tokio::runtime::Runtime> = Lazy::new(|| {
  tokio::runtime::Builder::new_multi_thread()
    .enable_all()
    .thread_name("io")
    .build()
    .unwrap()
});
