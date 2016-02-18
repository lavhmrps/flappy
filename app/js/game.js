(function () {
	
	var 

	container,
	ctx,
	canvas,
	width,
	height,

	canvasMouseover,

	fgpos = 0,
	frames = 0,
	score = 0,
	highscore = 0,
	best = 0,
	flaps = 0,
	pipeGap = 80,
	pipePeriod = 70,
	pipeSpeed = 3,
	freqMultiplier = 10,

	inputGap,
	inputPeriod,
	inputSpeed,

	outputGap,
	outputSpeed,
	outputPeriod,

	valor = {
		none: 0,
		bronze: 1,
		silver: 2,
		gold: 3,
		platinum:4
	},

	okbtn,
	options,

	sfx_die = new Audio("sfx/sfx_die.ogg"),
	sfx_hit = new Audio("sfx/sfx_hit.ogg"),
	sfx_point = [],
	sfx_swoosh = new Audio("sfx/sfx_swoosh.ogg"),
	sfx_wing =  [],
	num_sfx_wing = 6,

	displayGameOver = false,
	displayScoreBoard = false,

	goCounter = 0,
	sbCounter=0,
	scoreCounter=0,

	currentstate,
	states= {
		 Splash:0, Game:1, Score:2
	},

	bird = {
		x: 60,
		y: 0,
		frame: 0,
		animation: [0, 1, 2, 1],
		radius: 10,
		rotation: 0,
		velocity: 0,
		gravity: 0.25,
		_jump: 5,

		jump : function(){
			this.velocity = -this._jump;
			sfx_wing[flaps++ % num_sfx_wing].play();
			
		},

		update: function(){

			// slower flapping while in Splashscreen
			var n = currentstate === states.Splash ? 10 : 5;
			this.frame += frames % n === 0 ? 1: 0;
			this.frame %= this.animation.length;

			// no rotation and no falling when in splashscreen
			if(currentstate === states.Splash){
				this.y = height - 280 + 5 * Math.sin(frames/n);
				this.rotation = 0;
			}
			else {
				this.velocity += this.gravity; 
				this.y +=  this.velocity;


				// hitting the ground
				if(this.y >= height - (s_fg.height + bird.radius)){
					this.y = height - (s_fg.height + bird.radius);

					if(currentstate === states.Game) {
						sfx_hit.play();
						frames = 0;
						currentstate = states.Score;
					}
				}

				if(this.velocity >= this._jump){
					this.frame = 1;
					this.rotation = Math.min(Math.PI / 2, this.rotation);
					this.rotation += .1;
					
				} 
				else{
					this.rotation = -.3;
				}
				
			}

		},

		draw: function(ctx){
			ctx.save();
			ctx.translate(this.x, this.y);
			ctx.rotate(this.rotation);


			var n = this.animation[this.frame];
			s_bird[n].draw(ctx, -s_bird[n].width/2, -s_bird[n].height/2 );

			ctx.restore();

		}

	},
	
	pipes = {


		_pipes : [],

		reset: function(){
			this._pipes = [];
		},

		update: function(){
			var pipeGap2 = Math.round(pipeGap)/2;

			if(Math.floor(frames % (60/pipePeriod)) === 0){
				var rand = Math.random();
				// positive / negative pipe-position-factor based on last digit
				rand = rand.toString().charAt(rand.toString().length-1)%2==0?rand:rand*-1;
				var _y = height - (s_pipeSouth.height*1.5 + s_fg.height*1.3 - 50 - (160 - pipeGap2)*rand);

				this._pipes.push({
					x: width,
					y: _y,
					width: s_pipeSouth.width,
					height: s_pipeSouth.height,
					passed: false
				});
			}

			
			for(var i =0, len = this._pipes.length; i < len; i++){
				var pipe = this._pipes[i];
				pipe.x -= pipeSpeed;

				if(i === 0){
					// collision-check
					var cx =  Math.min(Math.max(bird.x, pipe.x), pipe.x + pipe.width);
					var cy1 = Math.min(Math.max(bird.y, pipe.y), pipe.y -pipeGap2 + pipe.height);
					var cy2 = Math.min(Math.max(bird.y, pipe.y + pipe.height + pipeGap2), pipe.y + 2*pipe.height + pipeGap2);

					var  dx = bird.x - cx;
					var dy1 = bird.y - cy1;
					var dy2 = bird.y - cy2;

					var  d1 = dx*dx + dy1*dy1;
					var  d2 = dx*dx + dy2*dy2;

					var r = bird.radius * bird.radius;
					// if crash
					if(r > d1 || r > d2){
						currentstate = states.Score;
						sfx_hit.play();
						setTimeout(function() {sfx_die.play();}, 400);
						frames = 0;
					}

					// passed a pipe, get point
					if( (pipe.x+pipe.width/2) <= bird.x && !pipe.passed){
						sfx_point[score%num_sfx_wing].play();
						pipe.passed = true;
						++score;
					}
					

				}

				if(pipe.x < -pipe.width){
					this._pipes.splice(i,1);
					i--;
					len--;
				}
			}			
		},

		draw: function(ctx){
			ctx.save();
			for(var i =0, len = this._pipes.length; i < len; i++){
				var p = this._pipes[i];
				var pipeGap2 = Math.round(pipeGap)/2;
				s_pipeSouth.draw(ctx, p.x, p.y - pipeGap2);
				s_pipeNorth.draw(ctx, p.x, p.y + pipeGap2+p.height);
			
			}
			ctx.restore();
		}
	},
	game = {
		reset : function(){
			localStorage.setItem("highscore", Math.max(highscore,score) || 0);
			highscore = localStorage.getItem("highscore");
			score = 0;
			frames = 0;
			displayGameOver = false;
			displayScoreBoard = false;
			sbCounter=0;
			goCounter= 0;
			scoreCounter=0;
		}
	};


	function onpress(evt){
		switch(currentstate){
			case states.Splash:
				if(canvasMouseover){
					game.reset();
					currentstate = states.Game;
					bird.jump();
				}
				break;

			case states.Game:
				bird.jump();
				break;

			case states.Score:
				if(frames < 70) // wait until ok button is done sliding up
				 	return;
				var mx = evt.offsetX,
					my = evt.offsetY;

				if( canvasMouseover && mx > okbtn.x && mx < okbtn.x + okbtn.width && my > okbtn.y && my < okbtn.y + okbtn.height) {
					currentstate = states.Splash;
					sfx_swoosh.play();
					pipes.reset();
				}
				break;
		}
	}

	function main(){

		container = document.getElementById("container");
		canvas = document.getElementById("flappyCanvas");
		
		canvas.addEventListener("mouseover",function(){
			canvasMouseover = true;
		});
		canvas.addEventListener("mouseout",function(){
			canvasMouseover = false;
		});

		
		width = window.innerWidth;
		height = window.innerHeight;

		var evt = "touchstart"
		if(width >= 500){
			width = 320;
			height = width*1.5;
			evt = "mousedown";
		}

		document.addEventListener(evt, onpress);

		canvas.style.border = "thin solid black";
		canvas.width = width;
		canvas.height = height;

		ctx = canvas.getContext("2d");

		currentstate = states.Splash;

		var img = new Image();
		img.src = "res/sheet.png";

		img.onload = function(){
			initSprites(this);
			ctx.fillStyle = s_bg.color;
			run();

			okbtn = {
				x: (width - s_buttons.Ok.width)/2,
				y: height- 180,
				height: s_buttons.Ok.height,
				width: s_buttons.Ok.width
			};
		}

		for(var i=0; i< num_sfx_wing;i++){
			sfx_wing[i] = new Audio("sfx/sfx_wing.ogg");
			sfx_point[i] = new Audio("sfx/sfx_point.ogg");
			sfx_wing[i].volume = .1;
			sfx_point[i].volume = .1;
		}
		
		sfx_swoosh.volume = .1;
		sfx_hit.volume = .1;
		sfx_die.volume = .1;

		
	}

	function run(){
		
		var loop = function(){
			update();
			render();
			window.requestAnimationFrame(loop, canvas);			
		}
		window.requestAnimationFrame(loop, canvas);
	}	

	function update(){
		frames++;
		// ground moving unless in Score-state
		if(currentstate !== states.Score){
			fgpos = (fgpos -2) % 16;
		}

		// updating pipes when in game
		if(currentstate === states.Game){
			pipes.update();
		}

		bird.update();

	}

	function render(){
		ctx.fillRect(0, 0, width, height);
		ctx.stroke();

		s_bg.draw(ctx, 0, height - s_bg.height);
		s_bg.draw(ctx, s_bg.width, height - s_bg.height);

		pipes.draw(ctx);
		bird.draw(ctx);

		s_fg.draw(ctx, fgpos, height - s_fg.height);
		s_fg.draw(ctx, fgpos + s_fg.width, height - s_fg.height);

		var width2 = width/2;
		var height2 = height/2;
		var scoreLen = score.toString().length;
		var scoreCounterLen = scoreCounter.toString().length;
		var highscoreLen = highscore.toString().length;

		if(currentstate === states.Game){
			s_numberB.draw(ctx, width/2- (s_numberB.width * scoreLen)/2, 20, score);

		}

		if(currentstate === states.Splash){
			s_text.GetReady.draw(ctx, width2 - s_text.GetReady.width/2, height-380);
			s_splash.draw(ctx, width2 - s_splash.width/2, height2 - s_splash.height/2);
			
		}
		if(currentstate === states.Score){

			var gameoverY 			= 80,
			 	scoreboardY 		= 150,
			 	scoreYoffset 		= 35,
			 	newYoffset			= 58,
			 	highscoreYoffset 	= 75,
			 	newHighscore		= score > highscore,
			 	medalValor = 0,
			 	medalX=74,
			 	medalY=192;


			if(score > 9 && score < 20)
				medalValor = valor.bronze;
			if(score > 19 && score < 30)
				medalValor = valor.silver;
			if(score > 29 && score < 40)
				medalValor = valor.gold;
			if(score > 39)
				medalValor = valor.platinum;
				
		

			if(!displayGameOver){
				s_numberB.draw(ctx, width/2- (s_numberB.width * scoreLen) /2, 20, score);
				setTimeout(function(){displayGameOver=true;},200);
			}
			if(!displayScoreBoard){
				s_numberB.draw(ctx, width/2- (s_numberB.width * scoreLen) /2, 20, score);
				setTimeout(function(){displayScoreBoard = true;},1000);
			}

			if(displayGameOver){
				goCounter+=.2;
				if(goCounter < Math.PI){
					s_text.GameOver.draw(ctx, width2 - s_text.GameOver.width/2, gameoverY - 5 * Math.sin(goCounter) );
				}else{
					s_text.GameOver.draw(ctx, width2 - s_text.GameOver.width/2, gameoverY );
				}
			}

			if(displayScoreBoard){
				sbCounter+=4;
				if(sbCounter < 50){
					sfx_swoosh.play();
					// scoreboard with elements sliding up
					s_score.draw(ctx, width2 - s_score.width/2, scoreboardY + 50 - sbCounter);
					// score
					s_numberS.draw(ctx, 250 - (s_numberS.width * scoreLen), scoreboardY + 85 - sbCounter, 0);
					// highscore
					s_numberS.draw(ctx, 250 - (s_numberS.width * highscoreLen), scoreboardY + 125 - sbCounter, highscore);
					// okbtn
					s_buttons.Ok.draw(ctx, width2 - s_buttons.Ok.width/2, height- 130 - sbCounter );
					if(newHighscore ){
						s_new.draw(ctx, 180, scoreboardY + newYoffset+50-sbCounter);
					}

					switch(medalValor){
						case valor.bronze:
							s_medal.bronze.draw(ctx,medalX,medalY + 50 - sbCounter);
							break;
						case valor.silver:
							s_medal.silver.draw(ctx,medalX,medalY + 50 - sbCounter);
							break;
						case valor.gold:
							s_medal.gold.draw(ctx,medalX,medalY + 50 - sbCounter);
							break;
						case valor.platinum:
							s_medal.platinum.draw(ctx,medalX,medalY + 50 - sbCounter);
							break;
					}

					

				}else{
					if(frames%2==0)
						scoreCounter = scoreCounter++ < score? scoreCounter : score;

					s_score.draw(ctx, width2 - s_score.width/2, scoreboardY);
					s_numberS.draw(ctx, 250 - (s_numberS.width * scoreCounterLen)  ,scoreboardY + scoreYoffset ,scoreCounter);
					s_numberS.draw(ctx, 250 - (s_numberS.width * highscoreLen)  ,scoreboardY + highscoreYoffset, highscore);
					s_buttons.Ok.draw(ctx, width2 - s_buttons.Ok.width/2 , height- 180);
					if(newHighscore ){
						s_new.draw(ctx, 180, scoreboardY + newYoffset);
					}

					switch(medalValor){
						case valor.bronze:
							s_medal.bronze.draw(ctx,medalX,medalY);
							break;
						case valor.silver:
							s_medal.silver.draw(ctx,medalX,medalY);
							break;
						case valor.gold:
							s_medal.gold.draw(ctx,medalX,medalY);
							break;
						case valor.platinum:
							s_medal.platinum.draw(ctx,medalX,medalY);
							break;
					}

				}
				
			}
		}

	}

	main();


	// HTML inputs
	inputGap = document.getElementById("inputPipeGap");
	inputPeriod = document.getElementById("inputPipePeriod");
	inputSpeed = document.getElementById("inputSpeed");
	btnReset = document.getElementById("btnReset");

	outputGap =document.getElementById("outputPipeGap");
	outputPeriod = document.getElementById("outputPipePeriod")
	outputSpeed = document.getElementById("outputSpeed");

	outputGap.innerHTML = inputGap.value;
	outputPeriod.innerHTML = inputPeriod.value;
	outputSpeed.innerHTML = inputSpeed.value;

	pipeGap = inputGap.value;
	pipePeriod = inputPeriod.value;
	pipeSpeed = inputSpeed.value;
	

	inputGap.addEventListener("input",function(){
		outputGap.innerHTML = this.value;
		pipeGap = this.value;
	});
	inputPeriod.addEventListener("input",function(){
		outputPeriod.innerHTML = this.value;
		pipePeriod = this.value;
	});
	inputSpeed.addEventListener("input",function(){
		outputSpeed.innerHTML = this.value;
		pipeSpeed = this.value;
	});

	btnReset.addEventListener("click", function(){
		inputGap.value = 80;
		outputGap.innerHTML =inputGap.value;
		pipeGap = 80;

		inputPeriod.value = 0.7
		outputPeriod.innerHTML = inputPeriod.value;
		pipePeriod = .7;

		inputSpeed.value = 2;
		outputSpeed.innerHTML = inputSpeed.value;
		pipeSpeed = 2;
	})

})();