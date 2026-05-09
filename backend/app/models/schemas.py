from pydantic import BaseModel
from typing import Optional

class PaperInput(BaseModel):
    abstract: Optional[str] = ""