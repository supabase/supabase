export const COMMAND_ROUTES = {
  AI: 'Supabase AI',
  DOCS_SEARCH: 'Docs Search',
  GENERATE_SQL: 'Generate SQL',
  THEME: 'Theme',
  AI_ASK_ANYTHING: 'Ask anything',
  AI_RLS_POLICY: 'Help me create a RLS policy',
  API_KEYS: 'Project API keys',
}

type QueryCategory = {
  category: string
  queries: string[]
}

type SampleQueries = QueryCategory[]

export const SAMPLE_QUERIES: SampleQueries = [
  {
    category: 'Tables',
    queries: [
      'Create a table that stores a list of cities, and insert 10 rows of sample data into it',
      'Create tables (with foreign key relationships) for blog posts and comments',
      'Create tables for employees, reviewers, and employee reviews, with columns for employee ID, reviewer ID, and review text',
    ],
  },
  {
    category: 'Views',
    queries: [
      'Create a view that shows the total revenue for each customer',
      'Create a view that shows all orders that were placed in the last week',
      'Create a view that shows all products that are currently out of stock',
      'Create a materialized view that shows the customer_orders table the total value of orders in a month',
    ],
  },
  {
    category: 'Indexes',
    queries: [
      'Create an index on the primary key column of my orders table',
      'Create a partial index on the orders table:',
      'Create an index on the customer_id column of the customer_orders table',
    ],
  },
  {
    category: 'Select',
    queries: [
      'Retrieve a list of employees from the employees table who have a salary greater than $50,000',
      'Retrieve a list of all employees with the title "Manager" from the employees table',
      'Retrieve a list of all employees hired in the last 6 months',
      'Retrieve the department and average salary of each department from the employees table, group by department',
    ],
  },
  {
    category: 'Triggers',
    queries: [
      'Create a trigger that updates the updated_at column on the orders table with the current time when the row of the orders table is updated',
      'Create a trigger to add a new user to the users table when someone new registers',
      'Create a trigger to send an email whenever there is an insert in the orders table',
      'Create a trigger to delete all orders placed by a customer when that customer is deleted from the customers table',
    ],
  },
  {
    category: 'Row Level Security',
    queries: [
      'Create an RLS policy that grants only authenticated access to the profiles table',
      'Create an RLS policy that grants SELECT access to the sales_rep role for the customers table, but denies access to all other roles',
      "Create an RLS policy that grants INSERT access access to the manager role for the employees table, but only for rows where the employee's department_id matches a list of departments that the manager is responsible for",
    ],
  },
  {
    category: 'Functions',
    queries: [
      "Create a function to add a new entry to a user's table when a new user signs up",
      'Create an a function to calculate the average price of a product in a given category',
      'Create a function to insert a new order and update the inventory for the ordered products',
      'Create a function to calculate the total sales for a product given an id',
    ],
  },
]
