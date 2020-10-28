let canvas, ctx
const preset = {
	snapDegree: 15,
	drawRadius: 12.5,
	lineWidth: 5
}
const data = {
	bounds: null,
	isLoaded: false,
	isDrawing: false,
	start: {},
	end: {},
	coordinates: [],
	mouseCoordinates: e => ({
		x: e.clientX - data.bounds.left,
		y: e.clientY - data.bounds.top
	}),
	endCoordinates: (start, length) => ({
		x: start.x + length.x,
		y: start.y + length.y,
	}),
	whichEdge: true
}

window.addEventListener('load', () => {

	canvas = document.querySelector("canvas")
	canvas.width = 500
	canvas.height = 500

	canvas.addEventListener('mousedown', e => {
		if (!data.isLoaded || data.isDrawing) return

		// Controlls drawing 
		shouldDraw(e)

		// if(data.isDrawing) newLayer(e)
	})

	canvas.addEventListener('mousemove', e => {
		if(!(data.isLoaded && data.isDrawing)) return

		data.end = data.endCoordinates(data.start, getLength(e))

		newLayer(e)
	} )

	canvas.addEventListener('mouseup', e => {
		if (!(data.isLoaded && data.isDrawing)) return

		if(data.whichEdge) data.coordinates.push( data.end )
		else if(!data.whichEdge) data.coordinates.unshift( data.end )

		data.isDrawing = false
		data.index = undefined
		newLayer(e)
	})

	data.bounds = canvas.getBoundingClientRect()

	ctx = canvas.getContext("2d")

	data.isLoaded = true
	newLayer()

})

function shouldDraw(e) {
	const { drawRadius } = preset
	const coordinates = data.mouseCoordinates(e)

	/**
	 * Returns true if it should draw.
	 * Otherwise doesn't return, resulting in a undefined (falsy) return
	 */

	// exception for the initial/first line
	if(!data.coordinates.length) {
		data.coordinates.push(coordinates)
		data.start = coordinates
		data.isDrawing = true
	}
	// if starting point is within drawRadius of a edge, then define it's index as index
	else [ 
		data.coordinates[0], 
		data.coordinates[data.coordinates.length-1] 
	].forEach((edge, index) => {
		const distanceX = Math.abs(coordinates.x - edge.x)
		const distanceY = Math.abs(coordinates.y - edge.y)
		if(distanceX < drawRadius && distanceY < drawRadius) {
			data.isDrawing = true
			data.whichEdge = index
			data.start = data.coordinates[index ? data.coordinates.length-1 : 0]
		}
	})
}

function newLayer(e) {
	const { coordinates, isDrawing, start, end, whichEdge } = data
	const { drawRadius, lineWidth } = preset

	// Hiddes oldlayer
	ctx.fillStyle = "#eee"
	ctx.fillRect(0,0,canvas.width,canvas.height)
	
	// redraws saved lines
	if(coordinates.length > 1) drawStoredLines()

	// draws circles at the edges
	whichEdge && drawCircle({ start: coordinates[0], radius: drawRadius })
	!whichEdge && drawCircle({ start: coordinates[coordinates.length-1], radius: drawRadius })
	drawCircle({ start: end, radius: drawRadius })
	
	// draws active line
	if (!isDrawing) return
	drawLine({ start, end }, true)
	

	function drawStoredLines() {
		let pointer = 1
		while(pointer < coordinates.length){
			drawLine({
				start: coordinates[pointer-1], 
				end: coordinates[pointer]
			})
			pointer++
	}}

	function drawLine({start, end}, active) {
		lineStyle(active)
		ctx.beginPath()
		ctx.moveTo(start.x, start.y)
		ctx.lineTo(end.x, end.y)
		ctx.stroke()
	}

	function drawCircle({ start: { x, y }, radius }, active){
		lineStyle(active)
		ctx.beginPath()
		ctx.arc(x, y, radius, 0, 2 * Math.PI)
		ctx.stroke()
	}

	function lineStyle(active) {
		if(active) {
			ctx.strokeStyle = "darkred"
			ctx.lineWidth = lineWidth*1.5
		} else {
			ctx.strokeStyle = "black"
			ctx.lineWidth = lineWidth
		}
	}
}

function getLength(e) {
	const { snapDegree } = preset
	const { sqrt, pow, atan, PI, round, cos, sin } = Math
	const { mouseCoordinates, start } = data

	let { x, y, h } = getLengths()

	// flips the hypotenuse inaccordance with x-axis, results in 360 degrees instead of 180
	h = (x < 0 ? -1 : 1) * h 
	
	/**
	 * Length is sufficent to draw the line. 
	 * However, since the angle needs to be a mutiple of snapDegree,
	 * it has to be round off to the nerest mutiple 
	 * and thereafter used to calculate the true length
	 */
	const angle = getAngle()
	x = h * cos(angle)
	y = h * sin(angle)
	h = pythagorean(x,y)

	/**
	 * x and y are used to draw the line. 
	 * However hypotenuse might be better used in calculations
	 */
	return { x, y, h }

	function getLengths() {
		// end point
		const end = mouseCoordinates(e)

		// length of x-axis
		let x = end.x - start.x

		// length of y-axis
		let y = end.y - start.y

		// the hypotenuse that x and y results in
		let h = pythagorean(x,y)

		return { x, y, h }
	}

	function pythagorean( x, y ) {
		return sqrt(( pow(x,2) + pow(y,2) ))
	}

	function getAngle() {
		const arctan = atan( y / x )
		
		// converts arctan to degrees
		let degrees = arctan * 180 / PI
		
		// rounds of to the nerest multiple of snapDegree 
		degrees = snapDegree * round(degrees/snapDegree)
		
		// converts degrees to arctan 
		const angle = degrees * PI / 180

		return angle
	}
}