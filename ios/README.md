# slopgang for iOS

A native SwiftUI app for iPhone and iPad. It reads the same data as the site:

- `https://slopgang.org/archive.json` has every plate. The site build makes this file from `src/data/archive.json` and the essays, so there is no second copy to edit.
- `https://slopgang.org/about.json` has the About text. The site About page reads the same file, `src/data/about.json`.
- Images and video come from `https://slopgang.org/archive/...`, as on the site.

A new plate shows up in the app when it is live on the site. You do not need an app update.

The app uses only Apple frameworks: SwiftUI, UIKit, Core Animation, AVFoundation and Core Image. It has no third-party packages and no web views.

## Requirements

- A Mac with Xcode 15 or later
- iOS 17 or later on the simulator or the device

## Open and run on the simulator

1. Open `ios/Slopgang/Slopgang.xcodeproj` in Xcode.
2. At the top of the window, select the **Slopgang** scheme and an iPhone simulator.
3. Press **⌘R**.

The simulator does not need a signing team.

## Run on your iPhone

1. Connect the iPhone with a cable, or use the same Wi-Fi network after you pair it once.
2. In Xcode, select the **Slopgang** project, then the **Slopgang** target, then **Signing & Capabilities**.
3. Keep **Automatically manage signing** on. Set **Team** to your Apple ID. A free Personal Team works for your own device. To add an Apple ID, go to **Xcode › Settings › Accounts**.
4. If Xcode says the bundle identifier `org.slopgang.app` is taken, change it to an identifier that is unique to you, for example `org.slopgang.app.mal`.
5. Select your iPhone as the run target and press **⌘R**.
6. The first time, the iPhone asks you to trust the developer. Go to **Settings › General › VPN & Device Management**, select your Apple ID, and tap **Trust**. On iOS 16 and later you must also turn on **Settings › Privacy & Security › Developer Mode**.

With a free Personal Team, the app stops opening after 7 days. Run it again from Xcode to renew it. An Apple Developer Program account removes that limit and lets you use TestFlight and the App Store.

## Regenerate the project (optional)

The committed `Slopgang.xcodeproj` was written by `make_xcodeproj.py`, because XcodeGen does not run on Linux. On a Mac you can use either one:

```sh
cd ios/Slopgang
brew install xcodegen && xcodegen generate   # uses project.yml
# or
python3 make_xcodeproj.py
```

Run one of them again after you add or remove a Swift file.

## How to use it

- **Home:** the colour cloud. Each plate sits where its thumbnail's mean colour puts it in an HSL double cone. Drag to turn the cloud, and flick to make it coast.
- **Tap** a plate to open it.
- **Press and hold** a plate to preview it. This replaces hover on the site. The background switches to the full image at once, with no fade. Video plates play. Slide your finger to move the preview to other plates, and lift your finger to close it.
- **Detail:** the media, the metadata, the essay, the research and art header for pairs, sources, and links to related plates.
- **Deep links:** `slopgang://specimen/sg-123` opens a plate.

## Files

| File | What it does |
| --- | --- |
| `SlopgangApp.swift` | App entry, navigation, home screen |
| `CloudView.swift` | The colour cloud: CALayers, CADisplayLink, gestures, preview |
| `DetailView.swift` | The plate page |
| `AboutView.swift` | The About page, from about.json |
| `PlayerView.swift` | AVPlayerLayer video for plates |
| `ArchiveStore.swift` | Loads archive.json and about.json and keeps them on disk for offline use |
| `ImageLoader.swift` | Image download and cache, mean colour with Core Image |
| `Models.swift` | Codable models for archive.json. Every field is optional. |
| `Seeded.swift` | The same seeded random numbers as the site, so plates land in the same place |
| `Theme.swift` | Type scale, chips, text buttons, spiral mark |
