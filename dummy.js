const response = await gotScraping({
    url: 'https://api.apify.com/v2/browser-info',
    headerGeneratorOptions:{
        browsers:[
            {
                name: 'chrome',
                minVersion: 87,
                maxVersion: 89
            }
        ],
        devices: ['desktop'],
        languages: ['de-DE', 'en-US'],
        operatingSystems: ['windows', 'linux'] 
    }
});