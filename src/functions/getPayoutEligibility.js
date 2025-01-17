const axios = require('axios');

module.exports = async function (userId, groupId, cookie) {
    const url = `https://economy.roblox.com/v1/groups/${groupId}/users-payout-eligibility?userIds=${userId}`;

    return axios
        .get(url, {
            headers: {
                Cookie: `.ROBLOSECURITY=${cookie}`,
            },
        })
        .then((response) => {
            return response.data.usersGroupPayoutEligibility[userId] === 'Eligible';
        })
        .catch((error) => {
            console.log('[ERROR]'.red + 'Roblox API error:', error);
        });
};