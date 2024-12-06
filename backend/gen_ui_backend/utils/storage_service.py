from typing import Protocol
from google.cloud import storage
import os


class FileReader(Protocol):
    def read_file(self, filename: str) -> str: ...


class FileSystemReader(FileReader):
    def __init__(self, local_dir: str):
        self.local_dir = local_dir

    def read_file(self, filename: str) -> str:
        with open(os.path.join(self.local_dir, filename), "r") as f:
            return f.read()


class CloudStorageReader(FileReader):
    def __init__(self, bucket_name: str):
        self.bucket = storage.Client().bucket(bucket_name)

    def read_file(self, filename: str) -> str:
        return self.bucket.blob(filename).download_as_text()


class FileReaderService:
    def __init__(self, base_dir: str):
        storage_type = os.getenv("STORAGE_TYPE", "gcp")
        self.reader = (
            FileSystemReader(local_dir=base_dir)
            if storage_type == "local"
            else CloudStorageReader(bucket_name=base_dir)
        )

    def read_file(self, filename: str) -> str:
        return self.reader.read_file(filename)
