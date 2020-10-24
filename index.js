/* let canvasWidth = 500
let canvasHeight = 500
let canvas = null
let bounds = null
let ctx = null
let hasLoaded = false

let startX, startY, mouseX, mouseY
startX, startY, mouseX, mouseY = 0
let isDrawing = false
let existingLines = []

window.onload = function() {
	canvas = document.querySelector("canvas")
	canvas.width = canvasWidth
	canvas.height = canvasHeight
	canvas.onmousedown = onmousedown
	canvas.onmouseup = onmouseup
	canvas.onmousemove = onmousemove
	
	bounds = canvas.getBoundingClientRect()
	ctx = canvas.getContext("2d")
	hasLoaded = true
	
	draw()
}

function draw() {
	ctx.fillStyle = "#333333"
	ctx.fillRect(0,0,canvasWidth,canvasHeight)
	
	ctx.strokeStyle = "black"
	ctx.lineWidth = 2
	
	
	existingLines.forEach(({startX, startY, endX, endY}) => {
		ctx.beginPath()
		ctx.moveTo(startX, startY)
		ctx.lineTo(endX, endY)
		ctx.stroke()
	})
	
	
	if (isDrawing) {
		ctx.strokeStyle = "darkred"
		ctx.lineWidth = 3
		ctx.beginPath()
		ctx.moveTo(startX, startY)
		ctx.lineTo(mouseX, mouseY)
		ctx.stroke()
	}
}

function onmousedown(e) {
	if (!hasLoaded) return 
	if (!isDrawing) {
		const { x, y } = getMouseCoordinates(e)
		startX = x
		startY = y
		
		isDrawing = true
	}
	
	draw()
}

function onmouseup(e) {
	if (!hasLoaded) return
	if (isDrawing) {
		existingLines.push({
			startX: startX,
			startY: startY,
			endX: mouseX,
			endY: mouseY
		})
		isDrawing = false
	}
	draw()
}

function onmousemove(e) {
	if (!hasLoaded) return
	const { x, y } = getMouseCoordinates(e)
	mouseX = x
	mouseY = y
	
	if (isDrawing) draw()
}

function getMouseCoordinates(e) {
	return {
		x: e.clientX - bounds.left,
		y: e.clientY - bounds.top
	}
} */
let canvas, ctx
const data = {
	bounds: null,
	isLoaded: false,
	isDrawing: false,
	startCoordinates: {},
	angle: 0,
	lengths: {},
	lines: [],
}

window.onload = function() {
	canvas = document.querySelector("canvas")
	canvas.width = 500
	canvas.height = 500
	canvas.onmousedown = onmousedown
	canvas.onmouseup = onmouseup
	canvas.onmousemove = onmousemove
	
	data.bounds = canvas.getBoundingClientRect()
	console.log(data.bounds)
	ctx = canvas.getContext("2d")
	data.isLoaded = true
	draw()
}

function draw() {
	ctx.fillStyle = "#eee"
	ctx.fillRect(0,0,canvas.width,canvas.height)
	
	/* ctx.strokeStyle = "black"
	ctx.lineWidth = 2
	data.lines.forEach(line => {}) */
	
	
	if (data.isDrawing) {
		ctx.strokeStyle = "darkred"
		ctx.lineWidth = 3
		drawLine({
			start: data.startCoordinates, 
			length: data.lengths, 
			angle: data.angle,
		})
	}
}

function onmousedown(e) {
	if (!data.isLoaded) return 
	if (!data.isDrawing) {
		data.startCoordinates = getMouseCoordinates(e)
		//console.log(getMouseCoordinates(e))
		setLength(e)
		setAngle()
		data.isDrawing = true
	}
	draw()
}

function onmousemove(e) {
	if (!(data.isLoaded && data.isDrawing)) return
	setLength(e)
	setAngle()
	//console.log(data.lengths)
	draw()
}

function onmouseup() {
	if (!(data.isLoaded && data.isDrawing)) return
	data.lines.push({
		x: data.startCoordinate,
		length: data.lengths.length, 
		angle: data.angle 
	})
	data.isDrawing = false
	
	draw()
}

function getMouseCoordinates(e) {
	return {
		x: e.clientX - data.bounds.left,
		y: e.clientY - data.bounds.top
	}
}

function lineAtAngle() {

}

function setLength(e) {
	const { x, y } = getMouseCoordinates(e)
	const lengthX = data.startCoordinates.x - x
	const lengthY = data.startCoordinates.y - y
	const length = Math.sqrt( (Math.pow(lengthX,2) + Math.pow(lengthY,2) ))
	
	data.lengths = { 
		lengthX: -lengthX, 
		lengthY: lengthY, 
		length: length,
	}
}

function setAngle() {
	const arctan = Math.atan2(data.lengths.lengthY, data.lengths.lengthX)
	const angle = arctan * 180 / Math.PI
	data.angle = Math.floor(angle)
	console.log(data.angle)
}

function drawLine({start, length: { lengthX, lengthY }, angle}) {
	const end = {
		x: start.x + lengthX * Math.cos((angle * Math.PI)/180),
		y: start.y + lengthY * Math.sin((angle * Math.PI)/180),
	}

	ctx.beginPath()
	ctx.moveTo(start.x, start.y)
	ctx.lineTo(end.x, end.y)
	ctx.stroke()
}