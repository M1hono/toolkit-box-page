/**
 * @fileoverview Shared Mobile Photo Album Utilities
 * @description Provides mobile photo album saving functionality across components for iOS, Android, and other mobile platforms
 */

/**
 * @description Detect if the current platform is iPhone (not iPad or Mac)
 */
export function isIPhone(): boolean {
    if (typeof navigator === "undefined") return false;
    return /iPhone/.test(navigator.userAgent);
}

/**
 * @description Detect if the current platform is Android
 */
export function isAndroid(): boolean {
    if (typeof navigator === "undefined") return false;
    return /Android/.test(navigator.userAgent);
}

/**
 * @description Detect if the current platform is any mobile device
 */
export function isMobile(): boolean {
    if (typeof navigator === "undefined") return false;
    return (
        /Android|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(
            navigator.userAgent
        ) || !!(navigator.maxTouchPoints && navigator.maxTouchPoints > 1)
    );
}

/**
 * @description Get the mobile platform type
 */
export function getMobilePlatform():
    | "iphone"
    | "android"
    | "mobile"
    | "desktop" {
    if (isIPhone()) return "iphone";
    if (isAndroid()) return "android";
    if (isMobile()) return "mobile";
    return "desktop";
}

/**
 * @description Show a temporary notification to the user
 */
export function showNotification(
    message: string,
    type: "success" | "info" | "error" = "info"
) {
    if (typeof document === "undefined") return;

    const notification = document.createElement("div");
    notification.style.cssText = `
        position: fixed;
        top: 20px;
        right: 20px;
        padding: 12px 20px;
        border-radius: 8px;
        color: white;
        font-family: -apple-system, BlinkMacSystemFont, sans-serif;
        font-size: 14px;
        font-weight: 500;
        z-index: 10000;
        box-shadow: 0 4px 12px rgba(0, 0, 0, 0.3);
        transition: opacity 0.3s ease;
        max-width: 300px;
        word-wrap: break-word;
    `;

    const colors = {
        success: "#4CAF50",
        info: "#2196F3",
        error: "#F44336",
    };

    notification.style.backgroundColor = colors[type];
    notification.textContent = message;

    document.body.appendChild(notification);

    setTimeout(() => {
        notification.style.opacity = "0";
        setTimeout(() => {
            if (notification.parentNode) {
                notification.parentNode.removeChild(notification);
            }
        }, 300);
    }, 3000);
}

/**
 * @description Save image using H5+ API (for HBuilder/UniApp)
 * @param canvas The canvas element to save
 * @param filename The filename for the saved image
 * @returns Promise<boolean> True if saved successfully
 */
async function saveUsingH5Plus(
    canvas: HTMLCanvasElement,
    filename: string
): Promise<boolean> {
    return new Promise((resolve) => {
        try {
            // Convert canvas to blob and create object URL
            canvas.toBlob((blob) => {
                if (!blob) {
                    resolve(false);
                    return;
                }

                const url = URL.createObjectURL(blob);
                const localPath = `_downloads/${filename}`;

                // Use H5+ downloader to save the image
                const dtask = (window as any).plus?.downloader?.createDownload(
                    url,
                    {},
                    (d: any, status: number) => {
                        URL.revokeObjectURL(url);
                        if (status === 200) {
                            // Use H5+ gallery to save to photo album
                            (window as any).plus?.gallery?.save(
                                localPath,
                                () => {
                                    showNotification(
                                        "已保存到手机相册",
                                        "success"
                                    );
                                    resolve(true);
                                },
                                () => {
                                    showNotification(
                                        "保存失败，请重试！",
                                        "error"
                                    );
                                    resolve(false);
                                }
                            );
                        } else {
                            showNotification("下载失败，请重试！", "error");
                            resolve(false);
                        }
                    }
                );

                dtask?.start();
            }, "image/png");
        } catch (error) {
            console.error("H5+ save failed:", error);
            resolve(false);
        }
    });
}

/**
 * @description Save image to mobile photo album using platform-specific methods
 * @param canvas The canvas element to save
 * @param filename The filename for the saved image
 * @returns Promise<boolean> True if saved successfully
 */
export async function saveToMobilePhotoAlbum(
    canvas: HTMLCanvasElement,
    filename: string
): Promise<boolean> {
    const platform = getMobilePlatform();

    try {
        // Method 1: Try H5+ API first (for HBuilder/UniApp environments)
        if (typeof window !== "undefined" && (window as any).plus) {
            const h5Success = await saveUsingH5Plus(canvas, filename);
            if (h5Success) return true;
        }

        // Method 2: Use Web Share API (works on iPhone, Android, and other modern mobile browsers)
        if (navigator.share && navigator.canShare) {
            const blob = await new Promise<Blob>((resolve) => {
                canvas.toBlob((blob) => resolve(blob!), "image/png");
            });

            const filesArray = [
                new File([blob], filename, { type: "image/png" }),
            ];
            const shareData = {
                files: filesArray,
                title: "Save to Photos",
                text: "Save image to photo album",
            };

            if (navigator.canShare(shareData)) {
                await navigator.share(shareData);

                // Platform-specific success messages
                const messages = {
                    iphone: 'Image shared to Photos! Tap "Save to Photos" to add to your album.',
                    android:
                        "Image shared! Select your preferred app to save the image.",
                    mobile: "Image shared! Choose an app to save the image.",
                    desktop: "Image shared successfully!",
                };

                showNotification(messages[platform], "success");
                return true;
            }
        }

        // Method 3: Try Android-specific download approach
        if (platform === "android") {
            return await saveForAndroid(canvas, filename);
        }

        // Method 4: Fallback - Create download link
        const url = canvas.toDataURL();
        const link = document.createElement("a");
        link.download = filename;
        link.href = url;
        link.click();

        // Platform-specific download guidance
        const downloadMessages = {
            iphone: "Image downloaded! Tap and hold the image to save to Photos.",
            android:
                "Image downloaded! Check your Downloads folder or notification panel.",
            mobile: "Image downloaded! Check your device's download location.",
            desktop: "Image downloaded successfully!",
        };

        showNotification(downloadMessages[platform], "info");
        return true;
    } catch (error) {
        console.error("Failed to save to mobile photo album:", error);
        showNotification(
            "Failed to save image. Please try downloading instead.",
            "error"
        );
        return false;
    }
}

/**
 * @description Android-specific save approach
 * @param canvas The canvas element to save
 * @param filename The filename for the saved image
 * @returns Promise<boolean> True if saved successfully
 */
async function saveForAndroid(
    canvas: HTMLCanvasElement,
    filename: string
): Promise<boolean> {
    try {
        // For Android, we can try to trigger download with better Android support
        const blob = await new Promise<Blob>((resolve) => {
            canvas.toBlob((blob) => resolve(blob!), "image/png");
        });

        const url = URL.createObjectURL(blob);

        // Create a temporary link with Android-friendly attributes
        const link = document.createElement("a");
        link.href = url;
        link.download = filename;
        link.style.display = "none";

        // Add to DOM temporarily (required for some Android browsers)
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);

        // Clean up
        setTimeout(() => URL.revokeObjectURL(url), 100);

        showNotification(
            "Image saved! Check Downloads folder or notification panel.",
            "success"
        );
        return true;
    } catch (error) {
        console.error("Android save failed:", error);
        return false;
    }
}

/**
 * @description Legacy function for iPhone-only compatibility
 * @deprecated Use saveToMobilePhotoAlbum instead
 */
export const saveToiPhonePhotoAlbum = saveToMobilePhotoAlbum;

/**
 * @description Enhanced save function that uses mobile photo album for all mobile platforms
 * @param canvas The canvas to save
 * @param filename The filename for the saved image
 */
export async function saveImageWithMobileSupport(
    canvas: HTMLCanvasElement,
    filename: string
): Promise<void> {
    if (typeof document === "undefined") return;

    // On any mobile platform, try to save to photo album first
    if (isMobile()) {
        const saved = await saveToMobilePhotoAlbum(canvas, filename);
        if (saved) return;
    }

    // Fallback to regular download for desktop
    const link = document.createElement("a");
    link.download = filename;
    link.href = canvas.toDataURL();
    link.click();
    showNotification("Image downloaded successfully!", "success");
}

/**
 * @description Legacy function for iPhone-only compatibility
 * @deprecated Use saveImageWithMobileSupport instead
 */
export const saveImageWithiPhoneSupport = saveImageWithMobileSupport;
