import fs from "fs";
import path from "path";

export interface Panorama {
  name: string;
  src: string;
}

/**
 * Safely reads panorama files from the public/panoramas directory
 * @returns Array of panorama objects with name and filename
 */
export async function getPanoramas(): Promise<Panorama[]> {
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

    // Map files to panorama objects
    const panoramas: Panorama[] = imageFiles.map((filename) => {
      // Generate a user-friendly name from the filename
      const nameWithoutExt = path.parse(filename).name;
      // Replace underscores and hyphens with spaces, capitalize words
      const name = nameWithoutExt
        .replace(/[-_]/g, " ")
        .split(" ")
        .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
        .join(" ");

      return {
        name: name,
        src: `/panoramas/${filename}`,
      };
    });

    // Sort alphabetically by name
    panoramas.sort((a, b) => a.name.localeCompare(b.name));

    return panoramas;
  } catch (error) {
    console.error("Error reading panoramas directory:", error);
    return [];
  }
}
