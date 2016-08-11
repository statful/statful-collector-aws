export const Util = {
    getAWSAvailableRegions: () => {
        return ['us-east-1', 'us-west-1', 'us-west-2', 'ap-south-1', 'ap-northeast-1', 'ap-northeast-2',
            'ap-southeast-1', 'ap-southeast-2', 'eu-central-1', 'eu-west-1', 'sa-east-1'];
    },

    getCurrentFile: (module) => {
        return module.filename.split('/').pop();
    },

    isObjectEmpty: (obj) => {
        if (obj) {
            for (var prop in obj) {
                if (obj.hasOwnProperty(prop)) {
                    return false;
                }
            }
        }
        return true;
    }
};