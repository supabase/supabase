#[rustler::nif]
fn statement_types(query: &str) -> Result<Vec<String>, String> {
    let result = pg_query::parse(query).map_err(|_| "Error parsing query")?;

    let message = result
        .statement_types()
        .into_iter()
        .map(Into::into)
        .collect();
    Ok(message)
}

rustler::init!("Elixir.Supavisor.PgParser");
