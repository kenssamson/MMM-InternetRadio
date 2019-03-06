Module.register("MMM-InternetRadio",{
	
	defaults:{
		chromiumPath: "/usr/bin/chromium-browser", // chromiumPath
		showCover : true,
		stations: [
			{
				name: "RMF Classic",
				loadLink: "https://www.rmfon.pl/play,7",
				titlePath: '#content > #player-box-container > div > #player-box > #player-infos > div > #player-texts > #now-playing > div.title',
				artistPath: '#content > #player-box-container > div > #player-box > #player-infos > div > #player-texts > #now-playing > div.artist',
				coverPath: '#content > #player-box-container > div > #player-box > #player-infos > div > #cover-container > #cover > img',
				playPath: '#player-icon',
				pausePath: '#player-icon',
				footerWait: '#footer'
			},
		]
	},

	getStyles: function() {
		return ['MMM-InternetRadio.css',];
	},
	
	start: function(){
		this.init = "Initializing...";
		this.Station = 0;
		this.Title = "";
		this.Artist = "";
		this.CoverLink = "";
		this.playing = false;
		this.closed = false;
		this.sendSocketNotification("CONFIG", this.config);	
	},
	
	getDom: function(){
		var wrapper = document.createElement("div");
		try
		{
			if(!this.closed){
				wrapper.className = "bright MMM-InternetRadio";

				var playerNode = document.createElement("div");
				playerNode.className = 'MMM-InternetRadio_player';
				wrapper.appendChild(playerNode);

				var containerNode =  document.createElement("div");
				containerNode.className = 'MMM-InternetRadio_text-container';
				playerNode.appendChild(containerNode);

				var initNode = document.createElement("div");
				initNode.className = 'MMM-InternetRadio_init';
				initNode.appendChild(document.createTextNode(this.init));
				containerNode.appendChild(initNode);

				var titleNode = document.createElement("div");
				titleNode.className = 'MMM-InternetRadio_title bright';
				titleNode.appendChild(document.createTextNode(this.Title));
				containerNode.appendChild(titleNode);

				var artistNode = document.createElement("div");
				artistNode.className = 'MMM-InternetRadio_artist';
				artistNode.appendChild(document.createTextNode(this.Artist));
				containerNode.appendChild(artistNode);

				if(this.config.showCover){
					var coverContainer = document.createElement("div");
					coverContainer.className = 'MMM-InternetRadio_cover-container';
					playerNode.appendChild(coverContainer);

					var coverNode = document.createElement("div");
					coverNode.className = 'MMM-InternetRadio_cover';
					coverContainer.appendChild(coverNode);

					var coverImg = document.createElement("img");
					coverImg.setAttribute('src', this.CoverLink);
					coverImg.setAttribute('width', '300');
					coverNode.appendChild(coverImg);
				}
	
				var playButton = document.createElement("div");
				if (this.playing) {
					playButton.className = "fa fa-stop-circle MMM-InternetRadio_button bright";
				}
				else {
					playButton.className = "fa fa-play-circle MMM-InternetRadio_button dimmed";
				}
				
				wrapper.appendChild(playButton);

				playButton.onclick = () => {
					this.sendSocketNotification('TogglePlay', null);
				};
				
				return wrapper;
			}else{
				wrapper.innerHTML = "";
				wrapper.className = "dimmed light small MMM-InternetRadio";
				return wrapper;
			}
		}catch(error)
		{
				wrapper.innerHTML = "<div>" + error + '</div>';
				wrapper.className = "dimmed light small MMM-InternetRadio";
				return wrapper;
		}
				
	},

	socketNotificationReceived: function(notification, payload) {
		switch(notification){
			case("LogIn"):
				this.closed = false;
				this.playing = true;
				this.init = "Loading page...";
				break;
			case("Ready"):
				this.init = "";
				break;
			case("Title"):
				this.Title = payload;
				break;
			case("Update"):
				this.Artist = (payload.Artist !== "") ? payload.Artist : "No artist";
				this.Title = (payload.Title !== "") ? payload.Title : "No title";
				this.CoverLink = payload.CoverLink;
				break;
			case("Error"):
				this.Title = "Problem getting data";
				this.Artist = "";
				break;
			case("Cover"):
				break;
			case("Paused"):
				this.playing = false;
				break;
			case("Playing"):
				this.playing = true;
				break;
			case("Closed"):
				this.closed = true;
				this.playing = false;
				break;
			default:
				break;

		}
		this.updateDom();
	},
	
	notificationReceived: function(notification, payload, sender) {
		if (sender) {
			Log.log(this.name + " received a module notification: " + notification + " from sender: " + sender.name);
		} else {
			Log.log(this.name + " received a system notification: " + notification);
		}
		if(notification == "AtMusicOnDemand"){
			switch(payload.message){
				case("Play"):
					this.sendSocketNotification("PLAY", "");
					break;
				case("Pause"):
					this.sendSocketNotification("PAUSE", "");
					break;
				case("Next"):
					this.sendSocketNotification("NEXT", "");
					break;
				case("Previous"):
					this.sendSocketNotification("PREVIOUS", "");
					break;
				case("Artist"):
					this.sendSocketNotification("Artist", payload.Artist);				
					break;
				case("Close"):
					this.sendSocketNotification("Close", "");
					break;
				case("Title"):
					this.sendSocketNotification("Title", payload.Title);
					break;
				default:
					break;

			}					
		}
	}
	
	
});
