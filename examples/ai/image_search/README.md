# Image Search with Supabase Vector

In this example we're implementing image search using the [OpenAI CLIP Model](https://github.com/openai/CLIP), which was trained on a variety of (image, text)-pairs.

We're implementing two methods in the [`/image_search/main.py` file](/image_search/main.py):

1. The `seed` method generates embeddings for the images in the `images` folder and upserts them into a collection in Supabase Vector.
2. The `search` method generates an embedding from the search query and performs a vector similarity search query.

## Prerequisites

Before running this example, ensure you have:

- Python 3.8 or higher installed
- A Supabase account (sign up at https://supabase.com)
- Poetry package manager
- Basic familiarity with vector databases (helpful but not required)

## Setup

- Create a new project in your [Supabase dashboard](https://supabase.com/dashboard)
- Go to Settings > Database and copy your connection string
- Ensure the Vector extension is enabled in your project
- Install poetry: `pip install poetry`
- Activate the virtual environment: `poetry shell`
  - (to leave the venv just run `exit`)
- Install app dependencies: `poetry install`

## Run locally

### Generate the embeddings and seed the collection

- `supabase start`
- `poetry run seed`
- Check the embeddings stored in the local Supabase Dashboard: http://localhost:54323/project/default/editor > schema: vecs

**What to expect:** The seed command will process all images in the `images` folder and generate vector embeddings for each one.

### Perform a search

- `poetry run search "bike in front of red brick wall"`

**What to expect:** The search will return a list of images ranked by similarity to your search query, along with similarity scores.

## Run on hosted Supabase project

- Set `DB_CONNECTION` with the connection string from your hosted Supabase Dashboard: https://supabase.com/dashboard/project/_/database/settings > Connection string > URI

## Example Search Queries

Try these search queries to test the image search functionality:

- `"bike in front of red brick wall"`
- `"person walking in park"`
- `"blue sky with clouds"`
- `"city street at night"`

## Troubleshooting

**Common Issues:**

- **Poetry not found:** Make sure Poetry is installed with `pip install poetry`
- **Connection errors:** Verify your Supabase connection string is correct
- **No search results:** Ensure you've run the seed command first to populate the database
- **Python version errors:** This example requires Python 3.8 or higher

## How It Works

This example uses the CLIP (Contrastive Language-Image Pre-training) model to:

1. Convert images into high-dimensional vector representations (embeddings)
2. Convert text search queries into similar vector representations
3. Find images with embeddings most similar to the search query embedding
4. Return ranked results based on vector similarity scores

## Attributions

### Models

[clip-ViT-B-32](https://www.sbert.net/examples/applications/image-search/README.html) via [Hugging Face](https://huggingface.co/sentence-transformers/clip-ViT-B-32)

### Images

Images from https://unsplash.com/license via https://picsum.photos/
