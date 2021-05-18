# Music Library Manager

This project is an app I made in order to the electron framework, and also to clean my music library to find more easily my songs while mixing.

Here are the main functionality :

- Rename the tags `Artist` and `Song name`
- Automatically rename the filename to `Artist - Song name.mp3`
- Sort songs into folders into genres (after manging the categories into the menu)

## How to install it

This app uses electron, which is based on an `npm` architecture. Get sure to have [node.js](https://nodejs.org/en/) installed on your machine.

Then in the root, run these shell commands :

```
npm install
```

## How to use it

In order to use it, run the command in terminal in the root folder :
```
npm start
```

To export the app, run one of the following commands, according to your operating system :

```
npm run package-mac
npm run package-linux
npm run package-win
```