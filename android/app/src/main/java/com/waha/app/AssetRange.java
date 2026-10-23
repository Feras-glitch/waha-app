package com.waha.app;

import android.content.res.AssetFileDescriptor;
import android.content.res.AssetManager;
import android.webkit.WebResourceResponse;

import java.io.ByteArrayInputStream;
import java.io.FilterInputStream;
import java.io.IOException;
import java.io.InputStream;
import java.util.HashMap;
import java.util.Map;

/**
 * تلاوة من حزمة الصوت داخل الـAPK (www/audio/): المشغّل يطلب أجزاءً من الملف (Range) ليقفز في السورة الطويلة،
 * فيُجاب بالجزء المطلوب وحده (206). ملفات mp3 لا تُضغط داخل الـAPK، فيُعرف طولها من دون قراءتها.
 * إن تعذّر شيءٌ من ذلك رجع null، فيُرسل الملف كاملًا كما تُرسل سائر الملفات.
 */
final class AssetRange {
    private AssetRange() {}

    static WebResourceResponse serve(AssetManager am, String path, Map<String, String> requestHeaders, String mime) {
        String range = null;
        if (requestHeaders != null) {
            for (Map.Entry<String, String> e : requestHeaders.entrySet()) {
                if (e.getKey() != null && "range".equalsIgnoreCase(e.getKey())) range = e.getValue();
            }
        }
        long len;
        try {
            AssetFileDescriptor fd = am.openFd(path);
            len = fd.getLength();
            fd.close();
        } catch (IOException e) {
            return null;
        }
        if (len <= 0) return null;
        HashMap<String, String> h = new HashMap<String, String>();
        h.put("Accept-Ranges", "bytes");
        try {
            long start = 0, end = len - 1;
            boolean partial = false;
            if (range != null && range.trim().startsWith("bytes=")) {
                String spec = range.trim().substring(6);
                int dash = spec.indexOf('-');
                if (dash < 0 || spec.indexOf(',') >= 0) return null;
                String a = spec.substring(0, dash).trim(), b = spec.substring(dash + 1).trim();
                if (a.isEmpty() && b.isEmpty()) return null;
                if (a.isEmpty()) {
                    start = Math.max(0, len - Long.parseLong(b));
                } else {
                    start = Long.parseLong(a);
                    if (!b.isEmpty()) end = Math.min(Long.parseLong(b), len - 1);
                }
                partial = true;
            }
            if (start >= len || end < start) {
                h.put("Content-Range", "bytes */" + len);
                return new WebResourceResponse(mime, null, 416, "Range Not Satisfiable", h, new ByteArrayInputStream(new byte[0]));
            }
            InputStream in = am.open(path);
            long skip = start;
            while (skip > 0) {
                long n = in.skip(skip);
                if (n <= 0) { in.close(); return null; }
                skip -= n;
            }
            long count = end - start + 1;
            h.put("Content-Length", String.valueOf(count));
            if (!partial) return new WebResourceResponse(mime, null, 200, "OK", h, in);
            h.put("Content-Range", "bytes " + start + "-" + end + "/" + len);
            return new WebResourceResponse(mime, null, 206, "Partial Content", h, new Limited(in, count));
        } catch (NumberFormatException | IOException e) {
            return null;
        }
    }

    /** يقرأ عددًا محددًا من البايتات ثم يتوقف */
    private static final class Limited extends FilterInputStream {
        private long left;

        Limited(InputStream in, long n) { super(in); left = n; }

        @Override
        public int read() throws IOException {
            if (left <= 0) return -1;
            int c = super.read();
            if (c >= 0) left--;
            return c;
        }

        @Override
        public int read(byte[] b, int off, int len) throws IOException {
            if (left <= 0) return -1;
            int n = super.read(b, off, (int) Math.min(len, left));
            if (n > 0) left -= n;
            return n;
        }

        @Override
        public long skip(long n) throws IOException {
            long s = super.skip(Math.min(n, left));
            left -= s;
            return s;
        }

        @Override
        public int available() throws IOException {
            return (int) Math.min(super.available(), left);
        }
    }
}
