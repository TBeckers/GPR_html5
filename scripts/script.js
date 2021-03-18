// by Thomas Beckers, 2020
// t.beckers@tum.de

var canvas = document.getElementById("canvas");
var ctx = canvas.getContext('2d', {desynchronized: true});
var BB = canvas.getBoundingClientRect();
var offsetX = BB.left;
var offsetY = BB.top;
var WIDTH = canvas.width;
var HEIGHT = canvas.height;

const MAX_RECTS = 20;
const R_POINTS = 30;
const ELEMENTS = 150;
const MAX_SLIDER1 = 2000;
const MAX_SLIDER2 = 1000;
const MAX_SLIDER3 = 1000;

var img_trash = document.getElementById("img_trash");
var slider1 = document.getElementById("slider1");
var slider2 = document.getElementById("slider2");
var slider3 = document.getElementById("slider3");
var kernelselection = document.getElementById("kernelselection");
var lik_value = document.getElementById('lik_value');
var controlcontainer = document.getElementById('controlcontainer')
var slidecontainer1 = document.getElementById('slidecontainer1')
var div_text = document.getElementById('div_text')
var x_test=[];
for (var i=0; i<ELEMENTS+1; i++){
	x_test[i]=i/ELEMENTS;
}


var gp = new gpr();

// drag related variables
var dragok = false;

// an array of objects that define different rectangles
var rects = [];

  	
// listen for mouse events
canvas.onmousedown = myDown;
canvas.onmouseup = myUp;
canvas.onmousemove = myMove;
canvas.addEventListener('touchstart', myDownTouch, false);
canvas.addEventListener('touchmove', myMoveTouch, false);
canvas.addEventListener('touchend', myUpTouch, false);
window.addEventListener('resize', resizeCanvas, false);
window.addEventListener('scroll', resizeCanvas, false);
window.addEventListener('orientationchange', resizeCanvas, false);

// call to draw the scene
reset();
resizeCanvas();

function resizeCanvas() {
	var actual_width;
	if (window.innerWidth<screen.width) {
		actual_width=window.innerWidth;
	} else{
		actual_width=screen.width;
	}
	var divHeight1 = controlcontainer.clientHeight;
	var divHeight2 = slidecontainer1.clientHeight;
	
	WIDTH=0.95*actual_width;
	
	var orient=getComputedStyle(document.documentElement).getPropertyValue('--orientation');

	if (orient==1) {
		HEIGHT=Math.max(100,window.innerHeight-divHeight1-2*divHeight2-20);
	} else {
		HEIGHT=Math.max(100,window.innerHeight-divHeight1-3*divHeight2-20);
	}

	canvas.width = WIDTH;
	canvas.height = HEIGHT;
	div_text.style.height=HEIGHT-2 + "px";
	


	BB = canvas.getBoundingClientRect();
	offsetX = BB.left;
	offsetY = BB.top;
	draw();
}
		
function rect(x, y, r) {
	x=x*WIDTH;
	y=y*HEIGHT+HEIGHT/2;
	ctx.beginPath();
    ctx.moveTo(x-r/2, y);
	ctx.lineTo(x+r/2, y);
	ctx.moveTo(x, y-r/2);
	ctx.lineTo(x, y+r/2);
	ctx.strokeStyle = "#0000FF";
    ctx.stroke();
}

div_text.onclick = function() { 
  
    div_text.style.display = "none"; 
  
} 

function draw_mean(x, y, length,color) {
	ctx.beginPath();
	ctx.strokeStyle = color;
	for (var i=0; i<length; i++){
		x0=x[i]*WIDTH;
		y0=y[i]*HEIGHT+HEIGHT/2;
		x1=x[i+1]*WIDTH;
		y1=y[i+1]*HEIGHT+HEIGHT/2;
		ctx.moveTo(x0, y0);
		ctx.lineTo(x1, y1);
	}
	ctx.stroke();
}

function draw_var(x, y, z, c,length,color) {
	ctx.beginPath();
	ctx.strokeStyle = color;
	for (var i=0; i<length; i++){
		x0=x[i]*WIDTH;
		y0=(y[i]+c*z[i])*HEIGHT+HEIGHT/2;
		x1=x[i+1]*WIDTH;
		y1=(y[i+1]+c*z[i+1])*HEIGHT+HEIGHT/2;
		ctx.moveTo(x0, y0);
		ctx.lineTo(x1, y1);
	}
	ctx.stroke();
}

// clear the canvas
function clear() {
    ctx.clearRect(0, 0, WIDTH, HEIGHT);
}

// clear the canvas
function reset() {
	rects = [];
	hyp_sn=1/MAX_SLIDER1;
	hyp_sf=500/MAX_SLIDER2;
	hyp_l=500/MAX_SLIDER3;
	slider1.value=hyp_sn*MAX_SLIDER1;
	slider2.value=hyp_sf*MAX_SLIDER2;
	slider3.value=hyp_l*MAX_SLIDER3;
	lik_value.value="-";
	draw();
}

function button_clear() {
	div_text.style.display = "none"; 
	reset();
}

function helper(x) {
	return gp.loglik(x,gp.X,gp.Y);
}

function opt_hyp() {
	
	if (gp.X.length>0){
	// Powell method can be applied to zero order unconstrained optimization
	var dims = [
    optimjs.Real(1/MAX_SLIDER1, 1/2),
    optimjs.Real(1/MAX_SLIDER2, 1),
	optimjs.Real(1/MAX_SLIDER3, 1),
]
	var solution = optimjs.dummy_minimize(helper, dims, 1000);
	//console.log(solution);
	hyp_sn=solution.best_x[0];
	slider1.value=hyp_sn*MAX_SLIDER1;
	hyp_sf=solution.best_x[1];
	slider2.value=hyp_sf*MAX_SLIDER2;
	hyp_l=solution.best_x[2];
	slider3.value=hyp_l*MAX_SLIDER3;
	
	draw();
	}
}

// set kernel
function kernel_selection() {
	gp.kernel_fcn=kernelselection.value;
	draw();
}

//slider
slider1.oninput = function() {
  hyp_sn = this.value/MAX_SLIDER1;
  draw();
}

slider2.oninput = function() {
  hyp_sf = this.value/MAX_SLIDER2;
  draw();
}

slider3.oninput = function() {
  hyp_l = this.value/MAX_SLIDER3;
  draw();
}

// redraw the scene
function draw() {
    clear();
    ctx.fillStyle = "#FFFFFF";
    ctx.drawImage(img_trash, WIDTH-30, HEIGHT-30,30,30);

	var X = [];
	var Y = [];
	
    for (var i = 0; i < rects.length; i++) {
        var r = rects[i];
        rect(r.x, r.y, r.radius);
		X[i]=r.x;
		Y[i]=r.y;
	}
	gp.X=X;
	gp.Y=Y;
	//draw gp
	if (X.length>0){
	var gp_out= gp.pred(x_test,hyp_sn,hyp_sf,hyp_l);
	draw_mean(x_test,gp_out.mean,ELEMENTS,'#FF0000');
	draw_var(x_test,gp_out.mean,gp_out.sigma,1,ELEMENTS,'#c8c8c8');
	draw_var(x_test,gp_out.mean,gp_out.sigma,-1,ELEMENTS,'#c8c8c8');
	
	print_lik(-gp_out.ll)
	} 
}

function print_lik(gp_lik) {
	var out;
	var pos=1;
	if (gp_lik<0) {pos=-1;}
	out=Math.abs(gp_lik)
	if (out<10) {lik_value.value=parseFloat(pos*out).toFixed(3);}
	else if (out<100) {lik_value.value=parseFloat(pos*out).toFixed(2);}
	else if (out<1000) {lik_value.value=parseFloat(pos*out).toFixed(1);}
	else if (out<10000) {lik_value.value=parseFloat(pos*out).toFixed(0);}
	else {lik_value.value=parseFloat(pos*9999).toFixed(0);}
}



// handle mousedown events
function myDown(e) {

    // tell the browser we're handling this mouse event
    e.preventDefault();
    e.stopPropagation();
		
    // get the current mouse position
    var mx = parseInt(e.clientX - offsetX)/WIDTH;
    var my = (parseInt(e.clientY - offsetY)-HEIGHT/2)/HEIGHT;
	
    // test each rect to see if mouse is inside
    dragok = false;
    for (var i = 0; i < rects.length; i++) {
        var r = rects[i];
        if (((mx-r.x)*(mx-r.x)*WIDTH*WIDTH+ (my-r.y)*(my-r.y)*HEIGHT*HEIGHT)<(r.radius*r.radius/4)) {
            // if yes, set that rects isDragging=true
            dragok = true;
            r.isDragging = true;
			break;
        }
    }
	if (dragok==false &&  rects.length<MAX_RECTS &&!(mx*WIDTH>WIDTH-R_POINTS && my*HEIGHT+HEIGHT/2>HEIGHT-R_POINTS)){
		rects.push({
		x: mx,
		y: my,
		radius: R_POINTS,
		fill: "#0c64e8",
		isDragging: false
			});
	  
	  draw();
	}
}


// handle mouseup events
function myUp(e) {  
    // tell the browser we're handling this mouse event
    e.preventDefault();
    e.stopPropagation();
	
	// get the current mouse position
    var mx = parseInt(e.clientX - offsetX)/WIDTH;
    var my = (parseInt(e.clientY - offsetY)-HEIGHT/2)/HEIGHT;;

    // clear all the dragging flags
    dragok = false;
    for (var i = 0; i < rects.length; i++) {
		if (rects[i].isDragging == true){
			if (mx*WIDTH>WIDTH-R_POINTS && my*HEIGHT+HEIGHT/2>HEIGHT-R_POINTS){
			rects.splice(i,1);
			i=i-1;
			draw();
			}
			else{
				rects[i].isDragging = false;
			}
		}
    }
}


// handle mouse moves
function myMove(e) {
    if (dragok) {
        e.preventDefault();
        e.stopPropagation();

        var mx = parseInt(e.clientX - offsetX)/WIDTH;
        var my = (parseInt(e.clientY - offsetY)-HEIGHT/2)/HEIGHT;;

        for (var i = 0; i < rects.length; i++) {
            var r = rects[i];
            if (r.isDragging) {
                r.x = mx;
                r.y = my;
            }
        }

        // redraw the scene with the new rect positions
        draw();


    }
}

// handle touch events

    function getTouchPos(e) {
        if (!e)
            var e = event;

        if(e.touches) {
            if (e.touches.length == 1) { // Only deal with one finger
                var touch = e.touches[0]; // Get the information for finger #1
                mx=(touch.pageX-touch.target.offsetLeft)/WIDTH;
                my=((touch.pageY-touch.target.offsetTop)-HEIGHT/2)/HEIGHT;;
            }
        }
    }
	
function myDownTouch(e) {

    // tell the browser we're handling this mouse event
    e.preventDefault();
    e.stopPropagation();
		
    // get the current mouse position
    getTouchPos(e);

    dragok = false;
    for (var i = 0; i < rects.length; i++) {
        var r = rects[i];
        if (((mx-r.x)*(mx-r.x)*WIDTH*WIDTH+ (my-r.y)*(my-r.y)*HEIGHT*HEIGHT)<(r.radius*r.radius/1.5)) {
            // if yes, set that rects isDragging=true
            dragok = true;
            r.isDragging = true;
			break;
        }
    }
	if (dragok==false &&  rects.length<MAX_RECTS &&!(mx*WIDTH>WIDTH-R_POINTS && my*HEIGHT+HEIGHT/2>HEIGHT-R_POINTS)){
		rects.push({
		x: mx,
		y: my,
		radius: R_POINTS,
		fill: "#0c64e8",
		isDragging: false
			});
	  
	  draw();
	}
}


// handle mouseup events
function myUpTouch(e) {  
    // tell the browser we're handling this mouse event
    e.preventDefault();
    e.stopPropagation();
	
	// get the current mouse position
    getTouchPos(e);

    // clear all the dragging flags
    dragok = false;
    for (var i = 0; i < rects.length; i++) {
		if (rects[i].isDragging == true){
			if (mx*WIDTH>WIDTH-R_POINTS && my*HEIGHT+HEIGHT/2>HEIGHT-R_POINTS){
			rects.splice(i,1);
			i=i-1;
			draw();
			}
			else{
				rects[i].isDragging = false;
			}
		}
    }
}

function myMoveTouch(e) {
    if (dragok) {

        e.preventDefault();
        e.stopPropagation();

        getTouchPos(e);

        for (var i = 0; i < rects.length; i++) {
            var r = rects[i];
            if (r.isDragging) {
                r.x = mx;
                r.y = my;
            }
        }

        draw();

    }
}