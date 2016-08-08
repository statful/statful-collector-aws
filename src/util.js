export const Util = {
    getCurrentFile : function(module) {
        return module.filename.split('/').pop();
    }
};