
// Simple JavaScript example to take a name input and save it in a Supabase database.

const { createClient } = require("@supabase/supabase-js");
const readline = require("readline");

const supabaseUrl = "replace-with-your-supabase-url";
const supabaseKey =
  "replace-with-your-supabasekey";
const supabase = createClient(supabaseUrl, supabaseKey);

async function fetchTableData(tableName) {
  try {
    const { data, error } = await supabase.from(tableName).select("*");
    if (error) throw error;
    return data;
  } catch (error) {
    console.error("Error fetching data:", error.message);
    return null;
  }
}

async function insertRow(tableName, row) {
  try {
    const { data, error } = await supabase.from(tableName).insert(row);
    if (error) throw error;
    return data;
  } catch (error) {
    console.error("Error inserting row:", error.message);
    return null;
  }
}

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout,
});

async function main() {
  try {
    const name = await new Promise((resolve) => {
      rl.question(" New To-Do ", (answer) => {
        resolve(answer);
      });
    });

    const { data, error } = await supabase
      .from("To-Do-reg")
      .insert({ todo: todo });

    if (error) {
      throw error;
    }

    console.log("Inserted To-do:", todo);
    import("chalk").then((chalk) => {
      console.log(
        chalk.default.blue("To-Do Added!")
      );
    });
  } catch (error) {
    import("chalk").then((chalk) => {
      console.error(chalk.default.red("Error adding To-Do:", error.message));
    });
  } finally {
    rl.close();
  }
}

main();
