"use strict";


const puppeteer = require('puppeteer');
var NodeHelper = require("node_helper");
var self;

module.exports = NodeHelper.create({

	start : function(){
		self = this;
		self.playingMusic = false;
		self.loggedIn = false;
		self.page = null;
		self.browser = null;
		self.config = {};
		self.ErrorPlaying = false;
		self.closed = false;
		self.oldTitle = "";
	},

	socketNotificationReceived: function(notification, payload) {
		console.error("Notification: " + notification); 
		self.closed = false;
		switch(notification){
			case("CONFIG"):
				self.config = payload;
				LoadMusicPage();
				break;
			case("PLAY"):
				playMusic();
				break;
			case("PAUSE"):
				pauseMusic();
				break;
			case("TogglePlay"):
				if (this.playingMusic) {
					pauseMusic();
				}
				else {
					playMusic();
				}
				break;
			case("Close"):
				closeBrowser(false);
				self.closed = true;
				break;
			default:
				break;			
		}
	}, 

	stop : function(){
		closeBrowser(true);
	}
});

async function closeBrowser(stop){
	try{
		if(!self.closed){
			if(!stop){
				self.sendSocketNotification("Closed", "");
			}
			self.loggedIn = false;
			self.playingMusic = false;
			await self.page.close();
			await self.browser.close();
		}
		
		
	}catch(error){
		console.error(error);
	}
	
}


async function LoadMusicPage(){
	try{
		console.error("Loading..."); 
		if(self.config.chromiumPath != null){
			self.browser = await puppeteer.launch({ executablePath: self.config.chromiumPath, ignoreDefaultArgs: ['--mute-audio'], headless : !self.config.showBrowser }); // headless : false
		}else{
			self.browser = await puppeteer.launch({ignoreDefaultArgs: ['--mute-audio'], headless : !self.config.showBrowser }); // headless : false
		}
	
		self.page = await self.browser.newPage();
		
		await self.page.setDefaultNavigationTimeout(120000);
		//await page.setViewport({width:200, height:80});
		await self.page.goto("https://www.rmfon.pl/play,7");
		self.sendSocketNotification("LogIn", "");
		await self.page.waitForSelector('#footer');
		self.sendSocketNotification("Ready", "");
		console.error("ready to play music");
		// await page.waitFor('.is-highlight')
		self.loggedIn = true;
		updateInfos();
		self.sendSocketNotification("Update", {
				Artist: self.artist,
				Title: self.title,
				CoverLink: self.coverLink,
		});
		self.oldTitle = self.title;

		self.playingMusic = true;
		update();
		self.sendSocketNotification("Playing", "");
		console.error("playing music");

	}catch(error){
		console.error(error);
	}
	
    //await page.evaluate(()=>document.querySelector('.is-highlight').click())
}

async function update(){
	self.oldTitle = self.title;
	
	while(self.playingMusic){
		await updateInfos();

		if (self.oldTitle !== self.title)
		{
			console.error("Updating: " + self.artist + " - " + self.title + " - " + self.coverLink);
			self.sendSocketNotification("Update", {
				Artist: self.artist,
				Title: self.title,
				CoverLink: self.coverLink,
			});
			self.oldTitle = self.title;
		}
		await delay(5*1000);
	}
}

function delay(time) {
	return new Promise(function(resolve) { 
		setTimeout(resolve, time);
	});
 }

async function playMusic (){
	try{
		if(!self.playingMusic){
			if(!self.loggedIn){
				await LoadMusicPage();
			}
			await self.page.evaluate(()=>document.querySelector('#player-icon').click());
			self.playingMusic = true;
			update();
			self.sendSocketNotification("Playing", "");
			console.error("playing music");
		}   
	}catch(error){
		console.error(error);
	}
	
}

async function pauseMusic (){
	try{
		if(self.playingMusic){
			if(!self.loggedIn){
				await LoadMusicPage();
			}
			await self.page.evaluate(()=>document.querySelector('#player-icon').click());  // yep, the same as playMusic()
			self.playingMusic = false;
			self.sendSocketNotification("Paused", "");
			console.error("pause music");
		}  
	}catch(error){
		console.error(error);
	}
	
}

async function updateInfos(){
	if(!self.loggedIn){
		await LoadMusicPage();
	}
	try{
		self.title = await self.page.evaluate(()=>document.querySelector('#content > #player-box-container > div > #player-box > #player-infos > div > #player-texts > #now-playing > div.title').textContent);
		//console.error("got title: " + self.title); 
		self.artist = await self.page.evaluate(()=>document.querySelector('#content > #player-box-container > div > #player-box > #player-infos > div > #player-texts > #now-playing > div.artist').textContent); //a.track-link:nth-child(2)
		//console.error("got artist: " + self.artist); 
		self.coverLink = await self.page.evaluate(()=>document.querySelector('#content > #player-box-container > div > #player-box > #player-infos > div > #cover-container > #cover > img').getAttribute('src'));
		//console.error("got cover: " + self.coverLink); 
	}catch(error){
		self.sendSocketNotification("Error", "");
		self.ErrorPlaying = true;
		return;
	}
}
