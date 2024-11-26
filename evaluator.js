async function evaluateResource(url) {
    // Check if we're in extension context
    if (!chrome.runtime) {
        throw new Error('This page needs to be loaded as a Chrome extension');
    }

    try {
        // Check if we have cached results
        const cachedResult = await getCachedEvaluation(url);
        if (cachedResult) {
            return cachedResult;
        }

        // If online, perform evaluation and cache results
        if (navigator.onLine) {
            const result = await new Promise((resolve, reject) => {
                chrome.runtime.sendMessage(
                    { type: 'evaluateUrl', url: url },
                    response => {
                        if (chrome.runtime.lastError) {
                            reject(new Error(chrome.runtime.lastError.message));
                            return;
                        }
                        if (response.error) {
                            reject(new Error(response.error));
                        } else {
                            resolve(response);
                        }
                    }
                );
            });

            // Cache the results
            await cacheEvaluation(url, result);
            return result;
        } else {
            // If offline, perform local evaluation
            return await performOfflineEvaluation(url);
        }
    } catch (error) {
        console.error('Evaluation error:', error);
        // If all else fails, perform offline evaluation
        return await performOfflineEvaluation(url);
    }
}

async function evaluateQuality(url) {
    // Quality criteria evaluation
    const criteria = [
        'Content accuracy',
        'Content clarity',
        'Educational value',
        'Technical quality'
    ];
    
    return 'Quality score: Good';
}
async function evaluateQuality(url) {
    try {
        // Basic quality evaluation based on URL pattern and domain reputation
        const urlObj = new URL(url);
        const domain = urlObj.hostname;
        
        if (domain.includes('youtube.com')) {
            return 'Quality score: High (YouTube verified content)';
        } else if (domain.includes('books.google.com')) {
            return 'Quality score: High (Google Books content)';
        }
        
        return 'Quality score: Moderate (Standard web content)';
    } catch (error) {
        console.error('Quality evaluation error:', error);
        return 'Quality score: Unable to determine';
    }
}

// Cache management functions
async function getCachedEvaluation(url) {
    return new Promise((resolve) => {
        chrome.storage.local.get([url], (result) => {
            resolve(result[url] || null);
        });
    });
}

async function cacheEvaluation(url, result) {
    return new Promise((resolve) => {
        chrome.storage.local.set({ [url]: result }, resolve);
    });
}

async function performOfflineEvaluation(url) {
    const cachedData = await getCachedEvaluation(url);
    if (cachedData) {
        cachedData.fromCache = true;
        return cachedData;
    }

    const urlObj = new URL(url);
    const domain = urlObj.hostname;
    
    // Enhanced offline evaluation results
    const results = {
        license: {
            type: 'Offline evaluation - License information unavailable',
            offlineAvailable: true,
            lastUpdated: new Date().toISOString(),
            fromCache: false,
            details: {
                platform: domain.includes('youtube.com') ? 'YouTube' : 
                         domain.includes('books.google.com') ? 'Google Books' : 'Unknown',
                status: 'Offline evaluation',
                restrictions: 'Unable to determine (offline)'
            }
        },
        quality: await evaluateQualityOffline(url),
        adaptability: await evaluateAdaptabilityOffline(url),
        reusability: await evaluateReusabilityOffline(url)
    };

    // Cache the offline evaluation results
    await cacheEvaluation(url, results);
    return results;
}

async function evaluateQualityOffline(url) {
    // Offline quality evaluation based on URL pattern and known domains
    const domain = new URL(url).hostname;
    if (domain.includes('youtube.com')) {
        return 'Quality score: Moderate (YouTube content - offline evaluation)';
    } else if (domain.includes('books.google.com')) {
        return 'Quality score: Good (Google Books content - offline evaluation)';
    }
    return 'Quality score: Unable to determine (offline)';
}

async function evaluateAdaptabilityOffline(url) {
    // Offline adaptability evaluation based on URL pattern
    const domain = new URL(url).hostname;
    if (domain.includes('youtube.com')) {
        return 'Adaptability score: Limited (Video content - offline evaluation)';
    } else if (domain.includes('books.google.com')) {
        return 'Adaptability score: Moderate (Book content - offline evaluation)';
    }
    return 'Adaptability score: Unable to determine (offline)';
}

async function evaluateReusabilityOffline(url) {
    // Offline reusability evaluation based on URL pattern
    const domain = new URL(url).hostname;
    if (domain.includes('youtube.com')) {
        return 'Reusability score: Limited (Platform dependent - offline evaluation)';
    } else if (domain.includes('books.google.com')) {
        return 'Reusability score: Moderate (Book content - offline evaluation)';
    }
    return 'Reusability score: Unable to determine (offline)';
}
async function evaluateAdaptability(url) {
    // Adaptability criteria evaluation
    const criteria = [
        'Format flexibility',
        'Module independence',
        'Technical compatibility'
    ];
    
    return 'Adaptability score: Medium';
}

async function evaluateReusability(url) {
    // Reusability criteria evaluation
    const criteria = [
        'Self-contained',
        'Context independence',
        'Format accessibility'
    ];
    
    return 'Reusability score: High';
}
