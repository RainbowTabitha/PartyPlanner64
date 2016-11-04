# ![PartyPlanner64](http://i.imgur.com/ygEasfG.png)

> Mario Party N64 board editor

PartyPlanner64 allows you to create and import boards into a Mario Party N64 ROM for playback in emulators or on real hardware.

## Getting Started

PartyPlanner64 is web-based, so no installation required to try it out. A [running copy](http://partyplanner64.github.io/PartyPlanner64) is hosted from this repository. Chrome and Firefox are the main two supported browsers.

The main instructions are on the [Creating a Board](https://github.com/PartyPlanner64/PartyPlanner64/wiki/Creating-a-Board) page. It is highly recommended you read this before trying to create a board, or at least take note of the help graphics which highlight some of the common mistakes.

The [wiki](https://github.com/PartyPlanner64/PartyPlanner64/wiki) has been populated with additional information about the editor, as well as technical documentation on the game itself.

## Limitations

While you can create boards and use the editor without a ROM at all, to play them you will need to open a Mario Party ROM file. Presently, only the NTSC USA files are supported.

* `Mario Party (U).z64` ROM file (MD5 `8BC2712139FBF0C56C8EA835802C52DC`).
* `Mario Party 2 (U).z64` ROM file (MD5 `04840612A35ECE222AFDB2DFBF926409`).
* `Mario Party 3 (U).z64` ROM file (MD5 `76A8BBC81BC2060EC99C9645867237CC`).

ROMs you have edited with PP64 will also be able to be opened with the editor.

A saved ROM must be ran with an Expansion Pak on real hardware, and emulators need to be configured to use 8MB RAM or the game will crash immediately.

## Building

After cloning the repository, you will need to do the following to run your own instance of PP64 locally:

* Install Node.js and a package manager (npm or yarn).
* Retrieve the dependencies for the editor and development.
    * `npm install --dev`
    * `yarn install`
* `gulp` to create a copy of the site in `dist/`.
    * `gulp prod` will build a minified production copy. The production build uses CDN assets when possible.
* Open `index.html` from `dist/` to use the editor.

Before making changes, you can start `gulp watch` to monitor for file changes.

If running from the filesystem with Chrome, you may need to run the `chrome` executable with the `--allow-file-access-from-files` flag to avoid cross domain permission issues related to working with local image files and Data URIs.

## Contributors

It would be great to receive pull requests and other contributions.

## [FAQ](https://github.com/PartyPlanner64/PartyPlanner64/wiki/FAQ)

## License

Code in this repository is released into the public domain, with the exception of included third party libraries with separate licenses.
