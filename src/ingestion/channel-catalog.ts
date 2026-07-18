import { Innertube, YTNodes, type YT } from 'youtubei.js';
import type { ChannelVideo } from '../domain/video';

export interface ResolvedChannel {
  readonly channelId: string;
  readonly title: string;
  readonly handle: string;
  readonly videos: readonly ChannelVideo[];
}

/**
 * Resolves a channel handle and lists every video on it, following pagination
 * to the end. Ingestion starts from the same input a real user would provide —
 * a handle URL — rather than a hardcoded channel ID.
 *
 * Scrapes, so it runs ONLY on a developer's machine, like the transcript
 * provider.
 */
export async function listChannelVideos(handle: string): Promise<ResolvedChannel> {
  const yt = await Innertube.create({ retrieve_player: false });

  const url = `https://www.youtube.com/${handle.startsWith('@') ? handle : `@${handle}`}`;
  const resolved = await yt.resolveURL(url);
  const channelId = (resolved.payload as { browseId?: string }).browseId;
  if (!channelId) {
    throw new Error(`Could not resolve ${url} to a channel (got ${resolved.type})`);
  }

  const channel = await yt.getChannel(channelId);
  let feed: YT.Channel | YT.ChannelListContinuation = await channel.getVideos();
  const videos: ChannelVideo[] = [];
  for (;;) {
    for (const node of feed.videos) {
      const video = toChannelVideo(node);
      if (video) videos.push(video);
    }
    if (!feed.has_continuation) break;
    feed = await feed.getContinuation();
  }

  return {
    channelId,
    title: channel.metadata.title ?? handle,
    handle,
    videos,
  };
}

type FeedNode = YT.Channel['videos'][number];

function toChannelVideo(node: FeedNode): ChannelVideo | undefined {
  // Channel tabs render LockupView as of 2025; older layouts used Video.
  const inner = node.is(YTNodes.RichItem) ? node.content : node;
  if (inner.is(YTNodes.LockupView)) {
    if (inner.content_type !== 'VIDEO') return undefined;
    return {
      videoId: inner.content_id,
      title: inner.metadata?.title?.toString() ?? '',
      durationSeconds: lockupDurationSeconds(inner),
      publishedText: lockupPublishedText(inner),
    };
  }
  if (inner.is(YTNodes.Video)) {
    return {
      videoId: inner.video_id,
      title: inner.title.toString(),
      durationSeconds: inner.duration?.seconds ?? 0,
      publishedText: inner.published?.toString() ?? '',
    };
  }
  return undefined;
}

function lockupDurationSeconds(lockup: YTNodes.LockupView): number {
  const image = lockup.content_image;
  const overlays = image?.is(YTNodes.ThumbnailView) ? (image.overlays ?? []) : [];
  for (const overlay of overlays) {
    if (!overlay.is(YTNodes.ThumbnailBottomOverlayView)) continue;
    for (const badge of overlay.badges ?? []) {
      const text = badge.text ?? '';
      if (/^\d+(:\d{2})+$/.test(text)) return parseClock(text);
    }
  }
  return 0;
}

/** "19:39" → 1179, "1:02:33" → 3753. */
function parseClock(text: string): number {
  return text
    .split(':')
    .reduce((total, part) => total * 60 + Number.parseInt(part, 10), 0);
}

function lockupPublishedText(lockup: YTNodes.LockupView): string {
  const rows = lockup.metadata?.metadata?.metadata_rows ?? [];
  for (const row of rows) {
    for (const part of row.metadata_parts ?? []) {
      const text = part.text?.toString() ?? '';
      if (text.endsWith('ago')) return text;
    }
  }
  return '';
}
