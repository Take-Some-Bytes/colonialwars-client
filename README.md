# Colonial Wars Client
This is ``colonialwars-client``, one of the components for Colonial Wars.
This repository includes:
- A mainly JavaScript web application that makes up the front-end.

The back-end application could be found at ``colonialwars-server``.

There are no tests.

## Compatibility
| colonialwars-client | colonialwars-server |
|:-------------------:|:-------------------:|
|       <=0.2.0       |    0.2.0 - 0.3.2    |
|        0.3.0        |        0.3.2        |
|        ^0.4.0       |        ^0.4.0       |
|        ^0.5.0       |        ^0.5.0       |

## Dependencies
Aside from the development dependencies listed in ``package.json``, this project now also
needs ``colonialwars-server`` .

## Running the Development Server
The development server is powered by [``snowpack``](https://npmjs.com/package/snowpack).
To start it up, just run:
```sh
npm start
```
A new browser tab will open once snowpack has completed its work.

The dynamic route (``/xhr``) is handled via snowpack's
[``routes``](https://www.snowpack.dev/guides/routing) configuration.

Make sure you have Node.JS [installed](https://nodejs.org), with a version that satisfies
the [``engines``](https://github.com/Take-Some-Bytes/colonialwars-client/blob/main/package.json#L26)
field (currently Node.JS 12 and up).
