
// manual implementation of base64 decoding following @google/genai guidelines
export function decode(base64: string): Uint8Array {
  const binaryString = atob(base64);
  const len = binaryString.length;
  const bytes = new Uint8Array(len);
  for (let i = 0; i < len; i++) {
    bytes[i] = binaryString.charCodeAt(i);
  }
  return bytes;
}

// manual implementation of base64 encoding following @google/genai guidelines
export function encode(bytes: Uint8Array): string {
  let binary = '';
  const len = bytes.byteLength;
  for (let i = 0; i < len; i++) {
    binary += String.fromCharCode(bytes[i]);
  }
  return btoa(binary);
}

// alias for backward compatibility in the app
export const decodeBase64 = decode;

// manual implementation of PCM decoding following @google/genai guidelines
export async function decodeAudioData(
  data: Uint8Array,
  ctx: AudioContext,
  sampleRate: number = 24000,
  numChannels: number = 1,
): Promise<AudioBuffer> {
  const dataInt16 = new Int16Array(data.buffer);
  const frameCount = dataInt16.length / numChannels;
  const buffer = ctx.createBuffer(numChannels, frameCount, sampleRate);

  for (let channel = 0; channel < numChannels; channel++) {
    const channelData = buffer.getChannelData(channel);
    for (let i = 0; i < frameCount; i++) {
      channelData[i] = dataInt16[i * numChannels + channel] / 32768.0;
    }
  }
  return buffer;
}

/**
 * وظيفة للانتظار لعدد محدد من الملي ثانية
 */
export const delay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

/**
 * وظيفة لإعادة محاولة تنفيذ طلب API في حال حدوث خطأ 429
 * تم زيادة وقت الانتظار الأولي لضمان تخطي نافذة الحصة الزمنية
 */
export async function withRetry<T>(fn: () => Promise<T>, retries = 5, initialDelay = 10000): Promise<T> {
  try {
    return await fn();
  } catch (error: any) {
    const errorStr = JSON.stringify(error).toLowerCase();
    const isRateLimit = 
      error?.status === 429 || 
      error?.code === 429 || 
      errorStr.includes('quota') || 
      errorStr.includes('exhausted') ||
      errorStr.includes('429') ||
      errorStr.includes('limit');

    if (retries > 0 && isRateLimit) {
      // إضافة تذبذب (jitter) بسيط لتجنب الطلبات المتزامنة
      const jitter = Math.random() * 2000;
      const waitTime = initialDelay + jitter;
      
      console.warn(`[بصر] تم تجاوز حد الطلبات. الانتظار ${Math.round(waitTime/1000)} ثوانٍ قبل المحاولة التالية... (${retries} محاولات متبقية)`);
      
      await delay(waitTime);
      // استخدام تراجع أسي (Exponential Backoff)
      return withRetry(fn, retries - 1, initialDelay * 1.5);
    }
    throw error;
  }
}
