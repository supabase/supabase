module Main (main) where

import Protolude
import System.IO (BufferMode (..), hSetBuffering)

import PostgREST.CLI qualified as CLI

main :: IO ()
main = do
  setBuffering
  opts <- CLI.readCLIShowHelp
  CLI.main opts

setBuffering :: IO ()
setBuffering = do
  -- LineBuffering: the entire output buffer is flushed whenever a newline is
  -- output, the buffer overflows, a hFlush is issued or the handle is closed
  hSetBuffering stdout LineBuffering
  hSetBuffering stdin LineBuffering
  hSetBuffering stderr LineBuffering
