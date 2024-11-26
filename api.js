class APIClient {
    constructor() {
        this.YOUTUBE_API_KEY = 'AIzaSyCxOzQNY6t81GHCxy9SnYxSLCJnisKdss8';
        this.BOOKS_API_KEY = 'AIzaSyC-Ro3Mqxsz0q6vy1Sf33tiDn1S4Ia9IbE';
        this.licenseCache = new Map();
    }

    async getYouTubeLicense(url) {
        try {
            const videoId = this.extractYouTubeId(url);
            if (!videoId) {
                throw new Error('Invalid YouTube URL');
            }

            // Check cache first
            const cachedData = this.licenseCache.get(url);
            if (cachedData) {
                return cachedData;
            }

            const response = await fetch(
                `https://www.googleapis.com/youtube/v3/videos?part=status,contentDetails&id=${videoId}&key=${this.YOUTUBE_API_KEY}`
            );
            
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }
            
            const data = await response.json();
            
            if (!data.items || !data.items[0]) {
                throw new Error('Video not found');
            }

            const videoInfo = data.items[0];
            const licenseInfo = {
                type: videoInfo.status.license || 'Standard YouTube License',
                isLicensedContent: videoInfo.contentDetails.licensedContent || false,
                offlineAvailable: true,
                lastUpdated: new Date().toISOString(),
                details: {
                    platform: 'YouTube',
                    allowEmbed: videoInfo.status.embeddable || false,
                    privacyStatus: videoInfo.status.privacyStatus || 'unknown'
                }
            };

            // Cache the result
            this.licenseCache.set(url, licenseInfo);
            return licenseInfo;
        } catch (error) {
            console.error('YouTube API error:', error);
            // Return offline fallback data
            return {
                type: 'Standard YouTube License (Offline)',
                isLicensedContent: null,
                offlineAvailable: true,
                lastUpdated: new Date().toISOString(),
                details: {
                    platform: 'YouTube',
                    allowEmbed: null,
                    privacyStatus: 'unknown'
                }
            };
        }
    }

    async getGoogleBooksLicense(url) {
        try {
            const bookId = this.extractGoogleBooksId(url);
            if (!bookId) {
                throw new Error('Invalid Google Books URL');
            }

            // Check cache first
            const cachedData = this.licenseCache.get(url);
            if (cachedData) {
                return cachedData;
            }

            const response = await fetch(
                `https://www.googleapis.com/books/v1/volumes/${bookId}?key=${this.BOOKS_API_KEY}`
            );

            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }

            const data = await response.json();
            
            if (!data.accessInfo) {
                throw new Error('Book information not available');
            }

            const licenseInfo = {
                type: this.determineBookLicense(data),
                accessInfo: {
                    viewability: data.accessInfo.viewability || 'NO_PAGES',
                    downloadAvailable: data.accessInfo.epub?.isAvailable || false,
                    accessViewStatus: data.accessInfo.accessViewStatus || 'NONE',
                    publicDomain: data.accessInfo.publicDomain || false
                },
                offlineAvailable: false,
                lastUpdated: new Date().toISOString(),
                details: {
                    platform: 'Google Books',
                    country: data.accessInfo.country || 'unknown',
                    quoteSharingAllowed: data.accessInfo.quoteSharingAllowed || false
                }
            };

            // Cache the result
            this.licenseCache.set(url, licenseInfo);
            return licenseInfo;
        } catch (error) {
            console.error('Google Books API error:', error);
            // Return offline fallback data
            return {
                type: 'Unknown License (Offline)',
                accessInfo: {
                    viewability: 'NO_PAGES',
                    downloadAvailable: false,
                    accessViewStatus: 'NONE',
                    publicDomain: false
                },
                offlineAvailable: false,
                lastUpdated: new Date().toISOString(),
                details: {
                    platform: 'Google Books',
                    country: 'unknown',
                    quoteSharingAllowed: false
                }
            };
        }
    }

    determineBookLicense(bookData) {
        if (bookData.accessInfo.publicDomain) {
            return 'Public Domain';
        }
        
        const volumeInfo = bookData.volumeInfo || {};
        if (volumeInfo.license) {
            return volumeInfo.license;
        }

        // Check for Creative Commons license in description
        const description = volumeInfo.description || '';
        if (description.toLowerCase().includes('creative commons')) {
            return this.extractCreativeCommonsLicense(description);
        }

        return bookData.accessInfo.accessViewStatus || 'Unknown License';
    }

    extractCreativeCommonsLicense(text) {
        const ccTypes = ['CC BY', 'CC BY-SA', 'CC BY-ND', 'CC BY-NC', 'CC BY-NC-SA', 'CC BY-NC-ND'];
        const lowerText = text.toLowerCase();
        
        for (const type of ccTypes) {
            if (lowerText.includes(type.toLowerCase())) {
                return type;
            }
        }
        return 'Creative Commons (Unspecified)';
    }

    extractYouTubeId(url) {
        const regExp = /^.*(youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=|\&v=)([^#\&\?]*).*/;
        const match = url.match(regExp);
        return match && match[2].length === 11 ? match[2] : null;
    }

    extractGoogleBooksId(url) {
        const match = url.match(/id=([^&]+)/);
        return match ? match[1] : null;
    }
}
