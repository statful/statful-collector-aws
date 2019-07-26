
Statful Collector AWS
==============
[npm-url]: https://npmjs.org/package/statful-collector-aws
[npm-image]: https://badge.fury.io/js/statful-collector-aws.svg

[![NPM version][npm-image]][npm-url] [![Build Status](https://travis-ci.org/statful/statful-collector-aws.svg?branch=master)](https://travis-ci.org/statful/statful-collector-aws)

Staful Collector AWS is built in NodeJS. This collector is intended to gather metrics from *AWS CloudWatch* and send them to Statful.

## Table of Contents

* [Supported NodeJS Versions](#supported-nodejs-versions)
* [Installation](#installation)
* [Quick Start](#quick-start)
* [Reference](#reference)
	* [CLI](#cli)
	* [Configuration File](#configuration-file) 
* [Examples](#examples)
	* [Collect a List of Metrics](#collect-a-list-of-metrics)
	* [Collect a Metric with Different Dimensions](#collect-a-metric-with-different-dimensions)
	* [Collect Metrics from Multiple Regions](#collect-metrics-from-multiple-regions )
* [Authors](#authors)
* [License](#license)

## Supported NodeJS Versions

| Statful Collector AWS Version | Tested NodeJS versions  |
|:---|:---|
| 1.1.x | `4` |
| 1.2.x | `6.9.2`, `10.9.0` and `Stable` |

## Installation

```bash
$ npm install -g statful-collector-aws
```

## Quick Start

After installing Statful Collector AWS, you are ready to start using it. You can use it straight away by doing:

```bash
$ statful-collector-aws generate-config /etc/statful-collector-aws/conf/

# Update the access details in the statful-collector-aws-conf.json: accessKeyId, secretAccessKey, and the Statful's API token

$ statful-collector-aws start /etc/statful-collector-aws/conf/statful-collector-aws-conf.json
```


## Reference

The following section presents a detailed reference of the available options to take full advantage from the Statful Collector AWS.

### CLI
Here we provide a set of instructions to get started with calls to the service/collector. These refer to the AWS Command Line Interface [syntax](https://aws.amazon.com/cli/).
<br>

Create a default configuration at the given path. If the given path doesn't exist, it is created based on the user’s input. 
```bash
$ statful-collector-aws generate-config <path>
```

Start the collector with the existing configuration on the given path.
```bash
$ statful-collector-aws start <path>
```

Start the collector managed by PM2 with the existing configuration on the given path.
```bash
$ statful-collector-aws start-managed <path>
```

Stop the collector managed by PM2.
```bash
$ statful-collector-aws stop-managed
```

Restart the collector managed by PM2.
```bash
$ statful-collector-aws restart-managed
```

Display a help screen listing built-in commands, each with a brief description.
```bash
$ statful-collector-aws help
```


### Configuration File

In the configuration file, you will find three distinct sections: `statfulCollectorAws`, `bunyan`, `statfulClient`. Here we identify the options that define them.

**StatfulCollectorAWS**

| Option | Description | Type | Default | Required |
|:---|:---|:---|:---|:---|
| _credentials_ | Defines the credentials required to access AWS. | `object` | **none** | **YES** |
| _period_ | Defines the global output level, in **seconds**.<br><br> **Valid Periods:** `60, 120, 180, 300` | `number` | 60 | **YES** |
| _statistics_ | Defines which statistics data should be collected from AWS.<br><br> **Valid Statistics:** `SampleCount, Average, Sum, Minimum, Maximum` | `array` | `["SampleCount", "Average", "Sum", "Minimum", "Maximum"]` | **YES** |
| _metricsList_ | Defines metrics to collect from AWS. Here you should only configure the `metricsPerRegion` which is an object organized by AWS region. Inside each region you should set a list of metrics object to collect. Each metric object supports a `Namespace`, `MetricName`, and `Dimensions`.| `object` | **none** | **YES** |
| _signals_ | Defines the process signals for which the collector should be stopped. You can add any valid NodeJS signal. | `array` | `["SIGTERM", "SIGINT", "SIGABRT", "SIGUSR2"]` | **YES** |
>To get more information about the metrics object, or related to AWS entities, please refer to the AWS documentation ([AWS Metric Reference](http://docs.aws.amazon.com/AmazonCloudWatch/latest/APIReference/API_Metric.html) and [Amazon CloudWatch Namespaces, Dimensions, and Metrics Reference](http://docs.aws.amazon.com/AmazonCloudWatch/latest/monitoring/CW_Support_For_AWS.html)) and our [Examples](https://github.com/statful/statful-collector-aws/blob/master/README.md#examples) section.

**Bunyan**

Next, you will only find the description to some of the Bunyan configuration options, but you can use all of the supported configurations by Bunyan.

| Option | Description | Type | Default | Required |
|:---|:---|:---|:---|:---|
| _name_ | Defines the logger name. | `string` | **none** | **YES** |
| _level_ | Defines the global output level. | `string` | **none** | **NO** |
| _streams_ | Define the logger streams. By default, when the value is an empty array, the logger will output to `process.stdout`. | `array` | `[]` | **YES** |

> To get more information, please read the [Bunyan documentation](https://github.com/trentm/node-bunyan).

**StatfulClient**

Find more information about this specific client on the [Statful Client NodeJS documentation](https://github.com/statful/statful-client-nodejs).



## Examples

Here you can find some useful usage examples of the Statful Collector AWS. In the following examples, we assume that you have already installed the collector with success and followed through the [Quick Start](#quick-start).

### Collect a List of Metrics

Collect the metrics that you want from the full possible list of metrics received from AWS. Please check the StatfulCollectorAWS [reference](https://github.com/statful/statful-collector-aws#configuration) for more details.

```json
{
  "statfulCollectorAws": {
    ... ,
    "period": 60,
    "statistics": ["SampleCount", "Average", "Sum", "Minimum", "Maximum"],
    "metricsList": {
      "type": "white",
      "metricsPerRegion": {
        "us-west-2": [
          {
            "Namespace": "AWS/ELB"
          },
          {
            "Namespace": "AWS/AutoScaling",
            "MetricName": "GroupMinSize"
          },
          {
            "Namespace": "AWS/AutoScaling",
            "MetricName": "GroupMaxSize"
          },
          {
            "Namespace": "AWS/AutoScaling",
            "MetricName": "GroupStandbyInstances"
          }
        ]
      }
    },
    ...
  },
  ...
}
```

### Collect a Metric with Different Dimensions

A dimension, as read in the AWS [docs](https://docs.aws.amazon.com/AmazonCloudWatch/latest/monitoring/cloudwatch_concepts.html#Dimension), is a name/value pair that uniquely identifies a metric. You can specify a maximum of 10 dimensions for a given metric. Here’s an example on collecting a metric with a set of dimensions:

```json
{
  "statfulCollectorAws": {
    ... ,
    "period": 60,
    "statistics": ["SampleCount", "Average", "Sum", "Minimum", "Maximum"],
    "metricsList": {
      "type": "white",
      "metricsPerRegion": {
        "us-west-2": [
          {
            "Namespace": "AWS/ELB"
          },
          {
            "Namespace": "AWS/Billing",
            "MetricName": "EstimatedCharges",
            "Dimensions": [
            	{
            		"Name": "ServiceName",
            		"Value": "Service1"
            	},
            	{
            		"Name": "ServiceName",
            		"Value": "Service12"
            	},
            	{
            		"Name": "Currency",
            		"Value": "USD"
            	},
            	{
            		"Name": "Currency",
            		"Value": "EUR"
            	}
            ]
          }
        ]
      }
    },
    ...
  },
  ...
}
```

### Collect Metrics from Multiple Regions

Most of the Amazon Web Services offer a regional endpoint to make your requests. The full list of available regions is presented [here](https://docs.aws.amazon.com/general/latest/gr/rande.html). Statful also allows you to collect metrics from multiple regions - check the example below.

```json
{
  "statfulCollectorAws": {
    ... ,
    "period": 300,
    "statistics": ["SampleCount", "Average", "Sum", "Minimum", "Maximum"],
    "metricsList": {
      "type": "white",
      "metricsPerRegion": {
      	"eu-central-1": [
          {
            "Namespace": "AWS/Billing"
          }
        ],
      	"us-west-1": [
          {
            "Namespace": "AWS/Billing"
          }
        ],
        "us-west-2": [
          {
            "Namespace": "AWS/Billing"
          }
        ]
      }
    },
    ...
  },
  ...
}
```

## Authors

[Mindera - Software Craft](https://github.com/Mindera)

## License

Statful Collector AWS is available under the MIT license. See the [LICENSE](https://raw.githubusercontent.com/statful/statful-collector-aws/master/LICENSE) file for more information.
