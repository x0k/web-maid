import { AsyncFactory } from '@/lib/factory';
import { DownloaderData } from '@/lib/operators/fs';

export class Downloader implements AsyncFactory<DownloaderData,void> {
  async Create({ content, filename, type }: DownloaderData): Promise<void> {
    const blob = new Blob([content], { type })
    await chrome.downloads.download({
      url: URL.createObjectURL(blob),
      conflictAction: 'uniquify',
      filename,
      saveAs: false
    })
  }
}
