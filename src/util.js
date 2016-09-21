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
    },

    getObjectIndexedSymbols: (object) => {
        let indexedSymbols = {};

        if (object) {
            let symbols = Object.getOwnPropertySymbols(object);

            for (var symbol of symbols) {
                let symbolName = symbol.toString();
                let indexedSymbolKey = symbolName.slice(7, symbolName.length - 1);
                indexedSymbols[indexedSymbolKey] = symbol;
            }
        }

        return indexedSymbols;
    }
};