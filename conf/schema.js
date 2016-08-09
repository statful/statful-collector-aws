export const schema = {
    schema: 'http://json-schema.org/draft-04/schema#',
    type: 'object',
    properties: {
        statfulAwsCollector: {
            type: 'object',
            properties: {
                credentials: {
                    type: 'object',
                    properties: {
                        accessKeyId: {
                            type: 'string'
                        },
                        secretAccessKey: {
                            type: 'string'
                        }
                    }
                },
                frequency: {
                    type: 'number'
                },
                metricsBlackList: {
                    type: 'object'
                },
                signals: {
                    type: 'array'
                }
            },
            required: ['credentials', 'frequency', 'signals']
        },
        bunyan: {
            type: 'object',
            properties: {
                name: {
                    type: 'string'
                },
                streams: {
                    type: 'array'
                }
            },
            required: ['name', 'streams']
        },
        statfulClient: {
            type: 'object',
            properties: {
                app: {
                   type: 'string'
                },
                default: {
                    type: 'object'
                },
                api: {
                    type: 'object'
                },
                dryRun: {
                    type: 'boolean'
                },
                flushInterval: {
                    type: 'number'
                },
                flushSize: {
                    type: 'number'
                },
                namespace: {
                    type: 'string'
                },
                sampleRate: {
                    type: 'number'
                },
                tags: {
                    type: 'object'
                },
                transport: {
                    type: 'string'
                },
                host: {
                    type: 'string'
                },
                port: {
                    type: 'string'
                },
                secure: {
                    type: 'boolean'
                },
                token: {
                    type: 'string'
                },
                timeout: {
                    type: 'number'
                }
            },
            required: ['transport']
        },
    },
    required: ['statfulAwsCollector', 'bunyan', 'statfulClient']
};