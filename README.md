Statful AWS Collector
==============

Staful AWS Collector built in NodeJS. This is intended to collect metrics from AWS CloudWatch and send them to Statful.

## Table of Contents

* [Supported Versions of NodeJS](#supported-versions-of-nodejs)
* [Installation](#installation)
* [Quick Start](#quick-start)
* [Examples](#examples)
* [Reference](#reference)
* [Authors](#authors)
* [License](#license)

## Supported Versions of NodeJS

| Statful AWS Collector Version | Tested NodeJS versions  |
|:---|:---|
| 1.x.x | `4` and `Stable` |

## Installation

```bash
$ npm install -g statful-aws-collector
```

## Quick start

After installing Statful AWS Collector you are ready to use it. The quickest way is to do the following:

```bash
$ statful-aws-collector generate-config /etc/statful-aws-collector/conf/
# Update some info in the statful-aws-collector-conf.json: accessKeyId, secretAccessKey and the statful api token
$ statful-aws-collector start /etc/statful-aws-collector/conf/statful-aws-collector-conf.json
```

## Examples

You can find here some useful usage examples of the Statful AWS Collector. In the following examples are assumed you have already installed the collector globally.

## Reference

Detailed reference if you want to take full advantage from Statful AWS Collector.

### CLI

```bash
$ statful-aws-collector generate-config <path>
```

Creates a default configuration at the given path. If the given path doesn't exists, it will be created.

```bash
$ statful-aws-collector start <path>
```

Starts the collector with the config on given path.

```bash
$ statful-aws-collector help
```

Shows a small help for the collector.

### Configuration

## Authors

[Mindera - Software Craft](https://github.com/Mindera)

## License

Statful AWS Collector is available under the MIT license. See the [LICENSE](https://raw.githubusercontent.com/statful/statful-aws-collector/master/LICENSE) file for more information.