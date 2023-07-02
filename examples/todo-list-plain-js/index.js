const { createClient } = require("@supabase/supabase-js");
const readline = require("readline");

const supabaseUrl = "https://mbwscisakidilfvsknjb.supabase.co";
const supabaseKey =
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im1id3NjaXNha2lkaWxmdnNrbmpiIiwicm9sZSI6ImFub24iLCJpYXQiOjE2ODc2NzkxODksImV4cCI6MjAwMzI1NTE4OX0.HTyKnzPEOkAEEkKa83qfCwjiw7eZtwCekOZ9e3IZaxc";
const supabase = createClient(supabaseUrl, supabaseKey);

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

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout,
});

async function main() {
  try {
    const input = await new Promise((resolve) => {
      rl.question(
        "Enter 1 to for new todo\nEnter 2 to fetch todo\n\n>> ",
        (answer) => {
          resolve(answer);
        }
      );
    });
    if (input == "2") {
      fetchTodoData();
    } else if (input == "1") {
      try {
        const todo = await new Promise((resolve) => {
          rl.question(" New To-Do: ", (answer) => {
            resolve(answer);
          });
        });

        const { data, error } = await supabase
          .from("todoreg")
          .insert({ todo: todo });

        if (error) {
          throw error;
        }

        console.log("Inserted To-do:", todo);
        import("chalk").then((chalk) => {
          console.log(chalk.default.blue("To-Do Added!"));
        });
      } catch (error) {
        import("chalk").then((chalk) => {
          console.error(
            chalk.default.red("Error adding To-Do:", error.message)
          );
        });
      } finally {
        rl.close();
      }
    } else {
      console.log("please enter valid choice!");
    }
  } catch (error) {
    console.log(error);
  } finally {
    rl.close();
  }
}

main();
