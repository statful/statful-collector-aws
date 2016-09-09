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
                period: {
                    type: 'number',
                    enum: [60, 120, 180, 300]
                },
                statistics: {
                    type: 'array',
                    items: {
                        type: 'string',
                        enum: ['SampleCount', 'Average', 'Sum', 'Minimum', 'Maximum']
                    }
                },
                metricsList: {
                    type: 'object',
                    properties: {
                        type: {
                            type: 'string',
                            enum: ['white']
                        },
                        metricsPerRegion: {
                            type: 'object',
                            patternProperties: {
                                '^.*(us-east-1|us-west-1|us-west-2|ap-south-1|ap-northeast-1|ap-northeast-2|ap-southeast-1|ap-southeast-2|eu-central-1|eu-west-1|sa-east-1).*$': {
                                    type: 'array',
                                    items: {
                                        type: 'object',
                                        properties: {
                                            MetricName: {
                                                type: 'string',
                                                minLength: '1',
                                                maxLength: '255'
                                            },
                                            Namespace: {
                                                type: 'string',
                                                minLength: '1',
                                                maxLength: '255'
                                            },
                                            Dimensions: {
                                                type: 'array',
                                                maxItems: 10,
                                                items: {
                                                    type: 'object',
                                                    properties: {
                                                        Name: {
                                                            type: 'string',
                                                            minLength: '1',
                                                            maxLength: '255'
                                                        },
                                                        Value: {
                                                            type: 'string',
                                                            minLength: '1',
                                                            maxLength: '255'
                                                        }
                                                    },
                                                    required: ['Name']
                                                }
                                            }
                                        }
                                    }
                                }
                            },
                            additionalProperties: false
                        }
                    }
                },
                signals: {
                    type: 'array'
                }
            },
            required: ['credentials', 'period', 'signals']
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