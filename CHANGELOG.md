# Colonial Wars Client Changelog
Changelog for ``colonialwars-client``.

The format is based on [Keep a Changelog][1], and this project adheres to [Semantic Versioning][2].

<!--
  When releasing a new version:
    - Ensure all updateable dependencies are updated.
    - Add changelog entries for important things that changed.
    - Bump version in package.json.
    - Update compatibility table in README.md if needed.
-->

## [Unreleased]

## [v0.5.3] - 2022-04-17
### Changed:
- Used snowpack for development!
  * The folder structure has been re-jumbled to work with snowpack.
  * The ``debug`` module has been moved to ``node_modules``, and is now being packaged by snowpack.
  * The dynamic route (``/xhr``) has been moved to work with snowpack's
  [``routes``](https://www.snowpack.dev/guides/routing) configuration.

## [v0.5.2] - 2021-08-31
Major redesign of Colonial Wars Client. Communcation with Colonial Wars Server has not been touched,
so only a patch increment is required.
### Added:
- Added a loading screen! The loading screen will be shown on initial load of the page, and when a
``Game`` object is loading.
### Changed:
- Debug logs are now namespaced under ``"cw-client"``, as opposed to ``"colonialwars"``.
- Modified most CSS classes to use [BEM](http://getbem.com/) methodology.
- Restructured and redesiged main application.
  * A main app object (the ``App`` class) will hand off control to other appropriate sub-apps, and
  will switch sub-apps when necessary.
  * The HTML structure of the main page was altered greatly, to give more hierarchy to the elements.
  * The appearance of the lobby page has been altered greatly. The title and navigation buttons now
  all appear on the center of the page, as opposed to on the left hand side for bigger screens, and
  on the center for smaller screens.

## [v0.5.1] - 2021-08-18
### Fixed:
- Fixed the ``ImageLoader`` class's ``.loadImg`` method: instead of firing of 10 requests for the
same image when 10 calls to the function with the same path happens, it only fires of 1; all
the other calls with the same path wait on that one request.

## [v0.5.0] - 2021-04-29
### Added:
- Added JavaScript in ``client/js/game/`` to handle client game logic. This completes the connection
between the game server and game client.
- Added a ``PlayApp`` class to handle logic on the ``Play`` page.
- Added local copies of the [Raleway](https://fonts.google.com/specimen/Raleway) in ``client/fonts``.
- Added a sprite sheet which contained the graphics for the ``grass`` map theme.
- Added more utility methods and class in ``client/js/helpers``.
- Added ``emitter.removeAllListeners([type])`` in the ``EventEmitter`` class, which does the same
thing as the ``emitter.removeAllListeners([type])`` method of the Node.JS EventEmitter.
- Added a CWDTP client implementation.
- Ported the [``debug``](https://www.npmjs.com/package/debug) module to our client-side.
### Changed:
- Renamed game image folder from ``game-images`` to ``game``.
- Made constants static--in other words, more like actual constants. Moved the code that determined
viewport dimensions to another class (see above).
### Removed:
- Removed our dependence on Google Fonts--all our fonts are now locally available

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
[v0.4.1]: https://github.com/Take-Some-Bytes/colonialwars-client/tree/85cb2323d21888d9ec5f0d5095eae4f68500dd87
[v0.5.0]: https://github.com/Take-Some-Bytes/colonialwars-client/tree/f1388103cc2f087e6222554751e3cfda515d1970
[v0.5.1]: https://github.com/Take-Some-Bytes/colonialwars-client/tree/a418e6c38406cca198c2a258ef8b55e9c3d9d823
[v0.5.2]: https://github.com/Take-Some-Bytes/colonialwars-client/tree/40f49c3573bf76ee2567af52b0d1e3625227622d
[v0.5.3]: https://github.com/Take-Some-Bytes/colonialwars-client/tree/324deddb222f138ea8e41c2ed6683853a599bfb0
[Unreleased]: https://github.com/Take-Some-Bytes/colonialwars-client/tree/main
