let canvas, ctx
const preset = {
	canvas: {
		width: innerWidth,
		height: innerHeight,
		color: "#eee",
	},
	circle: {
		radius: 7.5,
	},
	line: {
		snapDegree: 15,
		width: 5,
		color: "black",
		active: {
			multiplierOfWidth: 1.5,
			color: "darkred",
		},
	},
}
const data = {
	bounds: null,
	isLoaded: false,
	isDrawing: false,
	start: {},
	end: {},
	coordinates: [],
	mouseCoordinate: e => ({
		x: e.clientX - data.bounds.left,
		y: e.clientY - data.bounds.top,
	}),
	getEdges: () => [
		data.coordinates[0],
		data.coordinates[data.coordinates.length-1]
	],
	getEdge: (edge = data.edge) => data.coordinates[
		edge ? data.coordinates.length-1 : 0
	],

	/** tracks active edge */
	edge: undefined,
	shift: false,
}
/**
* ENUM for edge definition
* left and right symbolises 
* the position in lineEdges
* not on screen
*/
const EDGE = {
   LEFT: 0,
   RIGHT: 1,
}



/** 
 * * Process 
*/
window.onload = () => {
	canvas = document.querySelector("canvas")
	canvas.width = preset.canvas.width
	canvas.height = preset.canvas.height
	data.bounds = canvas.getBoundingClientRect()
	ctx = canvas.getContext("2d")

	canvas.onmousedown = mouseDown
	canvas.onmousemove = mouseMove
	canvas.onmouseup = mouseUp
	window.onkeydown = keyDown
	window.onkeyup = keyUp

	data.isLoaded = true
	newLayer()
}
window.onresize = () => {
	canvas.width = preset.canvas.width
	canvas.height = preset.canvas.height
	newLayer()
}
const mouseDown = e => {
	if (!data.isLoaded || data.isDrawing) return

	drawProcess()


	function drawProcess() {
		const coordinate = data.mouseCoordinate(e)

		if(data.edge === undefined) requestNewLine(coordinate)
		else allowDraw(coordinate)

		data.isDrawing && newLayer()
	}
}
const mouseMove = e => {
	if(!data.isLoaded) return

	data.isDrawing && drawProcess()

	function drawProcess() {
		if(data.coordinates.length === 1) data.edge = EDGE.RIGHT
		data.end = getEnd(e)

		newLayer()
	}
}
const mouseUp = e => {
	if (!data.isLoaded) return

	data.isDrawing && drawProcess()


	function drawProcess() {
		data.end = getEnd(e)

		data.isDrawing = false

		newLayer()
	}
}

const keyDown = e => {
	if(!data.isLoaded) return

	data.edge !== undefined && e.key === 'Enter' && drawProcess()

	e.shiftKey && (data.shift = true)

	function drawProcess() {
		/** 
		 * pushes or unshifts coordinate onto 
		 * data.coordinates depending on which edge 
		 */
		;( 
			array => data.edge === EDGE.LEFT ? array.unshift( data.end ) : array.push( data.end )
		)(data.coordinates)

		reset()
		newLayer()

		function reset() {
			data.start = {}
			data.end = {}
			data.isDrawing = false
			data.edge = undefined
		}
	}
}
const keyUp = e => {
	!e.shiftKey && (data.shift = false)
}
const scroll = () => {
	ctx.scale(2, 2)
}
/** 
 * * End Process 
*/



/** 
 * * Delegations 
*/
function requestNewLine(coordinate) {
	/** exception for the initial/first line */
	if(!data.coordinates.length) {
		data.coordinates.push(coordinate)
		data.edge = EDGE.LEFT
		data.isDrawing = true
	}
	
	/** 
	 * if the requested start coordinate is within drawRadius 
	 * of an edge coordinate, then define it as edge
	 */
	else allowDraw(coordinate)

	data.start = data.end = data.getEdge()
}

function allowDraw(coordinate) {
	if(data.edge !== undefined) {
		validate(() => {
			data.isDrawing = true
		}, data.end)
	}

	else data.getEdges().forEach((edge, index) => {
		validate(() => {
			data.edge = index
			data.isDrawing = true
		}, edge)
	})

	function validate(func, edge) {
		const distanceX = Math.abs(coordinate.x - edge.x)
		const distanceY = Math.abs(coordinate.y - edge.y)

		distanceX < preset.circle.radius 
		&& distanceY < preset.circle.radius 
		&& func()
		
	}
}

function newLayer() {
	// Hiddes oldlayer
	ctx.fillStyle = preset.canvas.color
	ctx.fillRect( 0, 0, preset.canvas.width, preset.canvas.height )
	
	// redraws saved lines
	data.coordinates.length && drawLines()

	// draws active line
	drawLine({ 
		start: data.start, 
		end: data.end,
	}, data.isDrawing)
		
	
	
	// draws circles to mark where you can draw new lines and resize active line
	;(array => array.forEach(coordinate => coordinate && drawCircle(
		{ coordinate, radius: preset.circle.radius }, 
		data.edge !== undefined && data.isDrawing,
	)))(data.edge !== undefined ? [data.end] : data.getEdges())

	function drawLines() {
		lineStyle()
		ctx.beginPath()
		ctx.moveTo(
			data.coordinates[0].x, 
			data.coordinates[0].y
		)
		
		for(pointer = 1; pointer < data.coordinates.length; pointer++)
			ctx.lineTo(
				data.coordinates[pointer].x,
				data.coordinates[pointer].y
			)

		ctx.stroke()
	}

	function drawLine({start, end}, active) {
		lineStyle(active)
		ctx.beginPath()
		ctx.moveTo(start.x, start.y)
		ctx.lineTo(end.x, end.y)
		ctx.stroke()
	}

	function drawCircle({ coordinate: { x, y }, radius }, active){
		lineStyle(active)
		ctx.beginPath()
		ctx.arc(x, y, radius, 0, 2 * Math.PI)
		ctx.stroke()
		ctx.fill()
	}

	function lineStyle(active) {
		if(active) {
			ctx.strokeStyle = preset.line.active.color
			ctx.lineWidth = preset.line.width * preset.line.active.multiplierOfWidth
		} else {
			ctx.strokeStyle = preset.line.color
			ctx.lineWidth = preset.line.width
		}
	}
}

function getEnd(e) {
	let { x, y, h } = getLengths()

	// flips the hypotenuse inaccordance with x-axis, results in 360 degrees instead of 180
	h = (x < 0 ? -1 : 1) * h 
	
	/**
	 * Length is sufficent to draw the line. 
	 * However, since the range of motion might need to be restricted, 
	 * addtionall calculations with the angle is required
	 */
	rangeOfMotion()
	
	// if x,y,h is anything falsy make it 0
	!x && (x = 0)
	!y && (y = 0)
	!h && (h = 0)

	/**
	 * x and y are used to draw the line. 
	 * However hypotenuse/length might be better used in calculations
	 */
	return {
		x: data.start.x + x,
		y: data.start.y + y,
		length: h,
	}

	function getLengths() {
		// end point
		const end = data.mouseCoordinate(e)

		// length of x-axis
		let x = end.x - data.start.x

		// length of y-axis
		let y = end.y - data.start.y

		// the hypotenuse that x and y results in
		let h = pythagorean(x,y)
		return { x, y, h }
	}

	function pythagorean( x, y ) {
		// c = √a2 + b2
		return Math.sqrt(( Math.pow(x,2) + Math.pow(y,2) ))
	}
	function rangeOfMotion() {
		/** 
		 * enables full range of motion 
		*/ 
		if(data.shift) return

		/** 
		 * restricts range of motion 
		*/
		const angle = getAngle()
		x = h * Math.cos(angle)
		y = h * Math.sin(angle)
		h = pythagorean(x,y)
	}
	function getAngle() {
		let arctan = Math.atan( y / x )
		
		// convert to degree
		let degrees = arctan * 180 / Math.PI
		
		// rounds of to the nerest multiple of snapDegree 
		degrees = preset.line.snapDegree * Math.round( degrees / preset.line.snapDegree) 
		
		// revert to arctan 
		arctan = degrees * Math.PI / 180

		return arctan
	}
}

function scrollDirection() {
	const st = window.pageYOffset || document.documentElement.scrollTop;
	const direction = st > this.lastScrollTop
	this.lastScrollTop = st <= 0 ? 0 : st
	return direction
}