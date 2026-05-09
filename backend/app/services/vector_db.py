import faiss
import numpy as np

index = None
journal_map = []


def build_index(journals):
    global index, journal_map

    vectors = []
    journal_map = journals

    for j in journals:
        vectors.append(j["embedding"])

    vectors = np.array(vectors).astype("float32")

    index = faiss.IndexFlatL2(len(vectors[0]))
    index.add(vectors)


def search(query_vector, k=5):
    global index, journal_map

    q = np.array([query_vector]).astype("float32")

    distances, indices = index.search(q, k)

    results = []
    for i in indices[0]:
        results.append(journal_map[i])

    return results