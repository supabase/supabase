// Copyright 2018-2024 the Deno authors. All rights reserved. MIT license.
use brotli::enc::backward_references::BrotliEncoderMode;
use brotli::enc::encode::BrotliEncoderCompress;
use brotli::enc::encode::BrotliEncoderOperation;
use brotli::enc::encode::BrotliEncoderParameter;
use brotli::enc::encode::BrotliEncoderStateStruct;
use brotli::writer::StandardAlloc;
use brotli::BrotliDecompressStream;
use brotli::BrotliResult;
use brotli::BrotliState;
use brotli::Decompressor;
use deno_core::op2;
use deno_core::JsBuffer;
use deno_core::OpState;
use deno_core::Resource;
use deno_core::ToJsBuffer;
use std::cell::RefCell;
use std::io::Read;

#[derive(Debug, thiserror::Error)]
pub enum BrotliError {
  #[error("Invalid encoder mode")]
  InvalidEncoderMode,
  #[error("Failed to compress")]
  CompressFailed,
  #[error("Failed to decompress")]
  DecompressFailed,
  #[error(transparent)]
  Join(#[from] tokio::task::JoinError),
  #[error(transparent)]
  Resource(deno_core::error::AnyError),
  #[error("{0}")]
  Io(std::io::Error),
}

fn encoder_mode(mode: u32) -> Result<BrotliEncoderMode, BrotliError> {
  Ok(match mode {
    0 => BrotliEncoderMode::BROTLI_MODE_GENERIC,
    1 => BrotliEncoderMode::BROTLI_MODE_TEXT,
    2 => BrotliEncoderMode::BROTLI_MODE_FONT,
    3 => BrotliEncoderMode::BROTLI_FORCE_LSB_PRIOR,
    4 => BrotliEncoderMode::BROTLI_FORCE_MSB_PRIOR,
    5 => BrotliEncoderMode::BROTLI_FORCE_UTF8_PRIOR,
    6 => BrotliEncoderMode::BROTLI_FORCE_SIGNED_PRIOR,
    _ => return Err(BrotliError::InvalidEncoderMode),
  })
}

#[op2(fast)]
#[number]
pub fn op_brotli_compress(
  #[buffer] buffer: &[u8],
  #[buffer] out: &mut [u8],
  #[smi] quality: i32,
  #[smi] lgwin: i32,
  #[smi] mode: u32,
) -> Result<usize, BrotliError> {
  let mode = encoder_mode(mode)?;
  let mut out_size = out.len();

  let result = BrotliEncoderCompress(
    StandardAlloc::default(),
    &mut StandardAlloc::default(),
    quality,
    lgwin,
    mode,
    buffer.len(),
    buffer,
    &mut out_size,
    out,
    &mut |_, _, _, _| (),
  );
  if result != 1 {
    return Err(BrotliError::CompressFailed);
  }

  Ok(out_size)
}

fn max_compressed_size(input_size: usize) -> usize {
  if input_size == 0 {
    return 2;
  }

  // [window bits / empty metadata] + N * [uncompressed] + [last empty]
  let num_large_blocks = input_size >> 14;
  let overhead = 2 + (4 * num_large_blocks) + 3 + 1;
  let result = input_size + overhead;

  if result < input_size {
    0
  } else {
    result
  }
}

#[op2(async)]
#[serde]
pub async fn op_brotli_compress_async(
  #[buffer] input: JsBuffer,
  #[smi] quality: i32,
  #[smi] lgwin: i32,
  #[smi] mode: u32,
) -> Result<ToJsBuffer, BrotliError> {
  let mode = encoder_mode(mode)?;
  tokio::task::spawn_blocking(move || {
    let input = &*input;
    let mut out = vec![0u8; max_compressed_size(input.len())];
    let mut out_size = out.len();

    let result = BrotliEncoderCompress(
      StandardAlloc::default(),
      &mut StandardAlloc::default(),
      quality,
      lgwin,
      mode,
      input.len(),
      input,
      &mut out_size,
      &mut out,
      &mut |_, _, _, _| (),
    );
    if result != 1 {
      return Err(BrotliError::CompressFailed);
    }

    out.truncate(out_size);
    Ok(out.into())
  })
  .await?
}

struct BrotliCompressCtx {
  inst: RefCell<BrotliEncoderStateStruct<StandardAlloc>>,
}

impl Resource for BrotliCompressCtx {}

#[op2]
#[smi]
pub fn op_create_brotli_compress(
  state: &mut OpState,
  #[serde] params: Vec<(u8, i32)>,
) -> u32 {
  let mut inst = BrotliEncoderStateStruct::new(StandardAlloc::default());

  for (key, value) in params {
    inst.set_parameter(encoder_param(key), value as u32);
  }

  state.resource_table.add(BrotliCompressCtx {
    inst: RefCell::new(inst),
  })
}

fn encoder_param(param: u8) -> BrotliEncoderParameter {
  // SAFETY: BrotliEncoderParam is valid for 0-255
  unsafe { std::mem::transmute(param as u32) }
}

#[op2(fast)]
#[number]
pub fn op_brotli_compress_stream(
  state: &mut OpState,
  #[smi] rid: u32,
  #[buffer] input: &[u8],
  #[buffer] output: &mut [u8],
) -> Result<usize, BrotliError> {
  let ctx = state
    .resource_table
    .get::<BrotliCompressCtx>(rid)
    .map_err(BrotliError::Resource)?;
  let mut inst = ctx.inst.borrow_mut();
  let mut output_offset = 0;

  let result = inst.compress_stream(
    BrotliEncoderOperation::BROTLI_OPERATION_PROCESS,
    &mut input.len(),
    input,
    &mut 0,
    &mut output.len(),
    output,
    &mut output_offset,
    &mut None,
    &mut |_, _, _, _| (),
  );
  if !result {
    return Err(BrotliError::CompressFailed);
  }

  Ok(output_offset)
}

#[op2(fast)]
#[number]
pub fn op_brotli_compress_stream_end(
  state: &mut OpState,
  #[smi] rid: u32,
  #[buffer] output: &mut [u8],
) -> Result<usize, BrotliError> {
  let ctx = state
    .resource_table
    .get::<BrotliCompressCtx>(rid)
    .map_err(BrotliError::Resource)?;
  let mut inst = ctx.inst.borrow_mut();
  let mut output_offset = 0;

  let result = inst.compress_stream(
    BrotliEncoderOperation::BROTLI_OPERATION_FINISH,
    &mut 0,
    &[],
    &mut 0,
    &mut output.len(),
    output,
    &mut output_offset,
    &mut None,
    &mut |_, _, _, _| (),
  );
  if !result {
    return Err(BrotliError::CompressFailed);
  }

  Ok(output_offset)
}

fn brotli_decompress(buffer: &[u8]) -> Result<ToJsBuffer, std::io::Error> {
  let mut output = Vec::with_capacity(4096);
  let mut decompressor = Decompressor::new(buffer, buffer.len());
  decompressor.read_to_end(&mut output)?;
  Ok(output.into())
}

#[op2]
#[serde]
pub fn op_brotli_decompress(
  #[buffer] buffer: &[u8],
) -> Result<ToJsBuffer, std::io::Error> {
  brotli_decompress(buffer)
}

#[op2(async)]
#[serde]
pub async fn op_brotli_decompress_async(
  #[buffer] buffer: JsBuffer,
) -> Result<ToJsBuffer, BrotliError> {
  tokio::task::spawn_blocking(move || {
    brotli_decompress(&buffer).map_err(BrotliError::Io)
  })
  .await?
}

struct BrotliDecompressCtx {
  inst: RefCell<BrotliState<StandardAlloc, StandardAlloc, StandardAlloc>>,
}

impl Resource for BrotliDecompressCtx {}

#[op2(fast)]
#[smi]
pub fn op_create_brotli_decompress(state: &mut OpState) -> u32 {
  let inst = BrotliState::new(
    StandardAlloc::default(),
    StandardAlloc::default(),
    StandardAlloc::default(),
  );
  state.resource_table.add(BrotliDecompressCtx {
    inst: RefCell::new(inst),
  })
}

#[op2(fast)]
#[number]
pub fn op_brotli_decompress_stream(
  state: &mut OpState,
  #[smi] rid: u32,
  #[buffer] input: &[u8],
  #[buffer] output: &mut [u8],
) -> Result<usize, BrotliError> {
  let ctx = state
    .resource_table
    .get::<BrotliDecompressCtx>(rid)
    .map_err(BrotliError::Resource)?;
  let mut inst = ctx.inst.borrow_mut();
  let mut output_offset = 0;

  let result = BrotliDecompressStream(
    &mut input.len(),
    &mut 0,
    input,
    &mut output.len(),
    &mut output_offset,
    output,
    &mut 0,
    &mut inst,
  );
  if matches!(result, BrotliResult::ResultFailure) {
    return Err(BrotliError::DecompressFailed);
  }

  Ok(output_offset)
}

#[op2(fast)]
#[number]
pub fn op_brotli_decompress_stream_end(
  state: &mut OpState,
  #[smi] rid: u32,
  #[buffer] output: &mut [u8],
) -> Result<usize, BrotliError> {
  let ctx = state
    .resource_table
    .get::<BrotliDecompressCtx>(rid)
    .map_err(BrotliError::Resource)?;
  let mut inst = ctx.inst.borrow_mut();
  let mut output_offset = 0;

  let result = BrotliDecompressStream(
    &mut 0,
    &mut 0,
    &[],
    &mut output.len(),
    &mut output_offset,
    output,
    &mut 0,
    &mut inst,
  );
  if matches!(result, BrotliResult::ResultFailure) {
    return Err(BrotliError::DecompressFailed);
  }

  Ok(output_offset)
}
