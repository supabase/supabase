# Define a linked project variable as user input
variable "linked_project" {
  type = string
}

# Configure api settings for the linked project
resource "supabase_settings" "production" {
  project_ref = var.linked_project

  database = jsonencode({})

  api = jsonencode({
    db_schema            = "public, storage, graphql_public"
    db_extra_search_path = "public, extensions"
    max_rows             = 1000
  })
}
