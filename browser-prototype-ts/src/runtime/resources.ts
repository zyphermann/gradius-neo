export type ResourceKind = 'png' | 'midi' | 'manifest' | 'game-data' | 'image-data' | 'binary';

export interface ResourceEntry {
  path: string;
  size: number;
  kind: ResourceKind;
}

interface ResourceManifest {
  resources: ResourceEntry[];
}

function normalizePath(path: string): string {
  return path.replace(/^\/+/, '');
}

export class ResourceManager {
  private readonly bytes = new Map<string, Uint8Array>();
  private manifest: ResourceManifest | null = null;

  async preloadAll(onProgress?: (loaded: number, total: number, path: string) => void): Promise<void> {
    const manifestResponse = await fetch('/assets/manifest.json');
    if (!manifestResponse.ok) throw new Error(`Resource manifest failed: HTTP ${manifestResponse.status}`);
    this.manifest = await manifestResponse.json() as ResourceManifest;

    let loaded = 0;
    await Promise.all(this.manifest.resources.map(async (entry) => {
      const response = await fetch(`/assets/${entry.path}`);
      if (!response.ok) throw new Error(`Resource ${entry.path} failed: HTTP ${response.status}`);
      const data = new Uint8Array(await response.arrayBuffer());
      if (data.byteLength !== entry.size) {
        throw new Error(`Resource ${entry.path}: expected ${entry.size} bytes, received ${data.byteLength}`);
      }
      this.bytes.set(entry.path, data);
      loaded += 1;
      onProgress?.(loaded, this.manifest?.resources.length ?? 0, entry.path);
    }));
  }

  getBytes(path: string): Uint8Array {
    const normalized = normalizePath(path);
    const data = this.bytes.get(normalized);
    if (!data) throw new Error(`Resource is not preloaded: ${path}`);
    return data;
  }

  has(path: string): boolean {
    return this.bytes.has(normalizePath(path));
  }

  list(kind?: ResourceKind): readonly ResourceEntry[] {
    const resources = this.manifest?.resources ?? [];
    return kind ? resources.filter((entry) => entry.kind === kind) : resources;
  }
}
