import sys
import boto3
import vecs
import json
import base64
from matplotlib import pyplot as plt
from matplotlib import image as mpimg
from typing import Optional

DB_CONNECTION = "postgresql://postgres:postgres@localhost:54322/postgres"

bedrock_client = boto3.client(
    'bedrock-runtime',
    region_name='us-west-2',
    # Credentials from your AWS account
    aws_access_key_id='<replace_your_own_credentials>',
    aws_secret_access_key='<replace_your_own_credentials>',
    aws_session_token='<replace_your_own_credentials>',
)


def readFileAsBase64(file_path):
    """Encode image as base64 string."""
    try:
        with open(file_path, "rb") as image_file:
            input_image = base64.b64encode(image_file.read()).decode("utf8")
        return input_image
    except:
        print("bad file name")
        sys.exit(0)


def construct_bedrock_image_body(base64_string):
    """Construct the request body.

    https://docs.aws.amazon.com/bedrock/latest/userguide/model-parameters-titan-embed-mm.html
    """
    return json.dumps(
        {
            "inputImage": base64_string,
            "embeddingConfig": {"outputEmbeddingLength": 1024},
        }
    )


def get_embedding_from_titan_multimodal(body):
    """Invoke the Amazon Titan Model via API request."""
    response = bedrock_client.invoke_model(
        body=body,
        modelId="amazon.titan-embed-image-v1",
        accept="application/json",
        contentType="application/json",
    )

    response_body = json.loads(response.get("body").read())
    print(response_body)
    return response_body["embedding"]


def encode_image(file_path):
    """Generate embedding for the image at file_path."""
    base64_string = readFileAsBase64(file_path)
    body = construct_bedrock_image_body(base64_string)
    emb = get_embedding_from_titan_multimodal(body)
    return emb


def seed():
    # create vector store client
    vx = vecs.create_client(DB_CONNECTION)

    # get or create a collection of vectors with 1024 dimensions
    images = vx.get_or_create_collection(name="image_vectors", dimension=1024)

    # Generate image embeddings with Amazon Titan Model
    img_emb1 = encode_image('./images/one.jpg')
    img_emb2 = encode_image('./images/two.jpg')
    img_emb3 = encode_image('./images/three.jpg')
    img_emb4 = encode_image('./images/four.jpg')

    # add records to the *images* collection
    images.upsert(
        records=[
            (
                "one.jpg",       # the vector's identifier
                img_emb1,        # the vector. list or np.array
                {"type": "jpg"}  # associated  metadata
            ), (
                "two.jpg",
                img_emb2,
                {"type": "jpg"}
            ), (
                "three.jpg",
                img_emb3,
                {"type": "jpg"}
            ), (
                "four.jpg",
                img_emb4,
                {"type": "jpg"}
            )
        ]
    )
    print("Inserted images")

    # index the collection for fast search performance
    images.create_index()
    print("Created index")


def search(query_term: Optional[str] = None):
    if query_term is None:
        query_term = sys.argv[1]
    
    # create vector store client
    vx = vecs.create_client(DB_CONNECTION)
    images = vx.get_or_create_collection(name="image_vectors", dimension=1024)

    # Encode text query
    text_emb = get_embedding_from_titan_multimodal(json.dumps(
        {
            "inputText": query_term,
            "embeddingConfig": {"outputEmbeddingLength": 1024},
        }
    ))

    # query the collection filtering metadata for "type" = "jpg"
    results = images.query(
        data=text_emb,                      # required
        limit=1,                            # number of records to return
        filters={"type": {"$eq": "jpg"}},   # metadata filters
    )
    result = results[0]
    print(result)
    plt.title(result)
    image = mpimg.imread('./images/' + result)
    plt.imshow(image)
    plt.show()
