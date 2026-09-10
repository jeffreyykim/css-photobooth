# UBC CSS Photo Strip Booth

A static, client-only webcam photo booth. Open `index.html` through a local server for camera permissions, for example:

```sh
python3 -m http.server 8000
```

Then visit `http://localhost:8000`.

Place the supplied `1.png`, `2.png`, and `3.png` files in the project root beside `index.html`. The app falls back to generated preview frames when the PNGs are absent, so the interaction can still be tested before the assets arrive. All compositing happens in the browser at the templates' native 591 x 1772 resolution.

On a phone, camera access requires a secure context: deploy over HTTPS, or use `localhost` during local testing. If camera permission is denied, the built-in upload flow can still create a complete strip from photos on the device.
