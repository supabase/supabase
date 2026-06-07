---
id: 'ai-integration-roboflow'
title: 'Roboflow'
subtitle: 'Learn how to integrate Supabase with Roboflow, a tool for running fine-tuned and foundation vision models.'
breadcrumb: 'AI Integrations'
---

In this guide, we will walk through two examples of using [Roboflow Inference](https://inference.roboflow.com) to run fine-tuned and foundation models. We will run inference and save predictions using an object detection model and [CLIP](https://github.com/openai/CLIP).

<$Partial path="database_setup.mdx" />

## Save computer vision predictions

Once you have a trained vision model, you need to create business logic for your application. In many cases, you want to save inference results to a file.

The steps below show you how to run a vision model locally and save predictions to Supabase.

### Preparation: Set up a model

Before you begin, you will need an object detection model trained on your data.

You can [train a model on Roboflow](https://blog.roboflow.com/getting-started-with-roboflow/), leveraging end-to-end tools from data management and annotation to deployment, or [upload custom model weights](https://docs.roboflow.com/deploy/upload-custom-weights) for deployment.

All models have an infinitely scalable API through which you can query your model, and can be run locally.

For this guide, we will use a demo [rock, paper, scissors](https://universe.roboflow.com/roboflow-58fyf/rock-paper-scissors-sxsw) model.

### Step 1: Install and start Roboflow Inference

You will deploy our model locally using Roboflow Inference, a computer vision inference server.

To install and start Roboflow Inference, first install Docker on your machine.

Then, run:

```
pip install inference inference-cli inference-sdk && inference server start
```

An inference server will be available at `http://localhost:9001`.

### Step 2: Run inference on an image

You can run inference on images and videos. Let's run inference on an image.

Create a new Python file and add the following code:

```python
from inference_sdk import InferenceHTTPClient

image = "example.jpg"
MODEL_ID = "rock-paper-scissors-sxsw/11"

client = InferenceHTTPClient(
    api_url="http://localhost:9001",
    api_key="ROBOFLOW_API_KEY"
)
with client.use_model(MODEL_ID):
    predictions = client.infer(image)

print(predictions)
```

Above, replace:

1. The image URL with the name of the image on which you want to run inference.
2. `ROBOFLOW_API_KEY` with your Roboflow API key. [Learn how to retrieve your Roboflow API key](https://docs.roboflow.com/api-reference/authentication#retrieve-an-api-key).
3. `MODEL_ID` with your Roboflow model ID. [Learn how to retrieve your model ID](https://docs.roboflow.com/api-reference/workspace-and-project-ids).

When you run the code above, a list of predictions will be printed to the console:

```
{'time': 0.05402109300121083, 'image': {'width': 640, 'height': 480}, 'predictions': [{'x': 312.5, 'y': 392.0, 'width': 255.0, 'height': 110.0, 'confidence': 0.8620790839195251, 'class': 'Paper', 'class_id': 0}]}
```

### Step 3: Save results in Supabase

To save results in Supabase, add the following code to your script:

```python
import os
from supabase import create_client, Client

url: str = os.environ.get("SUPABASE_URL")
key: str = os.environ.get("SUPABASE_KEY")
supabase: Client = create_client(url, key)

result = supabase.table('predictions') \
    .insert({"filename": image, "predictions": predictions}) \
    .execute()
```

You can then query your predictions using the following code:

```python
result = supabase.table('predictions') \
    .select("predictions") \
    .filter("filename", "eq", image) \
    .execute()

print(result)
```

Here is an example result:

```
data=[{'predictions': {'time': 0.08492901099998562, 'image': {'width': 640, 'height': 480}, 'predictions': [{'x': 312.5, 'y': 392.0, 'width': 255.0, 'height': 110.0, 'confidence': 0.8620790839195251, 'class': 'Paper', 'class_id': 0}]}}, {'predictions': {'time': 0.08818970100037404, 'image': {'width': 640, 'height': 480}, 'predictions': [{'x': 312.5, 'y': 392.0, 'width': 255.0, 'height': 110.0, 'confidence': 0.8620790839195251, 'class': 'Paper', 'class_id': 0}]}}] count=None
```

## Calculate and save CLIP embeddings

You can use the Supabase vector database functionality to store and query CLIP embeddings.

Roboflow Inference provides an HTTP interface through which you can calculate image and text embeddings using CLIP.

### Step 1: Install and start Roboflow Inference

See [Step #1: Install and Start Roboflow Inference](#step-1-install-and-start-roboflow-inference) above to install and start Roboflow Inference.

### Step 2: Run CLIP on an image

Create a new Python file and add the following code:

```python
import cv2
import supervision as sv
import requests
import base64
import os

IMAGE_DIR = "images/train/images/"
API_KEY = ""
SERVER_URL = "http://localhost:9001"

results = []

for i, image in enumerate(os.listdir(IMAGE_DIR)):
    print(f"Processing image {image}")
    infer_clip_payload = {
        "image": {
            "type": "base64",
            "value": base64.b64encode(open(IMAGE_DIR + image, "rb").read()).decode("utf-8"),
        },
    }

    res = requests.post(
        f"{SERVER_URL}/clip/embed_image?api_key={API_KEY}",
        json=infer_clip_payload,
    )

    embeddings = res.json()['embeddings']

    results.append({
        "filename": image,
        "embeddings": embeddings
    })
```

This code will calculate CLIP embeddings for each image in the directory and print the results to the console.

Above, replace:

1. `IMAGE_DIR` with the directory containing the images on which you want to run inference.
2. `ROBOFLOW_API_KEY` with your Roboflow API key. [Learn how to retrieve your Roboflow API key](https://docs.roboflow.com/api-reference/authentication#retrieve-an-api-key).

You can also calculate CLIP embeddings in the cloud by setting `SERVER_URL` to `https://infer.roboflow.com`.

### Step 3: Save embeddings in Supabase

You can store your image embeddings in Supabase using the Supabase `vecs` Python package:

First, install `vecs`:

```
pip install vecs
```

Next, add the following code to your script to create an index:

```python

import vecs

DB_CONNECTION = "postgresql://postgres:[password]@[host]:[port]/[database]"

vx = vecs.create_client(DB_CONNECTION)

# create a collection of vectors with 3 dimensions
images = vx.get_or_create_collection(name="image_vectors", dimension=512)

for result in results:
    image = result["filename"]
    embeddings = result["embeddings"][0]

    # insert a vector into the collection
    images.upsert(
        records=[
            (
                image,
                embeddings,
                {} # metadata
            )
        ]
    )

images.create_index()
```

Replace `DB_CONNECTION` with the authentication information for your database. You can retrieve this from the Supabase dashboard in `Project Settings > Database Settings`.

You can then query your embeddings using the following code:

```python
infer_clip_payload = {
    "text": "cat",
}

res = requests.post(
    f"{SERVER_URL}/clip/embed_text?api_key={API_KEY}",
    json=infer_clip_payload,
)

embeddings = res.json()['embeddings']

result = images.query(
    data=embeddings[0],
    limit=1
)

print(result[0])
```

## Resources

- [Roboflow Inference documentation](https://inference.roboflow.com)
- [Roboflow Getting Started guide](https://blog.roboflow.com/getting-started-with-roboflow/)
- [How to Build a Semantic Image Search Engine with Supabase and OpenAI CLIP](https://blog.roboflow.com/how-to-use-semantic-search-supabase-openai-clip/)
