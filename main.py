import os
import sys
import re
import subprocess
from pathlib import Path

import manim

print(manim.__version__)

# Path to the directory where your scenes are saved
scenes_dir = Path(os.path.join(os.getcwd(), "scenes"))

# Find the most recent Python file in the scenes directory
latest_scene_file = max(scenes_dir.glob("*.py"), key=os.path.getctime)

# Ensure that the file exists
if not latest_scene_file:
    sys.exit("No scene file found")

# Read the contents of the Python file
with open(latest_scene_file, 'r') as file:
    file_contents = file.read()

# Search for the class definition within the file
class_name_match = re.search(r'class\s+(\w+)\(Scene\)', file_contents)

if not class_name_match:
    sys.exit("No class found in the Python file")

scene_name = class_name_match.group(1)  # Extracted class name
print(f"🎬 Rendering scene: {scene_name}")

# Define the command to render the scene using Manim
command = f"manim render -pql {latest_scene_file} {scene_name}"

# Run the Manim render command
subprocess.run(command, shell=True, check=True)