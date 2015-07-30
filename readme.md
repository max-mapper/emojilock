# emojilock

converts minilock ids, e.g. 25DAuXM9z84c4iEXazuvwtBX2651pLa4xp5bF2p3pJqKMw into base-emoji representations, e.g. 🍮💡©✈️😖🎪🐘🎪💣📀😥🕓➡️🚅🍻📋⚓️🔄🐄📈🌂💏🛄🚧📲⬆️📷💫⬇️📘💑⚓️

## install

```
npm i emojilock -g
```

## usage

first, use `npm i minilock-cli` to create a minilock id

## encode

```
emojilock <your-minilock-id>
```

will convert your minilock id to emoji and print it out

if no args are specified, will try to read the file `~/.mlck/profile.json` to get your minilock-cli id

## decode

```
emojilock decode <emoji>
```

will convert emoji back into a minilock id
