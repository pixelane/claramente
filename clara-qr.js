(function (root, factory) {
  const api = factory();
  if (typeof module !== "undefined" && module.exports) module.exports = api;
  root.ClaraQr = api;
})(typeof globalThis !== "undefined" ? globalThis : this, function () {
  function encoder() {
    if (typeof qrcode === "function") return qrcode;
    if (typeof require === "function") return require("./vendor/qrcode-generator.js");
    throw new Error("QR_ENCODER_MISSING");
  }

  function decoder() {
    if (typeof jsQR === "function") return jsQR;
    if (typeof require === "function") return require("./vendor/jsQR.js");
    return null;
  }

  function draw(text) {
    const qrcode = encoder();
    let lastError = null;
    for (const level of ["M", "L"]) {
      try {
        const qr = qrcode(0, level);
        qr.addData(String(text || ""));
        qr.make();
        return qr;
      } catch (error) {
        lastError = error;
      }
    }
    throw lastError;
  }

  function toSvg(text) {
    const qr = draw(text);
    const count = qr.getModuleCount();
    let path = "";
    for (let row = 0; row < count; row += 1) {
      for (let col = 0; col < count; col += 1) {
        if (qr.isDark(row, col)) path += `M${col} ${row}h1v1h-1z`;
      }
    }
    const size = count + 8;
    return `<svg class="qr-svg" xmlns="http://www.w3.org/2000/svg" viewBox="-4 -4 ${size} ${size}" shape-rendering="crispEdges" role="img" aria-label="Dibujo para escanear"><rect x="-4" y="-4" width="${size}" height="${size}" fill="#ffffff"/><path fill="#14120b" d="${path}"/></svg>`;
  }

  function toPixels(text, scale) {
    const qr = draw(text);
    const count = qr.getModuleCount();
    const quiet = 4;
    const cell = scale || 4;
    const size = (count + quiet * 2) * cell;
    const data = new Uint8ClampedArray(size * size * 4);
    for (let y = 0; y < size; y += 1) {
      for (let x = 0; x < size; x += 1) {
        const col = Math.floor(x / cell) - quiet;
        const row = Math.floor(y / cell) - quiet;
        const dark = col >= 0 && row >= 0 && col < count && row < count && qr.isDark(row, col);
        const index = (y * size + x) * 4;
        const color = dark ? 0 : 255;
        data[index] = color;
        data[index + 1] = color;
        data[index + 2] = color;
        data[index + 3] = 255;
      }
    }
    return { data, width: size, height: size };
  }

  function readPixels(pixels) {
    const jsQR = decoder();
    if (!jsQR || !pixels) return "";
    const found = jsQR(pixels.data, pixels.width, pixels.height);
    return found && found.data ? found.data : "";
  }

  async function readFile(file) {
    const bitmap = await createImageBitmap(file);
    const canvas = document.createElement("canvas");
    canvas.width = bitmap.width;
    canvas.height = bitmap.height;
    const context = canvas.getContext("2d", { willReadFrequently: true });
    context.drawImage(bitmap, 0, 0);
    if (typeof BarcodeDetector === "function") {
      try {
        const detector = new BarcodeDetector({ formats: ["qr_code"] });
        const codes = await detector.detect(canvas);
        if (codes[0] && codes[0].rawValue) return codes[0].rawValue;
      } catch (error) {
        // El lector del navegador no esta. Sigue el lector de la app.
      }
    }
    const image = context.getImageData(0, 0, canvas.width, canvas.height);
    return readPixels(image);
  }

  return { toSvg, toPixels, readPixels, readFile };
});
