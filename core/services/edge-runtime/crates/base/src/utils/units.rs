use num_traits::NumCast;

// bytes size for 1 kibibyte
pub const KIB: u64 = 1_024;
// bytes size for 1 mebibyte
pub const MIB: u64 = 1_048_576;

pub fn mib_to_bytes(val: u64) -> u64 {
  val * MIB
}

fn get_in_format(byte_count: u64, conversion: u64, suffix: &str) -> String {
  let converted_value = byte_count / conversion;
  let decimal = (byte_count % conversion) * 100 / conversion;
  format!("{}.{:0>2}{}", converted_value, decimal, suffix)
}

pub fn bytes_to_display(val: u64) -> String {
  if val < MIB {
    get_in_format(val, KIB, "KiB")
  } else {
    get_in_format(val, MIB, "MiB")
  }
}

// A function that converts a milisecond elapsed time to a string that
// represents a human readable version of that time.
pub fn human_elapsed(elapsed: u64) -> String {
  if elapsed < 1_000 {
    return format!("{}ms", elapsed);
  }
  if elapsed < 1_000 * 60 {
    return format!("{}s", elapsed / 1000);
  }

  let seconds = elapsed / 1_000;
  let minutes = seconds / 60;
  let seconds_remainder = seconds % 60;
  format!("{}m{}s", minutes, seconds_remainder)
}

pub fn percentage_value<T, U>(value: U, percent: T) -> Option<U>
where
  T: NumCast + Ord,
  U: NumCast,
{
  let percent = std::cmp::min(percent, T::from(100)?).to_f64()?;
  let p = percent / 100.0f64;

  if p.is_normal() {
    U::from(value.to_f64()? * p)
  } else {
    None
  }
}
