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
The development server is powered by [``vite``](https://npmjs.com/package/vite).
To start it up, just run:
```sh
npm run dev
```

The dynamic route (``/xhr``) is handled using a simple [Vite plugin](https://vitejs.dev/guide/api-plugin.html).

Make sure you have Node.JS [installed](https://nodejs.org), with a version that satisfies
the [``engines``](https://github.com/Take-Some-Bytes/colonialwars-client/blob/main/package.json#L26)
field (currently Node.JS 12 and up).
