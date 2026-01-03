import { spawn } from "node:child_process";
import { once } from "node:events";
import { performance } from "node:perf_hooks";
import process from "node:process";
import puppeteer from "puppeteer";

const OUTPUT_WIDTH = 1080;
const OUTPUT_HEIGHT = 1920;
const DEFAULT_URL = "http://localhost:3000";
const DEFAULT_DURATION = 10;
const DEFAULT_FPS = 60;
const DEFAULT_OUTPUT = "recording_1080x1920.mp4";
const DEFAULT_WAIT = 0.01;

const helpText = `
Record a website as a 1080x1920 mp4 using Puppeteer + ffmpeg.

Usage:
  npm run record -- --url <url> --duration <seconds> [options]

Options:
  -u, --url        Target URL (default: ${DEFAULT_URL})
  -d, --duration   Duration in seconds (default: ${DEFAULT_DURATION})
  -o, --out        Output file (default: ${DEFAULT_OUTPUT})
  -f, --fps        Frames per second (default: ${DEFAULT_FPS})
  -w, --wait       Seconds to wait after load (default: ${DEFAULT_WAIT})
  --headful        Run Chromium with a visible window
  -h, --help       Show this help
`.trim();

const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

const normalizeUrl = (rawUrl) => {
  if (!rawUrl) return DEFAULT_URL;
  try {
    // eslint-disable-next-line no-new
    new URL(rawUrl);
    return rawUrl;
  } catch {
    return `http://${rawUrl}`;
  }
};

const parseArgs = (args) => {
  const options = {
    url: DEFAULT_URL,
    duration: DEFAULT_DURATION,
    out: DEFAULT_OUTPUT,
    fps: DEFAULT_FPS,
    wait: DEFAULT_WAIT,
    headless: true,
    help: false,
  };

  const setOption = (key, value) => {
    switch (key) {
      case "url":
        options.url = value;
        break;
      case "duration":
        options.duration = Number.parseFloat(value);
        break;
      case "out":
        options.out = value;
        break;
      case "fps":
        options.fps = Number.parseFloat(value);
        break;
      case "wait":
        options.wait = Number.parseFloat(value);
        break;
      default:
        throw new Error(`Unknown option: ${key}`);
    }
  };

  for (let i = 0; i < args.length; i += 1) {
    const arg = args[i];
    if (arg === "--help" || arg === "-h") {
      options.help = true;
      return options;
    }
    if (arg === "--headful") {
      options.headless = false;
      continue;
    }
    if (arg.startsWith("--")) {
      const [key, inlineValue] = arg.slice(2).split("=");
      if (!key) throw new Error(`Invalid option: ${arg}`);
      const value = inlineValue ?? args[i + 1];
      if (value === undefined) throw new Error(`Missing value for --${key}`);
      if (inlineValue === undefined) i += 1;
      setOption(key, value);
      continue;
    }
    if (arg.startsWith("-")) {
      const key = arg.slice(1);
      const value = args[i + 1];
      if (value === undefined) throw new Error(`Missing value for -${key}`);
      if (key === "u") setOption("url", value);
      else if (key === "d") setOption("duration", value);
      else if (key === "o") setOption("out", value);
      else if (key === "f") setOption("fps", value);
      else if (key === "w") setOption("wait", value);
      else throw new Error(`Unknown option: -${key}`);
      i += 1;
      continue;
    }
    throw new Error(`Unknown argument: ${arg}`);
  }

  return options;
};

const validateOptions = (options) => {
  if (!Number.isFinite(options.duration) || options.duration <= 0) {
    throw new Error("Duration must be a number > 0.");
  }
  if (!Number.isFinite(options.fps) || options.fps <= 0) {
    throw new Error("FPS must be a number > 0.");
  }
  if (!Number.isFinite(options.wait) || options.wait < 0) {
    throw new Error("Wait must be a number >= 0.");
  }
  if (!options.out) {
    throw new Error("Output file path is required.");
  }
};

const buildFfmpegArgs = (fps, output) => [
  "-y",
  "-loglevel",
  "error",
  "-f",
  "image2pipe",
  "-vcodec",
  "mjpeg",
  "-r",
  String(fps),
  "-i",
  "-",
  "-vf",
  `scale=${OUTPUT_WIDTH}:${OUTPUT_HEIGHT}:force_original_aspect_ratio=decrease,pad=${OUTPUT_WIDTH}:${OUTPUT_HEIGHT}:(ow-iw)/2:(oh-ih)/2,format=yuv420p`,
  "-c:v",
  "libx264",
  "-profile:v",
  "high",
  "-level",
  "4.1",
  "-pix_fmt",
  "yuv420p",
  "-r",
  String(fps),
  "-movflags",
  "+faststart",
  output,
];

const run = async () => {
  const options = parseArgs(process.argv.slice(2));
  if (options.help) {
    console.log(helpText);
    return;
  }

  validateOptions(options);
  options.url = normalizeUrl(options.url);

  const totalFrames = Math.ceil(options.duration * options.fps);
  const frameIntervalMs = 1000 / options.fps;

  let browser;
  let page;
  let client;
  let ffmpeg;
  let ffmpegExit;
  let stopCapture = false;

  const stopScreencast = async () => {
    if (!client) return;
    await client.send("Page.stopScreencast").catch(() => {});
  };

  const stop = async () => {
    stopCapture = true;
    await stopScreencast();
    if (ffmpeg?.stdin && !ffmpeg.stdin.destroyed && !ffmpeg.stdin.writableEnded) {
      ffmpeg.stdin.end();
    }
    if (ffmpegExit) {
      await ffmpegExit.catch(() => {});
    }
    if (browser) {
      await browser.close().catch(() => {});
    }
  };

  const onSignal = async (signal) => {
    console.error(`Received ${signal}, shutting down...`);
    await stop();
    process.exit(1);
  };

  process.once("SIGINT", onSignal);
  process.once("SIGTERM", onSignal);

  try {
    console.log(
      `Recording ${options.url} at ${OUTPUT_WIDTH}x${OUTPUT_HEIGHT}, ${options.fps}fps for ${options.duration}s...`,
    );

    browser = await puppeteer.launch({ headless: options.headless });
    page = await browser.newPage();
    await page.setViewport({
      width: OUTPUT_WIDTH,
      height: OUTPUT_HEIGHT,
      deviceScaleFactor: 1,
    });
    await page.goto(options.url, { waitUntil: "domcontentloaded", timeout: 60000 });
    if (options.wait > 0) {
      console.log(`Waiting ${options.wait}s before capture...`);
      await sleep(options.wait * 1000);
    }

    client = await page.target().createCDPSession();

    let latestFrame = null;
    let latestFrameId = 0;
    let frameCounter = 0;
    let lastWrittenFrame = null;
    let lastWrittenFrameId = 0;
    let captureError = null;
    let resolveFirstFrame;
    const firstFrameReady = new Promise((resolve) => {
      resolveFirstFrame = resolve;
    });

    client.on("Page.screencastFrame", async ({ data, sessionId }) => {
      const frameId = (frameCounter += 1);
      // Ack promptly so Chrome keeps the screencast stream flowing.
      try {
        await client.send("Page.screencastFrameAck", { sessionId });
      } catch (error) {
        captureError = error;
        stopCapture = true;
        if (resolveFirstFrame) {
          resolveFirstFrame();
          resolveFirstFrame = null;
        }
        return;
      }

      if (stopCapture) return;
      if (frameId <= latestFrameId) return;
      latestFrame = Buffer.from(data, "base64");
      latestFrameId = frameId;
      if (resolveFirstFrame) {
        resolveFirstFrame();
        resolveFirstFrame = null;
      }
    });

    await client.send("Page.startScreencast", {
      format: "jpeg",
      quality: 80,
      maxWidth: OUTPUT_WIDTH,
      maxHeight: OUTPUT_HEIGHT,
    });

    ffmpeg = spawn("ffmpeg", buildFfmpegArgs(options.fps, options.out), {
      stdio: ["pipe", "inherit", "inherit"],
    });

    ffmpegExit = new Promise((resolve, reject) => {
      ffmpeg.on("error", (error) => reject(error));
      ffmpeg.on("exit", (code, signal) => {
        if (code === 0) resolve();
        else reject(new Error(`ffmpeg exited with code ${code ?? "null"} (${signal ?? "no signal"})`));
      });
    });

    const logEvery = Math.max(1, Math.round(options.fps));

    await firstFrameReady;
    if (!latestFrame) {
      throw captureError ?? new Error("Failed to receive the first frame.");
    }

    const writeFrame = async (buffer) => {
      if (!ffmpeg.stdin.write(buffer)) {
        await once(ffmpeg.stdin, "drain");
      }
    };

    const start = performance.now();
    for (let frame = 0; frame < totalFrames; frame += 1) {
      if (captureError) throw captureError;

      // Frame pacing: keep CFR output to honor --fps/--duration, drop bursty
      // updates, and only repeat when the stream is slow to minimize stutter.
      let buffer;
      if (latestFrameId > lastWrittenFrameId) {
        buffer = latestFrame;
        lastWrittenFrame = buffer;
        lastWrittenFrameId = latestFrameId;
      } else {
        buffer = lastWrittenFrame;
      }

      if (!buffer) {
        throw new Error("No frame available to write.");
      }

      await writeFrame(buffer);

      const targetTime = start + (frame + 1) * frameIntervalMs;
      const remaining = targetTime - performance.now();
      if (remaining > 0) await sleep(remaining);

      if ((frame + 1) % logEvery === 0 || frame + 1 === totalFrames) {
        const seconds = ((frame + 1) / options.fps).toFixed(1);
        console.log(`Captured ${frame + 1}/${totalFrames} frames (${seconds}s)`);
      }
    }

    stopCapture = true;
    await stopScreencast();

    ffmpeg.stdin.end();
    await ffmpegExit;
    await browser.close();

    console.log(`Saved ${options.out}`);
  } catch (error) {
    await stop();
    if (error.code === "ENOENT") {
      console.error("ffmpeg was not found on your PATH. Please install ffmpeg and try again.");
    } else {
      console.error(error?.message ?? error);
    }
    process.exitCode = 1;
  } finally {
    process.removeListener("SIGINT", onSignal);
    process.removeListener("SIGTERM", onSignal);
  }
};

await run();
