import cloneDeep from 'lodash/cloneDeep';

export const Util = {
    deepCopy: o => {
        return cloneDeep(o);
    },

    getCurrentFile: module => {
        return module.filename.split('/').pop();
    },

    getMetricListUpdateTime: () => {
        return 5 * 60;
    },

    getObjectIndexedSymbols: object => {
        let indexedSymbols = {};

        if (object) {
            let symbols = Object.getOwnPropertySymbols(object);

            for (let i = 0; i < symbols.length; i++) {
                let symbolName = symbols[i].toString();
                let indexedSymbolKey = symbolName.slice(
                    7,
                    symbolName.length - 1
                );
                indexedSymbols[indexedSymbolKey] = symbols[i];
            }
        }

        return indexedSymbols;
    }
};
