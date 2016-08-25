import cloneDeep from 'lodash/cloneDeep';

export const Util = {
    deepCopy: (o) => {
        return cloneDeep(o);
    },

    getCurrentFile: (module) => {
        return module.filename.split('/').pop();
    },

    getMetricListUpdateTime: () => {
      return 5 * 60;
    }
};