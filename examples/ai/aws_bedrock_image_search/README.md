# Image Search with Amazon Bedrock and Supabase Vector

In this example we're implementing image search using the [Amazon Titan Multimodal Embeddings G1](https://aws.amazon.com/bedrock/titan), a set of pre-trained high-performing image, multimodal, and text model, accessible via a fully managed API.

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

- Set `DB_CONNECTION` with the connection string from your hosted Supabase Dashboard: https://supabase.com/dashboard/project/_/database/settings > Connection string > URI

## Attributions

### Models

[Amazon Titan Multimodal Embeddings G1](https://docs.aws.amazon.com/bedrock/latest/userguide/model-parameters-titan-embed-mm.html)

### Images

Images from https://unsplash.com/license via https://picsum.photos/
