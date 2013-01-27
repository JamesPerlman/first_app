// JavaScript Document

// set up vars
var isDrawing; // (true or false)
var drawingData; // (data being collected)
var polygonPoints; // current polygon
var polygons; // array of all drawn polygons waiting to be flushed to the server
var canvas, statusDiv; // 
var cx, cy, ctx;
var sending, drawing;
var numPoints=0, totalPoints=0, maxPoints=2048;
var dataSendTimeout, waitSeconds = 3;
var xmlhttp;
var pid;

function init() {
	polygons = new Array();
	pid = Number(document.getElementById("pid").innerHTML);
	if (!pid) pid=0;
	canvas = document.getElementById("canvas");
	statusDiv = document.getElementById("status");
	ctx = canvas.getContext('2d');
	ctx.lineWidth="1";
	ctx.strokeStyle="#000000";
}

function setStatus(msg) {
	statusDiv.innerHTML = msg;
}

function updateCursor() { cx = window.event.clientX+window.pageXOffset-canvas.offsetLeft; cy = window.event.clientY+window.pageYOffset-canvas.offsetTop; }

function mouseDown() {
	updateCursor();
	startDrawing(cx, cy);
	setStatus("Editing");
	if (dataSendTimeout) {
		clearTimeout(dataSendTimeout);
		dataSendTimeout = 0;
	}
}

// called when the cursor is moved
function mouseMove() {
	if (drawing) {
	 	updateCursor();
	 	drawToPoint(cx, cy);
		if (++numPoints>maxPoints) {
			stopDrawing();
			flushDrawingData();
			startDrawing(cx,cy);

			setStatus("Saving...");
		}
	}
}


// called on mouseUp event
function mouseUp() {
	stopDrawing();
	setStatus("Edited");
	dataSendTimeout = setTimeout(flushDrawingData, waitSeconds*1000);
}

function startDrawing(_x, _y) {
	drawing = true;
	polygonPoints = new Array();
	polygonPoints.push(_x, _y);
}

// this method draws a line point as efficiently as possible
function drawToPoint (_x, _y) {

	ctx.beginPath();
	
	ctx.moveTo(polygonPoints[polygonPoints.length-2], polygonPoints[polygonPoints.length-1]);
	
	ctx.lineTo(_x, _y);
	
	ctx.closePath();
	
	ctx.stroke();

	polygonPoints.push(_x, _y);

}

function stopDrawing () {
	drawing = false
	polygons.push(polygonPoints);
	polygonPoints = null;
}

// turn vectors into an image
function rasterizeCanvas() {
	var imageData = ctx.getImageData(0,0, canvas.width, canvas.height)
	ctx.clearRect(0, 0, canvas.width, canvas.height);
	ctx.putImageData(imageData, 0, 0);
}
// returns a string of polygon data
function stringData() {
	var datastr = "";
	for (var j=0; j<polygons.length; j++) {
		var poly = polygons[j];
		for (var i = 0; i < poly.length; i+=2) {
			datastr += poly[i] + "," + poly[i+1] + " ";
		}
		datastr += "!";
	}
	return datastr;
}

function flushDrawingData() {
	sendDrawingData();
	polygons.length=0;

	if ((totalPoints+=numPoints)>=maxPoints) {
		totalPoints=0;
		rasterizeCanvas();
	}

	numPoints=0;
}
// sends current drawn data to the server for processing
function sendDrawingData() {

	setStatus("Saving...");

    xmlhttp=null;

    var Url="/draw/" + pid           // THE SERVER SCRIPT TO HANDLE THE REQUEST 


  if (window.XMLHttpRequest) {

      xmlhttp=new XMLHttpRequest()                            // For all modern browsers

  } else if (window.ActiveXObject) {

     xmlhttp=new ActiveXObject("Microsoft.XMLHTTP")   // For (older) IE

  }


 if (xmlhttp!=null)  {

     xmlhttp.onreadystatechange=processDrawingResponse;
  

   // How to send a POST request
    xmlhttp.open("POST", Url, true);                                                         //  (httpMethod,  URL,  asynchronous)

    xmlhttp.setRequestHeader("Content-Type", "application/x-www-form-urlencoded; charset=UTF-8");

     xmlhttp.send("data="+stringData());

  } else
     alert("The XMLHttpRequest not supported");
}

function processDrawingResponse() {
	if (xmlhttp.readyState == 4) {
		// alert(xmlhttp.responseText);
		if (xmlhttp.responseText == "success" && xmlhttp.status == 200)
			setStatus("Saved");
		else
			setStatus("Failed");
	}
}

