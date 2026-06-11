from functools import lru_cache

from app.config import settings


@lru_cache(maxsize=1)
def get_spacy_nlp():
    import spacy

    return spacy.load(settings.spacy_model)
