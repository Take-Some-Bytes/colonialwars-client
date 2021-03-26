# Colonial Wars Client Changelog
Changelog for ``colonialwars-client``.

The format is based on [Keep a Changelog][1], and this project adheres to [Semantic Versioning][2].

## [v0.4.1] - 2021-03-26
### Added:
- Added a ``&display=swap`` query when fetching the Raleway font from Google fonts.
- Added a ``.gitignore`` file so we could start using Git properly.
- Added an image meta file, which stores metadata about images that are going to be loaded
by this application.
- Added a map preview for the "Plains" map.
- Added dedicated UI styles for making UI elements a specific colour.
- Added some ARIA roles for various elements in the app.
### Changed:
- Changed the appearance of the main page a bit. Now, the buttons are more square, and the
header and footer font sizes have both been increased.
- Changed the IDs of some elements in ``index.html``.
- Refactored code in the ``Fetcher`` class--a lot of the shared code for fetching stuff is
now concentrated in two functions (``fetcher.fetchResource`` and ``fetcher.fetchAs``).
- Updated various CSS styles.
- Updated NPM lock file version.
- Rewrote all the CSS styles for custom select menus.
- Radically changed how the ``SelectMenu`` class worked. Now, instead of taking an existing
``select`` element, the ``SelectMenu`` class created a new ``select`` element, and worked with
that instead.
### Removed:
- Removed all CSS classes related to "button links". Now, to make links look like buttons,
you must use a normal button class.
- Removed the need for a wrapper ``div`` when constructing custom select menus.

## [v0.4.0] - 2021-03-12
### Added:
- Added an adapter in ``helpers/adapters.js`` to "convert" the new HTTP response body structure
into the old expected response body structure.
### Changed:
- Updated all response data parsing to expect the structure defined in
[``specifications/colonialwars/message-structures.md``](
  https://github.com/Take-Some-Bytes/specifications/blob/main/colonialwars/message-structure.md#http-response-body-structure
).
- Updated compatibility data in ``README.md``.

## [v0.3.0] - 2021-02-11
### Added:
- Added a ``RadioButtonList`` class to construct lists of radio buttons.
- Added compatibility data in ``README.md``.
- Added a second stage to the ``Play`` dialog--after you click the ``Next`` button, the client will
fetch a list of games available on the server you selected, and show them to the client.
### Changed:
- Made ``Play`` dialog size dynamic on page load, and constant when the window changes size.
- Updated validation functions and updated validation schemas for client input.
- Updated player name input validation/sanitation--more characters are now alowed, and the error
messages have become much clearer.
### Fixed:
- Fixed the fact that scrollbars appeared regardless of whether they are needed on some OSes.
- Fixed inconsistent dialog content height, and buggy scrolling.

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
[v0.2.0]: https://github.com/Take-Some-Bytes/colonialwars-client/tree/f3f8432130d30a28da961fb464069ea104cadca4
[v0.3.0]: https://github.com/Take-Some-Bytes/colonialwars-client/tree/7fbb2ec25351f8369227f67332e86dec4206dc43
[v0.4.0]: https://github.com/Take-Some-Bytes/colonialwars-client/tree/7ec1261ca2c90866ae0b7c742a4a2575e70c565c
[v0.4.1]: https://github.com/Take-Some-Bytes/colonialwars-client/tree/main
