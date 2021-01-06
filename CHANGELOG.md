# Colonial Wars Client Changelog
Changelog for ``colonialwars-client``.

The format is based on [Keep a Changelog][1], and this project adheres to [Semantic Versioning][2].

## [v0.2.0] - 2021-01-05
### Added:
- Added a ``validator.js`` helper file to validate client input.
- Added a ``components`` folder to store various JS UI components: e.g. the ``Play`` dialog code.
- Added a ``SelectMenu`` class for customizing select menu appearances.
- Added a custom select menu drop down arrow.
- Added a page description in a ``<meta>`` tag of ``index.html``.
### Changed:
- Updated lobby application to fill up the ``Play`` dialog
- Used CSS ``rgb`` function for colours instead of hexidecimal notation to keep things consistent.
- Re-organized and split the ``ui-helpers.js`` file into:
  * ``dom-helpers.js``, functions to help manipulate the DOM, and
  * ``number-utils.js``, functions to help when working with numbers.
### Fixed:
- Fixed the fact that the ``EventTarget`` constructor isn't available on all browsers. How? By using a
custom ``EventEmitter`` implementation in place of it.

## [v0.1.0] - 2020-12-30
- Initial (pre-)release.

[1]: https://keepachangelog.com/
[2]: https://semver.org

[v0.1.0]: https://github.com/Take-Some-Bytes/colonialwars-client/tree/bec2736d782914a69f6d861e076b4e6c38487a7f
[v0.2.0]: https://github.com/Take-Some-Bytes/colonialwars-client/tree/main
