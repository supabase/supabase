// Copyright 2018-2024 the Deno authors. MIT license.

use std::collections::LinkedList;
use std::collections::VecDeque;

const CHUNK_SIZE: usize = 1024;

/// A queue that stores elements in chunks in a linked list
/// to reduce allocations.
pub(crate) struct ChunkedQueue<T> {
  chunks: LinkedList<VecDeque<T>>,
}

impl<T> Default for ChunkedQueue<T> {
  fn default() -> Self {
    Self {
      chunks: Default::default(),
    }
  }
}

impl<T> ChunkedQueue<T> {
  pub fn len(&self) -> usize {
    match self.chunks.len() {
      0 => 0,
      1 => self.chunks.front().unwrap().len(),
      2 => {
        self.chunks.front().unwrap().len() + self.chunks.back().unwrap().len()
      }
      _ => {
        self.chunks.front().unwrap().len()
          + CHUNK_SIZE * (self.chunks.len() - 2)
          + self.chunks.back().unwrap().len()
      }
    }
  }

  pub fn push_back(&mut self, value: T) {
    if let Some(tail) = self.chunks.back_mut() {
      if tail.len() < CHUNK_SIZE {
        tail.push_back(value);
        return;
      }
    }
    let mut new_buffer = VecDeque::with_capacity(CHUNK_SIZE);
    new_buffer.push_back(value);
    self.chunks.push_back(new_buffer);
  }

  pub fn pop_front(&mut self) -> Option<T> {
    if let Some(head) = self.chunks.front_mut() {
      let value = head.pop_front();
      if value.is_some() && head.is_empty() && self.chunks.len() > 1 {
        self.chunks.pop_front().unwrap();
      }
      value
    } else {
      None
    }
  }
}

#[cfg(test)]
mod test {
  use super::CHUNK_SIZE;

  #[test]
  fn ensure_len_correct() {
    let mut queue = super::ChunkedQueue::default();
    for _ in 0..2 {
      for i in 0..CHUNK_SIZE * 20 {
        queue.push_back(i);
        assert_eq!(queue.len(), i + 1);
      }
      for i in (0..CHUNK_SIZE * 20).rev() {
        queue.pop_front();
        assert_eq!(queue.len(), i);
      }
      assert_eq!(queue.len(), 0);
    }
  }
}
