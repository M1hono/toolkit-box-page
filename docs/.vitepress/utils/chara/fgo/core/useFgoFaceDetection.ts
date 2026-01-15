/**
 * @fileoverview FGO Face Detection Composable
 * @description Handles face detection using OpenCV and coordinate data
 */

import { ref, onMounted } from "vue";
import type { FgoCharacter, FaceCoordinate, SelectionRect } from "../types";

declare global {
    interface Window {
        cv: any;
    }
}

export function useFgoFaceDetection() {
    const faceDetected = ref(false);
    const opencvReady = ref(false);

    let opencvLoadingPromise: Promise<void> | null = null;

    async function loadOpenCV(): Promise<void> {
        // Return existing promise if already loading
        if (opencvLoadingPromise) {
            return opencvLoadingPromise;
        }

        if (window.cv && window.cv.Mat) {
            console.log("✅ OpenCV already loaded");
            opencvReady.value = true;
            return Promise.resolve();
        }

        opencvLoadingPromise = new Promise<void>((resolve) => {
            // Check if script is already in DOM
            const existingScript = document.querySelector(
                'script[src*="opencv.js"]'
            );
            if (existingScript) {
                console.log("⏳ OpenCV script already loading...");
                const checkReady = setInterval(() => {
                    if (window.cv && window.cv.Mat) {
                        clearInterval(checkReady);
                        opencvReady.value = true;
                        console.log("✅ OpenCV ready");
                        resolve();
                    }
                }, 100);
                return;
            }

            console.log("📥 Loading OpenCV...");
            if (typeof document !== "undefined") {
                const script = document.createElement("script");
                script.src = "https://docs.opencv.org/4.5.2/opencv.js";
                script.async = true;
                script.onload = () => {
                    console.log("✅ OpenCV loaded");
                    opencvReady.value = true;
                    resolve();
                };
                script.onerror = () => {
                    console.error("❌ OpenCV load failed");
                    opencvLoadingPromise = null;
                    resolve();
                };
                document.body.appendChild(script);
            } else {
                resolve();
            }
        });

        return opencvLoadingPromise;
    }

    async function initFaceDetector() {
        if (!window.cv) {
            console.warn("⚠️ OpenCV not loaded, skipping face detector init");
            return;
        }

        try {
            await new Promise((resolve) => {
                if (window.cv && window.cv.Mat) {
                    resolve(true);
                } else {
                    const checkCV = () => {
                        if (window.cv && window.cv.Mat) {
                            resolve(true);
                        } else {
                            setTimeout(checkCV, 100);
                        }
                    };
                    checkCV();
                }
            });

            const classifiers = [
                {
                    name: "lbpcascade_animeface.xml",
                    url: "/lbpcascade_animeface.xml",
                },
                {
                    name: "haarcascade_frontalface_default.xml",
                    url: "/haarcascade_frontalface_default.xml",
                },
            ];

            for (const classifier of classifiers) {
                try {
                    const response = await fetch(classifier.url);
                    if (!response.ok) continue;

                    const buffer = await response.arrayBuffer();
                    const uint8Array = new Uint8Array(buffer);

                    if (window.cv.FS) {
                        window.cv.FS.writeFile(classifier.name, uint8Array);
                        console.log(`✅ Loaded classifier: ${classifier.name}`);
                    }
                } catch (error) {
                    console.warn(
                        `⚠️ Failed to load ${classifier.name}:`,
                        error
                    );
                }
            }
            console.log("✅ Face detector initialized");
        } catch (error) {
            console.warn("⚠️ Face detector init failed:", error);
        }
    }

    function detectFaceInMat(mat: any): SelectionRect | null {
        if (!window.cv) return null;

        const gray = new window.cv.Mat();
        window.cv.cvtColor(mat, gray, window.cv.COLOR_RGBA2GRAY);

        const faces = new window.cv.RectVector();
        const faceCascade = new window.cv.CascadeClassifier();

        let cascadeLoaded = false;

        try {
            if (window.cv.FS && window.cv.FS.readFile) {
                try {
                    const animeData = window.cv.FS.readFile(
                        "lbpcascade_animeface.xml"
                    );
                    if (animeData && animeData.length > 0) {
                        faceCascade.load("lbpcascade_animeface.xml");
                        cascadeLoaded = true;
                        console.log("✅ Using anime face detector");
                    }
                } catch (e) {
                    console.log(
                        "⚠️ Anime detector unavailable, trying general detector"
                    );
                }
            }

            if (!cascadeLoaded && window.cv.FS && window.cv.FS.readFile) {
                try {
                    const generalData = window.cv.FS.readFile(
                        "haarcascade_frontalface_default.xml"
                    );
                    if (generalData && generalData.length > 0) {
                        faceCascade.load("haarcascade_frontalface_default.xml");
                        cascadeLoaded = true;
                        console.log("✅ Using general face detector");
                    }
                } catch (e) {
                    console.warn("⚠️ General detector also unavailable");
                }
            }
        } catch (error) {
            console.warn("⚠️ Face detector load failed:", error);
        }

        if (!cascadeLoaded) {
            gray.delete();
            faces.delete();
            faceCascade.delete();
            return null;
        }

        try {
            faceCascade.detectMultiScale(
                gray,
                faces,
                1.1,
                3,
                0,
                new window.cv.Size(30, 30)
            );

            let result = null;
            if (faces.size() > 0) {
                const face = faces.get(0);
                const centerX = face.x + face.width / 2;
                const centerY = face.y + face.height / 2;
                const size = Math.max(256, face.width * 1.5, face.height * 1.5);

                result = {
                    x: Math.max(0, centerX - size / 2),
                    y: Math.max(0, centerY - size / 2),
                    width: Math.min(mat.cols - centerX + size / 2, size),
                    height: Math.min(mat.rows - centerY + size / 2, size),
                };

                console.log("✅ OpenCV detected face:", result);
            }

            gray.delete();
            faces.delete();
            faceCascade.delete();

            return result;
        } catch (error) {
            console.warn("⚠️ Face detection process failed:", error);
            gray.delete();
            faces.delete();
            faceCascade.delete();
            return null;
        }
    }

    function detectFaceFromCoordinates(
        character: FgoCharacter,
        imageKey: string,
        image: HTMLImageElement | null
    ): SelectionRect | null {
        const faceCoords = character.imageData?.faceCoordinates;
        if (!faceCoords) return null;

        const imageId = extractImageId(imageKey);
        let faceData: FaceCoordinate | null = null;

        if (faceCoords[imageId]) {
            faceData = faceCoords[imageId];
        } else {
            const availableKeys = Object.keys(faceCoords);
            const fuzzyMatch = availableKeys.find(
                (key) =>
                    key.includes(imageId) ||
                    imageId.includes(key) ||
                    key.replace(/[^0-9]/g, "") ===
                        imageId.replace(/[^0-9]/g, "")
            );
            if (fuzzyMatch) {
                faceData = faceCoords[fuzzyMatch];
                console.log("🎯 Fuzzy match successful:", fuzzyMatch);
            }
        }

        if (
            faceData &&
            typeof faceData.faceX === "number" &&
            typeof faceData.faceY === "number"
        ) {
            const adjusted = adjustFaceCoordinates(
                faceData.faceX,
                faceData.faceY,
                image
            );
            return {
                x: adjusted.x,
                y: adjusted.y,
                width: 256,
                height: 256,
            };
        }

        return null;
    }

    function extractImageId(imageKey: string): string {
        const match = imageKey.match(/(\d+)_merged\.png/);
        if (match) return match[1];

        const parts = imageKey.split("_");
        if (parts.length > 1) return parts[1];

        return imageKey;
    }

    function adjustFaceCoordinates(
        originalX: number,
        originalY: number,
        image: HTMLImageElement | null
    ): { x: number; y: number } {
        if (!image) {
            return { x: Math.round(originalX), y: Math.round(originalY) };
        }

        const imageWidth = image.naturalWidth || image.width;
        const imageHeight = image.naturalHeight || image.height;

        let adjustedX = originalX;
        let adjustedY = originalY;

        if (imageWidth === 2048) {
            adjustedX = (originalX - 512) / 1;
            adjustedY = originalY * (768 / 1536);
        } else if (imageWidth === 1024) {
            adjustedX = originalX;
            adjustedY = originalY * (768 / 1024);
        } else {
            adjustedX = originalX * (1024 / imageWidth);
            adjustedY = originalY * (768 / imageHeight);
        }

        adjustedX = Math.max(0, Math.min(adjustedX, 1024 - 256));
        adjustedY = Math.max(0, Math.min(adjustedY, 768 - 256));

        return { x: Math.round(adjustedX), y: Math.round(adjustedY) };
    }

    onMounted(async () => {
        await loadOpenCV();
        setTimeout(() => initFaceDetector(), 1000);
    });

    return {
        faceDetected,
        opencvReady,
        loadOpenCV,
        initFaceDetector,
        detectFaceInMat,
        detectFaceFromCoordinates,
    };
}
