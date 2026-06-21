import { Image } from 'expo-image';
import { useVideoPlayer, VideoView } from 'expo-video';
import { Platform, StyleSheet, View } from 'react-native';
import { WebView } from 'react-native-webview';

import { colors } from '@/theme';
import type { VideoClip } from '@/store/types';
import { Icon } from './Icon';

interface Props {
  clip: VideoClip;
  /** When true the clip plays; otherwise a static thumbnail is shown. */
  playing?: boolean;
  muted?: boolean;
  borderRadius?: number;
}

const EMBED_ORIGIN = 'https://com.hopoff.app';

/** HTML iframe embed avoids YouTube error 153 on Android WebView (referrer required). */
function youtubeEmbedHtml(id: string, muted: boolean) {
  const params = new URLSearchParams({
    autoplay: '1',
    playsinline: '1',
    controls: '0',
    modestbranding: '1',
    rel: '0',
    loop: '1',
    playlist: id,
    mute: muted ? '1' : '0',
    enablejsapi: '1',
    origin: EMBED_ORIGIN,
  });
  const src = `https://www.youtube-nocookie.com/embed/${id}?${params.toString()}`;
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
  src="${src}"
  allow="autoplay; encrypted-media; picture-in-picture"
  referrerpolicy="strict-origin-when-cross-origin"
  allowfullscreen
></iframe>
</body>
</html>`;
}

function Mp4Player({ url, muted }: { url: string; muted: boolean }) {
  const player = useVideoPlayer(url, (p) => {
    p.loop = true;
    p.muted = muted;
    p.play();
  });
  return <VideoView player={player} style={StyleSheet.absoluteFill} contentFit="cover" nativeControls={false} />;
}

function YoutubePlayer({ id, muted, borderRadius }: { id: string; muted: boolean; borderRadius: number }) {
  return (
    <View style={[styles.fill, { borderRadius, overflow: 'hidden' }]}>
      <WebView
        source={{ html: youtubeEmbedHtml(id, muted), baseUrl: EMBED_ORIGIN }}
        style={styles.fill}
        allowsInlineMediaPlayback
        mediaPlaybackRequiresUserAction={false}
        javaScriptEnabled
        scrollEnabled={false}
        setSupportMultipleWindows={false}
        allowsFullscreenVideo
        androidLayerType="hardware"
        originWhitelist={['*']}
      />
    </View>
  );
}

// Renders a 9:16 clip. YouTube uses a WebView embed; mp4 uses expo-video.
export function VideoFrame({ clip, playing, muted = false, borderRadius = 0 }: Props) {
  if (playing && clip.source === 'youtube' && clip.youtubeId && Platform.OS !== 'web') {
    return <YoutubePlayer id={clip.youtubeId} muted={muted} borderRadius={borderRadius} />;
  }

  if (playing && clip.source === 'mp4' && clip.url) {
    return (
      <View style={[styles.fill, { borderRadius, overflow: 'hidden' }]}>
        <Mp4Player url={clip.url} muted={muted} />
      </View>
    );
  }

  // Static thumbnail / poster with a play affordance.
  return (
    <View style={[styles.fill, styles.thumb, { borderRadius }]}>
      {clip.thumbnail ? (
        <Image source={{ uri: clip.thumbnail }} style={StyleSheet.absoluteFill} contentFit="cover" transition={200} />
      ) : null}
      <View style={styles.playBadge}>
        <Icon name="play" size={22} color={colors.white} />
      </View>
    </View>
  );
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
});
