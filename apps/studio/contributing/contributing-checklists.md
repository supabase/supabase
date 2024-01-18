# Checklists for contributing to the Supabase Dashboard

First, we appreciate the time you've taken to contribute to Supabase! Thank you!

The following is a set of checklists to help make sure the code we contribute to the Dashboard is well tested. If you've made changes to any specific tools, please take a couple of minutes and go through the relevant checklist below.

You don't need to go through all of these for every PR you contribute. These checklists should help remind you of the important things to test after you've made changes to a feature. For example, if you make changes to the Table Editor, just run through that checklist below.

**Note**: not all of these tools are available in the self-hosted Dashboard. If your PR is related to Storage, Edge Functions, Logs Explorer or Organization settings, just leave a comment on the PR and a Supabase team member will have a look for you.

## Tools and features

### Table Editor

- [ ] Go to **Table Editor**
  - [ ] Create a **new table**
    - [ ] Add different fields and types: at least one nullable, one with default generated value (like `now()`), at least one date field
    - [ ] Insert a few rows into the table
    - [ ] Edit the row with the default spreadsheet view
    - [ ] Edit the row with the Side Panel editor (the expand button to the left of the ID column for each row)
    - [ ] Add a filter
    - [ ] Sort the rows
    - [ ] Create a new column and then add a new row

### Authentication / User management

- [ ] Go to **Authentication**
  - [ ] Invite a new user
  - [ ] Search the list of users
  - [ ] Go to Policies and create a new policy for a table
  - [ ] Check logs view
  - [ ] Go to settings and check that any changes you make get saved
    - [ ] General
    - [ ] Add a redirect URL
    - [ ] Enable a couple of Auth providers

### Storage

- [ ] Go to **Storage**
  - [ ] Go to **Settings** and try to change the upload size limit (unless on Free plan)
  - [ ] **Create a new bucket**
  - [ ] Go to your new **bucket** (check if it is public or private)
    - [ ] Upload a file
    - [ ] Create a folder
    - [ ] Upload a file to your new folder
    - [ ] Download the file
    - [ ] Copy URL for your file and open it in new incognito tab (check that it respects private/public setting)
  - [ ] Go to **Policies**: add a policy for a bucket
  - [ ] Change public/private status for your bucket
    - [ ] Check if objects respect private/public setting

### SQL Editor

- [ ] Go to **SQL editor**
  - [ ] Create **new query**
    - [ ] Run a query (ex: `select * from extensions.pg_stat_statements`) and check that it returns results
    - [ ] Download a csv of the results (via the Results dropdown above the preview table)
  - [ ] Go to **Welcome** and choose and run a template (ex: "Create table")
  - [ ] Switch between queries, rename one of your queries, refresh page, delete one of your queries

### Edge Functions

- [ ] Go to **Edge Functions**
  - [ ] See that any functions you've created are listed
  - [ ] Click a function and see that its **Metrics** are displaying
  - [ ] Switch to **Details** - you should see the details of your function
  - [ ] Switch to **Invocations** and **Logs** - to see logs of recent activity

### Logs Explorer

- [ ] Go to **Logs Explorer**
  - [ ] Switch to **Templates** and select one
  - [ ] Check that query results are displaying properly
  - [ ] Make a change to the query from the template, save this query
  - [ ] Switch to **Saved** - you should see your new query, run it and check the results
  - [ ] Switch to **Recent** - you should be able to see recent queries you've run

### Database settings

- [ ] Go to **Database**
  - [ ] You should see any tables you have created
    - [ ] Click on a table column, try and edit it
  - [ ] Go to **Roles** - check if roles are displayed
  - [ ] Go to **Extensions** - filter the extensions, try enabling and disabling an extension
  - [ ] Go to **Replication** — enable, disable few event types for `supabase_realtime` add some tables to replication
  - [ ] Go to **API Logs**, **Postgres Logs**, **Realtime Logs**
    - [ ] Check filtering: time range, product, status, method

### Org settings

- [ ] Go to **Organizations** and select your organization
  - [ ] On **General** - you should be able to rename your organization
  - [ ] On **Team** - you should be able to invite team members
  - [ ] On **Billing** - you should be able to see your project details and change billing address and email
  - [ ] On **Invoices** - you should be able to download recent invoices
