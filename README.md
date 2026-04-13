# Apicius

Apicius is a self-hosted recipy web app with the sole difference that everything is stored localy with a clean UI. In other words, it is an app made thinking about me for you :)

<p align="center">
  <img src="/assets/Demo/Demo.gif?raw=true" width="100%" alt="Demo" />
</p>

## Quick Start

```bash
# Install dependencies
npm install

# Start the server (default port: 3000)
npm start
```

Then open **http://localhost:3000** in your browser.

## Docker

```bash
# Build the image
docker build -t apicius .

# Run the container (maps port 3000 and persists your database)
docker run -d \
  -p 3000:3000 \
  -v $(pwd)/database:/usr/src/app/database \
  --name apicius \
  apicius
```

Then open **http://localhost:3000** (or replace `localhost` with your NAS/server IP).

## Fun Fact

[Apicius cookbook](https://www.gutenberg.org/files/29728/29728-h/29728-h.htm)  is the oldest recipe cookbook that we still have the recipies for. Might be a good place for you to get inspiration from.
