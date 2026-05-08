#!/usr/bin/env python3

"""
Extract a frame from an MP4 video and embed realistic XMP metadata.

Industry-standard tools used:
- FFmpeg  -> frame extraction
- ExifTool -> writing XMP metadata

Requirements:
    ffmpeg
    exiftool

Ubuntu/Debian:
    sudo apt install ffmpeg libimage-exiftool-perl

macOS:
    brew install ffmpeg exiftool

Usage:
    python extract_frame.py input.mp4 00:01:23.500

Output:
    frame_000123.jpg
"""

import subprocess
import sys
import json
from pathlib import Path

# ------------------------------------------------------------
# Camera profile (based on your specifications)
# ------------------------------------------------------------

MAKER = "QYSEA"
MODEL = "FIFISH E-MASTER NAVI"

# Calculated full Sphere Size assuming 3840x2160 fov=146°
CALCULATED_IMAGE_WIDTH = 9804
CALCULATED_IMAGE_HEIGHT = 3812

# ------------------------------------------------------------
# Helpers
# ------------------------------------------------------------

def run(cmd):
    result = subprocess.run(
        cmd,
        stdout=subprocess.PIPE,
        stderr=subprocess.PIPE,
        text=True
    )

    if result.returncode != 0:
        print("Command failed:")
        print(" ".join(cmd))
        print(result.stderr)
        sys.exit(1)

    return result.stdout.strip()


def get_video_metadata(video_path):
    """
    Uses ffprobe to read metadata from the MP4.
    """

    cmd = [
        "ffprobe",
        "-v",
        "quiet",
        "-print_format",
        "json",
        "-show_streams",
        "-show_format",
        str(video_path)
    ]

    output = run(cmd)
    return json.loads(output)


def extract_frame(video_path, timestamp, output_path):
    """
    Uses FFmpeg (industry standard) to extract frame.
    """

    cmd = [
        "ffmpeg",
        "-y",                       #overwrite output files
        "-ss", timestamp,           #set the start time offset
        "-i", str(video_path),      #Input file
        "-frames:v","1",            #set the number of frames to output
        # "-vf", "v360=input=fisheye:id_fov=146:",
        "-vf", "v360=input=flat:id_fov=146:"
               # "output=equirect:h_fov=360:v_fov=180",
               "output=equirect:h_fov=141:v_fov=102",
        "-q:v", "2",

        str(output_path)
    ]

    run(cmd)


def write_xmp_metadata(image_path, width, height):
    """
    Embed realistic XMP/EXIF metadata using ExifTool.
    """

    cmd = [
        "exiftool",
        "-overwrite_original",

        # ----------------------------------------------------
        # Standard EXIF
        # ----------------------------------------------------
        f"-EXIF:Make={MAKER}",
        f"-EXIF:Model={MODEL}",

        # ----------------------------------------------------
        # Standard XMP
        # ----------------------------------------------------
        "-XMP:CreatorTool=QYSEA Frame Extractor",
        "-XMP:Format=image/jpeg",

        # ----------------------------------------------------
        # GPano Metadata
        # Official Google Panorama Namespace
        # ----------------------------------------------------
        "-XMP-GPano:ProjectionType=equirectangular",

        f"-XMP-GPano:CroppedAreaImageWidthPixels={width}",
        f"-XMP-GPano:CroppedAreaImageHeightPixels={height}",

        f"-XMP-GPano:FullPanoWidthPixels={CALCULATED_IMAGE_WIDTH}",
        f"-XMP-GPano:FullPanoHeightPixels={CALCULATED_IMAGE_HEIGHT}",

        f"-XMP-GPano:CroppedAreaLeftPixels={0}",
        f"-XMP-GPano:CroppedAreaTopPixels={(CALCULATED_IMAGE_HEIGHT - height) // 2}",

        "-XMP-GPano:InitialViewHeadingDegrees=180",
        "-XMP-GPano:InitialViewPitchDegrees=0",
        "-XMP-GPano:InitialViewRollDegrees=0",

        str(image_path)
    ]

    run(cmd)

def extract_image_and_write_metadata(video_path, timestamp, output_path):

    # Read metadata
    metadata = get_video_metadata(video_path)

    # Detect actual video resolution
    video_stream = next(
        s for s in metadata["streams"]
        if s["codec_type"] == "video"
    )

    width = video_stream["width"]
    height = video_stream["height"]

    # Output filename
    safe_timestamp = timestamp.replace(":", "").replace(".", "_")
    if output_path:
        output_path = Path(output_path).joinpath(f"frame_{safe_timestamp}.jpg")
    else:
        output_path = Path(f"frame_{safe_timestamp}.jpg")

    # Extract frame
    print(f"Extracting frame at {timestamp}...")
    extract_frame(video_path, timestamp, output_path)

    # Embed metadata
    print("Writing XMP metadata...")
    write_xmp_metadata(output_path, width, height)

    print()
    print("Done.")
    print(f"Saved: {output_path}")

def main():

    if len(sys.argv) < 3:
        print("Wrong Input")
        print("    Usage: python videoFrameExtractor.py input.mp4 00:01:23.500")
        print("       Or: python videoFrameExtractor.py input.mp4 00:01:23.500 output_directory/")
        sys.exit(1)

    video_path = Path(sys.argv[1])
    timestamp = sys.argv[2]

    if not video_path.exists():
        print(f"Video not found: {video_path}")
        sys.exit(1)

    output_path = None
    if len(sys.argv) >= 4:
        output_path = Path(sys.argv[3])
        if not output_path.exists():
            print(f"Output Directory not found: {output_path}")
            sys.exit(1)


    extract_image_and_write_metadata(video_path, timestamp, output_path)
    # #Take 10 frames with a time difference of 0.1 seconds
    # for i in range(10):
    #     timestamp = timestamp[:-3] +  str(i) + "00"
    #     extract_image_and_write_metadata(video_path, timestamp, output_path)


if __name__ == "__main__":
    main()