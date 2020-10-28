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
	lines: [],
	mouseCoordinates: e => ({
		x: e.clientX - data.bounds.left,
		y: e.clientY - data.bounds.top
	}),
	endCoordinates: (start, length) => ({
		x: start.x + length.x,
		y: start.y + length.y,
	}),
	lineEdges: [],
	index: 0
}

window.addEventListener('load', () => {

	canvas = document.querySelector("canvas")
	canvas.width = 500
	canvas.height = 500

	canvas.addEventListener('mousedown', e => {
		if (!data.isLoaded || data.isDrawing) return

		// Controlls drawing 
		if(shouldDraw(e)) {
			data.start = data.lineEdges[data.index]
			newLayer(e)
		}
	})

	canvas.addEventListener('mousemove', e => {
		if(!(data.isLoaded && data.isDrawing)) return

		const end = data.endCoordinates(data.start, getLength(e))
		if(data.lineEdges.length === 1) data.lineEdges[1] = end
		else data.lineEdges[data.index] = end

		newLayer(e)
	} )

	canvas.addEventListener('mouseup', e => {
		if (!(data.isLoaded && data.isDrawing)) return
		
		data.lines.push({ start: data.start, length: getLength(e) })

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
	if(!data.lineEdges.length) data.lineEdges[data.index] = coordinates
	
	// if starting point is within drawRadius of a edge, then define it's index as index
	else data.lineEdges.forEach((edge, index) => {
		const distanceX = Math.abs(coordinates.x - edge.x)
		const distanceY = Math.abs(coordinates.y - edge.y)
		if(distanceX < drawRadius && distanceY < drawRadius) 
			data.index = index
	})

	// allow draw if an index was defined
	if(data.index !== undefined) 
		return data.isDrawing = true
}

function newLayer(e) {
	const { lines, isDrawing, start, endCoordinates, lineEdges, index } = data
	const { drawRadius, lineWidth } = preset

	// Hiddes oldlayer
	ctx.fillStyle = "#eee"
	ctx.fillRect(0,0,canvas.width,canvas.height)
	
	// redraws saved lines
	lines.forEach(line => drawLine(line))

	// draws circles at the edges
	lineEdges.forEach((edge, i) => drawCircle(
		{ start: edge, radius: drawRadius }, 
		i === index
	))
	
	// draws active line
	if (!isDrawing) return
	drawLine({ start: start, length: getLength(e) }, true)

	function drawLine({start, length}, active) {
		lineStyle(active)
		
		const end = endCoordinates(start, length)

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