# Image Search with Supabase Vector

In this example we're implementing image search using the [OpenAI CLIP Model](https://github.com/openai/CLIP), which was trained on a variety of (image, text)-pairs.

We're implementing two methods in the [`/image_search/main.py` file](/image_search/main.py):

1. The `seed` method generates embeddings for the images in the `images` folder and upserts them into a collection in Supabase Vector.
2. The `search` method generates an embedding from the search query and performs a vector similarity search query.

## Setup

- Install poetry: `pip install poetry`
- Activate the virtual environment: `poetry shell`
  - (to leave the venv just run `exit`)
- Install app dependencies: `poetry install`

## Run locally

### Generate the embeddings and seed the collection

- `supabase start`
- `poetry run seed`
- Check the embeddings stored in the local Supabase Dashboard: http://localhost:54323/project/default/editor > schema: vecs

### Perform a search

- `poetry run search "bike in front of red brick wall"`

## Run on hosted Supabase project

- Set `DB_CONNECTION` with the connection string from your hosted Supabase Dashboard: https://supabase.com/dashboard/project/_/settings/database > Connection string > URI

## Attributions

### Models

[clip-ViT-B-32](https://www.sbert.net/examples/applications/image-search/README.html) via [Hugging Face](https://huggingface.co/sentence-transformers/clip-ViT-B-32)

### Images

Images from https://unsplash.com/license via https://picsum.photos/
