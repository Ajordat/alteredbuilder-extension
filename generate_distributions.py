import os
import re
import shutil
import subprocess
from pathlib import Path
import zipfile

DIST_FOLDER = "dist"
SOURCE_CODE_ZIP = "src.zip"

BASE_DIR = Path(__file__).parent.resolve()
DIST_DIR = BASE_DIR / DIST_FOLDER


def run_command(cmd, cwd=BASE_DIR):
    print(f"> {cmd}")
    result = subprocess.run(cmd, shell=True, cwd=cwd)
    if result.returncode != 0:
        raise RuntimeError(f"Command failed: {cmd}")


def zip_folder(source_dir, output_zip):
    shutil.make_archive(output_zip.replace(".zip", ""), "zip", source_dir)
    print(f"Zipped {source_dir} to {output_zip}")


def clean_dist():
    if DIST_DIR.exists():
        print("Removing existing dist folder...")
        shutil.rmtree(DIST_DIR)


def build_dist(browser):
    run_command(f"npm run build:{browser}")

    if not DIST_DIR.exists():
        raise RuntimeError(f"Build did not create '{DIST_FOLDER}' folder.")

    zip_folder(DIST_DIR, f"{browser}_dist.zip")


def pack_source_code():
    exclusions = [r"dist", r"node_modules", r".*\.zip", r".git$"]
    source_dir = BASE_DIR

    exclusion_patterns = [re.compile(pattern) for pattern in exclusions]

    with zipfile.ZipFile(SOURCE_CODE_ZIP, "w", zipfile.ZIP_DEFLATED) as zipf:
        for root, dirs, files in os.walk(source_dir):
            dirs[:] = [
                d for d in dirs if not any(p.match(d) for p in exclusion_patterns)
            ]

            for file in files:
                if not any(p.match(file) for p in exclusion_patterns):
                    file_path = Path(root) / file
                    zipf.write(file_path, arcname=file_path.relative_to(source_dir))
                    print(f"Adding {file_path}")


def main():

    if not (BASE_DIR / "node_modules").exists():
        run_command("npm install")

    clean_dist()
    build_dist("chrome")
    clean_dist()
    build_dist("firefox")
    clean_dist()

    pack_source_code()


if __name__ == "__main__":
    main()
