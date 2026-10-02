use std::io::Write;

struct CliLogger {
  logger: env_logger::Logger,
}

impl CliLogger {
  fn new(log_level: log::Level, include_source: bool) -> Self {
    let logger = env_logger::Builder::from_env(
      env_logger::Env::default()
        .default_filter_or(log_level.to_level_filter().to_string()),
    )
    .format(move |buf, record| {
      let mut preamble = "".to_string();
      if include_source {
        preamble = format!(
          "{}-{}: ",
          record.file().unwrap_or("unknown"),
          record.line().unwrap_or(0)
        )
      }

      if record.level() == log::Level::Debug {
        writeln!(buf, "{}{} {}", preamble, record.level(), record.args())
      } else {
        writeln!(buf, "{}{}", preamble, record.args())
      }
    })
    .build();
    Self { logger }
  }

  pub fn filter(&self) -> log::LevelFilter {
    self.logger.filter()
  }
}

impl log::Log for CliLogger {
  fn enabled(&self, metadata: &log::Metadata) -> bool {
    self.logger.enabled(metadata)
  }

  fn log(&self, record: &log::Record) {
    if self.enabled(record.metadata()) {
      self.logger.log(record);
    }
  }

  fn flush(&self) {
    self.logger.flush();
  }
}

pub fn init(verbose: bool, include_source: bool) {
  let log_level = if verbose {
    log::Level::Debug
  } else {
    log::Level::Info
  };

  let cli_logger = CliLogger::new(log_level, include_source);
  let max_level = cli_logger.filter();
  let r = log::set_boxed_logger(Box::new(cli_logger));
  if r.is_ok() {
    log::set_max_level(max_level);
  }
  r.expect("Could not install logger.");
}
