import Config

# Print nothing during tests unless captured or a test failure happens
config :logger, level: :debug, default_handler: false
