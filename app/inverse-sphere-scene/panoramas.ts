import fs from "fs";
import path from "path";
import type { PanoramaItem } from "./types";

/**
 * Safely reads panorama files from the public/panoramas directory
 * @returns Array of panorama items with label and src
 */
export async function getPanoramaItems(): Promise<PanoramaItem[]> {
  try {
    // Get the absolute path to the panoramas directory
    const panoramasDir = path.join(process.cwd(), "public", "panoramas");
    
    // Normalize and sanitize the path to prevent directory traversal
    const safePanoramasDir = path.normalize(panoramasDir);
    
    // Ensure the resolved path is still within the expected directory
    if (!safePanoramasDir.startsWith(path.join(process.cwd(), "public"))) {
      console.error("Directory traversal attempt detected");
      return [];
    }

    // Check if directory exists
    if (!fs.existsSync(safePanoramasDir)) {
      console.warn(`Panoramas directory not found: ${safePanoramasDir}`);
      return [];
    }

    // Read directory contents
    const files = await fs.promises.readdir(safePanoramasDir);

    // Filter for image files only
    const imageExtensions = [".jpg", ".jpeg", ".png", ".webp", ".avif"];
    const imageFiles = files.filter((file) => {
      const ext = path.extname(file).toLowerCase();
      return imageExtensions.includes(ext);
    });

    // Map files to panorama items
    const panoramas: PanoramaItem[] = imageFiles.map((filename) => {
      // Generate a user-friendly label from the filename
      const nameWithoutExt = path.parse(filename).name;
      // Replace underscores and hyphens with spaces, capitalize words
      const label = nameWithoutExt
        .replace(/[-_]/g, " ")
        .split(" ")
        .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
        .join(" ");

      return {
        label,
        src: `/panoramas/${filename}`,
      };
    });

    // Sort alphabetically by label
    panoramas.sort((a, b) => a.label.localeCompare(b.label));

    return panoramas;
  } catch (error) {
    console.error("Error reading panoramas directory:", error);
    return [];
  }
}
