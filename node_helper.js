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
		self.station = 0;
	},

	socketNotificationReceived: function(notification, payload) {
		console.log("Notification: " + notification); 
		self.closed = false;
		switch(notification){
			case("CONFIG"):
				self.config = payload;
				LoadMusicPage();
				break;
			case("StationSwitch"):
				self.station = payload;
				closeBrowser(false);
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
		console.log("Loading station " + self.station + ": " + self.config.stations[self.station].name + " from " + self.config.stations[self.station].url); 
		if(self.config.chromiumPath != null){
			self.browser = await puppeteer.launch({ executablePath: self.config.chromiumPath, ignoreDefaultArgs: ['--mute-audio'], headless : !self.config.showBrowser }); // headless : false
		}else{
			self.browser = await puppeteer.launch({ignoreDefaultArgs: ['--mute-audio'], headless : !self.config.showBrowser }); // headless : false
		}
	
		self.page = await self.browser.newPage();
		
		await self.page.setDefaultNavigationTimeout(120000);
		//await page.setViewport({width:200, height:80});
		await self.page.goto(self.config.stations[self.station].url);				//"https://www.rmfon.pl/play,7");
		self.sendSocketNotification("LogIn", "");
		if (self.config.stations[self.station].footerWait != '') {
			await self.page.waitForSelector(self.config.stations[self.station].footerWait);
		}

		self.sendSocketNotification("Ready", "");
		console.log("ready to play music");
		// await page.waitFor('.is-highlight')
		self.loggedIn = true;
		updateInfos();
		self.sendSocketNotification("Update", {
				Artist: self.artist,
				Title: self.title,
				CoverLink: self.coverLink,
				Station: self.station,
		});
		self.oldTitle = self.title;

		self.playingMusic = true;
		update();
		self.sendSocketNotification("Playing", "");
		console.log("playing music");

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
			console.log("Updating: " + self.artist + " - " + self.title + " - " + self.coverLink);
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

			await self.page.evaluate(function (path) {
				document.querySelector(path).click();
			}, self.config.stations[self.station].playPath);

			self.playingMusic = true;
			update();
			self.sendSocketNotification("Playing", "");
			console.log("playing music");
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
			
			await self.page.evaluate(function (path) {
				document.querySelector(path).click();
			}, self.config.stations[self.station].pausePath);
			
			self.playingMusic = false;
			self.sendSocketNotification("Paused", "");
			console.log("pause music");
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
		//console.log("Station infos: " + self.config.stations[self.station]);

		if (self.config.stations[self.station].titlePath != '')
		{
			self.title = await self.page.evaluate(function (path) { 
					return document.querySelector(path).textContent; 
			}, self.config.stations[self.station].titlePath);
		} else {
			self.title = '';
		}

		if (self.config.stations[self.station].artistPath != '')
		{
			self.artist = await self.page.evaluate(function (path) { 
					return document.querySelector(path).textContent; 
			}, self.config.stations[self.station].artistPath);
		} else {
			self.artist = '';
		}

		if (self.config.stations[self.station].coverPath != '') {
			self.coverLink = await self.page.evaluate(function (path) { 
					return document.querySelector(path).getAttribute('src'); 
			}, self.config.stations[self.station].coverPath);
		} else {
			self.coverLink = '';
		}

	}catch(error){
		console.error(error);
		self.sendSocketNotification("Error", "");
		self.ErrorPlaying = true;
		return;
	}
}
