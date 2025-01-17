const axios = require('axios');

async function getLTCtoUSDRate() {
    try {
        const response = await axios.get('https://api.coingecko.com/api/v3/simple/price?ids=litecoin&vs_currencies=usd');
        return response.data.litecoin.usd; // Current LTC price in USD
    } catch (error) {
        console.error('Error fetching LTC price:', error);
        throw new Error('Unable to fetch LTC price. Please try again later.');
    }
}

module.exports = { getLTCtoUSDRate };
