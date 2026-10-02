// Below is roughly originated from eszip@fix-pub-vis-0-80-1/src/v2.rs

use std::collections::HashMap;
use std::sync::Arc;
use std::sync::Mutex;

use eszip::v2::read_npm_section;
use eszip::v2::Checksum;
use eszip::v2::EszipNpmPackageIndex;
use eszip::v2::EszipV2Module;
use eszip::v2::EszipV2Modules;
use eszip::v2::EszipV2SourceSlot;
use eszip::v2::EszipVersion;
use eszip::v2::Options;
use eszip::v2::Section;
use eszip::EszipV2;
use eszip::ModuleKind;
use eszip::ParseError;
use futures::io::BufReader;
use futures::AsyncRead;
use futures::AsyncReadExt;
use hashlink::LinkedHashMap;

pub async fn parse_v2_header<R: AsyncRead + Unpin>(
  reader: &mut BufReader<R>,
) -> Result<EszipV2, ParseError> {
  let mut magic = [0u8; 8];
  reader.read_exact(&mut magic).await?;

  let Some(version) = EszipVersion::from_magic(&magic) else {
    return Err(ParseError::InvalidV2);
  };

  parse_v2_header_inner(version, reader).await
}

// parse_with_version
async fn parse_v2_header_inner<R: AsyncRead + Unpin>(
  version: EszipVersion,
  mut reader: &mut BufReader<R>,
) -> Result<EszipV2, ParseError> {
  let supports_npm = version != EszipVersion::V2;
  let supports_options = version >= EszipVersion::V2_2;

  let mut options = Options::default_for_version(version);

  if supports_options {
    let mut pre_options = options;
    // First read options without checksum, then reread and validate if necessary
    pre_options.checksum = Some(Checksum::NoChecksum);
    pre_options.checksum_size = None;
    let options_header = Section::read(&mut reader, pre_options).await?;
    if options_header.content_len() % 2 != 0 {
      return Err(ParseError::InvalidV22OptionsHeader(String::from(
        "options are expected to be byte tuples",
      )));
    }

    for option in options_header.content().chunks(2) {
      let (option, value) = (option[0], option[1]);
      match option {
        0 => {
          options.checksum = Checksum::from_u8(value);
        }
        1 => {
          options.checksum_size = Some(value);
        }
        _ => {} // Ignore unknown options for forward compatibility
      }
    }
    if options.checksum_size().is_none() {
      return Err(ParseError::InvalidV22OptionsHeader(String::from(
        "checksum size must be known",
      )));
    }

    if let Some(1..) = options.checksum_size() {
      // If the eszip has some checksum configured, the options header is also checksumed. Reread
      // it again with the checksum and validate it
      let options_header_with_checksum = Section::read_with_size(
        options_header.content().chain(&mut reader),
        options,
        options_header.content_len(),
      )
      .await?;
      if !options_header_with_checksum.is_checksum_valid() {
        return Err(ParseError::InvalidV22OptionsHeaderHash);
      }
    }
  }

  let modules_header = Section::read(&mut reader, options).await?;
  if !modules_header.is_checksum_valid() {
    return Err(ParseError::InvalidV2HeaderHash);
  }

  let mut modules = LinkedHashMap::<String, EszipV2Module>::new();
  let mut npm_specifiers = HashMap::new();

  let mut read = 0;

  // This macro reads n number of bytes from the header section. If the header
  // section is not long enough, this function will be early exited with an
  // error.
  macro_rules! read {
    ($n:expr, $err:expr) => {{
      if read + $n > modules_header.content_len() {
        return Err(ParseError::InvalidV2Header($err));
      }
      let start = read;
      read += $n;
      &modules_header.content()[start..read]
    }};
  }

  while read < modules_header.content_len() {
    let specifier_len =
      u32::from_be_bytes(read!(4, "specifier len").try_into().unwrap())
        as usize;
    let specifier =
      String::from_utf8(read!(specifier_len, "specifier").to_vec())
        .map_err(|_| ParseError::InvalidV2Specifier(read))?;

    let entry_kind = read!(1, "entry kind")[0];
    match entry_kind {
      0 => {
        let source_offset =
          u32::from_be_bytes(read!(4, "source offset").try_into().unwrap());
        let source_len =
          u32::from_be_bytes(read!(4, "source len").try_into().unwrap());
        let source_map_offset =
          u32::from_be_bytes(read!(4, "source map offset").try_into().unwrap());
        let source_map_len =
          u32::from_be_bytes(read!(4, "source map len").try_into().unwrap());
        let kind = match read!(1, "module kind")[0] {
          0 => ModuleKind::JavaScript,
          1 => ModuleKind::Json,
          2 => ModuleKind::Jsonc,
          3 => ModuleKind::OpaqueData,
          4 => ModuleKind::Wasm,
          n => return Err(ParseError::InvalidV2ModuleKind(n, read)),
        };
        let source = if source_offset == 0 && source_len == 0 {
          EszipV2SourceSlot::Ready(Arc::new([]))
        } else {
          EszipV2SourceSlot::Pending {
            offset: source_offset as usize,
            length: source_len as usize,
            wakers: vec![],
          }
        };
        let source_map = if source_map_offset == 0 && source_map_len == 0 {
          EszipV2SourceSlot::Ready(Arc::new([]))
        } else {
          EszipV2SourceSlot::Pending {
            offset: source_map_offset as usize,
            length: source_map_len as usize,
            wakers: vec![],
          }
        };
        let module = EszipV2Module::Module {
          kind,
          source,
          source_map,
        };
        modules.insert(specifier, module);
      }
      1 => {
        let target_len =
          u32::from_be_bytes(read!(4, "target len").try_into().unwrap())
            as usize;
        let target = String::from_utf8(read!(target_len, "target").to_vec())
          .map_err(|_| ParseError::InvalidV2Specifier(read))?;
        modules.insert(specifier, EszipV2Module::Redirect { target });
      }
      2 if supports_npm => {
        // npm specifier
        let pkg_id =
          u32::from_be_bytes(read!(4, "npm package id").try_into().unwrap());
        npm_specifiers.insert(specifier, EszipNpmPackageIndex(pkg_id));
      }
      n => return Err(ParseError::InvalidV2EntryKind(n, read)),
    };
  }

  let npm_snapshot = if supports_npm {
    read_npm_section(reader, options, npm_specifiers).await?
  } else {
    None
  };

  Ok(EszipV2 {
    modules: EszipV2Modules(Arc::new(Mutex::new(modules))),
    npm_snapshot,
    options,
  })
}
