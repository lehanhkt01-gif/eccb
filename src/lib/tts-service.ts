import fs from "fs";
import path from "path";
import { MsEdgeTTS, OUTPUT_FORMAT } from "msedge-tts";
import * as googleTTS from "google-tts-api";

export interface TTSOptions {
  newsId: string;
  title: string;
  summary?: string | null;
  contentHtml?: string | null;
  text?: string | null;
  voice?: "vi-VN-HoaiMyNeural" | "vi-VN-NamMinhNeural";
}

export interface TTSResult {
  success: boolean;
  audioUrl?: string;
  cached: boolean;
  durationEstimateSeconds?: number;
  provider?: "msedge-tts" | "google-tts" | "browser";
  fallbackToBrowser?: boolean;
  message?: string;
}

/**
 * Thư mục lưu trữ âm thanh bản tin tĩnh chuẩn Next.js / Docker
 */
const AUDIO_UPLOAD_DIR = path.join(process.cwd(), "public", "uploads", "audio", "news");

/**
 * Chuẩn hóa mã newsId thành tên file an toàn (chống Directory Traversal)
 */
export function sanitizeAudioId(id: string): string {
  if (!id || typeof id !== "string") {
    return `news-${Date.now()}`;
  }
  const sanitized = id.replace(/[^a-zA-Z0-9_-]/g, "_").substring(0, 80);
  return sanitized || `news-${Date.now()}`;
}

/**
 * Làm sạch văn bản HTML thành kịch bản đọc báo tiếng Việt tự nhiên
 * - Loại bỏ hoàn toàn mã script, style, comments, thẻ ảnh, caption rác
 * - Chuyển thẻ xuống dòng và đoạn văn thành dấu ngắt câu tự nhiên để giọng đọc ngắt nghỉ đúng nhịp
 * - Mở rộng các từ viết tắt chuyên ngành quân sự, Hội CCB, chính quyền địa phương
 */
export function extractCleanSpeechText(title: string, summary?: string | null, contentHtml?: string | null): string {
  let script = "";

  const cleanTitle = (title || "").trim();
  if (cleanTitle) {
    script += `${cleanTitle}. `;
  }

  const cleanSummary = (summary || "").trim();
  if (cleanSummary && !cleanTitle.includes(cleanSummary)) {
    script += `${cleanSummary}. `;
  }

  if (contentHtml) {
    let clean = contentHtml;

    // Loại bỏ khối ảnh, gallery, script, style, comment
    clean = clean.replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, " ");
    clean = clean.replace(/<style\b[^<]*(?:(?!<\/style>)<[^<]*)*<\/style>/gi, " ");
    clean = clean.replace(/<!--[\s\S]*?-->/gi, " ");
    clean = clean.replace(/<figcaption\b[^<]*(?:(?!<\/figcaption>)<[^<]*)*<\/figcaption>/gi, " ");
    clean = clean.replace(/<figure\b[^<]*(?:(?!<\/figure>)<[^<]*)*<\/figure>/gi, " ");

    // Thay thế ngắt dòng thành dấu ngắt câu có khoảng trống
    clean = clean.replace(/<\/(p|h1|h2|h3|h4|h5|h6|li|blockquote|div)>/gi, ". ");
    clean = clean.replace(/<br\s*\/?>/gi, ". ");

    // Gỡ toàn bộ thẻ HTML còn lại
    clean = clean.replace(/<[^>]+>/g, " ");

    // Giải mã thực thể HTML cơ bản
    clean = clean
      .replace(/&nbsp;/gi, " ")
      .replace(/&amp;/gi, " và ")
      .replace(/&quot;/gi, '"')
      .replace(/&#39;|&apos;/gi, "'")
      .replace(/&lt;/gi, "<")
      .replace(/&gt;/gi, ">")
      .replace(/&hellip;/gi, "...")
      .replace(/&bull;/gi, ", ")
      .replace(/&#(\d+);/g, (_, dec) => String.fromCharCode(parseInt(dec, 10)));

    // Loại bỏ URL dạng http/https để tránh đọc url dài dòng
    clean = clean.replace(/https?:\/\/\S+/gi, "");

    // Chuẩn hóa dấu câu lặp lại
    clean = clean.replace(/\.+/g, ".");
    clean = clean.replace(/\s+/g, " ");

    script += ` ${clean}`;
  }

  // Tinh chỉnh văn phong phát thanh và tự động mở rộng từ viết tắt quân đội & hành chính
  const abbreviations: [RegExp, string][] = [
    [/\bHội\s+CCB\b/gi, "Hội Cựu chiến binh"],
    [/\bCCB\b/g, "Cựu chiến binh"],
    [/\bCQN\b/g, "Cựu quân nhân"],
    [/\bUBND\b/g, "Ủy ban nhân dân"],
    [/\bHĐND\b/g, "Hội đồng nhân dân"],
    [/\bUBMTTQVN\b/gi, "Ủy ban Mặt trận Tổ quốc Việt Nam"],
    [/\bUBMTTQ\b/gi, "Ủy ban Mặt trận Tổ quốc"],
    [/\bMTTQ\b/g, "Mặt trận Tổ quốc"],
    [/\bBCH\b/g, "Ban Chấp hành"],
    [/\bBTV\b/g, "Ban Thường vụ"],
    [/\bTW\b/g, "Trung ương"],
    [/\bT\.Ư\b/gi, "Trung ương"],
    [/\bđ\/c\b/gi, "đồng chí"],
    [/\bĐ\/c\b/g, "Đồng chí"],
    [/\bPCT\b/g, "Phó Chủ tịch"],
    [/\bCT\b/g, "Chủ tịch"],
    [/\bNQ\b/g, "Nghị quyết"],
    [/\bQĐ\b/g, "Quyết định"],
    [/\bCSDL\b/g, "Cơ sở dữ liệu"],
    [/\bCNTT\b/g, "Công nghệ thông tin"],
    [/\bCĐS\b/g, "Chuyển đổi số"],
    [/\bĐTN\b/g, "Đoàn Thanh niên"],
    [/\bLHPN\b/g, "Liên hiệp Phụ nữ"],
    [/\bHND\b/g, "Hội Nông dân"],
    [/\bNHCSXH\b/g, "Ngân hàng Chính sách xã hội"],
    [/\bTổ\s*TK&VV\b/gi, "Tổ Tiết kiệm và Vay vốn"],
    [/\bTK&VV\b/g, "Tiết kiệm và Vay vốn"],
    [/\bTh\.\s*buôn\b/gi, "Thôn, buôn"],
    [/\b(\d{1,2})\/(\d{1,2})\/(\d{4})\b/g, "ngày $1 tháng $2 năm $3"],
    [/\b(\d{1,2})\/(\d{1,2})\b/g, "ngày $1 tháng $2"],
    [/(\d+)\s*%/g, "$1 phần trăm"],
  ];

  for (const [pattern, replacement] of abbreviations) {
    script = script.replace(pattern, replacement);
  }

  script = script.replace(/ngày\s+ngày\s+/gi, "ngày ");

  script = script
    .replace(/\s*([,.:;?!])\s*/g, "$1 ")
    .replace(/(\. ){2,}/g, ". ")
    .trim();

  return script;
}

/**
 * Đảm bảo thư mục lưu trữ file MP3 tồn tại
 */
function ensureAudioDir(): void {
  try {
    if (!fs.existsSync(AUDIO_UPLOAD_DIR)) {
      fs.mkdirSync(AUDIO_UPLOAD_DIR, { recursive: true });
    }
  } catch (err) {
    console.warn("[TTS_DIR_WARN] Không thể tạo thư mục lưu audio:", err);
  }
}

/**
 * Bộ nhớ đệm âm thanh RAM để dự phòng trường hợp đĩa máy chủ bị khóa quyền ghi (EACCES)
 */
export const audioMemoryCache = new Map<string, { buffer: Buffer; createdAt: number }>();

/**
 * Kiểm tra xem bản ghi MP3 của bài viết đã được lưu trên máy chủ chưa
 */
export function getCachedAudioPath(safeId: string): string | null {
  try {
    const filePath = path.join(AUDIO_UPLOAD_DIR, `${safeId}.mp3`);
    if (fs.existsSync(filePath)) {
      const stats = fs.statSync(filePath);
      if (stats.size > 200) {
        return `/uploads/audio/news/${safeId}.mp3`;
      }
    }
  } catch {}
  return null;
}

/**
 * Sinh file âm thanh bằng Microsoft Edge Neural TTS
 * Thiết lập timeout nghiêm ngặt (5s) để tránh treo request khi Microsoft nghẽn mạng
 */
async function synthesizeWithEdgeTTS(
  text: string,
  voice: "vi-VN-HoaiMyNeural" | "vi-VN-NamMinhNeural" = "vi-VN-HoaiMyNeural"
): Promise<Buffer> {
  const tts = new MsEdgeTTS();

  return new Promise(async (resolve, reject) => {
    let timer: NodeJS.Timeout | null = null;
    let isSettled = false;

    const cleanup = () => {
      isSettled = true;
      if (timer) clearTimeout(timer);
      try {
        tts.close();
      } catch {}
    };

    timer = setTimeout(() => {
      cleanup();
      reject(new Error("Edge-TTS timeout (5s)"));
    }, 5000);

    try {
      await tts.setMetadata(voice, OUTPUT_FORMAT.AUDIO_24KHZ_48KBITRATE_MONO_MP3);
      if (isSettled) return;

      // Giới hạn độ dài văn bản an toàn cho một luồng phát Edge-TTS
      const safeText = text.length > 5000 ? text.substring(0, 5000) : text;
      // Tốc độ +15%: Giọng đọc dứt khoát, thanh thoát, trôi chảy, đúng chuẩn phát thanh viên thời sự
      const { audioStream } = tts.toStream(safeText, { rate: "+15%", pitch: "+0Hz" });
      const chunks: Buffer[] = [];

      audioStream.on("data", (chunk) => {
        if (!isSettled) chunks.push(Buffer.from(chunk));
      });

      audioStream.on("end", () => {
        if (!isSettled) {
          const finalBuf = Buffer.concat(chunks);
          cleanup();
          if (finalBuf.length > 500) {
            resolve(finalBuf);
          } else {
            reject(new Error("Edge-TTS trả về luồng âm thanh rỗng"));
          }
        }
      });

      audioStream.on("error", (err) => {
        if (!isSettled) {
          cleanup();
          reject(err);
        }
      });
    } catch (err) {
      cleanup();
      reject(err);
    }
  });
}

/**
 * Sinh file âm thanh bằng Google TTS (Dự phòng tốc độ cao < 1 giây khi Edge-TTS bị nghẽn mạng)
 */
async function synthesizeWithGoogleTTS(text: string): Promise<Buffer> {
  const safeText = text.length > 4000 ? text.substring(0, 4000) : text;
  const results = await googleTTS.getAllAudioBase64(safeText, {
    lang: "vi",
    slow: false,
    timeout: 8000,
  });

  const buffers = results.map((item) => Buffer.from(item.base64, "base64"));
  const finalBuf = Buffer.concat(buffers);
  if (!finalBuf || finalBuf.length < 500) {
    throw new Error("Google-TTS trả về dữ liệu rỗng");
  }
  return finalBuf;
}

/**
 * Dịch vụ tổng hợp âm thanh giọng đọc bản tin chính thức (Hỗ trợ Static Cache, RAM Cache & Stream Fallback)
 */
export async function getOrGenerateNewsAudio(options: TTSOptions): Promise<TTSResult> {
  const baseId = sanitizeAudioId(options.newsId);
  const voiceKey = options.voice === "vi-VN-NamMinhNeural" ? "nam" : "nu";
  const safeId = `${baseId}-${voiceKey}`;

  // 1. KIỂM TRA BỘ NHỚ ĐỆM TĨNH TRÊN ĐĨA (STATIC CACHE)
  const cachedUrl = getCachedAudioPath(safeId) || (voiceKey === "nu" ? getCachedAudioPath(baseId) : null);
  if (cachedUrl) {
    return {
      success: true,
      audioUrl: cachedUrl,
      cached: true,
      provider: "msedge-tts",
    };
  }

  // 1.1 Kiểm tra RAM Cache nếu có sẵn
  if (audioMemoryCache.has(safeId)) {
    return {
      success: true,
      audioUrl: `/api/news/tts?stream=1&newsId=${safeId}`,
      cached: true,
      provider: "google-tts",
    };
  }

  // 2. BÓC TÁCH NỘI DUNG VĂN BẢN
  const textToRead = options.text?.trim()
    ? options.text.trim()
    : extractCleanSpeechText(options.title, options.summary, options.contentHtml);

  if (!textToRead || textToRead.length < 5) {
    return {
      success: false,
      cached: false,
      fallbackToBrowser: true,
      message: "Nội dung bản tin không đủ độ dài để chuyển đổi giọng đọc.",
    };
  }

  const filePath = path.join(AUDIO_UPLOAD_DIR, `${safeId}.mp3`);
  const finalVoice = options.voice || "vi-VN-HoaiMyNeural";

  // 3. THỰC THI SINH FILE ÂM THANH (ƯU TIÊN EDGE-TTS, TỰ ĐỘNG CHUYỂN SANG GOOGLE-TTS NẾU NGHẼN HOẶC TIMEOUT)
  let audioBuffer: Buffer | null = null;
  let providerUsed: "msedge-tts" | "google-tts" = "msedge-tts";

  try {
    audioBuffer = await synthesizeWithEdgeTTS(textToRead, finalVoice);
  } catch (edgeErr: any) {
    console.warn("[TTS_EDGE_WARN] Edge-TTS gặp sự cố hoặc timeout, chuyển sang Google TTS:", edgeErr?.message);
    try {
      audioBuffer = await synthesizeWithGoogleTTS(textToRead);
      providerUsed = "google-tts";
    } catch (googleErr: any) {
      console.error("[TTS_GOOGLE_ERROR] Cả Edge-TTS và Google-TTS đều thất bại:", googleErr?.message);
    }
  }

  // Nếu cả 2 đều thất bại trên server
  if (!audioBuffer || audioBuffer.length === 0) {
    return {
      success: false,
      cached: false,
      fallbackToBrowser: true,
      message: "Máy chủ tạm thời chưa thể chuyển đổi văn bản sang âm thanh.",
    };
  }

  // 4. LƯU VÀO RAM VÀ THỬ GHI RA ĐĨA
  audioMemoryCache.set(safeId, { buffer: audioBuffer, createdAt: Date.now() });

  let finalAudioUrl = `/api/news/tts?stream=1&newsId=${safeId}`;

  try {
    ensureAudioDir();
    await fs.promises.writeFile(filePath, audioBuffer);
    finalAudioUrl = `/uploads/audio/news/${safeId}.mp3`;
  } catch (diskErr) {
    console.warn("[TTS_DISK_WARN] Thư mục uploads không có quyền ghi, phục vụ âm thanh qua luồng Stream RAM:", diskErr);
  }

  return {
    success: true,
    audioUrl: finalAudioUrl,
    cached: false,
    provider: providerUsed,
    durationEstimateSeconds: Math.ceil(textToRead.length / 25),
  };
}
