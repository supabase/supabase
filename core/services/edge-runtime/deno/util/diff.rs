// Copyright 2018-2024 the Deno authors. All rights reserved. MIT license.

#![allow(clippy::write_literal)]

use dissimilar::diff as difference;
use dissimilar::Chunk;
use std::fmt::Write as _;

/// Print diff of the same file_path, before and after formatting.
///
/// Diff format is loosely based on GitHub diff formatting.
pub fn diff(orig_text: &str, edit_text: &str) -> String {
  if orig_text == edit_text {
    return String::new();
  }

  // normalize newlines as it adds too much noise if they differ
  let orig_text = orig_text.replace("\r\n", "\n");
  let edit_text = edit_text.replace("\r\n", "\n");

  if orig_text == edit_text {
    return " | Text differed by line endings.\n".to_string();
  }

  DiffBuilder::build(&orig_text, &edit_text)
}

struct DiffBuilder {
  output: String,
  line_number_width: usize,
  orig_line: usize,
  edit_line: usize,
  orig: String,
  edit: String,
  has_changes: bool,
}

impl DiffBuilder {
  pub fn build(orig_text: &str, edit_text: &str) -> String {
    let mut diff_builder = DiffBuilder {
      output: String::new(),
      orig_line: 1,
      edit_line: 1,
      orig: String::new(),
      edit: String::new(),
      has_changes: false,
      line_number_width: {
        let line_count = std::cmp::max(
          orig_text.split('\n').count(),
          edit_text.split('\n').count(),
        );
        line_count.to_string().chars().count()
      },
    };

    let chunks = difference(orig_text, edit_text);
    diff_builder.handle_chunks(chunks);
    diff_builder.output
  }

  fn handle_chunks<'a>(&'a mut self, chunks: Vec<Chunk<'a>>) {
    for chunk in chunks {
      match chunk {
        Chunk::Delete(s) => {
          let split = s.split('\n').enumerate();
          for (i, s) in split {
            if i > 0 {
              self.orig.push('\n');
            }
            self.orig.push_str(&fmt_rem_text_highlight(s));
          }
          self.has_changes = true
        }
        Chunk::Insert(s) => {
          let split = s.split('\n').enumerate();
          for (i, s) in split {
            if i > 0 {
              self.edit.push('\n');
            }
            self.edit.push_str(&fmt_add_text_highlight(s));
          }
          self.has_changes = true
        }
        Chunk::Equal(s) => {
          let split = s.split('\n').enumerate();
          for (i, s) in split {
            if i > 0 {
              self.flush_changes();
            }
            self.orig.push_str(&fmt_rem_text(s));
            self.edit.push_str(&fmt_add_text(s));
          }
        }
      }
    }

    self.flush_changes();
  }

  fn flush_changes(&mut self) {
    if self.has_changes {
      self.write_line_diff();

      self.orig_line += self.orig.split('\n').count();
      self.edit_line += self.edit.split('\n').count();
      self.has_changes = false;
    } else {
      self.orig_line += 1;
      self.edit_line += 1;
    }

    self.orig.clear();
    self.edit.clear();
  }

  fn write_line_diff(&mut self) {
    let split = self.orig.split('\n').enumerate();
    for (i, s) in split {
      write!(
        self.output,
        "{:width$}{} ",
        self.orig_line + i,
        " |",
        width = self.line_number_width
      )
      .unwrap();
      self.output.push_str(&fmt_rem());
      self.output.push_str(s);
      self.output.push('\n');
    }

    let split = self.edit.split('\n').enumerate();
    for (i, s) in split {
      write!(
        self.output,
        "{:width$}{} ",
        self.edit_line + i,
        " |",
        width = self.line_number_width
      )
      .unwrap();
      self.output.push_str(&fmt_add());
      self.output.push_str(s);
      self.output.push('\n');
    }
  }
}

fn fmt_add() -> String {
  "+".to_string()
}

fn fmt_add_text(x: &str) -> String {
  x.to_string()
}

fn fmt_add_text_highlight(x: &str) -> String {
  x.to_string()
}

fn fmt_rem() -> String {
  "-".to_string()
}

fn fmt_rem_text(x: &str) -> String {
  x.to_string()
}

fn fmt_rem_text_highlight(x: &str) -> String {
  x.to_string()
}
