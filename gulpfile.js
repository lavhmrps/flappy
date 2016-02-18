var gulp  		= require("gulp"),
	browserSync = require("browser-sync"),
	reload 		= browserSync.reload,
	uglify 		= require("gulp-uglify"),
	rename 		= require("gulp-rename");
	
gulp.task("server", function(){
	browserSync({
		server:{
			baseDir: "app"
		}
	});
});

gulp.task("scripts", function(){
	console.log("scripts");
	gulp.src("src/js/*.js")
	.pipe(gulp.dest("app/js/"))
	.pipe(reload({stream: true}));
});

gulp.task("scripts-uglify", function(){
	console.log("scripts");
	gulp.src("src/js/*.js")
	.pipe(uglify())
	.pipe(rename({
		suffix: ".min"
	}))
	.pipe(gulp.dest("app/js/"))
	.pipe(reload({stream: true}));
});

gulp.task("html", function(){
	console.log("html");
	gulp.src("src/**/*.html")
	.pipe(gulp.dest("app/"))
	.pipe(reload({stream: true}));
});

gulp.task("css", function(){
	gulp.src("src/css/*.css")
	.pipe(gulp.dest("app/css/"))
	.pipe(reload({stream: true}));
});

gulp.task("watch", function(){
	gulp.watch("src/js/*.js",["scripts"]);
	gulp.watch("src/*.html",["html"]);
	gulp.watch("src/css/*.css"),["css"];
});

gulp.task("default",["server", "scripts", "scripts-uglify", "html", "css", "watch"]);