# Supabase + Javascript Todo App

This documentation provides an overview of a JavaScript project that utilizes Supabase for the database. The project allows users to enter their Todo and save them in the database.
## Prerequisites

Before proceeding, ensure that you have the following:

- A Supabase account: Sign up at [Supabase Dashboard](https://supabase.com/dashboard) to create a new project and database.
- Node.js: Install Node.js from the official website [Node.js Website](https://nodejs.org).


## Configuration

### Creating a table in the database

1. Go to the Supabase dashboard and login yourself.


3. Go to SQL editor


<img src="./table-generation-1.png" alt="SQL editor"/>

4. Create a new blank query and paste the below code in there,

```SQL
CREATE TABLE todoreg (
  id SERIAL PRIMARY KEY,
  todo TEXT
);
```

5. After pasting code run the code.



<img src="./table-generation-2.png" alt="run query"/>

This will successfully generate a table in SQL, you can continue other steps now.

Head over to code now.

## Installation

To set up the project, follow these steps:

1. Clone the repository from GitHub:
   ```bash
   git clone <repository_url>
   ```

2. Navigate to the project directory:
   ```bash
   cd your-project
   ```

3. Install project dependencies using npm:
   ```bash
   npm install
   ```

## Configuration

Before running the application, you need to configure the Supabase URL and key. 
```javascript
const supabaseUrl = "{your_supabase_url}";
const supabaseKey = "{your_supabase_key}";
```

**Note:** Make sure to replace placeholders like `{your_supabase_url}`, `{your_supabase_key}`, and update the repository and author details according to your actual project information.

## Usage

To run the application, execute the following command:

```bash
npm run dev
```

This will start the development server, and you can access the Todo app in your browser at `http://localhost:3000`.

## Features

- Add new todos.
- Mark todos as complete.
- Real-time data syncing with Supabase.

## Contribution Guide

Contributions to this open-source project are welcome. Follow these steps to contribute:

1. Fork the repository on GitHub.
2. Clone your forked repository to your local machine.
3. Create a new branch for your changes:
   ```bash
   git checkout -b feature/your-feature-name
   ```
4. Make necessary modifications and additions.
5. Commit and push your changes to your forked repository.
6. Submit a pull request to the original repository.

## License

This project is licensed under the [MIT License](LICENSE).

## Acknowledgments

This project is built using the following technologies:

- [Supabase](https://supabase.com): An open-source alternative to Firebase, providing a PostgreSQL database with real-time capabilities.

## Authors

- [supabase](https://github.com/supabse)

Feel free to follow along and get involved in the [project repository](https://github.com/supabase/supabase)!

