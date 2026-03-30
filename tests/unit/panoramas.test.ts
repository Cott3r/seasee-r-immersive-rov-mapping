import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import fs from 'fs';
import path from 'path';
import { getPanoramas } from '@/utils/panorama-file-scanner';

// Mock the fs module
vi.mock('fs', () => ({
  default: {
    existsSync: vi.fn(),
    promises: {
      readdir: vi.fn(),
    },
  },
}));

describe('getPanoramas', () => {
  const mockCwd = '/mock/project';
  const originalCwd = process.cwd;

  beforeEach(() => {
    // Mock process.cwd()
    process.cwd = vi.fn(() => mockCwd);
    vi.clearAllMocks();
  });

  afterEach(() => {
    // Restore process.cwd()
    process.cwd = originalCwd;
    vi.restoreAllMocks();
  });

  it('should return empty array when directory does not exist', async () => {
    vi.mocked(fs.existsSync).mockReturnValue(false);

    const result = await getPanoramas();

    expect(result).toEqual([]);
    expect(fs.existsSync).toHaveBeenCalledWith(
      path.join(mockCwd, 'public', 'panoramas')
    );
  });

  it('should return empty array when readdir fails', async () => {
    vi.mocked(fs.existsSync).mockReturnValue(true);
    vi.mocked(fs.promises.readdir).mockRejectedValue(
      new Error('Permission denied')
    );

    const result = await getPanoramas();

    expect(result).toEqual([]);
  });

  it('should filter and return only image files', async () => {
    vi.mocked(fs.existsSync).mockReturnValue(true);
    vi.mocked(fs.promises.readdir).mockResolvedValue([
      'image1.jpg',
      'image2.png',
      'image3.jpeg',
      'image4.webp',
      'image5.avif',
      'document.pdf',
      'script.js',
      'README.md',
    ] as string[]);

    const result = await getPanoramas();

    expect(result).toHaveLength(5);
    expect(result.map((p) => p.filename)).toEqual([
      'image1.jpg',
      'image2.png',
      'image3.jpeg',
      'image4.webp',
      'image5.avif',
    ]);
  });

  it('should generate user-friendly names from filenames', async () => {
    vi.mocked(fs.existsSync).mockReturnValue(true);
    vi.mocked(fs.promises.readdir).mockResolvedValue([
      'underwater_scene.jpg',
      'coral-reef.png',
      'deep_ocean-view.jpeg',
    ] as string[]);

    const result = await getPanoramas();

    expect(result).toEqual([
      { name: 'Coral Reef', filename: 'coral-reef.png' },
      { name: 'Deep Ocean View', filename: 'deep_ocean-view.jpeg' },
      { name: 'Underwater Scene', filename: 'underwater_scene.jpg' },
    ]);
  });

  it('should sort panoramas alphabetically by name', async () => {
    vi.mocked(fs.existsSync).mockReturnValue(true);
    vi.mocked(fs.promises.readdir).mockResolvedValue([
      'zebra.jpg',
      'alpha.jpg',
      'beta.jpg',
      'gamma.jpg',
    ] as string[]);

    const result = await getPanoramas();

    expect(result.map((p) => p.name)).toEqual([
      'Alpha',
      'Beta',
      'Gamma',
      'Zebra',
    ]);
  });

  it('should handle mixed case file extensions', async () => {
    vi.mocked(fs.existsSync).mockReturnValue(true);
    vi.mocked(fs.promises.readdir).mockResolvedValue([
      'image1.JPG',
      'image2.PNG',
      'image3.JpEg',
    ] as string[]);

    const result = await getPanoramas();

    expect(result).toHaveLength(3);
    expect(result.map((p) => p.filename)).toEqual([
      'image1.JPG',
      'image2.PNG',
      'image3.JpEg',
    ]);
  });

  it('should return empty array when no image files exist', async () => {
    vi.mocked(fs.existsSync).mockReturnValue(true);
    vi.mocked(fs.promises.readdir).mockResolvedValue([
      'document.txt',
      'video.mp4',
      'audio.mp3',
    ] as string[]);

    const result = await getPanoramas();

    expect(result).toEqual([]);
  });

  it('should handle empty directory', async () => {
    vi.mocked(fs.existsSync).mockReturnValue(true);
    vi.mocked(fs.promises.readdir).mockResolvedValue([] as string[]);

    const result = await getPanoramas();

    expect(result).toEqual([]);
  });

  it('should handle filenames with multiple hyphens and underscores', async () => {
    vi.mocked(fs.existsSync).mockReturnValue(true);
    vi.mocked(fs.promises.readdir).mockResolvedValue([
      'my-awesome_underwater-scene_2024.jpg',
    ] as string[]);

    const result = await getPanoramas();

    expect(result[0].name).toBe('My Awesome Underwater Scene 2024');
  });

  it('should handle filenames with no special characters', async () => {
    vi.mocked(fs.existsSync).mockReturnValue(true);
    vi.mocked(fs.promises.readdir).mockResolvedValue([
      'panorama.jpg',
    ] as string[]);

    const result = await getPanoramas();

    expect(result[0].name).toBe('Panorama');
  });

  it('should return correct Panorama interface structure', async () => {
    vi.mocked(fs.existsSync).mockReturnValue(true);
    vi.mocked(fs.promises.readdir).mockResolvedValue(['test.jpg'] as string[]);

    const result = await getPanoramas();

    expect(result[0]).toHaveProperty('name');
    expect(result[0]).toHaveProperty('filename');
    expect(typeof result[0].name).toBe('string');
    expect(typeof result[0].filename).toBe('string');
  });

  it('should handle single word filenames correctly', async () => {
    vi.mocked(fs.existsSync).mockReturnValue(true);
    vi.mocked(fs.promises.readdir).mockResolvedValue([
      'ocean.jpg',
      'reef.png',
    ] as string[]);

    const result = await getPanoramas();

    expect(result).toEqual([
      { name: 'Ocean', filename: 'ocean.jpg' },
      { name: 'Reef', filename: 'reef.png' },
    ]);
  });

  it('should handle filenames with numbers', async () => {
    vi.mocked(fs.existsSync).mockReturnValue(true);
    vi.mocked(fs.promises.readdir).mockResolvedValue([
      'dive-site-123.jpg',
      '2024-expedition.png',
    ] as string[]);

    const result = await getPanoramas();

    expect(result).toEqual([
      { name: '2024 Expedition', filename: '2024-expedition.png' },
      { name: 'Dive Site 123', filename: 'dive-site-123.jpg' },
    ]);
  });
});
