document.addEventListener('DOMContentLoaded', () => {
    const resourceUrlInput = document.getElementById('resourceUrl');
    const evaluateBtn = document.getElementById('evaluateBtn');
    const resultsDiv = document.getElementById('results');
    const errorDiv = document.getElementById('error');
    const loadingDiv = document.getElementById('loading');

    // Initialize chrome.runtime check
    if (!chrome.runtime) {
        showError('Chrome extension APIs are not available');
        return;
    }

    evaluateBtn.addEventListener('click', async () => {
        const url = resourceUrlInput.value;
        if (!url) {
            showError('Please enter a URL');
            return;
        }

        try {
            hideError();
            showLoading();
            hideResults();
            
            // Proper message handling with error checking
            const results = await new Promise((resolve, reject) => {
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
            
            const licenseResult = document.getElementById('licenseResult');
            const licenseInfo = results.license || {
                type: 'License information unavailable',
                offlineAvailable: true,
                lastUpdated: new Date().toISOString(),
                details: { platform: 'Unknown' }
            };

            // Update license type
            licenseResult.querySelector('.license-type').textContent = licenseInfo.type;

            // Update license status
            const statusText = [];
            if (licenseInfo.details.platform) {
                statusText.push(`Platform: ${licenseInfo.details.platform}`);
            }
            if (licenseInfo.offlineAvailable !== undefined) {
                statusText.push(`Offline Available: ${licenseInfo.offlineAvailable ? 'Yes' : 'No'}`);
            }
            licenseResult.querySelector('.license-status').textContent = statusText.join(' | ');

            // Update availability info
            const availabilityText = [];
            if (licenseInfo.accessInfo) {
                if (licenseInfo.accessInfo.downloadAvailable !== undefined) {
                    availabilityText.push(`Download Available: ${licenseInfo.accessInfo.downloadAvailable ? 'Yes' : 'No'}`);
                }
                if (licenseInfo.accessInfo.publicDomain !== undefined) {
                    availabilityText.push(`Public Domain: ${licenseInfo.accessInfo.publicDomain ? 'Yes' : 'No'}`);
                }
            }
            licenseResult.querySelector('.license-availability').textContent = availabilityText.join(' | ');

            // Update additional details
            const detailsText = [];
            if (licenseInfo.details) {
                Object.entries(licenseInfo.details).forEach(([key, value]) => {
                    if (key !== 'platform' && value !== undefined && value !== null) {
                        detailsText.push(`${key.charAt(0).toUpperCase() + key.slice(1)}: ${value}`);
                    }
                });
            }
            licenseResult.querySelector('.license-details').textContent = detailsText.join(' | ');
            document.getElementById('qualityResult').textContent = results.quality;
            document.getElementById('adaptabilityResult').textContent = results.adaptability;
            document.getElementById('reusabilityResult').textContent = results.reusability;
            
            showResults();
        } catch (error) {
            showError(error.message || 'Failed to evaluate resource');
            console.error('Evaluation error:', error);
        } finally {
            hideLoading();
        }
    });

    function showError(message) {
        errorDiv.textContent = message;
        errorDiv.style.display = 'block';
    }

    function hideError() {
        errorDiv.style.display = 'none';
    }

    function showLoading() {
        loadingDiv.style.display = 'block';
    }

    function hideLoading() {
        loadingDiv.style.display = 'none';
    }

    function showResults() {
        resultsDiv.style.display = 'block';
    }

    function hideResults() {
        resultsDiv.style.display = 'none';
    }

    // Update online status
    window.addEventListener('online', updateOnlineStatus);
    window.addEventListener('offline', updateOnlineStatus);
    updateOnlineStatus();

    function updateOnlineStatus() {
        const status = navigator.onLine ? 'online' : 'offline';
        document.body.setAttribute('data-connection-status', status);
        
        const statusIndicator = document.querySelector('.status-indicator');
        const statusText = document.querySelector('.status-text');
        
        if (status === 'online') {
            statusText.textContent = 'Online - Full Functionality Available';
            statusIndicator.style.backgroundColor = '#4CAF50';
        } else {
            statusText.textContent = 'Offline Mode - Using Cached Data';
            statusIndicator.style.backgroundColor = '#f44336';
        }

        // Add offline indicator to cached results
        const licenseInfo = document.querySelector('.license-info');
        if (licenseInfo && !navigator.onLine) {
            const results = document.querySelectorAll('.criterion');
            results.forEach(result => {
                result.classList.add('offline-mode');
            });
        }
    }
});
