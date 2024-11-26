// Import required functions from evaluator.js
importScripts('evaluator.js', 'api.js');

// Setup message listener with proper error handling
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
    if (request.type === 'evaluateUrl') {
        // Properly handle the promise chain
        handleEvaluation(request.url)
            .then(response => {
                if (chrome.runtime.lastError) {
                    sendResponse({ error: chrome.runtime.lastError.message });
                    return;
                }
                sendResponse(response);
            })
            .catch(error => {
                console.error('Evaluation error:', error);
                sendResponse({ error: error.message || 'Failed to evaluate resource' });
            });
        return true; // Keep the message channel open for async response
    }
    // Return false for unhandled message types
    return false;
});

async function handleEvaluation(url) {
    try {
        // Check if we have cached results first
        const cachedResult = await getCachedEvaluation(url);
        if (!navigator.onLine) {
            console.log('Offline mode - using cached data or offline evaluation');
            return cachedResult || await performOfflineEvaluation(url);
        }

        // If we're online, try to get fresh data
        const resourceType = await determineResourceType(url);
        const apiClient = new APIClient();
        
        let licenseInfo;
        try {
            if (resourceType === 'youtube') {
                licenseInfo = await apiClient.getYouTubeLicense(url);
            } else if (resourceType === 'book') {
                licenseInfo = await apiClient.getGoogleBooksLicense(url);
            } else {
                licenseInfo = {
                    type: 'Unknown license',
                    offlineAvailable: true,
                    lastUpdated: new Date().toISOString(),
                    details: {
                        platform: 'Unknown',
                        error: 'Unsupported resource type'
                    }
                };
            }
        } catch (error) {
            console.error('License fetch error:', error);
            licenseInfo = {
                type: 'License information unavailable',
                offlineAvailable: true,
                lastUpdated: new Date().toISOString(),
                details: {
                    platform: resourceType,
                    error: error.message
                }
            };
        }

        const result = {
            license: licenseInfo,
            quality: await evaluateQuality(url),
            adaptability: await evaluateAdaptability(url),
            reusability: await evaluateReusability(url)
        };

        // Cache the results for offline use
        await cacheEvaluation(url, result);
        return result;
    } catch (error) {
        console.error('Evaluation error:', error);
        // If online evaluation fails, try offline evaluation as fallback
        if (navigator.onLine) {
            console.log('Online evaluation failed, falling back to offline evaluation');
            return performOfflineEvaluation(url);
        }
        throw new Error('Failed to evaluate resource');
    }
}

function determineResourceType(url) {
    if (url.includes('youtube.com') || url.includes('youtu.be')) {
        return 'youtube';
    } else if (url.includes('books.google.com')) {
        return 'book';
    }
    return 'other';
}
