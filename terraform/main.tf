module "WithSupabase" {
  source = "./supabase"
}

module "WithPlugins" {
  source = "./plugins"
  depends_on = [
    module.WithSupabase
  ]
}
