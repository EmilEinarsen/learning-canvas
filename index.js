let canvas, ctx
const preset = {
	snapDegree: 15,
	drawRadius: 12.5,
	lineWidth: 5,
	activeLineWidthMultiplier: 1.5,
}
const data = {
	bounds: null,
	isLoaded: false,
	isDrawing: false,
	start: {},
	coordinates: [],
	mouseCoordinate: e => ({
		x: e.clientX - data.bounds.left,
		y: e.clientY - data.bounds.top
	}),
	lineEdges: () => [ 
		data.coordinates[EDGE.LEFT], 
		data.coordinates[EDGE.RIGHT] 
	],

	/** tracks active edge */
	edge: NaN,
}
/**
 * ENUM for edge definition
 * left and right symbolises 
 * the position in lineEdges
 * not on screen
 */
const EDGE = {
	LEFT: 0,
	RIGHT: data.coordinates.length-1,
	NONE: NaN,
}



/** 
 * * Process 
*/
window.onload = () => {
	canvas = document.querySelector("canvas")
	canvas.width = innerWidth
	canvas.height = innerHeight
	data.bounds = canvas.getBoundingClientRect()
	ctx = canvas.getContext("2d")

	canvas.onmousedown = mouseDown
	canvas.onmousemove = mouseMove
	canvas.onmouseup = mouseUp

	data.isLoaded = true
	newLayer()
}
window.onresize = () => {
	canvas.width = innerWidth
	canvas.height = innerHeight
	newLayer()
}

const mouseDown = e => { try {
	if (!data.isLoaded || data.isDrawing) return

	drawProcess()


	function drawProcess() {
		requestNewLine(e)

		if(data.isDrawing) newLayer(e)
	}
} catch (err) { console.log(err) } }

const mouseMove = e => { try {
	if(!data.isLoaded) return

	data.isDrawing && drawProcess()


	function drawProcess() {
		const coordinate = getEnd(e)

		data.coordinates[data.edge] = coordinate

		newLayer(e)
	}
} catch (err) { console.log(err); data.isDrawing = false } }

const mouseUp = e => { try {
	if (!data.isLoaded) return

	data.isDrawing && drawProcess()


	function drawProcess() {
		const coordinate = getEnd(e)

		data.coordinates[data.edge] = coordinate

		reset()
		newLayer(e)

		function reset() {
			data.start = {}
			data.edge = data.EDGES.NONE
			data.isDrawing = false
			data.index = undefined
		}
	}
} catch (err) { console.log(err) } }
/** 
 * * End Process 
*/



/** 
 * * Delegations 
*/
function requestNewLine(e) {
	const { drawRadius } = preset
	const coordinate = data.mouseCoordinate(e)

	/** exception for the initial/first line */
	if(!data.coordinates.length) {
		data.coordinates.push(coordinate)
		data.coordinates.push({x:0,y:0})
	}
	/** 
	 * if the requested start coordinate is within drawRadius 
	 * of a edge coordinate, then define it as edge
	 */
	else data.lineEdges().forEach((edge, index) => {
		const distanceX = Math.abs(coordinate.x - edge.x)
		const distanceY = Math.abs(coordinate.y - edge.y)

		if(distanceX < drawRadius && distanceY < drawRadius) 
			data.edge = EDGE[index]
	})
	console.log(data.lineEdges())
	/** Allows drawing if the edge is allowed. (a perhaps not neccessary safe guard) */
	if([EDGE.LEFT, EDGE.RIGHT].includes(data.edge)) {
		data.isDrawing = true

		/** 
		 * pushes or unshifts coordinate onto 
		 * data.coordinates depending on which edge 
		 */
		;( 
			array => data.edge === EDGE.LEFT ? array.unshift( {} ) : array.push( {} )
		)(data.coordinates)
	}

	data.start = data.lineEdges()[data.edge]
}

function newLayer() {
	// Hiddes oldlayer
	ctx.fillStyle = "#eee"
	ctx.fillRect(0,0,canvas.width,canvas.height)
	
	// redraws saved lines
	for(pointer = 1; pointer < data.coordinates.length; pointer++) drawLine({
		start: data.coordinates[pointer-1],
		end: data.coordinates[pointer],
	})

	// draws active line
	if (data.isDrawing)
		drawLine({ 
			start: data.start, 
			end: data.coordinates[data.edge] 
		}, true)

	// draws circles at the edges, to mark where you can draw
	/* data.lineEdges().forEach((coordinate, i) => drawCircle(
		{ coordinate, radius: preset.drawRadius }, 
		i === data.edge,
	)) */
	
	


	function drawLine({start, end}, active) {
		lineStyle(active)
		ctx.beginPath()
		ctx.moveTo(start.x, start.y)
		ctx.lineTo(end.x, end.y)
		ctx.stroke()
	}

	function drawCircle({ coordinate: { x, y }, radius }, active){
		if(!isNumber(radius)) throw new Error('Invalid value')
		lineStyle(active)
		ctx.beginPath()
		ctx.arc(x, y, radius, 0, 2 * Math.PI)
		ctx.stroke()
		ctx.fill()
	}

	function lineStyle(active) {
		if(active) {
			ctx.strokeStyle = "darkred"
			ctx.lineWidth = preset.lineWidth*preset.activeLineWidthMultiplier
		} else {
			ctx.strokeStyle = "black"
			ctx.lineWidth = preset.lineWidth
		}
	}
}

function getEnd(e) {
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
	x = h * Math.cos(angle)
	y = h * Math.sin(angle)
	h = pythagorean(x,y)
	
	// if x,y,h is anything falsy make it 0
	!x && (x = 0)
	!y && (y = 0)
	!h && (h = 0)

	if(!isNumber(x) || !isNumber(y) || !isNumber(h)) throw new Error('Invalid value')

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
		const end = data.mouseCoordinate(e)

		let x = end.x - data.start.x

		let y = end.y - data.start.y

		// the hypotenuse that x and y results in
		let h = pythagorean(x,y)

		return { x, y, h }
	}

	function pythagorean( x, y ) {
		return Math.sqrt(( Math.pow(x,2) + Math.pow(y,2) ))
	}

	function getAngle() {
		const arctan = Math.atan( y / x )
		
		// converts arctan to degrees
		let degrees = arctan * 180 / Math.PI
		
		// rounds of to the nerest multiple of snapDegree 
		degrees = preset.snapDegree * Math.round(degrees/preset.snapDegree)
		
		// converts degrees to arctan 
		const angle = degrees * Math.PI / 180

		return angle
	}
}

function isNumber(param) {
	return typeof param === 'number' && !isNaN(param)
}