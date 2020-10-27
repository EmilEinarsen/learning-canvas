let canvas, ctx
const preset = {
	snapDegree: 15
}
const data = {
	bounds: null,
	isLoaded: false,
	isDrawing: false,
	start: {},
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

function draw(e) {
	ctx.fillStyle = "#eee"
	ctx.fillRect(0,0,canvas.width,canvas.height)
	
	ctx.strokeStyle = "black"
	ctx.lineWidth = 2
	data.lines.forEach(line => drawLine(line))
	
	
	if (data.isDrawing) {
		ctx.strokeStyle = "darkred"
		ctx.lineWidth = 3
		drawLine({
			start: data.start, 
			length: getLength(e),
		})
	}
}

function onmousedown(e) {
	if (!data.isLoaded) return 
	if (!data.isDrawing) {
		data.start = getMouseCoordinates(e)
		//console.log(getMouseCoordinates(e))
		
		data.isDrawing = true
	}
	draw(e)
}

function onmousemove(e) {
	if (!(data.isLoaded && data.isDrawing)) return
	//console.log(data.lengths)
	draw(e)
}

function onmouseup(e) {
	if (!(data.isLoaded && data.isDrawing)) return

	data.lines.push({ start: data.start, length: getLength(e) })

	data.isDrawing = false
	draw(e)
}

function getMouseCoordinates(e) {
	return {
		x: e.clientX - data.bounds.left,
		y: e.clientY - data.bounds.top
	}
}

function getLength(e) {
	const { snapDegree } = preset

	const { x, y, d } = getLengths()
	// flips the length inaccordance with x-axis, results in 360 degrees instead of 180
	const length = (x < 0 ? -1 : 1) * d 
	
	/**
	 * Length is sufficent to draw the line. 
	 * However, since we want the angle to be a mutiple of snapDegree,
	 * it has to be round of to the nerest mutiple 
	 * and thereafter used to calculate the true length
	 */
	const angle = getAngle()
	return { 
		x: length * Math.cos(angle), 
		y: length * Math.sin(angle),
	}

	function getLengths() {
		// end point
		const end = getMouseCoordinates(e)

		// length of x-axis
		const x = - data.start.x + end.x

		// length of y-axis
		const y = - data.start.y + end.y

		// length is the diagonal that x and y results in
		let d = Math.sqrt( (Math.pow(x,2) + Math.pow(y,2) ))

		return { x, y, d }
	}

	function getAngle() {
		const arctan = Math.atan( y / x )
		
		// converts arctan to degrees
		let degrees = arctan * 180 / Math.PI
		
		// rounds of to the nerest multiple of snapDegree 
		degrees = snapDegree * Math.round(degrees/snapDegree)
		
		// converts degrees to arctan 
		return degrees * Math.PI / 180
	}
}

function drawLine({start, length}) {
	const end = {
		x: start.x + length.x,
		y: start.y + length.y,
	}
	ctx.beginPath()
	ctx.moveTo(start.x, start.y)
	ctx.lineTo(end.x, end.y)
	ctx.stroke()
}