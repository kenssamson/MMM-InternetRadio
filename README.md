# MMM-InternetRadio
MagicMirror module for playing internet radio

=======
This module is based on the idea of using [puppeteer](https://pptr.dev/) taken from (MMM-MusicOnDemand)[https://forum.magicmirror.builders/topic/9666/mmm-musicondemand-play-music-from-deezer-with-a-browser-in-the-background].

It allows you yo configure most Internet Radio stations using selectors for items on the page to pick up:
 - artist and title of what's currently playing
 - play and pause buttons

Confirmed working environment:
- Raspberry Pi 3b+ with Raspbian with preinstalled chromium 
- node 8.15.1
- latest [MagicMirror](https://github.com/MichMich/MagicMirror) (v.2.6.0)

## Installation

```
cd ~/MagicMirror/modules/
git clone https://github.com/Aruta79/MMM-InternetRadio.git
cd MMM-InternetRadio
npm install
```

It installs a puppeteer package with a chromium browser (~100mb-270mb). If you don't want to use the puppeteer browser or if you're running on a Raspberry Pi you may want to delete this extra chromium browser:

```
cd ~/MagicMirror/modules/MMM-InternetRadio/node_modules/puppeteer
rm -r .local-chromium
```

## Configuration

Copy the following to your config.txt:
```
		{
			module: "MMM-InternetRadio",
			position: "middle_center",
			config: {
			 }
		 },
```

#### The module is by default configured to play [RMF Classic](https://www.rmfon.pl/play,7), [RMF Celtic](https://www.rmfon.pl/play,7) and [Encore](https://www.encoreradio.co.uk/radioplayer/)

## Additional configuration

Additional stations can be configured using the following syntax:
```
		stations: [
			{
				name: "RMF Classic",
				url: "https://www.rmfon.pl/play,7",
				titlePath: '#content > #player-box-container > div > #player-box > #player-infos > div > #player-texts > #now-playing > div.title',
				artistPath: '#content > #player-box-container > div > #player-box > #player-infos > div > #player-texts > #now-playing > div.artist',
				coverPath: '#content > #player-box-container > div > #player-box > #player-infos > div > #cover-container > #cover > img',
				playPath: '#player-icon',
				pausePath: '#player-icon',
				footerWait: '#footer',
			},
```
- **name** - name of station
- **url** - link to "Listen live" or similar page that actually plays the sound
- **titlePath**, **artistPath**, **coverPath** - selectors for, respectively, title, artist and cover image - should point to some elements of the page to dislay appropriate info about what's playing
- **playPath**, **pausePath** - selectors for clickable buttons to play and stop sound - may, in many cases, point to the same item
- **footerWait** - item on the page to wait for to ensure page has finished loading - should be any item towards the end of the page, or empty string to disable waiting - usually good to have one defined, but not needed with decent connections

The module also has two icons to control volume, sending **VOLUME_UP** and **VOLUME_DOWN** notifications, usually for use with [MMM-Volume](https://github.com/eouia/MMM-Volume.git)

## Troubleshooting

See (MMM-MusicOnDemand)[https://forum.magicmirror.builders/topic/9666/mmm-musicondemand-play-music-from-deezer-with-a-browser-in-the-background] for info about using _puppeteer_ and _chromium_.
