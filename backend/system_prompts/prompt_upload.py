from google.cloud import storage
import os


def aggregate_system_prompt(directory: str) -> str:
    content = ""
    files_to_read = []

    for root, _, files in os.walk(directory):
        for file in files:
            if file == "aggregated_system_prompt.txt":
                continue
            if file.endswith(".md") or file.endswith(".txt"):
                files_to_read.append(os.path.join(root, file))

    for file_path in sorted(files_to_read):
        with open(file_path, "r") as f:
            file_content = f.read()
            if file_path.endswith(".txt"):
                file_content = file_content.replace("{", "{{").replace("}", "}}")
            content += file_content + "\n\n"

    # Write aggregated file
    output_path = os.path.join(directory, "aggregated_system_prompt.txt")
    with open(output_path, "w") as f:
        f.write(content)

    return content


def upload_system_prompt(bucket_name: str, source_dir: str):
    """Uploads aggregated system prompt to GCP bucket"""
    # Read the aggregated file
    file_path = os.path.join(source_dir, "aggregated_system_prompt.txt")
    with open(file_path, "r") as f:
        content = f.read()

    # Upload to GCP
    storage_client = storage.Client()
    bucket = storage_client.bucket(bucket_name)
    blob = bucket.blob("aggregated_system_prompt.txt")
    blob.upload_from_string(content)


if __name__ == "__main__":
    aggregate_system_prompt("system_prompts")
    upload_system_prompt("system_prompts", "system_prompts")
