use deno_core::serde_json::Value;

pub fn merge_object(a: &mut Value, b: &Value) {
  match (a, b) {
    (Value::Object(a), Value::Object(b)) => {
      for (k, v) in b {
        merge_object(a.entry(k.clone()).or_insert(Value::Null), v);
      }
    }
    (a, b) => *a = b.clone(),
  }
}
