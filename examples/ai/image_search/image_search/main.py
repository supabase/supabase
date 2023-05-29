import sys
from PIL import Image
from sentence_transformers import SentenceTransformer
import vecs
from matplotlib import pyplot as plt
from matplotlib import image as mpimg

DB_CONNECTION = "postgresql://postgres:postgres@localhost:54322/postgres"


def seed():
    # create vector store client
    vx = vecs.create_client(DB_CONNECTION)

    # create a collection of vectors with 512 dimensions
    images = vx.create_collection(name="image_vectors", dimension=512)

    # Load CLIP model
    model = SentenceTransformer('clip-ViT-B-32')

    # Encode an image:
    img_emb1 = model.encode(Image.open('./images/one.jpg'))
    img_emb2 = model.encode(Image.open('./images/two.jpg'))
    img_emb3 = model.encode(Image.open('./images/three.jpg'))
    img_emb4 = model.encode(Image.open('./images/four.jpg'))

    # add records to the *images* collection
    images.upsert(
        vectors=[
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


def search(args=sys.argv):
    # create vector store client
    vx = vecs.create_client(DB_CONNECTION)
    images = vx.get_collection(name="image_vectors")

    # Load CLIP model
    model = SentenceTransformer('clip-ViT-B-32')
    # Encode text query
    query_string = args[1]
    text_emb = model.encode(query_string)

    # query the collection filtering metadata for "type" = "jpg"
    results = images.query(
        query_vector=text_emb,              # required
        limit=1,                            # number of records to return
        filters={"type": {"$eq": "jpg"}},   # metadata filters
    )
    result = results[0]
    print(result)
    plt.title(result)
    image = mpimg.imread('./images/' + result)
    plt.imshow(image)
    plt.show()
