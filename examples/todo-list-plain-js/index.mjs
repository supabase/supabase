import { createClient } from "@supabase/supabase-js";
import readline from "readline";
import chalk from "chalk";

const supabaseUrl = "YOUR_SUPABASE_URL";
const supabaseKey = "YOUR_SUPABASE_KEY" ;
const supabase = createClient(supabaseUrl, supabaseKey);

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout,
});

async function fetchTodoData() {
  try {
    const { data, error } = await supabase.from("todoreg").select("*");

    if (error) {
      throw error;
    }

    console.log(data);
  } catch (error) {
    console.error("Error fetching data:", error.message);
  }
}

async function main() {
  try {
    const input = await new Promise((resolve) => {
      rl.question(
        "Enter 1 for new todo\nEnter 2 to fetch todo\n\n>> ",
        (answer) => {
          resolve(answer);
        }
      );
    });

    if (input === "2") {
      fetchTodoData();
    } else if (input === "1") {
      try {
        const todo = await new Promise((resolve) => {
          rl.question("New To-Do: ", (answer) => {
            resolve(answer);
          });
        });

        const { data, error } = await supabase.from("todoreg").insert({ todo });

        if (error) {
          throw error;
        }

        console.log("Inserted To-do:", todo);
        console.log(chalk.blue("To-Do Added!"));
      } catch (error) {
        console.error(chalk.red("Error adding To-Do:", error.message));
      }
    } else {
      console.log("Please enter a valid choice!");
    }
  } catch (error) {
    console.error(error);
  } finally {
    rl.close();
  }
}

main();
