import { Image } from 'expo-image';
import { useVideoPlayer, VideoView } from 'expo-video';
import { useCallback, useEffect, useRef, useState } from 'react';
import { Platform, Pressable, StyleSheet, View } from 'react-native';
import { WebView, type WebViewMessageEvent } from 'react-native-webview';

import { YOUTUBE_EMBED_ORIGIN } from '@/config/appId';
import { colors } from '@/theme';
import type { VideoClip } from '@/store/types';
import { Icon } from './Icon';
import { Txt } from './Txt';

interface Props {
  clip: VideoClip;
  playing?: boolean;
  muted?: boolean;
  borderRadius?: number;
  /** Hide YouTube controls so the user cannot seek/skip. */
  noControls?: boolean;
  onTapPlay?: () => void;
  /** Fires when playback reaches the end (YouTube ENDED / MP4 complete). */
  onEnded?: () => void;
}

const ERROR_CODES = new Set([2, 5, 100, 101, 150, 153]);
const YOUTUBE_ORIGINS = [YOUTUBE_EMBED_ORIGIN, 'https://www.youtube.com', 'https://m.youtube.com'];
const TIKTOK_ORIGINS = ['https://www.tiktok.com'];
const INSTAGRAM_ORIGINS = ['https://www.instagram.com', 'https://instagram.com'];

function isYouTubeId(id: string) {
  return /^[\w-]{6,20}$/.test(id);
}

function safeSharedUrl(raw: string | undefined, platform: VideoClip['platform']) {
  if (!raw) return undefined;
  try {
    const url = new URL(raw);
    if (url.protocol !== 'https:') return undefined;
    const host = url.hostname.toLowerCase();
    if (platform === 'tiktok' && host === 'www.tiktok.com') return url.toString();
    if (platform === 'instagram' && (host === 'www.instagram.com' || host === 'instagram.com')) return url.toString();
    return undefined;
  } catch {
    return undefined;
  }
}

function tiktokVideoIdFromUrl(url: string) {
  return url.match(/\/video\/(\d{5,32})/)?.[1];
}

/** IFrame Player API — baseUrl + origin must match (fixes Error 153). */
function youtubeEmbedHtml(id: string, muted: boolean, noControls = false) {
  if (!isYouTubeId(id)) return '';
  return `<!DOCTYPE html>
<html>
<head>
<meta name="viewport" content="width=device-width, initial-scale=1, maximum-scale=1">
<meta name="referrer" content="strict-origin-when-cross-origin">
<style>
  * { margin: 0; padding: 0; box-sizing: border-box; }
  html, body { width: 100%; height: 100%; background: #000; overflow: hidden; }
  #player { width: 100%; height: 100%; }
</style>
</head>
<body>
<div id="player"></div>
<script>
  var tag = document.createElement('script');
  tag.src = 'https://www.youtube.com/iframe_api';
  var firstScriptTag = document.getElementsByTagName('script')[0];
  firstScriptTag.parentNode.insertBefore(tag, firstScriptTag);
  function onYouTubeIframeAPIReady() {
    window.player = new YT.Player('player', {
      videoId: '${id}',
      playerVars: {
        autoplay: 1,
        playsinline: 1,
        controls: ${noControls ? 0 : 1},
        modestbranding: 1,
        rel: 0,
        mute: ${muted ? 1 : 0},
        enablejsapi: 1,
        origin: '${YOUTUBE_EMBED_ORIGIN}'
      },
      events: {
        onReady: function(e) {
          // Force playback + an initial frame — autoplay alone sometimes starts
          // audio while the video surface stays black on Android WebView.
          try { ${muted ? 'e.target.mute();' : 'e.target.unMute();'} } catch (err) {}
          try { e.target.playVideo(); } catch (err) {}
        },
        onStateChange: function(e) {
          if (${noControls ? 'true' : 'false'} && e.data === YT.PlayerState.PAUSED) {
            try { e.target.playVideo(); } catch (err) {}
            return;
          }
          if (e.data === YT.PlayerState.ENDED) {
            window.ReactNativeWebView.postMessage(JSON.stringify({ type: 'ended' }));
          }
        },
        onError: function(e) {
          window.ReactNativeWebView.postMessage(JSON.stringify({ type: 'error', code: e.data }));
        }
      }
    });
  }
</script>
</body>
</html>`;
}

function webIframeSrc(id: string, muted: boolean, noControls = false) {
  const params = [
    'autoplay=1',
    'playsinline=1',
    `controls=${noControls ? 0 : 1}`,
    'modestbranding=1',
    'rel=0',
    'cc_load_policy=0',
    'iv_load_policy=3',
    ...(noControls ? ['disablekb=1', 'fs=0'] : []),
    `mute=${muted ? 1 : 0}`,
    `origin=${encodeURIComponent(YOUTUBE_EMBED_ORIGIN)}`,
  ].join('&');
  return `https://www.youtube.com/embed/${id}?${params}`;
}

function youtubeIframeHtml(id: string, muted: boolean, noControls = false) {
  if (!isYouTubeId(id)) return '';
  return `<!DOCTYPE html>
<html>
<head>
<meta name="viewport" content="width=device-width, initial-scale=1, maximum-scale=1">
<meta name="referrer" content="strict-origin-when-cross-origin">
<style>
  * { margin: 0; padding: 0; box-sizing: border-box; }
  html, body { width: 100%; height: 100%; background: #000; overflow: hidden; }
  iframe { width: 100%; height: 100%; border: 0; }
</style>
</head>
<body>
<iframe
  src="${webIframeSrc(id, muted, noControls)}"
  allow="autoplay; encrypted-media; picture-in-picture"
  referrerpolicy="strict-origin-when-cross-origin"
></iframe>
</body>
</html>`;
}

function socialEmbedHtml(clip: VideoClip) {
  const safeUrl = safeSharedUrl(clip.url, clip.platform);
  const url = safeUrl?.replace(/"/g, '&quot;');
  const tiktokId = safeUrl && clip.platform === 'tiktok' ? tiktokVideoIdFromUrl(safeUrl) : undefined;
  const fallback =
    clip.platform === 'tiktok' && tiktokId
      ? `<iframe src="https://www.tiktok.com/player/v1/${tiktokId}?autoplay=1&controls=0&loop=0&music_info=0&description=0&progress_bar=0&fullscreen_button=0" allow="fullscreen; autoplay; encrypted-media; picture-in-picture" style="width:100%;height:100%;border:0;" allowfullscreen></iframe>`
    : clip.platform === 'instagram' && url
      ? `<blockquote class="instagram-media" data-instgrm-permalink="${url}" data-instgrm-version="14"></blockquote><script async src="https://www.instagram.com/embed.js"></script>`
        : '';

  return `<!DOCTYPE html>
<html>
<head>
<meta name="viewport" content="width=device-width, initial-scale=1, maximum-scale=1">
<meta name="referrer" content="strict-origin-when-cross-origin">
<style>
  * { box-sizing: border-box; }
  html, body {
    width: 100%;
    height: 100%;
    margin: 0;
    padding: 0;
    overflow: hidden;
    background: #000;
  }
  body {
    display: flex;
    align-items: center;
    justify-content: center;
  }
  iframe, blockquote {
    max-width: 100% !important;
    min-width: 0 !important;
    margin: 0 !important;
  }
</style>
</head>
<body>
${fallback || ''}
</body>
</html>`;
}

function Mp4Player({ url, muted, onEnded }: { url: string; muted: boolean; onEnded?: () => void }) {
  const player = useVideoPlayer(url, (p) => {
    p.loop = false;
    p.muted = muted;
    p.play();
  });

  useEffect(() => {
    if (!onEnded) return;
    const sub = player.addListener('playToEnd', () => {
      onEnded();
    });
    return () => sub.remove();
  }, [onEnded, player]);

  return <VideoView player={player} style={StyleSheet.absoluteFill} contentFit="cover" nativeControls={false} />;
}

function YoutubeUnavailable({ clip, borderRadius }: { clip: VideoClip; borderRadius: number }) {
  return (
    <View style={[styles.fill, styles.unavailable, { borderRadius }]}>
      {clip.thumbnail ? (
        <Image source={{ uri: clip.thumbnail }} style={StyleSheet.absoluteFill} contentFit="cover" transition={200} />
      ) : null}
      <View style={styles.unavailableOverlay}>
        <Icon name="play" size={22} color={colors.white} />
        <Txt variant="caption" color={colors.white} center style={{ marginTop: 8 }}>
          Video unavailable
        </Txt>
      </View>
    </View>
  );
}

function YoutubePlayer({
  id,
  clip,
  muted,
  noControls,
  borderRadius,
  onEnded,
}: {
  id: string;
  clip: VideoClip;
  muted: boolean;
  noControls?: boolean;
  borderRadius: number;
  onEnded?: () => void;
}) {
  const [failed, setFailed] = useState(false);
  const webViewRef = useRef<WebView>(null);
  const validYouTubeId = isYouTubeId(id);

  useEffect(() => {
    if (!noControls || !onEnded) return;
    const durationMs = Math.max(5, clip.durationSec || 30) * 1000;
    const timer = setTimeout(onEnded, durationMs);
    return () => clearTimeout(timer);
  }, [clip.durationSec, noControls, onEnded]);

  useEffect(() => {
    const stopPlayer = () => {
      webViewRef.current?.injectJavaScript(`
        try {
          if (window.player && typeof window.player.stopVideo === 'function') {
            window.player.stopVideo();
          }
        } catch (err) {}
        true;
      `);
    };
    return () => {
      stopPlayer();
    };
  }, []);

  const onMessage = useCallback(
    (event: WebViewMessageEvent) => {
      try {
        const data = JSON.parse(event.nativeEvent.data) as { type?: string; code?: number };
        if (data.type === 'ended') {
          onEnded?.();
          return;
        }
        if (data.type === 'error' && typeof data.code === 'number' && ERROR_CODES.has(data.code)) {
          setFailed(true);
        }
      } catch {
        // ignore
      }
    },
    [onEnded],
  );

  if (!validYouTubeId || failed) {
    return <YoutubeUnavailable clip={clip} borderRadius={borderRadius} />;
  }

  if (Platform.OS === 'web') {
    return (
      <View style={[styles.fill, { borderRadius, overflow: 'hidden' }]}>
        <iframe
          src={webIframeSrc(id, muted, noControls)}
          style={{ width: '100%', height: '100%', border: 0 }}
          allow="accelerometer; autoplay; encrypted-media; gyroscope; picture-in-picture"
          allowFullScreen
        />
      </View>
    );
  }

  if (noControls) {
    return (
      <View style={[styles.fill, { borderRadius, overflow: 'hidden' }]}>
        <WebView
          source={{ html: youtubeIframeHtml(id, muted, true), baseUrl: YOUTUBE_EMBED_ORIGIN }}
          style={styles.fill}
          allowsInlineMediaPlayback
          mediaPlaybackRequiresUserAction={false}
          javaScriptEnabled
          scrollEnabled={false}
          setSupportMultipleWindows={false}
          allowsFullscreenVideo={false}
          androidLayerType="hardware"
          originWhitelist={YOUTUBE_ORIGINS}
          onHttpError={() => setFailed(true)}
        />
      </View>
    );
  }

  return (
    <View style={[styles.fill, { borderRadius, overflow: 'hidden' }]}>
      <WebView
        ref={webViewRef}
        source={{ html: youtubeEmbedHtml(id, muted, noControls), baseUrl: YOUTUBE_EMBED_ORIGIN }}
        style={styles.fill}
        allowsInlineMediaPlayback
        mediaPlaybackRequiresUserAction={false}
        javaScriptEnabled
        scrollEnabled={false}
        setSupportMultipleWindows={false}
        allowsFullscreenVideo
        androidLayerType="hardware"
        originWhitelist={YOUTUBE_ORIGINS}
        onMessage={onMessage}
        onHttpError={() => setFailed(true)}
      />
    </View>
  );
}

function ThumbnailPoster({
  clip,
  borderRadius,
  onTapPlay,
}: {
  clip: VideoClip;
  borderRadius: number;
  onTapPlay?: () => void;
}) {
  const content = (
    <View style={[styles.fill, styles.thumb, { borderRadius }]}>
      {clip.thumbnail ? (
        <Image source={{ uri: clip.thumbnail }} style={StyleSheet.absoluteFill} contentFit="cover" transition={200} />
      ) : null}
      <View style={styles.playBadge}>
        <Icon name="play" size={22} color={colors.white} />
      </View>
    </View>
  );

  if (onTapPlay) {
    return (
      <Pressable style={styles.fill} onPress={onTapPlay} accessibilityRole="button" accessibilityLabel="Play video">
        {content}
      </Pressable>
    );
  }

  return content;
}

function SocialEmbedPlayer({
  clip,
  borderRadius,
  onEnded,
}: {
  clip: VideoClip;
  borderRadius: number;
  onEnded?: () => void;
}) {
  useEffect(() => {
    if (!onEnded) return;
    const durationMs = Math.max(5, clip.durationSec || 30) * 1000;
    const timer = setTimeout(onEnded, durationMs);
    return () => clearTimeout(timer);
  }, [clip.durationSec, onEnded]);

  const safeUrl = safeSharedUrl(clip.url, clip.platform);
  if (!safeUrl) return <ThumbnailPoster clip={clip} borderRadius={borderRadius} />;

  return (
    <View style={[styles.fill, { borderRadius, overflow: 'hidden' }]}>
      <WebView
        source={{
          html: socialEmbedHtml(clip),
          baseUrl: clip.platform === 'instagram' ? 'https://www.instagram.com' : 'https://www.tiktok.com',
        }}
        style={styles.fill}
        javaScriptEnabled
        domStorageEnabled
        allowsInlineMediaPlayback
        mediaPlaybackRequiresUserAction={false}
        scrollEnabled={false}
        setSupportMultipleWindows={false}
        allowsFullscreenVideo={false}
        androidLayerType="hardware"
        originWhitelist={clip.platform === 'instagram' ? INSTAGRAM_ORIGINS : TIKTOK_ORIGINS}
      />
    </View>
  );
}

export function VideoFrame({ clip, playing, muted = false, borderRadius = 0, noControls, onTapPlay, onEnded }: Props) {
  if (playing && clip.source === 'youtube' && clip.youtubeId) {
    return (
      <YoutubePlayer
        key={clip.youtubeId}
        id={clip.youtubeId}
        clip={clip}
        muted={muted}
        noControls={noControls}
        borderRadius={borderRadius}
        onEnded={onEnded}
      />
    );
  }

  if (playing && clip.source === 'mp4' && clip.url) {
    return (
      <View style={[styles.fill, { borderRadius, overflow: 'hidden' }]}>
        <Mp4Player url={clip.url} muted={muted} onEnded={onEnded} />
      </View>
    );
  }

  if (playing && clip.source === 'share' && clip.url) {
    return <SocialEmbedPlayer clip={clip} borderRadius={borderRadius} onEnded={onEnded} />;
  }

  return <ThumbnailPoster clip={clip} borderRadius={borderRadius} onTapPlay={onTapPlay} />;
}

const styles = StyleSheet.create({
  fill: {
    width: '100%',
    height: '100%',
  },
  thumb: {
    backgroundColor: '#101010',
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
  },
  playBadge: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: 'rgba(0,0,0,0.45)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  unavailable: {
    backgroundColor: '#101010',
    overflow: 'hidden',
  },
  unavailableOverlay: {
    ...StyleSheet.absoluteFill,
    backgroundColor: 'rgba(0,0,0,0.55)',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 16,
  },
});
