"use client";

import React, { useState, useEffect, useRef, useCallback } from "react";
import { useRouter } from "next/navigation";
import {
  Volume2,
  Play,
  Pause,
  RotateCcw,
  RotateCw,
  SkipForward,
  Repeat,
  Loader2,
  X,
} from "lucide-react";

export interface ArticleMeta {
  id: string;
  title: string;
  slug?: string | null;
  summary?: string | null;
  content?: string | null;
  contentHtml?: string | null;
}

export interface NewsAudioPlayerProps {
  newsId: string;
  title: string;
  summary?: string | null;
  content?: string | null;
  contentHtml?: string | null;
  className?: string;
  nextArticle?: ArticleMeta | null;
}

type PlayerStatus = "idle" | "loading" | "playing" | "paused";
type PlaybackSpeed = 1.0 | 1.2 | 1.4;
type VoiceType = "vi-VN-HoaiMyNeural" | "vi-VN-NamMinhNeural";

// Đoạn âm thanh im lặng (0.2s Silent 8000Hz WAV Base64) đảm bảo mở khóa tức thời Media Pipeline trên iOS Safari / Android ngay trong chuỗi click
const SILENT_BASE64_WAV =
  "data:audio/wav;base64,UklGRmQGAABXQVZFZm10IBAAAAABAAEAQB8AAEAfAAABAAgAZGF0YUAGAACAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICA=";

// Định dạng thời gian mm:ss
function formatTime(seconds: number): string {
  if (!seconds || isNaN(seconds) || seconds < 0) return "00:00";
  const mins = Math.floor(seconds / 60);
  const secs = Math.floor(seconds % 60);
  return `${mins.toString().padStart(2, "0")}:${secs.toString().padStart(2, "0")}`;
}

let activeMasterNewsId: string | null = null;
// eslint-disable-next-line @typescript-eslint/no-explicit-any
let wakeLockSentinel: any = null;

/**
 * Lấy hoặc tạo đối tượng HTMLAudioElement gắn trực tiếp vào DOM (document.body).
 * Tránh việc unmount component làm tắt âm thanh nền khi chuyển trang hoặc tắt màn hình điện thoại.
 */
function getMasterAudio(): HTMLAudioElement | null {
  if (typeof window === "undefined" || typeof document === "undefined") return null;

  let audio = document.getElementById("eccb-master-audio") as HTMLAudioElement | null;
  if (!audio) {
    audio = document.createElement("audio");
    audio.id = "eccb-master-audio";
    audio.setAttribute("preload", "auto");
    audio.setAttribute("playsinline", "true");
    audio.setAttribute("webkit-playsinline", "true");
    audio.setAttribute("x-webkit-airplay", "allow");
    audio.style.display = "none";
    document.body.appendChild(audio);
  }
  return audio;
}

/**
 * Yêu cầu Screen Wake Lock giữ sáng màn hình khi người dùng đang theo dõi
 */
async function requestScreenWakeLock() {
  if (typeof navigator !== "undefined" && "wakeLock" in navigator) {
    try {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      wakeLockSentinel = await (navigator as any).wakeLock.request("screen");
      wakeLockSentinel.addEventListener("release", () => {
        wakeLockSentinel = null;
      });
    } catch {}
  }
}

function releaseScreenWakeLock() {
  if (wakeLockSentinel) {
    try {
      wakeLockSentinel.release();
    } catch {}
    wakeLockSentinel = null;
  }
}

export function NewsAudioPlayer({
  newsId,
  title,
  summary,
  content,
  contentHtml,
  className = "",
  nextArticle: initialNextArticle,
}: NewsAudioPlayerProps) {
  const router = useRouter();

  // Trạng thái bài viết đang đọc hiện tại
  const [currentArticle, setCurrentArticle] = useState<ArticleMeta>({
    id: newsId,
    title,
    slug: newsId,
    summary,
    content: content || contentHtml,
    contentHtml: contentHtml || content,
  });

  // Trạng thái bài viết kế tiếp
  const [nextArticle, setNextArticle] = useState<ArticleMeta | null>(initialNextArticle || null);

  const [status, setStatus] = useState<PlayerStatus>("idle");
  const [currentTime, setCurrentTime] = useState<number>(0);
  const [duration, setDuration] = useState<number>(0);
  // MẶC ĐỊNH TỐC ĐỘ 1.2: Chuẩn giọng đọc dứt khoát, thanh thoát, trôi chảy theo yêu cầu
  const [speed, setSpeed] = useState<PlaybackSpeed>(1.2);
  // MẶC ĐỊNH GIỌNG NỮ CHUẨN: 'vi-VN-HoaiMyNeural' (Nữ truyền cảm)
  const [voice, setVoice] = useState<VoiceType>("vi-VN-HoaiMyNeural");
  const [autoPlayNext, setAutoPlayNext] = useState<boolean>(true);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Refs lưu giữ giá trị mới nhất cho các event listener bất đồng bộ
  const currentArticleRef = useRef<ArticleMeta>(currentArticle);
  const nextArticleRef = useRef<ArticleMeta | null>(nextArticle);
  const nextAudioUrlRef = useRef<string | null>(null);
  const autoPlayNextRef = useRef<boolean>(autoPlayNext);
  const speedRef = useRef<PlaybackSpeed>(speed);
  const voiceRef = useRef<VoiceType>(voice);
  const isDraggingRef = useRef<boolean>(false);

  // Khôi phục tùy chọn giọng đọc từ localStorage nếu có
  useEffect(() => {
    if (typeof window !== "undefined") {
      const savedVoice = localStorage.getItem("eccb_audio_voice") as VoiceType | null;
      if (savedVoice === "vi-VN-NamMinhNeural" || savedVoice === "vi-VN-HoaiMyNeural") {
        setVoice(savedVoice);
        voiceRef.current = savedVoice;
      }
    }
  }, []);

  // Đồng bộ props vào refs
  useEffect(() => {
    const meta: ArticleMeta = {
      id: newsId,
      title,
      slug: newsId,
      summary,
      content: content || contentHtml,
      contentHtml: contentHtml || content,
    };
    currentArticleRef.current = meta;
    setCurrentArticle(meta);
  }, [newsId, title, summary, content, contentHtml]);

  useEffect(() => {
    nextArticleRef.current = initialNextArticle || null;
    setNextArticle(initialNextArticle || null);
    nextAudioUrlRef.current = null;
  }, [initialNextArticle]);

  useEffect(() => {
    autoPlayNextRef.current = autoPlayNext;
  }, [autoPlayNext]);

  useEffect(() => {
    speedRef.current = speed;
    const audio = getMasterAudio();
    if (audio) {
      audio.playbackRate = speed;
    }
  }, [speed]);

  useEffect(() => {
    voiceRef.current = voice;
  }, [voice]);

  /**
   * Cập nhật thông tin bản tin lên Lock Screen (Màn hình khóa điện thoại)
   */
  const updateMediaSession = useCallback((articleTitle: string) => {
    if (typeof window === "undefined" || !("mediaSession" in navigator)) return;
    try {
      const origin = window.location.origin;
      navigator.mediaSession.metadata = new MediaMetadata({
        title: articleTitle || "Bản tin Hội CCB Xã Ea Súp",
        artist: "Hội Cựu Chiến Binh Xã Ea Súp",
        album: "Cổng thông tin điện tử & Nghiệp vụ E-CCB Ea Súp",
        artwork: [
          { src: `${origin}/images/logovip.png`, sizes: "512x512", type: "image/png" },
          { src: `${origin}/images/hero-military-bg.webp`, sizes: "192x192", type: "image/webp" },
        ],
      });
    } catch (err) {
      console.warn("[MEDIA_SESSION_ERROR]", err);
    }
  }, []);

  /**
   * Tự động nạp trước (Prefetch) file âm thanh MP3 của bài viết tiếp theo
   */
  const prefetchNextAudio = useCallback((nextItem: ArticleMeta | null) => {
    if (!nextItem || !nextItem.id) return;

    fetch("/api/news/tts", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        newsId: nextItem.id,
        title: nextItem.title,
        summary: nextItem.summary || null,
        voice: voiceRef.current,
      }),
    })
      .then((res) => res.json())
      .then((data) => {
        if (data.success && data.audioUrl) {
          nextAudioUrlRef.current = data.audioUrl;
          if (typeof document !== "undefined") {
            const preLink = document.createElement("link");
            preLink.rel = "prefetch";
            preLink.as = "fetch";
            preLink.href = data.audioUrl;
            document.head.appendChild(preLink);
          }
        }
      })
      .catch(() => {});
  }, []);

  /**
   * Tự động dò tìm bài viết tiếp theo để duy trì chuỗi đọc liên tục không giới hạn
   */
  const fetchNextSubsequentArticle = useCallback(
    async (currentId: string) => {
      try {
        const res = await fetch("/api/news?status=APPROVED");
        const json = await res.json();
        if (json.success && Array.isArray(json.data)) {
          const list = json.data;
          const idx = list.findIndex(
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            (a: any) => a.id === currentId || a.slug === currentId
          );
          if (idx !== -1 && idx + 1 < list.length) {
            const nextNext = list[idx + 1];
            const meta: ArticleMeta = {
              id: nextNext.id,
              title: nextNext.title,
              slug: nextNext.slug || nextNext.id,
              summary: nextNext.summary,
              content: nextNext.content,
            };
            setNextArticle(meta);
            nextArticleRef.current = meta;
            prefetchNextAudio(meta);
          } else if (list.length > 0 && idx === list.length - 1) {
            // Quay vòng lại bài đầu tiên nếu đã đến bài cuối
            const firstArticle = list[0];
            if (firstArticle.id !== currentId) {
              const meta: ArticleMeta = {
                id: firstArticle.id,
                title: firstArticle.title,
                slug: firstArticle.slug || firstArticle.id,
                summary: firstArticle.summary,
                content: firstArticle.content,
              };
              setNextArticle(meta);
              nextArticleRef.current = meta;
              prefetchNextAudio(meta);
            }
          }
        }
      } catch {}
    },
    [prefetchNextAudio]
  );

  /**
   * Đồng bộ điều hướng giao diện Next.js mà không làm đứt đoạn âm thanh nền
   */
  const syncPageNavigation = useCallback(
    (idOrSlug: string) => {
      if (typeof document === "undefined") return;

      if (document.visibilityState === "visible") {
        router.replace(`/tin-tuc/${idOrSlug}`, { scroll: false });
      } else {
        const handleVisibilityChange = () => {
          if (document.visibilityState === "visible") {
            document.removeEventListener("visibilitychange", handleVisibilityChange);
            router.replace(`/tin-tuc/${idOrSlug}`, { scroll: false });
          }
        };
        document.addEventListener("visibilitychange", handleVisibilityChange);
      }
    },
    [router]
  );

  /**
   * Dừng toàn bộ âm thanh và dọn dẹp tài nguyên
   */
  const stopAllAudio = useCallback(() => {
    activeMasterNewsId = null;
    releaseScreenWakeLock();

    const audio = getMasterAudio();
    if (audio) {
      audio.pause();
      audio.currentTime = 0;
      audio.removeAttribute("src");
      audio.load();
    }

    if (typeof window !== "undefined" && "mediaSession" in navigator) {
      navigator.mediaSession.playbackState = "none";
    }

    setStatus("idle");
    setCurrentTime(0);
    setDuration(0);
  }, []);

  /**
   * CHUYỂN VÀ PHÁT BẢN TIN TIẾP THEO MÀ KHÔNG BỊ TẮT KHI MÀN HÌNH ĐANG KHÓA
   */
  const handlePlayNext = useCallback(async () => {
    const next = nextArticleRef.current;
    if (!next) {
      stopAllAudio();
      return;
    }

    const audio = getMasterAudio();
    if (!audio) return;

    currentArticleRef.current = next;
    setCurrentArticle(next);
    activeMasterNewsId = next.id;

    updateMediaSession(next.title);
    if (typeof document !== "undefined") {
      document.title = `${next.title} — Hội CCB Xã Ea Súp`;
    }

    if (typeof window !== "undefined") {
      window.history.replaceState(null, "", `/tin-tuc/${next.slug || next.id}`);
    }

    const preloadedUrl = nextAudioUrlRef.current;

    // 1. Trường hợp có sẵn âm thanh nạp trước (Prefetched)
    if (preloadedUrl) {
      try {
        audio.loop = false;
        audio.src = preloadedUrl;
        audio.currentTime = 0;
        audio.playbackRate = speedRef.current;
        await audio.play();

        setStatus("playing");
        nextAudioUrlRef.current = null;

        fetchNextSubsequentArticle(next.id);
        syncPageNavigation(next.slug || next.id);
        return;
      } catch (err) {
        console.warn("[PLAY_PRELOADED_NEXT_FAIL]", err);
      }
    }

    // 2. Mở khóa hoặc chuẩn bị luồng audio bằng Data URI WAV im lặng tuyệt đối (không loop, không gọi mạng)
    try {
      audio.loop = false;
      audio.src = SILENT_BASE64_WAV;
      await audio.play().catch(() => {});
    } catch {}

    setStatus("loading");

    try {
      const res = await fetch("/api/news/tts", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          newsId: next.id,
          title: next.title,
          summary: next.summary || null,
          contentHtml: next.content || next.contentHtml || null,
          voice: voiceRef.current,
        }),
      });

      const data = await res.json();
      if (data.success && data.audioUrl) {
        audio.loop = false;
        audio.src = data.audioUrl;
        audio.currentTime = 0;
        audio.playbackRate = speedRef.current;
        await audio.play();

        setStatus("playing");
        fetchNextSubsequentArticle(next.id);
        syncPageNavigation(next.slug || next.id);
      } else {
        stopAllAudio();
      }
    } catch (err) {
      console.error("[PLAY_NEXT_FETCH_FAIL]", err);
      stopAllAudio();
    }
  }, [
    updateMediaSession,
    syncPageNavigation,
    fetchNextSubsequentArticle,
    stopAllAudio,
  ]);

  /**
   * ĐĂNG KÝ VÀ LẮNG NGHE SỰ KIỆN TRÊN ĐỐI TƯỢNG AUDIO MASTER
   */
  useEffect(() => {
    const audio = getMasterAudio();
    if (!audio) return;

    const handleLoadedMetadata = () => {
      if (audio.duration && !isNaN(audio.duration) && isFinite(audio.duration)) {
        setDuration(audio.duration);
      }
    };

    const handleTimeUpdate = () => {
      if (!isDraggingRef.current && audio) {
        setCurrentTime(audio.currentTime);

        if (
          typeof window !== "undefined" &&
          "mediaSession" in navigator &&
          "setPositionState" in navigator.mediaSession &&
          audio.duration &&
          !isNaN(audio.duration) &&
          isFinite(audio.duration) &&
          audio.duration > 0
        ) {
          try {
            navigator.mediaSession.setPositionState({
              duration: Math.max(1, audio.duration),
              playbackRate: audio.playbackRate || 1.0,
              position: Math.min(Math.max(0, audio.currentTime), audio.duration),
            });
          } catch {}
        }
      }
    };

    const handleEnded = () => {
      if (autoPlayNextRef.current && nextArticleRef.current) {
        handlePlayNext();
      } else {
        setStatus("idle");
        setCurrentTime(0);
        releaseScreenWakeLock();
      }
    };

    const handlePlay = () => {
      setStatus("playing");
    };

    const handlePause = () => {
      if (status !== "loading") {
        setStatus("paused");
      }
    };

    audio.addEventListener("loadedmetadata", handleLoadedMetadata);
    audio.addEventListener("timeupdate", handleTimeUpdate);
    audio.addEventListener("ended", handleEnded);
    audio.addEventListener("play", handlePlay);
    audio.addEventListener("pause", handlePause);

    return () => {
      audio.removeEventListener("loadedmetadata", handleLoadedMetadata);
      audio.removeEventListener("timeupdate", handleTimeUpdate);
      audio.removeEventListener("ended", handleEnded);
      audio.removeEventListener("play", handlePlay);
      audio.removeEventListener("pause", handlePause);
    };
  }, [handlePlayNext, status]);

  /**
   * BẮT ĐẦU PHÁT ÂM THANH KHI NGƯỜI DÙNG BẤM "NGHE ĐỌC"
   */
  const handleStartPlay = useCallback(async () => {
    const audio = getMasterAudio();
    if (!audio) return;

    // Mở khóa Media Pipeline tức thời trên iOS / Android ngay trong User Gesture bằng Data URI WAV im lặng tuyệt đối (không loop, không gọi mạng)
    try {
      audio.loop = false;
      audio.src = SILENT_BASE64_WAV;
      await audio.play().catch(() => {});
    } catch (e) {
      console.warn("[PRIMING_AUDIO_WARN]", e);
    }

    requestScreenWakeLock();
    setStatus("loading");
    activeMasterNewsId = currentArticle.id;

    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 12000);

      const response = await fetch("/api/news/tts", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          newsId: currentArticle.id,
          title: currentArticle.title,
          summary: currentArticle.summary || null,
          contentHtml: currentArticle.content || currentArticle.contentHtml || null,
          voice: voiceRef.current,
        }),
        signal: controller.signal,
      });

      clearTimeout(timeoutId);

      if (!response.ok) {
        throw new Error(`API HTTP ${response.status}`);
      }

      const data = await response.json();

      if (data.success && data.audioUrl) {
        audio.loop = false;
        audio.src = data.audioUrl;
        audio.currentTime = 0;
        audio.playbackRate = speedRef.current;
        await audio.play();

        setStatus("playing");
        setErrorMessage(null);
        updateMediaSession(currentArticle.title);

        prefetchNextAudio(nextArticleRef.current);
      } else {
        audio.loop = false;
        audio.pause();
        setStatus("idle");
        setErrorMessage("Tạm thời chưa thể đọc bài này. Bấm để thử lại.");
        setTimeout(() => setErrorMessage(null), 5000);
      }
    } catch (err) {
      console.error("[NEWS_TTS_FETCH_FAIL]", err);
      audio.loop = false;
      audio.pause();
      setStatus("idle");
      setErrorMessage("Đang tải dữ liệu, vui lòng bấm lại.");
      setTimeout(() => setErrorMessage(null), 5000);
    }
  }, [currentArticle, updateMediaSession, prefetchNextAudio]);

  /**
   * CHUYỂN ĐỔI GIỮA GIỌNG ĐỌC NỮ (HOÀI MY) VÀ GIỌNG ĐỌC NAM (NAM MINH)
   */
  const handleToggleVoice = useCallback(() => {
    const nextVoice: VoiceType =
      voice === "vi-VN-HoaiMyNeural" ? "vi-VN-NamMinhNeural" : "vi-VN-HoaiMyNeural";
    setVoice(nextVoice);
    voiceRef.current = nextVoice;
    nextAudioUrlRef.current = null; // Đặt lại cache để nạp giọng mới

    if (typeof window !== "undefined") {
      localStorage.setItem("eccb_audio_voice", nextVoice);
    }

    // Nếu đang phát hoặc tạm dừng, chuyển đổi trực tiếp ngay tại thời điểm đang nghe
    if (status === "playing" || status === "paused") {
      const audio = getMasterAudio();
      const currentPos = audio ? audio.currentTime : 0;
      setStatus("loading");

      fetch("/api/news/tts", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          newsId: currentArticleRef.current.id,
          title: currentArticleRef.current.title,
          summary: currentArticleRef.current.summary || null,
          contentHtml: currentArticleRef.current.content || currentArticleRef.current.contentHtml || null,
          voice: nextVoice,
        }),
      })
        .then((res) => res.json())
        .then((data) => {
          if (data.success && data.audioUrl && audio) {
            audio.loop = false;
            audio.src = data.audioUrl;
            audio.currentTime = currentPos;
            audio.playbackRate = speedRef.current;
            audio.play().catch(() => {});
            setStatus("playing");
            prefetchNextAudio(nextArticleRef.current);
          } else {
            setStatus("playing");
          }
        })
        .catch(() => {
          setStatus("playing");
        });
    }
  }, [voice, status, prefetchNextAudio]);

  /**
   * ĐĂNG KÝ MEDIA SESSION CONTROLS CHO MÀN HÌNH KHÓA (LOCK SCREEN)
   */
  useEffect(() => {
    if (typeof window === "undefined" || !("mediaSession" in navigator)) return;

    try {
      updateMediaSession(currentArticle.title);

      navigator.mediaSession.setActionHandler("play", () => {
        const audio = getMasterAudio();
        if (audio) {
          audio.play().catch(() => {});
          setStatus("playing");
          requestScreenWakeLock();
        }
      });

      navigator.mediaSession.setActionHandler("pause", () => {
        const audio = getMasterAudio();
        if (audio) {
          audio.pause();
          setStatus("paused");
          releaseScreenWakeLock();
        }
      });

      navigator.mediaSession.setActionHandler("seekbackward", () => {
        const audio = getMasterAudio();
        if (audio) {
          audio.currentTime = Math.max(0, audio.currentTime - 10);
          setCurrentTime(audio.currentTime);
        }
      });

      navigator.mediaSession.setActionHandler("seekforward", () => {
        const audio = getMasterAudio();
        if (audio) {
          audio.currentTime = Math.min(audio.duration || 1000, audio.currentTime + 10);
          setCurrentTime(audio.currentTime);
        }
      });

      navigator.mediaSession.setActionHandler("nexttrack", () => {
        handlePlayNext();
      });

      try {
        navigator.mediaSession.setActionHandler("seekto", (details) => {
          const audio = getMasterAudio();
          if (audio && details.seekTime !== undefined) {
            audio.currentTime = details.seekTime;
            setCurrentTime(details.seekTime);
          }
        });
      } catch {}
    } catch (e) {
      console.warn("[MEDIA_SESSION_WARN]", e);
    }
  }, [currentArticle.title, handlePlayNext, updateMediaSession]);

  useEffect(() => {
    if (typeof window !== "undefined" && "mediaSession" in navigator) {
      navigator.mediaSession.playbackState =
        status === "playing" ? "playing" : status === "paused" ? "paused" : "none";
    }
  }, [status]);

  const handleTogglePause = () => {
    const audio = getMasterAudio();
    if (!audio) return;

    if (status === "playing") {
      audio.pause();
      setStatus("paused");
      releaseScreenWakeLock();
    } else if (status === "paused") {
      audio.play().catch(() => {});
      setStatus("playing");
      requestScreenWakeLock();
    }
  };

  const handleRewind10 = () => {
    const audio = getMasterAudio();
    if (audio) {
      const nextTime = Math.max(0, audio.currentTime - 10);
      audio.currentTime = nextTime;
      setCurrentTime(nextTime);
    }
  };

  const handleForward10 = () => {
    const audio = getMasterAudio();
    if (audio) {
      const maxDur = audio.duration || duration || 1000;
      const nextTime = Math.min(maxDur, audio.currentTime + 10);
      audio.currentTime = nextTime;
      setCurrentTime(nextTime);
    }
  };

  const handleSeekChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = parseFloat(e.target.value);
    setCurrentTime(val);
  };

  const handleSeekCommit = (e: React.MouseEvent<HTMLInputElement> | React.TouchEvent<HTMLInputElement>) => {
    isDraggingRef.current = false;
    const val = parseFloat((e.currentTarget as HTMLInputElement).value);
    const audio = getMasterAudio();
    if (audio) {
      audio.currentTime = val;
    }
  };

  /**
   * Đổi tốc độ đọc xoay vòng (1.2x Mặc định -> 1.4x Nhanh -> 1.0x Chuẩn chậm)
   */
  const handleToggleSpeed = () => {
    const speeds: PlaybackSpeed[] = [1.2, 1.4, 1.0];
    const currentIndex = speeds.indexOf(speed);
    const nextSpeed = speeds[(currentIndex + 1) % speeds.length];
    setSpeed(nextSpeed);
  };

  useEffect(() => {
    if (status === "idle") return;

    function handleKeyDown(e: KeyboardEvent) {
      const tag = (e.target as HTMLElement)?.tagName?.toLowerCase();
      if (tag === "input" || tag === "textarea" || (e.target as HTMLElement)?.isContentEditable) {
        return;
      }

      if (e.code === "Space") {
        e.preventDefault();
        handleTogglePause();
      } else if (e.code === "ArrowLeft") {
        e.preventDefault();
        handleRewind10();
      } else if (e.code === "ArrowRight") {
        e.preventDefault();
        handleForward10();
      } else if (e.code === "Escape") {
        e.preventDefault();
        stopAllAudio();
      }
    }

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [status, handleTogglePause, stopAllAudio]);

  // ================= RENDER GIAO DIỆN THEO CHUẨN DESIGN SYSTEM QUÂN ĐỘI HALLMARK =================

  // 1. TRẠNG THÁI CHỜ (IDLE)
  if (status === "idle") {
    return (
      <div className={`inline-flex items-center gap-1.5 shrink-0 flex-wrap ${className}`}>
        {/* Nút chính: Nghe đọc bản tin */}
        <button
          type="button"
          onClick={handleStartPlay}
          className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-moss-green hover:bg-[#1a301a] text-white font-bold text-xs border border-bronze-gold/60 transition cursor-pointer shadow-2xs active:scale-95 shrink-0"
          title="Nghe đọc tự động bản tin (Tốc độ 1.2x chuẩn phát thanh — Duy trì phát khi tắt màn hình)"
          aria-label="Nghe đọc bản tin tự động"
        >
          <Volume2 className="w-3.5 h-3.5 text-bronze-gold" />
          <span>Nghe đọc</span>
        </button>

        {/* Nút chọn trước Giọng Nữ (Hoài My) hoặc Giọng Nam (Nam Minh) */}
        <button
          type="button"
          onClick={handleToggleVoice}
          className="inline-flex items-center gap-1 px-2 py-1.5 rounded-lg bg-stone-100 hover:bg-stone-200 text-stone-700 text-[11px] font-semibold border border-stone-200 transition cursor-pointer active:scale-95"
          title={`Đang chọn: ${voice === "vi-VN-HoaiMyNeural" ? "Giọng Nữ Hoài My (truyền cảm)" : "Giọng Nam Nam Minh (ấm áp, đĩnh đạc)"} — Bấm để đổi giọng`}
          aria-label="Đổi giọng đọc Nữ hoặc Nam"
        >
          <span>{voice === "vi-VN-HoaiMyNeural" ? "👩 Nữ" : "👨 Nam"}</span>
        </button>

        {errorMessage && (
          <span className="text-[11px] text-flag-red font-medium px-2 py-0.5 bg-red-50 rounded border border-red-200 animate-pulse">
            {errorMessage}
          </span>
        )}
      </div>
    );
  }

  // 2. TRẠNG THÁI ĐANG TẢI (LOADING) - Loại bỏ hoàn toàn role=status và aria-live để trình duyệt và hệ điều hành không đọc to "chấm, chấm, chấm...."
  if (status === "loading") {
    return (
      <div
        className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-stone-100 text-moss-green font-semibold text-xs border border-moss-green/40 shrink-0 select-none ${className}`}
        aria-hidden="true"
      >
        <Loader2 className="w-3.5 h-3.5 animate-spin text-moss-green" />
        <span className="text-[11px] sm:text-xs">Đang tải bản tin</span>
      </div>
    );
  }

  // 3 & 4. TRẠNG THÁI ĐANG PHÁT HOẶC TẠM DỪNG (PLAYING / PAUSED) - BẢNG ĐIỀU KHIỂN TỐI TÂN
  const progressPercent = duration > 0 ? Math.min(100, (currentTime / duration) * 100) : 0;

  return (
    <div
      className={`inline-flex items-center gap-1 sm:gap-1.5 px-2.5 py-1 rounded-xl bg-[#FBFBEE] border border-bronze-gold/50 shadow-xs text-xs text-deep-text transition-all max-w-full overflow-x-auto ${className}`}
      role="region"
      aria-label="Trình phát âm thanh đọc bản tin tự động"
    >
      {/* 1. Nút Tạm dừng / Tiếp tục */}
      <button
        type="button"
        onClick={handleTogglePause}
        className="w-7 h-7 rounded-lg bg-moss-green hover:bg-[#1a301a] text-white flex items-center justify-center transition active:scale-95 shrink-0 shadow-2xs border border-bronze-gold/40"
        title={status === "playing" ? "Tạm dừng (Phím Space)" : "Tiếp tục phát (Phím Space)"}
        aria-label={status === "playing" ? "Tạm dừng" : "Tiếp tục phát"}
      >
        {status === "playing" ? <Pause className="w-3.5 h-3.5" /> : <Play className="w-3.5 h-3.5 ml-0.5" />}
      </button>

      {/* 2. Tua lại 10 giây */}
      <button
        type="button"
        onClick={handleRewind10}
        className="p-1 rounded-md hover:bg-stone-200/70 text-stone-700 transition shrink-0 flex items-center gap-0.5 text-[10px] font-bold"
        title="Tua lại 10 giây (Phím Mũi tên trái)"
        aria-label="Tua lại 10 giây"
      >
        <RotateCcw className="w-3 h-3 text-stone-600" />
        <span className="hidden sm:inline">10s</span>
      </button>

      {/* 3. Tua tới 10 giây */}
      <button
        type="button"
        onClick={handleForward10}
        className="p-1 rounded-md hover:bg-stone-200/70 text-stone-700 transition shrink-0 flex items-center gap-0.5 text-[10px] font-bold"
        title="Tua tới 10 giây (Phím Mũi tên phải)"
        aria-label="Tua tới 10 giây"
      >
        <RotateCw className="w-3 h-3 text-stone-600" />
        <span className="hidden sm:inline">10s</span>
      </button>

      {/* Nút chuyển trực tiếp sang bài tiếp theo */}
      {nextArticle && (
        <button
          type="button"
          onClick={handlePlayNext}
          className="p-1 rounded-md hover:bg-stone-200/70 text-stone-700 transition shrink-0 flex items-center gap-0.5 text-[10px] font-bold"
          title={`Chuyển sang bản tin kế tiếp: ${nextArticle.title}`}
          aria-label="Chuyển sang bản tin kế tiếp"
        >
          <SkipForward className="w-3 h-3 text-stone-600" />
          <span className="hidden lg:inline text-[9px]">Tiếp</span>
        </button>
      )}

      {/* 4. Thanh trượt thời gian & hiển thị phút giây */}
      <div className="flex items-center gap-1.5 px-1 min-w-[65px] sm:min-w-[110px]">
        <input
          type="range"
          min="0"
          max={duration || 100}
          step="0.5"
          value={currentTime}
          onMouseDown={() => {
            isDraggingRef.current = true;
          }}
          onTouchStart={() => {
            isDraggingRef.current = true;
          }}
          onChange={handleSeekChange}
          onMouseUp={handleSeekCommit}
          onTouchEnd={handleSeekCommit}
          className="w-12 sm:w-16 md:w-20 h-1.5 bg-stone-200 rounded-lg appearance-none cursor-pointer accent-moss-green"
          style={{
            background: `linear-gradient(to right, #244023 ${progressPercent}%, #E5E7EB ${progressPercent}%)`,
          }}
          aria-label="Thanh trượt thời gian đọc"
        />

        <span className="font-mono text-[10px] sm:text-[11px] text-stone-600 whitespace-nowrap min-w-[34px] sm:min-w-[65px] text-right">
          <span className="font-semibold text-moss-green">{formatTime(currentTime)}</span>
          <span className="hidden sm:inline text-stone-400">/{formatTime(duration)}</span>
        </span>
      </div>

      {/* 5. Nút chọn tốc độ đọc (1.2x Mặc định - 1.4x Nhanh - 1.0x Chuẩn chậm) */}
      <button
        type="button"
        onClick={handleToggleSpeed}
        className="px-1.5 py-0.5 rounded-md bg-stone-100 hover:bg-stone-200 text-stone-700 font-mono font-bold text-[10px] transition shrink-0 border border-stone-200"
        title="Tốc độ đọc: Bấm để đổi (1.2x Mặc định - 1.4x Nhanh - 1.0x Chuẩn)"
        aria-label={`Tốc độ đọc hiện tại: ${speed}x`}
      >
        {speed}x
      </button>

      {/* 6. Nút chuyển đổi nhanh Giọng Nữ (Hoài My) / Giọng Nam (Nam Minh) */}
      <button
        type="button"
        onClick={handleToggleVoice}
        className="px-1.5 py-0.5 rounded text-[10px] font-semibold bg-stone-100 hover:bg-stone-200 text-deep-text border border-stone-200 transition cursor-pointer shrink-0 flex items-center gap-0.5 active:scale-95"
        title={`Đang đọc bằng: ${voice === "vi-VN-HoaiMyNeural" ? "Giọng Nữ Hoài My (truyền cảm)" : "Giọng Nam Nam Minh (đĩnh đạc)"} — Bấm để đổi giọng`}
        aria-label="Chuyển đổi giọng đọc"
      >
        <span>{voice === "vi-VN-HoaiMyNeural" ? "👩 Nữ" : "👨 Nam"}</span>
      </button>

      {/* Nút bật/tắt chế độ Đọc liên tục (Tự động đọc tiếp khi hết bài) */}
      {nextArticle && (
        <button
          type="button"
          onClick={() => setAutoPlayNext((prev) => !prev)}
          className={`px-1.5 py-0.5 rounded-md font-mono font-bold text-[10px] transition shrink-0 border flex items-center gap-1 ${
            autoPlayNext
              ? "bg-emerald-100/90 text-moss-green border-moss-green/40"
              : "bg-stone-100 text-stone-400 border-stone-200 hover:text-stone-700"
          }`}
          title={
            autoPlayNext
              ? `Tự động đọc bài kế tiếp: BẬT (Bài tiếp: "${nextArticle.title}")`
              : "Tự động đọc bài kế tiếp: TẮT (Bấm để bật)"
          }
          aria-label={autoPlayNext ? "Đọc liên tục: Bật" : "Đọc liên tục: Tắt"}
        >
          <Repeat className="w-2.5 h-2.5" />
          <span className="hidden sm:inline text-[9px]">Liên tục</span>
        </button>
      )}

      {/* 7. Nút Dừng & Đóng */}
      <button
        type="button"
        onClick={stopAllAudio}
        className="p-1 rounded-md hover:bg-stone-200 text-stone-500 hover:text-flag-red transition shrink-0"
        title="Dừng và tắt thanh phát âm thanh (Phím Esc)"
        aria-label="Dừng phát và đóng thanh điều khiển"
      >
        <X className="w-3.5 h-3.5" />
      </button>
    </div>
  );
}
