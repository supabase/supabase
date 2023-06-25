
// one of the most simplest example of javascript using supabase datbase to take input from user and save it in database.

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
      rl.question("Please enter your username: ", (answer) => {
        resolve(answer);
      });
    });

    const { data, error } = await supabase
      .from("usernames")
      .insert({ name: name });

    if (error) {
      throw error;
    }

    console.log("Inserted name:", name);
    import("chalk").then((chalk) => {
      console.log(
        chalk.default.blue("Thank you! your entry has been done successfully!")
      );
    });
  } catch (error) {
    import("chalk").then((chalk) => {
      console.error(chalk.default.red("Error inserting name:", error.message));
    });
  } finally {
    rl.close();
  }
}

main();
