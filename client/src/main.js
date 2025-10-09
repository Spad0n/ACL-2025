import { Application, Geometry, Mesh, Shader } from "pixi.js";

/**
 * @param {string} name 
 * @returns {HTMLElement}
 */
function getElementId(name) {
    const elem = document.getElementById(name);
    if (elem === null) {
	throw new Error("");
    }
    return elem;
}

/**
 * @param {string} url 
 * @returns {Promise<string>}
 */
async function loadShader(url) {
    const response = await fetch(url);
    return await response.text();
}

(async () => {
    const canvas = /** @type {HTMLCanvasElement} */ (getElementId("calendar"));

    const app = new Application();
    await app.init({
	canvas: canvas,
	width: canvas.width,
	height: canvas.height,
	backgroundColor: 0x334C4C,
	preference: "webgl",
	autoDensity: true,
    });

    const ratio = window.devicePixelRatio;

    const quadGeometry = new Geometry();
    quadGeometry.addAttribute('aPosition', [
	0, 0,
	app.screen.width, 0,
	app.screen.width, app.screen.height,
	0, app.screen.height,
    ]);
    quadGeometry.addAttribute('aUv', [
	0, 0, // UV pour le coin haut gauche
	1, 0, // UV pour le coin haut droit
	1, 1, // UV pour le coin bas droit
	0, 1, // UV pour le coin bas gauche
    ]);
    quadGeometry.addIndex([0, 1, 2, 0, 2, 3]);

    const vert_shader = await loadShader("/shaders/shader.vert");
    const frag_shader = await loadShader("/shaders/shader.frag");

    const quadShader = Shader.from({
	gl: {
	    vertex: vert_shader,
	    fragment: frag_shader,
	},
	resources: {
	    shaderUniforms: {
		iResolution: {value: [app.screen.width * ratio, app.screen.height * ratio, 1], type: 'vec3<f32>'},
		iTime: {value: 0, type: 'f32'},
		iTimeDelta: {value: 0, type: 'f32'},
		iFrame: {value: 0, type: 'i32'},
		iMouse: {value: [0, 0, 0, 0], type: 'vec4<f32>'},
		iDate: {value: [0, 0, 0, 0], type: 'vec4<f32>'},
	    }
	}
    });

    const quadMesh = new Mesh({
	geometry: quadGeometry,
	shader: quadShader
    });

    app.stage.addChild(quadMesh);

    app.ticker.add((ticker) => {
	const uniforms = quadShader.resources.shaderUniforms.uniforms;

	uniforms.iTime += ticker.deltaMS / 1000.0;
	uniforms.iTimeDelta = ticker.deltaMS / 1000.0;
	uniforms.iFrame += 1;
	uniforms.iFrameRate = ticker.FPS;
    });
})();
